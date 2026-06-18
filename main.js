const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { searchImages } = require('./services/imageSearch');

let mainWindow;
const DATA_FILE_PATH = path.join(app.getPath('userData'), 'tesol_generator_data.json');

const DEFAULT_DATA = {
  settings: {
    apiKey: '',
    apiProvider: 'gemini',
    aiModel: 'gemini-2.5-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o-mini'
  },
  lessons: []
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "TESOL Master Framework - Lesson Plan & Material Generator",
    backgroundColor: "#0d0e12",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Load Data
ipcMain.handle('load-data', () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const dataStr = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(dataStr);
      if (!parsed.settings) parsed.settings = { ...DEFAULT_DATA.settings };
      if (!parsed.lessons) parsed.lessons = [];
      return parsed;
    } else {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
  } catch (error) {
    console.error("Error reading data file:", error);
    return DEFAULT_DATA;
  }
});

// IPC Handler: Save Data
ipcMain.handle('save-data', (event, data) => {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error("Error saving data file:", error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Search Images
ipcMain.handle('search-images', async (event, { query, limit }) => {
  try {
    const results = await searchImages(query, limit);
    return { success: true, results };
  } catch (error) {
    console.error("Image search failed:", error);
    return { success: false, error: error.message };
  }
});

// Helper function to make HTTPS requests without external dependencies
function makeHttpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      port: 443
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: async () => data,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              throw new Error("Failed to parse JSON response: " + e.message + "\nResponse content: " + data);
            }
          }
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Helper for waiting
const delayMs = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callAiWithRetry(provider, apiKey, model, prompt, retries = 3, initialDelay = 2000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      if (provider === 'gemini') {
        const selectedModel = model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent`;
        
        const response = await makeHttpsRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 503 || response.status === 429) {
            console.warn(`[AI Request] Temporary error (${response.status}). Retrying... (Attempt ${attempt + 1}/${retries})`);
            attempt++;
            if (attempt < retries) {
              await delayMs(initialDelay * Math.pow(2, attempt - 1));
              continue;
            }
          }
          throw new Error(`Gemini API Error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
          return { success: true, text: json.candidates[0].content.parts[0].text };
        } else {
          throw new Error("Invalid structure returned from Gemini API");
        }
      } else if (provider === 'openai') {
        const selectedModel = model || 'gpt-4o-mini';
        const url = 'https://api.openai.com/v1/chat/completions';
        
        const response = await makeHttpsRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 503 || response.status === 429) {
            console.warn(`[AI Request] Temporary error (${response.status}). Retrying... (Attempt ${attempt + 1}/${retries})`);
            attempt++;
            if (attempt < retries) {
              await delayMs(initialDelay * Math.pow(2, attempt - 1));
              continue;
            }
          }
          throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
        }

        const json = await response.json();
        if (json.choices && json.choices[0] && json.choices[0].message) {
          return { success: true, text: json.choices[0].message.content };
        } else {
          throw new Error("Invalid structure returned from OpenAI API");
        }
      } else {
        throw new Error(`Unknown AI Provider: ${provider}`);
      }
    } catch (error) {
      attempt++;
      if (attempt < retries) {
        console.warn(`[AI Request] Network exception: ${error.message}. Retrying... (Attempt ${attempt + 1}/${retries})`);
        await delayMs(initialDelay * Math.pow(2, attempt - 1));
        continue;
      }
      throw error;
    }
  }
}

// IPC Handler: Call AI API
ipcMain.handle('call-ai', async (event, { provider, apiKey, model, prompt }) => {
  try {
    return await callAiWithRetry(provider, apiKey, model, prompt);
  } catch (error) {
    console.error("AI Request Failed after retries:", error);
    return { success: false, error: error.message };
  }
});
