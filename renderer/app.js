// Application State
let appData = {
  settings: {
    apiKey: '',
    apiProvider: 'gemini',
    aiModel: 'gemini-2.5-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o-mini'
  },
  lessons: []
};

let currentLesson = null;
let selectedSlideIndex = null;

// DOM Elements
const tabButtons = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Form inputs
const inputTopic = document.getElementById('lesson-topic');
const inputLevel = document.getElementById('lesson-level');
const inputDuration = document.getElementById('lesson-duration');
const inputSkill = document.getElementById('lesson-skill');
const inputNotes = document.getElementById('lesson-notes');
const btnGenerate = document.getElementById('btn-generate');

// Suggestions
const suggestionTags = document.querySelectorAll('.suggestion-tag');

// Loading overlay
const loadingOverlay = document.getElementById('generation-loading');
const loadingStatusText = document.getElementById('loading-status');
const loadingProgress = document.getElementById('loading-progress');
const loadingPercentage = document.getElementById('loading-percentage');

// Result elements
const resultContainer = document.getElementById('result-container');
const resultTitle = document.getElementById('result-title');
const tagSkill = document.getElementById('tag-skill');
const tagLevel = document.getElementById('tag-level');
const tagDuration = document.getElementById('tag-duration');
const scriptTableBody = document.getElementById('script-table-body');
const slidesListContainer = document.getElementById('slides-list-container');
const searchImageResults = document.getElementById('search-image-results');
const inputSlideImgSearch = document.getElementById('slide-img-search-input');
const btnSlideImgSearch = document.getElementById('btn-slide-img-search');

// Material blocks
const blockVideo = document.getElementById('material-video-content');
const blockGame = document.getElementById('material-game-content');
const blockAudio = document.getElementById('sheet-audio-content');
const blockExercise = document.getElementById('sheet-exercise-content');

// Actions
const btnSaveCurrent = document.getElementById('btn-save-current');
const btnExportMarkdown = document.getElementById('btn-export-markdown');
const btnPrintLesson = document.getElementById('btn-print-lesson');

// History Elements
const historyListGrid = document.getElementById('history-list-grid');
const historySearchInput = document.getElementById('history-search');
const btnClearHistory = document.getElementById('btn-clear-history');
const historyCountBadge = document.getElementById('history-count-badge');

// Settings Elements
const settingsProvider = document.getElementById('settings-provider');
const groupGeminiKey = document.getElementById('group-gemini-key');
const groupOpenaiKey = document.getElementById('group-openai-key');
const inputGeminiKey = document.getElementById('settings-gemini-key');
const inputOpenaiKey = document.getElementById('settings-openai-key');
const settingsModel = document.getElementById('settings-model');
const btnSaveSettings = document.getElementById('btn-save-settings');
const settingsSuccessMsg = document.getElementById('settings-success');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await loadDatabase();
  initNavigation();
  initForm();
  initSettings();
  initHistory();
  initResults();
});

// Load configuration and lessons from file
async function loadDatabase() {
  try {
    const loadedData = await window.api.loadData();
    if (loadedData) {
      appData = loadedData;
    }
    updateHistoryUI();
  } catch (error) {
    console.error("Failed to load local database:", error);
  }
}

// Save database state
async function saveDatabase() {
  try {
    await window.api.saveData(appData);
    updateHistoryUI();
  } catch (error) {
    console.error("Failed to save local database:", error);
  }
}

// Navigation Handling
function initNavigation() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });
      
      if (targetTab === 'history') {
        renderHistoryList();
      }
    });
  });
}

// Form logic
function initForm() {
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      inputTopic.value = tag.textContent;
    });
  });

  btnGenerate.addEventListener('click', handleGenerateLesson);
}

// Settings logic
function initSettings() {
  // Populate Models based on Provider
  function updateModelOptions() {
    const provider = settingsProvider.value;
    settingsModel.innerHTML = '';
    
    if (provider === 'gemini') {
      groupGeminiKey.classList.remove('hidden');
      groupOpenaiKey.classList.add('hidden');
      
      const models = [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast & Smart)' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Ultra Detailed)' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Highly Reliable)' },
        { value: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro (Experimental)' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Stable)' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (High Context)' }
      ];
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        settingsModel.appendChild(opt);
      });
      
      settingsModel.value = appData.settings.aiModel || 'gemini-2.5-flash';
    } else {
      groupGeminiKey.classList.add('hidden');
      groupOpenaiKey.classList.remove('hidden');
      
      const models = [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Default - Cost-efficient)' },
        { value: 'gpt-4o', label: 'GPT-4o (Premium - Complex Plans)' }
      ];
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        settingsModel.appendChild(opt);
      });
      
      settingsModel.value = appData.settings.openaiModel || 'gpt-4o-mini';
    }
  }

  // Set initial settings inputs
  settingsProvider.value = appData.settings.apiProvider || 'gemini';
  inputGeminiKey.value = appData.settings.apiKey || '';
  inputOpenaiKey.value = appData.settings.openaiKey || '';
  updateModelOptions();

  settingsProvider.addEventListener('change', updateModelOptions);

  btnSaveSettings.addEventListener('click', async () => {
    appData.settings.apiProvider = settingsProvider.value;
    appData.settings.apiKey = inputGeminiKey.value.trim();
    appData.settings.openaiKey = inputOpenaiKey.value.trim();
    
    if (settingsProvider.value === 'gemini') {
      appData.settings.aiModel = settingsModel.value;
    } else {
      appData.settings.openaiModel = settingsModel.value;
    }

    await saveDatabase();
    
    settingsSuccessMsg.classList.remove('hidden');
    setTimeout(() => {
      settingsSuccessMsg.classList.add('hidden');
    }, 3000);
  });
}

// Generate Script & Materials
async function handleGenerateLesson() {
  const topic = inputTopic.value.trim();
  const level = inputLevel.value;
  const duration = inputDuration.value;
  const skill = inputSkill.value;
  const notes = inputNotes.value.trim();

  if (!topic) {
    alert("Please enter a lesson topic!");
    return;
  }

  // Verify API Keys are entered
  const provider = appData.settings.apiProvider;
  const currentKey = provider === 'gemini' ? appData.settings.apiKey : appData.settings.openaiKey;
  if (!currentKey) {
    alert(`Please set your API key in the 'API Settings' tab before generating.`);
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.click();
    return;
  }

  // Show Loading Overlay
  loadingOverlay.classList.remove('hidden');
  updateLoadingProgress(10, "Initializing framework parser...");

  const activeModel = provider === 'gemini' ? appData.settings.aiModel : appData.settings.openaiModel;

  // Build TESOL Prompt
  const prompt = `You are an elite TESOL & CELTA Master educator. Generate a complete, detailed lesson plan and full materials package based on:
Topic: "${topic}"
Level: "${level}"
Class Duration: "${duration}"
Core Target Skill & Method: "${skill}"
Special Instructions/Notes: "${notes || 'None'}"

You MUST output ONLY a valid JSON string matching the following structure:
{
  "title": "Clear English topic title",
  "skill": "Speaking, Listening, Reading, or Writing",
  "level": "English Level",
  "duration": "Duration in minutes",
  "stages": [
    {
      "stageName": "Stage name (e.g. Warm-up, Lead-in, Eliciting, Controlled Practice, Freer Practice, Production, Delayed Error Correction)",
      "duration": "Time allocated (e.g. 10 mins)",
      "objective": "TESOL objective for this stage",
      "pattern": "Interaction pattern: T->S, S->S, S->Class, etc.",
      "script": "FULL classroom dialogue script. Write complete dialogues including what the Teacher says (T: ...) and expected Student responses (S: ...). Show TESOL techniques like Eliciting, Concept Checking Questions (CCQs) and pronunciation back-chaining drilling."
    }
  ],
  "slides": [
    {
      "number": 1,
      "title": "Slide Title",
      "description": "Visual elements, text to put on the slide, layout descriptions.",
      "imagePrompt": "Detailed English image prompt to search/generate a perfect visual representing this slide.",
      "searchKeywords": "1-2 keywords to search Bing images for this slide"
    }
  ],
  "materials": {
    "videoLinksDescription": "Suggested YouTube search terms and description of the ideal video lesson clip. Do NOT wrap this field in any markdown JSON block, write as plain formatted English text only.",
    "audioScript": "Complete audio/listening dialogue script if target is Listening; otherwise, speaking/discussion prompts script. Do NOT wrap this field in any markdown JSON block, write as plain formatted English text only.",
    "games": "Full instructions for a game matching the skill (e.g. Role Play situation, Information Gap details, Dictogloss text, Gallery Walk checklist, Story Chain rules). Explain clearly. Do NOT wrap this field in any markdown JSON block, write as plain formatted English text only.",
    "worksheets": "Detailed worksheet task for the students. Include 5-10 questions (e.g. Fill-in-the-blanks, matching vocabulary, multiple choices). Include answer keys. Do NOT output markdown JSON block or raw JSON structures inside this string, write as plain formatted English text only.",
    "homework": "1-2 follow-up homework tasks. Do NOT wrap this field in any markdown JSON block, write as plain formatted English text only."
  }
}

CRITICAL RULES FOR JSON VALIDITY:
1. Avoid double quotes (") inside JSON string values. Use single quotes (') instead. For example, write 'Teacher: Repeat "hello"' as 'Teacher: Repeat 'hello''.
2. Do not write raw newlines inside JSON string values. Replace them with '\\n'.
3. Ensure all brackets [ ] and braces { } match perfectly.

Important TESOL Constraints to reflect in the script & stages:
1. Student Talking Time (STT) must be 70-80% of the class. Ensure the script shows the teacher asking questions to elicit answers and guide interactions, not lecturing.
2. In Vocabulary stage: Show Eliciting and concept checking questions (CCQs). No long definitions.
3. In Pronunciation stage: Show drilling (Choral, Individual) and back-chaining.
4. If Speaking: Warm-up must use 'Would you rather' or 'Four corners'. Main practice must use 'Information Gap' or 'Role Play'. Show delayed error correction.
5. If Listening: Follow Pre-Listening (prediction, vocab), First Listening (gist question), Second Listening (detailed gaps), Third Listening (inference check), Post-listening (discussion).
6. If Reading: Follow Pre-Reading (picture discussion, title prediction), While-Reading (skimming, scanning, jigsaw text structure), Post-Reading (debate or ranking).
7. If Writing: Follow Process Writing Stages: Brainstorm (Think-Pair-Share), Planning, Drafting, Peer Review (with checklist), Publishing (Gallery Walk).`;

  try {
    updateLoadingProgress(40, "Sending prompt to AI model...");
    
    const response = await window.api.callAI({
      provider,
      apiKey: currentKey,
      model: activeModel,
      prompt
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    updateLoadingProgress(80, "Parsing generated curriculum...");
    
    let parsedLesson;
    try {
      parsedLesson = robustParse(response.text);
    } catch (parseErr) {
      console.error("Critical parser failure:", parseErr);
      parsedLesson = {
        title: "Lesson Plan",
        skill: skill,
        level: level,
        duration: duration,
        stages: [{ stageName: "Error", duration: "10 mins", objective: "Parse failed", pattern: "T->S", script: response.text }],
        slides: [{ number: 1, title: "Title Slide", description: "Slide content", imagePrompt: "N/A", searchKeywords: "N/A" }],
        materials: { videoLinksDescription: "", audioScript: "", games: "", worksheets: "", homework: "" }
      };
    }

    parsedLesson.createdAt = new Date().toISOString();
    parsedLesson.id = 'lesson_' + Date.now();
    parsedLesson.topicInput = topic;
    currentLesson = parsedLesson;

    renderLessonResult(parsedLesson);
    
    // Auto-scroll to result container
    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error("Failed to generate plan:", error);
    alert(`Failed to generate lesson: ${error.message}`);
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

// Clean & Parse JSON safely with multi-layered fallbacks
function robustParse(text) {
  let cleaned = text.trim();
  
  // 1. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 2. Clean markdown fencing and try parsing
  try {
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {}

  // 3. Try character-by-character cleaning of literal newlines and repairing nested double quotes
  try {
    const getContext = (str, index) => {
      let before = '';
      for (let i = index - 1; i >= 0; i--) {
        if (!/\s/.test(str[i])) {
          before = str[i];
          break;
        }
      }
      let after = '';
      for (let i = index + 1; i < str.length; i++) {
        if (!/\s/.test(str[i])) {
          after = str[i];
          break;
        }
      }
      return { before, after };
    };

    let inString = false;
    let repaired = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (char === '"') {
        // Check if escaped
        let isEscaped = false;
        let k = i - 1;
        while (k >= 0 && cleaned[k] === '\\') {
          isEscaped = !isEscaped;
          k--;
        }

        if (isEscaped) {
          repaired += char;
          continue;
        }

        const { before, after } = getContext(cleaned, i);

        if (!inString) {
          // Entering a string value or key
          if (before === '{' || before === ',' || before === '[' || before === ':') {
            inString = true;
            repaired += char;
          } else {
            // Stray double quote outside string
            repaired += "'";
          }
        } else {
          // We are in a string. Check if it ends the key or value.
          if (after === ':' || after === ',' || after === '}' || after === ']') {
            inString = false;
            repaired += char;
          } else {
            // Nested double quote inside string -> replace with single quote
            repaired += "'";
          }
        }
      } else if (inString && char === '\n') {
        repaired += '\\n';
      } else if (inString && char === '\r') {
        repaired += '\\r';
      } else if (inString && char === '\t') {
        repaired += '\\t';
      } else {
        repaired += char;
      }
    }
    return JSON.parse(repaired);
  } catch (e) {
    console.warn("Detailed repair parse failed. Falling back to regex extractor...", e);
  }

  // 4. Fallback: RegExp-based field extractor
  try {
    return extractJSONFields(cleaned);
  } catch (e) {
    console.error("Regex extractor failed:", e);
  }

  // 5. Ultimate hardcoded backup
  return {
    title: "Lesson Plan (Regex Fallback)",
    skill: "Speaking",
    level: "Intermediate",
    duration: "90 min",
    stages: [{ stageName: "Content", duration: "90 mins", objective: "Learn topic", pattern: "T->S", script: text }],
    slides: [{ number: 1, title: "Intro", description: "Slide content", imagePrompt: "N/A", searchKeywords: "N/A" }],
    materials: { videoLinksDescription: "", audioScript: "", games: "", worksheets: "", homework: "" }
  };
}

// Regex-based JSON parser for malformed strings
function extractJSONFields(text) {
  const lesson = {
    title: "TESOL Lesson Plan",
    skill: "Speaking",
    level: "Intermediate",
    duration: "90 minutes",
    stages: [],
    slides: [],
    materials: {
      videoLinksDescription: "",
      audioScript: "",
      games: "",
      worksheets: "",
      homework: ""
    }
  };

  // Helper to extract a single string value for a key
  function extractStringKey(key, sourceText) {
    const regex = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,|\\}|"\\s*\\w+"\\s*:)`, 'i');
    const match = sourceText.match(regex);
    if (match) {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    }
    const regexRelaxed = new RegExp(`"${key}"\\s*:\\s*['"]([\\s\\S]*?)['"]\\s*(?:,|\\})`, 'i');
    const matchRelaxed = sourceText.match(regexRelaxed);
    if (matchRelaxed) {
      return matchRelaxed[1].replace(/\\n/g, '\n').trim();
    }
    return "";
  }

  lesson.title = extractStringKey("title", text) || "TESOL Lesson Plan";
  lesson.skill = extractStringKey("skill", text) || "Speaking";
  lesson.level = extractStringKey("level", text) || "Intermediate";
  lesson.duration = extractStringKey("duration", text) || "90 minutes";

  // Extract Stages directly from text blocks split by "stageName"
  const stageBlocks = text.split(/"stageName"\s*:/i).slice(1);
  stageBlocks.forEach((block, idx) => {
    const fullBlock = `{"stageName": ` + block;
    if (idx >= 12) return; // limit to maximum stages

    const stageName = extractStringKey("stageName", fullBlock);
    const duration = extractStringKey("duration", fullBlock);
    const objective = extractStringKey("objective", fullBlock);
    const pattern = extractStringKey("pattern", fullBlock);
    const script = extractStringKey("script", fullBlock);

    if (stageName || script) {
      // Ensure we don't accidentally capture slides or materials as stages
      if (fullBlock.includes('"imagePrompt"') && !fullBlock.includes('"script"')) {
        return;
      }
      lesson.stages.push({
        stageName: stageName || `Stage ${idx + 1}`,
        duration: duration || "10 mins",
        objective: objective || "Stage Objective",
        pattern: pattern || "T->S",
        script: script || ""
      });
    }
  });

  // Extract Slides
  const slideBlocks = text.split(/"imagePrompt"\s*:/i);
  if (slideBlocks.length > 1) {
    for (let i = 0; i < slideBlocks.length - 1; i++) {
      const currentBlock = slideBlocks[i];
      const nextBlock = slideBlocks[i + 1];
      
      const title = extractStringKey("title", currentBlock);
      const description = extractStringKey("description", currentBlock);
      const imagePrompt = extractStringKey("imagePrompt", `{"imagePrompt": ${nextBlock}`);
      const searchKeywords = extractStringKey("searchKeywords", `{"searchKeywords": ${nextBlock}`);

      lesson.slides.push({
        number: i + 1,
        title: title || `Slide ${i + 1}`,
        description: description || "Slide content",
        imagePrompt: imagePrompt || "Visual illustration",
        searchKeywords: searchKeywords || title || "Key illustration"
      });
    }
  }

  // Extract Materials
  const materialsMatch = text.match(/"materials"\s*:\s*\{([\s\S]*?)\}\s*$/i) || text.match(/"materials"\s*:\s*\{([\s\S]*?)\}/i);
  if (materialsMatch) {
    const matText = materialsMatch[1];
    lesson.materials.videoLinksDescription = extractStringKey("videoLinksDescription", matText);
    lesson.materials.audioScript = extractStringKey("audioScript", matText);
    lesson.materials.games = extractStringKey("games", matText);
    lesson.materials.worksheets = extractStringKey("worksheets", matText);
    lesson.materials.homework = extractStringKey("homework", matText);
  }

  return lesson;
}

function updateLoadingProgress(percent, statusText) {
  loadingStatusText.textContent = statusText;
  loadingProgress.style.width = `${percent}%`;
  if (loadingPercentage) {
    loadingPercentage.textContent = `${percent}%`;
  }
}

// Render Results Tab
function initResults() {
  const resultTabs = document.querySelectorAll('.result-tab');
  const resultPanes = document.querySelectorAll('.result-panel');

  resultTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-result-tab');
      
      resultTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      resultPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `result-tab-${target}`) {
          pane.classList.add('active');
        }
      });
    });
  });

  // Action buttons
  btnSaveCurrent.addEventListener('click', saveCurrentPlan);
  btnExportMarkdown.addEventListener('click', exportToMarkdown);
  btnPrintLesson.addEventListener('click', () => {
    window.print();
  });

  // Slide search button
  btnSlideImgSearch.addEventListener('click', executeSlideImageSearch);
  inputSlideImgSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSlideImageSearch();
  });
}

// Render Lesson Results to UI
function renderLessonResult(lesson) {
  resultTitle.textContent = lesson.title;
  tagSkill.textContent = lesson.skill;
  tagLevel.textContent = lesson.level;
  tagDuration.textContent = lesson.duration;

  // 1. Script Table
  scriptTableBody.innerHTML = '';
  lesson.stages.forEach(stage => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="stage-name-col">
        <strong>${stage.stageName}</strong>
        <span>${stage.duration}</span>
      </td>
      <td class="objective-col">
        <p>${stage.objective}</p>
        <span class="interaction-pattern">${stage.pattern}</span>
      </td>
      <td class="script-content-col">${stage.script.replace(/\\n/g, '\n')}</td>
    `;
    scriptTableBody.appendChild(tr);
  });

  // 2. Slide List
  slidesListContainer.innerHTML = '';
  lesson.slides.forEach((slide, idx) => {
    const div = document.createElement('div');
    div.className = `slide-item-card ${idx === 0 ? 'selected' : ''}`;
    div.innerHTML = `
      <div class="slide-number-box">${slide.number}</div>
      <div class="slide-info-box">
        <div class="slide-info-header">
          <h5>${slide.title}</h5>
        </div>
        <p class="slide-desc-text">${slide.description.replace(/\\n/g, '\n')}</p>
        <div class="slide-img-prompt">Prompt: ${slide.imagePrompt.replace(/\\n/g, '\n')}</div>
        <div class="slide-keywords-row">
          ${slide.searchKeywords.split(',').map(kw => `
            <button class="keyword-btn" onclick="event.stopPropagation(); triggerSearch('${kw.trim()}')">${kw.trim()}</button>
          `).join('')}
        </div>
      </div>
    `;
    div.addEventListener('click', () => {
      document.querySelectorAll('.slide-item-card').forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
      selectedSlideIndex = idx;
      
      // Auto populate search keywords
      const mainKeyword = slide.searchKeywords.split(',')[0].trim() || slide.title;
      inputSlideImgSearch.value = mainKeyword;
      triggerSearch(mainKeyword);
    });
    slidesListContainer.appendChild(div);
  });

  // Select first slide by default to search images
  if (lesson.slides.length > 0) {
    selectedSlideIndex = 0;
    const firstKeyword = lesson.slides[0].searchKeywords.split(',')[0].trim() || lesson.slides[0].title;
    inputSlideImgSearch.value = firstKeyword;
    triggerSearch(firstKeyword);
  }

  // Stop any active speech before rendering a new plan
  stopAudioScript();

  // 3. Materials & Game Play
  blockGame.textContent = (lesson.materials.games || 'None suggested').replace(/\\n/g, '\n');
  blockExercise.textContent = (lesson.materials.worksheets || 'None suggested').replace(/\\n/g, '\n');

  if (lesson.materials.homework) {
    blockExercise.textContent += `\n\n**HOMEWORK:**\n${lesson.materials.homework.replace(/\\n/g, '\n')}`;
  }

  const topic = lesson.topicInput || lesson.title || 'English';
  const cleanTopic = topic.replace(/[“"”']/g, ''); // clean quotes

  // Handle video resources suggestion if empty or not applicable
  const videoText = (lesson.materials.videoLinksDescription || '').replace(/\\n/g, '\n');
  const isVideoNotApplicable = !videoText.trim() || 
    /not\s+applicable|n\/a|no\s+video|none\s+suggested/i.test(videoText);

  if (isVideoNotApplicable) {
    const vkw1 = `${cleanTopic} lesson video`;
    const vkw2 = `${cleanTopic} ESL class presentation`;
    const vkw3 = `${cleanTopic} explanation for students`;

    blockVideo.innerHTML = `
      <div style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: var(--text-muted); white-space: pre-line;">
        ${videoText || 'Not applicable for this lesson activity.'}
      </div>
      <div class="youtube-suggestion-box" style="background: rgba(249, 115, 22, 0.05); border: 1px solid rgba(249, 115, 22, 0.15); border-radius: 8px; padding: 18px; margin-top: 15px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--orange); font-weight: 700; font-family: var(--font-display); font-size: 15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="color-orange"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
          💡 Gợi ý Tìm Video Chủ Đề Qua YouTube
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 14px;">
          Do bài học này không đi kèm video bổ trợ trực tiếp, bạn hãy dùng các từ khóa gợi ý bên dưới để tìm video học liệu trên YouTube:
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${vkw1}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(vkw1)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto; background-color: var(--orange); color: white;">
              Tìm kiếm
            </a>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${vkw2}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(vkw2)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto; background-color: var(--orange); color: white;">
              Tìm kiếm
            </a>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${vkw3}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(vkw3)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto; background-color: var(--orange); color: white;">
              Tìm kiếm
            </a>
          </div>
        </div>
      </div>
    `;
  } else {
    blockVideo.textContent = videoText;
  }

  // Handle listening script / dialogues suggestion if empty or not applicable
  const audioText = (lesson.materials.audioScript || '').replace(/\\n/g, '\n');
  const isAudioNotApplicable = !audioText.trim() || 
    /not\s+applicable|n\/a|no\s+listening\s+script|none\s+suggested/i.test(audioText);

  if (isAudioNotApplicable) {
    const akw1 = `${cleanTopic} ESL conversation`;
    const akw2 = `${cleanTopic} English listening practice`;
    const akw3 = `${cleanTopic} vocabulary dialogues`;

    blockAudio.innerHTML = `
      <div style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: var(--text-muted); white-space: pre-line;">
        ${audioText || 'Not applicable for this lesson activity.'}
      </div>
      <div class="youtube-suggestion-box" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; padding: 18px; margin-top: 15px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #8b5cf6; font-weight: 700; font-family: var(--font-display); font-size: 15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="color-violet"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
          💡 Gợi ý Luyện Nghe Chủ Đề Qua YouTube
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 14px;">
          Do bài học này không đi kèm file nghe trực tiếp, bạn hãy dùng các từ khóa gợi ý bên dưới để tìm và luyện nghe các video thực tế trên YouTube:
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${akw1}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(akw1)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto;">
              Tìm kiếm
            </a>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${akw2}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(akw2)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto;">
              Tìm kiếm
            </a>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-dark); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
            <span style="font-family: monospace; font-size: 13px; color: var(--text-main); font-weight: 500;">"${akw3}"</span>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(akw3)}" target="_blank" class="btn btn-primary-sm" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; border-radius: 6px; height: auto;">
              Tìm kiếm
            </a>
          </div>
        </div>
      </div>
    `;
  } else {
    blockAudio.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 12px 16px; margin-bottom: 15px;">
        <div style="font-size: 13px; font-weight: 600; color: var(--green); display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          Sẵn sàng nghe thoại bằng AI
        </div>
        <button id="btn-play-audio-script" class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; background-color: var(--green); color: white; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Audio
        </button>
      </div>
      <div style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.6; color: var(--text-main); font-family: var(--font-family); background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
        ${audioText}
      </div>
    `;
    
    // Attach play event listener
    const playBtn = blockAudio.querySelector('#btn-play-audio-script');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (isSpeaking) {
          stopAudioScript();
        } else {
          playAudioScript(audioText);
        }
      });
    }
  }

  // Active Save current state
  btnSaveCurrent.disabled = false;
  btnSaveCurrent.textContent = "Save Plan";
}

// Trigger image search in drawer
async function triggerSearch(keyword) {
  inputSlideImgSearch.value = keyword;
  await executeSlideImageSearch();
}
window.triggerSearch = triggerSearch;

// Execute duckduckgo/bing image search
async function executeSlideImageSearch() {
  const query = inputSlideImgSearch.value.trim();
  if (!query) return;

  searchImageResults.innerHTML = '<div class="no-results-msg">Searching for images...</div>';

  try {
    const response = await window.api.searchImages({ query, limit: 8 });
    
    if (response.success && response.results.length > 0) {
      searchImageResults.innerHTML = '';
      response.results.forEach(img => {
        const div = document.createElement('div');
        div.className = 'image-result-item';
        div.innerHTML = `
          <img src="${img.url}" alt="${img.title}" onerror="this.src='https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300'">
          <div class="copy-overlay">
            <span>Copy Link</span>
          </div>
        `;
        div.addEventListener('click', () => {
          navigator.clipboard.writeText(img.url);
          showToast("Image link copied to clipboard!");
        });
        searchImageResults.appendChild(div);
      });
    } else {
      searchImageResults.innerHTML = '<div class="no-results-msg">No images found. Try another query.</div>';
    }
  } catch (error) {
    console.error("Search error:", error);
    searchImageResults.innerHTML = '<div class="no-results-msg">Search failed.</div>';
  }
}

// Clipboard copying feedback toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = 'var(--green)';
  toast.style.color = 'white';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '1001';
  toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
  toast.style.fontFamily = 'var(--font-family)';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '600';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// Save Lesson Plan to history database
async function saveCurrentPlan() {
  if (!currentLesson) return;

  // Check if already saved
  const exists = appData.lessons.some(l => l.id === currentLesson.id);
  if (exists) {
    alert("This lesson plan is already saved!");
    return;
  }

  appData.lessons.unshift(currentLesson);
  await saveDatabase();
  
  btnSaveCurrent.disabled = true;
  btnSaveCurrent.textContent = "Saved ✓";
  showToast("Lesson plan saved successfully!");
}

// Export Lesson to Markdown file
function exportToMarkdown() {
  if (!currentLesson) return;

  let md = `# TESOL LESSON PLAN: ${currentLesson.title}\n\n`;
  md += `* **Skill/Methodology:** ${currentLesson.skill}\n`;
  md += `* **Level:** ${currentLesson.level}\n`;
  md += `* **Duration:** ${currentLesson.duration}\n\n`;
  
  md += `## 📜 LESSON STAGES & SCRIPTS\n\n`;
  currentLesson.stages.forEach(stage => {
    md += `### ${stage.stageName} (${stage.duration})\n`;
    md += `* **Objective:** ${stage.objective}\n`;
    md += `* **Interaction Pattern:** ${stage.pattern}\n\n`;
    md += `**Dialogue/Script:**\n\`\`\`\n${stage.script}\n\`\`\`\n\n`;
  });

  md += `## 🖼️ SLIDES DESIGN\n\n`;
  currentLesson.slides.forEach(slide => {
    md += `### Slide ${slide.number}: ${slide.title}\n`;
    md += `* **Visual Description:** ${slide.description}\n`;
    md += `* **Image Prompt:** ${slide.imagePrompt}\n`;
    md += `* **Image Search Query:** ${slide.searchKeywords}\n\n`;
  });

  md += `## 📦 TEACHING MATERIALS & RESOURCE LINKS\n\n`;
  md += `### Video Resources\n${currentLesson.materials.videoLinksDescription}\n\n`;
  md += `### Audio script / Prompts\n${currentLesson.materials.audioScript}\n\n`;
  md += `### Classroom Game Play & Activities\n${currentLesson.materials.games}\n\n`;
  
  md += `## 📝 WORKSHEETS & HOMEWORK\n\n`;
  md += `### Student Worksheet\n${currentLesson.materials.worksheets}\n\n`;
  md += `### Homework\n${currentLesson.materials.homework}\n\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentLesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_tesol_plan.md`;
  a.click();
}

// History tab logic
function initHistory() {
  historySearchInput.addEventListener('input', renderHistoryList);
  btnClearHistory.addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete all saved lesson plans? This cannot be undone.")) {
      appData.lessons = [];
      await saveDatabase();
      renderHistoryList();
    }
  });
}

function updateHistoryUI() {
  const count = appData.lessons.length;
  historyCountBadge.textContent = count;
  if (count === 0) {
    historyCountBadge.classList.add('hidden');
  } else {
    historyCountBadge.classList.remove('hidden');
  }
}

function renderHistoryList() {
  const query = historySearchInput.value.trim().toLowerCase();
  historyListGrid.innerHTML = '';

  const filtered = appData.lessons.filter(l => 
    l.title.toLowerCase().includes(query) ||
    l.skill.toLowerCase().includes(query) ||
    l.level.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    historyListGrid.innerHTML = '<div class="no-history-msg">No matching saved lessons found.</div>';
    return;
  }

  filtered.forEach(lesson => {
    const div = document.createElement('div');
    div.className = 'history-item-card';
    
    const dateStr = new Date(lesson.createdAt).toLocaleDateString();
    
    div.innerHTML = `
      <div>
        <h4 class="history-title">${lesson.title}</h4>
        <div class="history-meta">
          <span class="meta-tag skill">${lesson.skill}</span>
          <span class="meta-tag level">${lesson.level}</span>
        </div>
      </div>
      <div class="history-footer">
        <span class="history-date">${dateStr}</span>
        <button class="btn-history-delete" onclick="event.stopPropagation(); deleteHistoryItem('${lesson.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `;
    
    div.addEventListener('click', () => {
      currentLesson = lesson;
      renderLessonResult(lesson);
      resultContainer.classList.remove('hidden');
      
      // Go to Create Tab to show results
      const createTabBtn = document.querySelector('[data-tab="create"]');
      if (createTabBtn) createTabBtn.click();
      
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    historyListGrid.appendChild(div);
  });
}

// Delete item from history
async function deleteHistoryItem(id) {
  if (confirm("Delete this lesson plan from history?")) {
    appData.lessons = filtered = appData.lessons.filter(l => l.id !== id);
    await saveDatabase();
    renderHistoryList();
  }
}
window.deleteHistoryItem = deleteHistoryItem;

// SpeechSynthesis TTS Player variables and helpers
let currentUtterance = null;
let isSpeaking = false;

function playAudioScript(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    // Clean roles and format spaces/newlines
    const cleanText = text
      .replace(/T:|S:|Teacher:|Student:|Sarah:|Ben:/gi, '')
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 0.95; // Slightly slower for students
    
    utterance.onend = () => {
      isSpeaking = false;
      updatePlayButtonUI(false);
    };
    
    utterance.onerror = () => {
      isSpeaking = false;
      updatePlayButtonUI(false);
    };
    
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
    updatePlayButtonUI(true);
  } else {
    alert("Speech Synthesis is not supported in this environment.");
  }
}

function stopAudioScript() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    updatePlayButtonUI(false);
  }
}

function updatePlayButtonUI(playing) {
  const btn = document.getElementById('btn-play-audio-script');
  if (!btn) return;
  if (playing) {
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg> Stop Audio`;
    btn.style.backgroundColor = 'var(--danger)';
  } else {
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Audio`;
    btn.style.backgroundColor = 'var(--green)';
  }
}
