/**
 * gpu-lexer syntax highlighter integration
 * Powered by https://gpu-lexer.vercel.app/ (WebGPU) with zero-dependency fallback.
 */

import { parse as gpuLexerParse } from "./assets/gpu-lexer.js";

let webGpuAvailable = null;

export function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Checks whether WebGPU is supported and available in the current context.
 */
export async function isWebGpuSupported() {
  if (webGpuAvailable !== null) return webGpuAvailable;
  if (typeof navigator === "undefined" || !navigator.gpu) {
    webGpuAvailable = false;
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    webGpuAvailable = !!adapter;
  } catch (e) {
    webGpuAvailable = false;
  }
  return webGpuAvailable;
}

/**
 * Highlights code using gpu-lexer (WebGPU).
 * Falls back gracefully to the regex lexer if WebGPU is unavailable.
 */
export async function highlightCode(code) {
  if (!code) return "";

  const canUseGpu = await isWebGpuSupported();

  if (canUseGpu) {
    try {
      const spans = await gpuLexerParse(code);
      let html = "";
      let lastIndex = 0;

      for (const span of spans) {
        if (span.start > lastIndex) {
          html += escapeHtml(code.slice(lastIndex, span.start));
        }
        const textChunk = escapeHtml(code.slice(span.start, span.end));
        html += `<span class="syntax-${span.type}">${textChunk}</span>`;
        lastIndex = span.end;
      }

      if (lastIndex < code.length) {
        html += escapeHtml(code.slice(lastIndex));
      }

      return html;
    } catch (err) {
      console.warn("gpu-lexer WebGPU execution fallback:", err);
    }
  }

  // Fallback: Lexical tokenizer emitting identical 9 classes
  return fallbackHighlight(code);
}

/**
 * Fast Ruby lexical tokenizer producing the exact same 9 classes as gpu-lexer:
 * plain, comment, string, number, keyword, type, function, constant, operator
 */
export function fallbackHighlight(code) {
  if (!code) return "";

  const rubyKeywords = new Set([
    "class", "module", "def", "end", "if", "else", "elsif", "unless",
    "case", "when", "while", "until", "for", "in", "do", "begin",
    "rescue", "ensure", "raise", "return", "yield", "super", "self",
    "true", "false", "nil", "and", "or", "not", "then", "break", "next",
    "redo", "retry", "alias", "defined?"
  ]);

  const rubyBuiltins = new Set([
    "puts", "print", "p", "pp", "require", "require_relative", "extend", "include",
    "prepend", "attr_reader", "attr_accessor", "attr_writer", "raise", "fail", "warn",
    "abort", "exit", "loop", "sleep", "lambda", "proc", "binding", "caller"
  ]);

  let html = "";
  let i = 0;
  const len = code.length;
  let prevWord = "";
  let prevChar = "";

  while (i < len) {
    const char = code[i];

    // 1. Comments: # ...
    if (char === "#") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = len;
      html += `<span class="syntax-comment">${escapeHtml(code.slice(i, end))}</span>`;
      i = end;
      prevChar = "";
      continue;
    }

    // 2. Double-quoted strings with #{...} interpolation
    if (char === '"') {
      html += `<span class="syntax-string">"</span>`;
      i++;
      let chunkStart = i;
      while (i < len && code[i] !== '"') {
        if (code[i] === "\\" && i + 1 < len) {
          i += 2;
          continue;
        }
        if (code[i] === "#" && i + 1 < len && code[i + 1] === "{") {
          if (i > chunkStart) {
            html += `<span class="syntax-string">${escapeHtml(code.slice(chunkStart, i))}</span>`;
          }
          html += `<span class="syntax-operator">#{</span>`;
          i += 2;
          // Find matching }
          let depth = 1;
          let exprStart = i;
          while (i < len && depth > 0) {
            if (code[i] === "{") depth++;
            else if (code[i] === "}") depth--;
            if (depth > 0) i++;
          }
          const expr = code.slice(exprStart, i);
          html += fallbackHighlight(expr);
          html += `<span class="syntax-operator">}</span>`;
          if (i < len && code[i] === "}") i++;
          chunkStart = i;
          continue;
        }
        i++;
      }
      if (i > chunkStart) {
        html += `<span class="syntax-string">${escapeHtml(code.slice(chunkStart, i))}</span>`;
      }
      if (i < len && code[i] === '"') {
        html += `<span class="syntax-string">"</span>`;
        i++;
      }
      prevChar = '"';
      continue;
    }

    // 3. Single-quoted strings
    if (char === "'") {
      let j = i + 1;
      while (j < len && code[j] !== "'") {
        if (code[j] === "\\" && j + 1 < len) j++;
        j++;
      }
      if (j < len) j++;
      html += `<span class="syntax-string">${escapeHtml(code.slice(i, j))}</span>`;
      i = j;
      prevChar = "'";
      continue;
    }

    // 4. Numbers: digits, floats, hex
    if (/\d/.test(char) && (i === 0 || /[\s,([{:+\-*\/%=<>]/.test(code[i - 1]))) {
      let j = i;
      while (j < len && /[\d.a-fA-Fx_]/.test(code[j])) j++;
      html += `<span class="syntax-number">${escapeHtml(code.slice(i, j))}</span>`;
      i = j;
      prevChar = "0";
      continue;
    }

    // 5. Symbols: :name or &:name
    if ((char === ":" || (char === "&" && i + 1 < len && code[i + 1] === ":")) && i + 1 < len) {
      const isAmpSymbol = char === "&";
      let startIdx = isAmpSymbol ? i + 2 : i + 1;
      if (startIdx < len && /[a-zA-Z_]/.test(code[startIdx])) {
        let j = startIdx;
        while (j < len && /[a-zA-Z0-9_?!]/.test(code[j])) j++;
        if (isAmpSymbol) {
          html += `<span class="syntax-operator">&amp;</span>`;
        }
        html += `<span class="syntax-constant">${escapeHtml(code.slice(i + (isAmpSymbol ? 1 : 0), j))}</span>`;
        i = j;
        prevChar = ":";
        continue;
      }
    }

    // 6. Instance variables: @name, @@name, $stdout
    if ((char === "@" || char === "$") && i + 1 < len && /[a-zA-Z_]/.test(code[i + 1])) {
      let j = i + 1;
      if (char === "@" && code[j] === "@") j++;
      while (j < len && /[a-zA-Z0-9_]/.test(code[j])) j++;
      html += `<span class="syntax-constant">${escapeHtml(code.slice(i, j))}</span>`;
      i = j;
      prevChar = "@";
      continue;
    }

    // 7. Identifiers, Keywords, Functions, Types
    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_?!]/.test(code[j])) j++;
      const word = code.slice(i, j);

      // Check if keyword argument like `model: "gpt-4o"`
      if (j < len && code[j] === ":" && (j + 1 >= len || code[j + 1] !== ":")) {
        html += `<span class="syntax-constant">${escapeHtml(word)}:</span>`;
        i = j + 1;
        prevChar = ":";
        prevWord = word;
        continue;
      }

      if (rubyKeywords.has(word)) {
        html += `<span class="syntax-keyword">${escapeHtml(word)}</span>`;
      } else if (rubyBuiltins.has(word)) {
        html += `<span class="syntax-function">${escapeHtml(word)}</span>`;
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        html += `<span class="syntax-type">${escapeHtml(word)}</span>`;
      } else if (prevChar === "." || prevChar === "&." || prevWord === "def" || (j < len && code[j] === "(")) {
        html += `<span class="syntax-function">${escapeHtml(word)}</span>`;
      } else {
        html += `<span class="syntax-plain">${escapeHtml(word)}</span>`;
      }
      prevWord = word;
      i = j;
      continue;
    }

    // 8. Operators & Delimiters
    if (/[+\-*\/%=<>!&|~^.]/.test(char)) {
      let j = i;
      while (j < len && /[+\-*\/%=<>!&|~^.]/.test(code[j])) j++;
      const op = code.slice(i, j);
      html += `<span class="syntax-operator">${escapeHtml(op)}</span>`;
      prevChar = op;
      i = j;
      continue;
    }

    if (!/\s/.test(char)) {
      prevChar = char;
    }
    html += escapeHtml(char);
    i++;
  }

  return html;
}
