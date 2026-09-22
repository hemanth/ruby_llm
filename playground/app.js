import { lessons } from "./lessons.js";
import { highlightCode, fallbackHighlight, isWebGpuSupported } from "./highlighter.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function getStorage(key, fallback = "") {
  try {
    return (typeof localStorage !== "undefined" && localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}
function setStorage(key, val) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, val);
  } catch (e) {}
}
function removeStorage(key) {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  } catch (e) {}
}

let rubyVM = null;
let rubyLLMCode = "";
let editor = null;
let currentLesson = 0;
let completed = JSON.parse(getStorage("rubyllm-codelab-completed", "[]"));
let isRunning = false;
let wasmStatus = "booting";
let currentTheme = getStorage("rubyllm-theme", (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const sidebarEl = $("sidebar-lessons");
const searchInput = $("search-input");
const lessonNum = $("lesson-num");
const lessonTitle = $("lesson-title");
const lessonDesc = $("lesson-desc");
const outputEl = $("output");
const outputStatus = $("output-status");
const exerciseText = $("exercise-text");
const hintText = $("hint-text");
const hintToggle = $("hint-toggle");
const progressLabel = $("progress-label");
const progressFill = $("progress-fill");
const progressPct = $("progress-pct");
const editorStatus = $("editor-status");
const btnRun = $("btn-run");
const btnReset = $("btn-reset");
const btnSolution = $("btn-solution");
const btnPrev = $("btn-prev");
const btnNext = $("btn-next");
const landingEl = $("landing");
const startBtn = $("start-codelab");
const sidebarToggle = $("sidebar-toggle");
const sidebarBackdrop = $("sidebar-backdrop");
const sidebarNav = $("sidebar");
const sidebarCloseBtn = $("sidebar-close-btn");
const mobileProgressFill = $("topbar-mobile-fill");
const congratsOverlay = $("congrats-overlay");
const congratsRestart = $("congrats-restart");
const engineStatus = $("engine-status");
const engineDot = $("engine-dot");
const engineBadge = $("engine-badge");
const themeToggleBtn = $("theme-toggle");
const landingThemeToggleBtn = $("landing-theme-toggle");

// ---------------------------------------------------------------------------
// Theme Management (Light & Dark matching rubyllm.com)
// ---------------------------------------------------------------------------

function applyTheme(theme) {
  currentTheme = theme;
  setStorage("rubyllm-theme", theme);
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  const icon = isDark ? "☀️" : "🌙";
  if (themeToggleBtn) themeToggleBtn.textContent = icon;
  if (landingThemeToggleBtn) landingThemeToggleBtn.textContent = icon;

  if (editor && window.monaco) {
    monaco.editor.setTheme(isDark ? "rubyllm-dark" : "rubyllm-light");
  }
}

function toggleTheme() {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

// ---------------------------------------------------------------------------
// Sidebar Toggle (Mobile)
// ---------------------------------------------------------------------------

function toggleSidebar(open) {
  const isOpen = open ?? !sidebarNav.classList.contains("open");
  sidebarNav.classList.toggle("open", isOpen);
  sidebarBackdrop.classList.toggle("open", isOpen);
  if (isOpen) {
    document.body.classList.add("sidebar-drawer-open");
  } else {
    document.body.classList.remove("sidebar-drawer-open");
  }
}
if (sidebarToggle) sidebarToggle.addEventListener("click", () => toggleSidebar());
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", () => toggleSidebar(false));
if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", () => toggleSidebar(false));

// ---------------------------------------------------------------------------
// Simple Markdown to HTML Formatter
// ---------------------------------------------------------------------------

function renderMarkdown(text) {
  if (!text) return "";
  const codeBlocks = [];

  // 1. Extract fenced code blocks with rich syntax highlighting and replace with placeholders
  let str = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const trimmed = code.trim();
    const highlighted = fallbackHighlight(trimmed);
    const html = `<pre><code class="language-${lang || "ruby"}" data-raw="${encodeURIComponent(trimmed)}">${highlighted}</code></pre>`;
    const placeholder = `@@@RUBYLLM_CODE_BLOCK_${codeBlocks.length}@@@`;
    codeBlocks.push(html);
    return `\n\n${placeholder}\n\n`;
  });

  // 2. Format inline markdown
  str = str
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 3. Block-level parsing for paragraphs, unordered lists, ordered lists, and code blocks
  const lines = str.split("\n");
  const blocks = [];
  let currentParagraph = [];
  let currentList = [];
  let listType = null;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      blocks.push(`<p>${currentParagraph.join("<br>")}</p>`);
      currentParagraph = [];
    }
  }

  function flushList() {
    if (currentList.length > 0) {
      const tag = listType === "ol" ? "ol" : "ul";
      const items = currentList.map((item) => `  <li>${item}</li>`).join("\n");
      blocks.push(`<${tag}>\n${items}\n</${tag}>`);
      currentList = [];
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("@@@RUBYLLM_CODE_BLOCK_")) {
      flushParagraph();
      flushList();
      blocks.push(trimmed);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const ulMatch = line.match(/^(\s*)[*-]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      currentList.push(ulMatch[2]);
      continue;
    }

    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      currentList.push(olMatch[2]);
      continue;
    }

    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  let result = blocks.join("\n");

  // 4. Restore code blocks untouched
  result = result.replace(/@@@RUBYLLM_CODE_BLOCK_(\d+)@@@/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || "";
  });

  return result;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function highlightCodeBlocks(container) {
  if (!container) return;
  const codeEls = container.querySelectorAll("pre code");
  for (const codeEl of codeEls) {
    let raw = "";
    if (codeEl.dataset.raw) {
      try {
        raw = decodeURIComponent(codeEl.dataset.raw);
      } catch {
        raw = codeEl.dataset.raw;
      }
    } else {
      raw = codeEl.textContent;
    }
    try {
      const gpuHtml = await highlightCode(raw);
      if (gpuHtml) codeEl.innerHTML = gpuHtml;
    } catch (e) {
      // Keep fallback highlight
    }
  }
}

async function highlightLandingSnippet() {
  const heroCodeEl = $("landing-hero-code");
  if (heroCodeEl) {
    const raw = heroCodeEl.textContent.trim();
    try {
      heroCodeEl.innerHTML = await highlightCode(raw);
    } catch (e) {
      heroCodeEl.innerHTML = fallbackHighlight(raw);
    }
  }
}


// ---------------------------------------------------------------------------
// Terminal Output Helpers
// ---------------------------------------------------------------------------

function clearOutput() {
  outputEl.innerHTML = "";
  outputEl.classList.remove("has-error");
}

function appendOutput(text, type = "stdout") {
  const emptyEl = outputEl.querySelector(".output-empty");
  if (emptyEl) emptyEl.remove();

  if (type === "error" || type === "stderr") {
    outputEl.classList.add("has-error");
    const span = document.createElement("span");
    span.style.color = "#f87171";
    span.textContent = text;
    outputEl.appendChild(span);
  } else {
    // Format special tags with styled badges after escaping user/model text
    const escaped = escapeHtml(text);
    const formatted = escaped
      .replace(/\[USER\]/g, '<span class="output-tag output-tag-chat">USER</span>')
      .replace(/\[TOOL\]/g, '<span class="output-tag output-tag-tool">TOOL</span>')
      .replace(/\[HITL\]/g, '<span class="output-tag output-tag-tool">HITL</span>')
      .replace(/\[RAILS\]/g, '<span class="output-tag output-tag-rails">RAILS</span>')
      .replace(/\[AGENT\]/g, '<span class="output-tag output-tag-agent">AGENT</span>')
      .replace(/\[RUBYLLM::\w+\]/g, '<span class="output-tag output-tag-sys">RUBYLLM</span>')
      .replace(/\[(IMAGE|VIDEO|AUDIO|APPROVAL|LOOP|SUCCESS)\]/g, '<span class="output-tag output-tag-sys">$1</span>');

    const wrapper = document.createElement("span");
    wrapper.innerHTML = formatted;
    outputEl.appendChild(wrapper);
  }
  outputEl.scrollTop = outputEl.scrollHeight;
}

// Global hook for Ruby WASM bridge
window.__rubyLLMOutput = (str, type) => {
  appendOutput(str, type);
};

// Global hook for Ruby WASM live proxy chat
window.__rubyLLMProxyChat = (payloadJson) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/chat", false); // Synchronous XHR for WASM execution
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(payloadJson);
    if (xhr.status === 200) {
      return xhr.responseText;
    }
    return JSON.stringify({ simulated: true, error: "HTTP " + xhr.status });
  } catch (e) {
    return JSON.stringify({ simulated: true, error: e.message });
  }
};

let proxyStatus = { live: false, activeProviders: [], preferredModel: null };

async function fetchProxyStatus() {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (res.ok) {
      proxyStatus = await res.json();
    }
  } catch {
    proxyStatus = { live: false, activeProviders: [], preferredModel: null };
  }
}

// ---------------------------------------------------------------------------
// Ruby Environment Initialization
// ---------------------------------------------------------------------------

async function initRubyEnvironment() {
  try {
    const resp = await fetch("./ruby_llm.rb", { cache: "no-store" });
    if (resp.ok) {
      rubyLLMCode = await resp.text();
    }
  } catch (e) {
    console.warn("Could not fetch local ruby_llm.rb", e);
  }

  // Attempt to load CRuby WebAssembly in background
  try {
    const { DefaultRubyVM } = await import("https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.10.1/dist/browser/+esm");
    const wasmResponse = await fetch("https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.10.1/dist/ruby+stdlib.wasm");

    if (wasmResponse.ok) {
      const module = await WebAssembly.compileStreaming(wasmResponse);
      const { vm } = await DefaultRubyVM(module);
      rubyVM = vm;

      // Setup stdout/stderr bridge
      rubyVM.eval(`
        require "js"
        class PlaygroundOutput
          def initialize(channel)
            @channel = channel
          end
          def write(str)
            JS.global.call(:__rubyLLMOutput, str, @channel)
          end
          def puts(*args)
            args.each { |a| write("#{a}\\n") }
          end
          def print(*args)
            args.each { |a| write(a.to_s) }
          end
          def flush; end
        end
        $stdout = PlaygroundOutput.new("stdout")
        $stderr = PlaygroundOutput.new("stderr")
      `);

      if (rubyLLMCode) {
        rubyVM.eval(rubyLLMCode);
      }

      wasmStatus = "ready";
      updateEngineBadge("Ruby 3.3 WASM", "ready");
    } else {
      throw new Error("WASM binary fetch failed");
    }
  } catch (err) {
    wasmStatus = "fallback";
    updateEngineBadge("Ruby Engine", "ready");
  }

  btnRun.disabled = false;
}

function updateEngineBadge(label, state) {
  const badgeEl = $("engine-badge");
  if (engineStatus) {
    if (proxyStatus.live) {
      const p = proxyStatus.activeProviders[0] || "Live API";
      engineStatus.textContent = `${label} · Live (${p})`;
      if (badgeEl) {
        badgeEl.title = `Live API active via proxy (${proxyStatus.activeProviders.join(", ")}). Models without keys fall back to simulation mode.`;
      }
    } else {
      engineStatus.textContent = `${label} · Simulation`;
      if (badgeEl) {
        badgeEl.title = `Local zero-setup simulation mode. Set API keys in .env for live LLM calls.`;
      }
    }
  }
  if (engineDot) {
    engineDot.classList.remove("loading");
    if (state === "ready") {
      engineDot.style.background = proxyStatus.live ? "#10b981" : "var(--green)";
    }
  }
}

// ---------------------------------------------------------------------------
// Monaco Editor Initialization
// ---------------------------------------------------------------------------

function updateEditorHeight() {
  if (!editor) return;
  const isMobile = window.innerWidth <= 600;
  const minH = isMobile ? 180 : 260;
  const maxH = isMobile ? 380 : 520;
  const contentHeight = Math.min(maxH, Math.max(minH, editor.getContentHeight()));
  const container = $("editor-container");
  if (container && Math.abs(container.clientHeight - contentHeight) > 4) {
    container.style.height = `${contentHeight}px`;
    editor.layout();
  }
}

function initMonaco() {
  return new Promise((resolve) => {
    window.require.config({
      paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
    });

    window.require(["vs/editor/editor.main"], () => {
      // 1. RubyLLM Dark Theme (Warm Gruvbox from rubyllm-overrides.css)
      monaco.editor.defineTheme("rubyllm-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "928374", fontStyle: "italic" },
          { token: "keyword", foreground: "FF433D", fontStyle: "bold" },
          { token: "string", foreground: "B8BB26" },
          { token: "number", foreground: "FABD2F" },
          { token: "type", foreground: "8EC07C" },
          { token: "identifier", foreground: "D6D0CC" },
          { token: "delimiter", foreground: "8F8A86" },
        ],
        colors: {
          "editor.background": "#1B1B1A",
          "editor.foreground": "#D6D0CC",
          "editor.lineHighlightBackground": "#232323",
          "editorLineNumber.foreground": "#5C5353",
          "editorLineNumber.activeForeground": "#ED3434",
          "editorCursor.foreground": "#ED3434",
          "editor.selectionBackground": "#30302F",
        },
      });

      // 2. RubyLLM Light Theme (Warm Paper Gruvbox)
      monaco.editor.defineTheme("rubyllm-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "928374", fontStyle: "italic" },
          { token: "keyword", foreground: "9D0006", fontStyle: "bold" },
          { token: "string", foreground: "79740E" },
          { token: "number", foreground: "B57614" },
          { token: "type", foreground: "427B58" },
          { token: "identifier", foreground: "2C2926" },
          { token: "delimiter", foreground: "5C5353" },
        ],
        colors: {
          "editor.background": "#FAF9F7",
          "editor.foreground": "#2C2926",
          "editor.lineHighlightBackground": "#F3ECE7",
          "editorLineNumber.foreground": "#A89984",
          "editorLineNumber.activeForeground": "#C9271E",
          "editorCursor.foreground": "#C9271E",
          "editor.selectionBackground": "#E0D9D5",
        },
      });

      const isDark = currentTheme === "dark";
      editor = monaco.editor.create($("editor-container"), {
        value: "",
        language: "ruby",
        theme: isDark ? "rubyllm-dark" : "rubyllm-light",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 20,
        wordWrap: "on",
        wrappingStrategy: "advanced",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
        tabSize: 2,
        renderLineHighlight: "all",
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      });

      editor.onDidContentSizeChange(updateEditorHeight);

      window.addEventListener("resize", () => {
        if (editor) {
          updateEditorHeight();
          editor.layout();
        }
      });

      const editorContainer = $("editor-container");
      const mainEl = $("main");
      if (editorContainer && mainEl) {
        editorContainer.addEventListener(
          "wheel",
          (e) => {
            if (!editor) return;
            const scrollHeight = editor.getScrollHeight();
            const scrollTop = editor.getScrollTop();
            const layout = editor.getLayoutInfo();
            const clientHeight = layout.height;
            const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

            const isDown = e.deltaY > 0;
            const isUp = e.deltaY < 0;

            const canScrollDown = isDown && scrollTop < maxScrollTop - 1;
            const canScrollUp = isUp && scrollTop > 1;

            if (!canScrollDown && !canScrollUp) {
              mainEl.scrollTop += e.deltaY;
            }
          },
          { passive: true, capture: true }
        );
      }

      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Sidebar & Progress
// ---------------------------------------------------------------------------

function buildSidebar() {
  sidebarEl.innerHTML = "";
  let lastCategory = null;

  lessons.forEach((lesson, index) => {
    if (lesson.category && lesson.category !== lastCategory) {
      const catEl = document.createElement("div");
      catEl.className = "sidebar-category";
      catEl.textContent = lesson.category;
      sidebarEl.appendChild(catEl);
      lastCategory = lesson.category;
    }

    const item = document.createElement("div");
    item.className = "sidebar-item";
    item.dataset.index = index;

    if (completed.includes(lesson.id)) {
      item.classList.add("completed");
    }

    item.innerHTML = `
      <div class="dot"></div>
      <span class="sidebar-num">${index + 1}.</span>
      <span class="sidebar-title">${escapeHtml(lesson.title)}</span>
    `;

    item.addEventListener("click", () => {
      loadLesson(index);
      toggleSidebar(false);
    });

    sidebarEl.appendChild(item);
  });
}

function updateProgress() {
  const total = lessons.length;
  const done = completed.length;
  const pct = Math.round((done / total) * 100);

  progressLabel.textContent = `${done}/${total} complete`;
  progressFill.style.width = `${pct}%`;
  progressPct.textContent = `${pct}%`;
  if (mobileProgressFill) mobileProgressFill.style.width = `${pct}%`;

  document.querySelectorAll(".sidebar-item").forEach((el) => {
    const idx = parseInt(el.dataset.index, 10);
    const lesson = lessons[idx];
    if (lesson && completed.includes(lesson.id)) {
      el.classList.add("completed");
    } else {
      el.classList.remove("completed");
    }
  });

  if (done === total && congratsOverlay) {
    const congratsTotal = $("congrats-total-lessons");
    if (congratsTotal) congratsTotal.textContent = `${total}`;
    const congratsStat = $("congrats-stat-lessons");
    if (congratsStat) congratsStat.textContent = `${total}`;
    congratsOverlay.classList.remove("hidden");
  }
}

function loadLesson(index) {
  if (index < 0 || index >= lessons.length) return;
  currentLesson = index;
  const lesson = lessons[index];

  document.querySelectorAll(".sidebar-item").forEach((el) => {
    el.classList.toggle("active", parseInt(el.dataset.index, 10) === index);
  });

  lessonNum.textContent = `Lesson ${index + 1} of ${lessons.length} · ${lesson.category || "RubyLLM"}`;
  lessonTitle.textContent = lesson.title;
  lessonDesc.innerHTML = renderMarkdown(lesson.description);

  exerciseText.innerHTML = renderMarkdown(lesson.exercise);
  hintText.innerHTML = renderMarkdown(lesson.hint);
  hintText.classList.remove("show");
  hintToggle.innerHTML = '<span class="hint-toggle-icon">💡</span><span class="hint-toggle-text">Show hint</span>';
  hintToggle.setAttribute("aria-expanded", "false");

  // Asynchronous WebGPU syntax highlighting pass via gpu-lexer
  highlightCodeBlocks(lessonDesc);
  highlightCodeBlocks(exerciseText);
  highlightCodeBlocks(hintText);

  const saved = getStorage(`rubyllm-code-${lesson.id}`);
  if (editor) {
    editor.setValue(saved || lesson.starterCode);
    updateEditorHeight();
  }

  clearOutput();
  outputEl.innerHTML = '<span class="output-empty">Click "Run Code" or press Shift+Enter to execute</span>';
  outputStatus.textContent = "Ready";
  outputStatus.className = "";

  btnSolution.textContent = "Show solution";
  btnPrev.disabled = index === 0;
  btnNext.disabled = index === lessons.length - 1;

  $("main").scrollTop = 0;
}

// ---------------------------------------------------------------------------
// Execution Engine
// ---------------------------------------------------------------------------

async function runCode() {
  if (isRunning) return;
  const code = editor.getValue();
  if (!code.trim()) return;

  isRunning = true;
  btnRun.disabled = true;
  clearOutput();
  outputStatus.textContent = "Running…";
  outputStatus.className = "output-status-running";

  const startTime = performance.now();

  try {
    if (rubyVM && wasmStatus === "ready") {
      rubyVM.eval(code);
    } else {
      await runSimulatedRuby(code);
    }

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    outputStatus.textContent = `Done (${elapsed}s)`;
    outputStatus.className = "output-status-ok";

    const lesson = lessons[currentLesson];
    if (lesson && !completed.includes(lesson.id)) {
      completed.push(lesson.id);
      setStorage("rubyllm-codelab-completed", JSON.stringify(completed));
      updateProgress();
    }
  } catch (err) {
    outputStatus.textContent = "Error";
    outputStatus.className = "output-status-err";
    appendOutput(`\nRuntime Error: ${err.message || err}`, "error");
  } finally {
    isRunning = false;
    btnRun.disabled = false;
  }
}

async function runSimulatedRuby(code) {
  const puts = (s) => appendOutput((s === undefined ? "" : s) + "\n", "stdout");

  let totalInTokens = 0;
  let totalOutTokens = 0;

  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    if (line.includes("RubyLLM.paint")) {
      const match = line.match(/paint\s*\(?["']([^"']+)["']/);
      const prompt = match ? match[1] : "artwork";
      puts(`[RUBYLLM::PAINT] Generating image with dall-e-3: "${prompt}"`);
      puts(`[IMAGE] Saved dall-e-3 image to gem.png (URL: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)`);
      continue;
    }

    if (line.includes("RubyLLM.animate")) {
      const match = line.match(/animate\s*\(?["']([^"']+)["']/);
      const prompt = match ? match[1] : "video";
      puts(`[RUBYLLM::ANIMATE] Generating video with sora-2: "${prompt}"`);
      puts(`[VIDEO] Saved sora-2 video (5.0s) to vid.mp4`);
      continue;
    }

    if (line.includes("RubyLLM.speak")) {
      const match = line.match(/speak\s*\(?["']([^"']+)["']/);
      const text = match ? match[1] : "Speech";
      puts(`[RUBYLLM::SPEAK] Synthesizing speech (alloy): "${text}"`);
      puts(`[AUDIO] Saved speech (0.8s, voice 'alloy') to speech.mp3`);
      continue;
    }

    if (line.includes("RubyLLM.transcribe")) {
      puts(`[RUBYLLM::TRANSCRIBE] Transcribing audio recording`);
      puts(`Full Transcript: RubyLLM provides an idiomatic and unified interface across all major AI providers.`);
      puts(`Language Detected: en`);
      puts(`Total Audio Duration: 5.1 seconds`);
      continue;
    }

    if (line.includes("RubyLLM.ocr")) {
      puts(`[RUBYLLM::OCR] Extracting structured text from document...`);
      puts(`# Invoice #INV-2026-042\n**Date:** 2026-09-21\n| Description | Qty | Rate | Amount |\n| AI Review | 10 | $250.00 | $2,500.00 |`);
      puts(`\n[SUCCESS] Table structure detected in document!`);
      continue;
    }

    if (line.includes("RubyLLM.embed")) {
      puts(`[RUBYLLM::EMBED] Computing vector embeddings (text-embedding-3-small)`);
      puts(`Dimensions: 1536`);
      puts(`Vector weights preview: [-0.0234, 0.1421, -0.0892, 0.2015]`);
      continue;
    }

    if (line.includes("RubyLLM.rerank")) {
      puts(`[RUBYLLM::RERANK] Reranking documents for query relevance`);
      puts(`1. [Score: 0.9421] You can reset your password under Account Settings -> Security.`);
      puts(`2. [Score: 0.8842] Forgotten passwords can be recovered via the login screen link.`);
      puts(`3. [Score: 0.3120] Invoices arrive on the 1st of every month.`);
      continue;
    }

    if (line.includes("RubyLLM.moderate")) {
      puts(`[RUBYLLM::MODERATE] Checking safety against moderation categories`);
      puts(`Flagged? false`);
      puts(`Harassment Score: 0.001`);
      puts(`Status: SAFE (Well below 0.05 threshold)`);
      continue;
    }

    if (line.includes("Chat.create") || line.includes("UserChat.create") || line.includes("SupportChat.create") || line.includes("WorkspaceChat.create") || line.includes("EnterpriseChat.create") || line.includes("PortfolioChat.create")) {
      puts(`[RAILS] INSERT INTO "ruby_llm_chats" ("model", "created_at") VALUES ('gpt-5.6-luna', '${new Date().toISOString()}') RETURNING "id"`);
      puts(`Created Chat Record #ID: 1`);
      continue;
    }

    if (line.includes(".ask ") || line.includes(".ask(")) {
      const match = line.match(/\.ask\s*\(?["']([^"']+)["']/);
      const prompt = match ? match[1] : "Question";
      puts(`[USER] ${prompt}`);

      if (proxyStatus.live && !line.includes("weather") && !prompt.toLowerCase().includes("weather") && !code.includes("Weather") && !prompt.toLowerCase().includes("stock") && !code.includes("StockPrice") && !line.includes("DeployTool")) {
        try {
          const modelMatch = code.match(/model:\s*["']([^"']+)["']/);
          const reqModel = modelMatch ? modelMatch[1] : (proxyStatus.preferredModel || "claude-sonnet-5");
          const chatRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: reqModel,
              messages: [{ role: "user", content: prompt }]
            })
          });
          const chatData = await chatRes.json();
          if (!chatData.simulated && chatData.content) {
            await simulateStreaming(chatData.content);
            totalInTokens += chatData.tokens?.input || 20;
            totalOutTokens += chatData.tokens?.output || 40;
            continue;
          }
        } catch {
          // fall through to simulation
        }
      }

      if (line.includes("weather") || prompt.toLowerCase().includes("weather") || code.includes("Weather")) {
        puts(`[TOOL] Executed WeatherTool -> {:city=>"Berlin", :temp=>"18.5°C", :weather=>"Partly Cloudy"}`);
        puts(`The current weather in Berlin is 18.5°C with partly cloudy skies and a gentle 12 km/h breeze.`);
      } else if (prompt.toLowerCase().includes("stock") || code.includes("StockPrice")) {
        puts(`[TOOL] Executed StockPrice -> {:symbol=>"AAPL", :price=>185.42, :change=>"+1.8%"}`);
        puts(`Apple Inc. (AAPL) is currently trading at $185.42 (+1.8% today).`);
      } else if (prompt.toLowerCase().includes("deploy") || line.includes("DeployTool")) {
        puts(`[HITL] Paused: Tool DeployTool requires human approval (Call ID: call_4821)`);
        puts(`Approved! Now complete? true`);
      } else if (prompt.toLowerCase().includes("story")) {
        await simulateStreaming("Once upon a time in 1995, Yukihiro Matsumoto created Ruby to prioritize developer happiness and expression. Today, RubyLLM carries that exact same joy into the modern era of autonomous AI agents.");
      } else if (prompt.toLowerCase().includes("active record") || prompt.toLowerCase().includes("rails")) {
        puts(`Active Record integrates seamlessly with RubyLLM via acts_as_chat and acts_as_message. Chats and messages persist cleanly in your application database.`);
      } else {
        puts(`RubyLLM processed your request using ${proxyStatus.preferredModel || "gpt-5.6-luna"}: "${prompt}". Every model, tool, and operation follows the Ruby way.`);
      }

      totalInTokens += Math.max(12, Math.floor(prompt.length / 3));
      totalOutTokens += 48;
      continue;
    }

    if (line.includes("puts ") || line.includes("print ")) {
      const expr = line.replace(/^(puts|print)\s+/, "");
      if (expr.includes("tokens") || expr.includes("Tokens")) {
        puts(`Tokens(in: ${totalInTokens || 24}, out: ${totalOutTokens || 72}, total: ${(totalInTokens || 24) + (totalOutTokens || 72)})`);
      } else if (expr.includes("cost") || expr.includes("Cost")) {
        const amt = (((totalInTokens + totalOutTokens) || 96) * 0.000003).toFixed(6);
        puts(`$${amt} USD`);
      } else if (expr.includes("complete?")) {
        puts("complete? true");
      }
    }
  }
}

async function simulateStreaming(text) {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    appendOutput(words[i] + " ", "stdout");
    await new Promise((r) => setTimeout(r, 20));
  }
  appendOutput("\n", "stdout");
}

// ---------------------------------------------------------------------------
// Search & Events
// ---------------------------------------------------------------------------

function setupSearch() {
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll(".sidebar-item").forEach((el) => {
      const idx = parseInt(el.dataset.index, 10);
      const lesson = lessons[idx];
      const match =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q) ||
        (lesson.category && lesson.category.toLowerCase().includes(q));
      el.classList.toggle("hidden", !match);
    });
  });
}

function setupEvents() {
  btnRun.addEventListener("click", runCode);

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey || e.shiftKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  });

  btnReset.addEventListener("click", () => {
    const lesson = lessons[currentLesson];
    if (lesson && editor) {
      editor.setValue(lesson.starterCode);
      removeStorage(`rubyllm-code-${lesson.id}`);
      clearOutput();
      outputEl.innerHTML = '<span class="output-empty">Code reset to starter template</span>';
    }
  });

  btnSolution.addEventListener("click", () => {
    const lesson = lessons[currentLesson];
    if (!lesson || !editor) return;

    if (btnSolution.textContent.includes("solution")) {
      editor.setValue(lesson.solution);
      btnSolution.textContent = "Show starter";
    } else {
      editor.setValue(lesson.starterCode);
      btnSolution.textContent = "Show solution";
    }
  });

  hintToggle.addEventListener("click", () => {
    const isShown = hintText.classList.toggle("show");
    hintToggle.innerHTML = isShown
      ? '<span class="hint-toggle-icon">💡</span><span class="hint-toggle-text">Hide hint</span>'
      : '<span class="hint-toggle-icon">💡</span><span class="hint-toggle-text">Show hint</span>';
    hintToggle.setAttribute("aria-expanded", String(isShown));
    if (isShown) {
      highlightCodeBlocks(hintText);
    }
  });

  btnPrev.addEventListener("click", () => loadLesson(currentLesson - 1));
  btnNext.addEventListener("click", () => loadLesson(currentLesson + 1));

  if (editor) {
    editor.onDidChangeModelContent(() => {
      const lesson = lessons[currentLesson];
      if (lesson) {
        setStorage(`rubyllm-code-${lesson.id}`, editor.getValue());
      }
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      document.body.classList.remove("landing-active");
      landingEl.classList.add("hidden");
      loadLesson(0);
      window.scrollTo(0, 0);
      if (editor) setTimeout(() => editor.layout(), 50);
    });
  }

  document.querySelectorAll(".pill[data-lesson]").forEach((pill) => {
    pill.addEventListener("click", () => {
      const targetId = pill.dataset.lesson;
      let targetIdx = 0;
      if (!isNaN(parseInt(targetId, 10))) {
        targetIdx = parseInt(targetId, 10);
      } else {
        const found = lessons.findIndex((l) => l.id === targetId);
        if (found !== -1) targetIdx = found;
      }
      document.body.classList.remove("landing-active");
      landingEl.classList.add("hidden");
      loadLesson(targetIdx);
      window.scrollTo(0, 0);
      if (editor) setTimeout(() => editor.layout(), 50);
    });
  });

  const brandGroup = $("brand-group");
  if (brandGroup) {
    brandGroup.addEventListener("click", () => {
      document.body.classList.add("landing-active");
      landingEl.classList.remove("hidden");
      window.scrollTo(0, 0);
    });
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
  if (landingThemeToggleBtn) landingThemeToggleBtn.addEventListener("click", toggleTheme);

  if (congratsRestart) {
    congratsRestart.addEventListener("click", () => {
      completed = [];
      removeStorage("rubyllm-codelab-completed");
      lessons.forEach((l) => removeStorage(`rubyllm-code-${l.id}`));
      updateProgress();
      congratsOverlay.classList.add("hidden");
      loadLesson(0);
    });
  }

  // Smooth scroll delegation: when cursor is over non-vertically-scrollable pre blocks,
  // ensure wheel delta scrolls the main page container without hitching
  window.addEventListener(
    "wheel",
    (e) => {
      const pre = e.target.closest("pre");
      if (pre && pre.scrollHeight <= pre.clientHeight + 2) {
        const scrollContainer = pre.closest(".landing") || pre.closest("#main") || $("main");
        if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
          scrollContainer.scrollTop += e.deltaY;
        }
      }
    },
    { passive: true, capture: true }
  );
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main() {
  applyTheme(currentTheme);

  // Sync actual lesson count dynamically
  const metaPillLessons = document.querySelector(".landing-meta-pill-lessons");
  if (metaPillLessons) metaPillLessons.textContent = `${lessons.length} hands-on lessons`;
  const congratsTotal = $("congrats-total-lessons");
  if (congratsTotal) congratsTotal.textContent = `${lessons.length}`;
  const congratsStat = $("congrats-stat-lessons");
  if (congratsStat) congratsStat.textContent = `${lessons.length}`;

  buildSidebar();
  updateProgress();
  setupSearch();

  await fetchProxyStatus();
  await initMonaco();
  loadLesson(0);
  setupEvents();

  highlightLandingSnippet();

  initRubyEnvironment().catch((err) => {
    console.warn("Ruby runtime background load note:", err);
  });
}

window.addEventListener("DOMContentLoaded", main);
