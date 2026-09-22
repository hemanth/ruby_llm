#!/usr/bin/env node

/**
 * Lightweight development server & LLM proxy for RubyLLM Playground
 * Zero dependencies — uses Node.js standard library.
 *
 * Supports live LLM calls when API keys (e.g. ANTHROPIC_API_KEY, OPENAI_API_KEY,
 * GEMINI_API_KEY) are configured in .env or environment variables.
 * Falls back gracefully to simulation mode whenever keys or models are unavailable.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.rb': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

/**
 * Read and parse .env configuration from repo root, combining with process.env.
 */
function getEnvConfig() {
  const env = { ...process.env };
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Filter out un-evaluated 1Password templates like $(op read ...)
        if (!env[key] && !val.startsWith('$(op read')) {
          env[key] = val;
        }
      }
    } catch {
      // Ignore reading errors
    }
  }
  return env;
}

/**
 * Filter valid API keys (exclude 1Password CLI templates)
 */
function isValidKey(key) {
  return Boolean(key && typeof key === 'string' && !key.startsWith('$(op read') && key.trim().length > 5);
}

/**
 * Resolve provider and credentials for the requested model.
 */
function resolveProvider(model, envConfig) {
  const m = (model || '').toLowerCase();

  // 1. Anthropic models
  if (m.startsWith('claude') || m.includes('anthropic')) {
    if (isValidKey(envConfig.ANTHROPIC_API_KEY)) {
      return { provider: 'anthropic', apiKey: envConfig.ANTHROPIC_API_KEY };
    }
    return null; // Fallback to simulation mode if no Anthropic key
  }

  // 2. OpenAI models
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4') || m.includes('openai')) {
    if (isValidKey(envConfig.OPENAI_API_KEY)) {
      return {
        provider: 'openai',
        apiKey: envConfig.OPENAI_API_KEY,
        endpoint: (envConfig.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions',
      };
    }
    return null; // Fallback to simulation mode if no OpenAI key
  }

  // 3. Google Gemini
  if (m.startsWith('gemini')) {
    if (isValidKey(envConfig.GEMINI_API_KEY)) {
      return {
        provider: 'gemini',
        apiKey: envConfig.GEMINI_API_KEY,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      };
    }
    return null; // Fallback to simulation mode if no Gemini key
  }

  // 4. Mistral
  if (m.startsWith('mistral') || m.startsWith('codestral')) {
    if (isValidKey(envConfig.MISTRAL_API_KEY)) {
      return {
        provider: 'mistral',
        apiKey: envConfig.MISTRAL_API_KEY,
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
      };
    }
    return null;
  }

  // 5. DeepSeek
  if (m.startsWith('deepseek')) {
    if (isValidKey(envConfig.DEEPSEEK_API_KEY)) {
      return {
        provider: 'deepseek',
        apiKey: envConfig.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
      };
    }
    return null;
  }

  // 6. Explicit OpenRouter
  if (m.includes('openrouter') && isValidKey(envConfig.OPENROUTER_API_KEY)) {
    return {
      provider: 'openrouter',
      apiKey: envConfig.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    };
  }

  // 7. Local Ollama
  if ((m.includes('ollama') || m.startsWith('qwen') || m.startsWith('llama')) && envConfig.OLLAMA_API_BASE) {
    return {
      provider: 'ollama',
      apiKey: null,
      endpoint: envConfig.OLLAMA_API_BASE.replace(/\/$/, '') + '/chat/completions',
    };
  }

  return null;
}

/**
 * Handle Anthropic Messages API
 */
async function callAnthropic({ apiKey, model, messages, temperature }) {
  let systemPrompt = undefined;
  const userAssistantMessages = [];

  for (const msg of messages || []) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else {
      userAssistantMessages.push({
        role: msg.role === 'tool' ? 'user' : (msg.role || 'user'),
        content: String(msg.content || ''),
      });
    }
  }

  if (userAssistantMessages.length === 0) {
    userAssistantMessages.push({ role: 'user', content: 'Hello' });
  }

  const payload = {
    model: model || 'claude-sonnet-5',
    max_tokens: 1024,
    messages: userAssistantMessages,
  };
  if (systemPrompt) payload.system = systemPrompt;
  if (temperature !== undefined && temperature !== null) payload.temperature = Number(temperature);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Anthropic error HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  const inTok = data.usage?.input_tokens || 0;
  const outTok = data.usage?.output_tokens || 0;

  return {
    content: text,
    model: data.model || model,
    provider: 'anthropic',
    tokens: { input: inTok, output: outTok, total: inTok + outTok },
    cost: parseFloat(((inTok * 3 + outTok * 15) / 1000000).toFixed(6)),
    live: true,
  };
}

/**
 * Handle OpenAI-compatible Chat Completions
 */
async function callOpenAICompatible({ endpoint, apiKey, model, messages, temperature, provider }) {
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers['authorization'] = `Bearer ${apiKey}`;

  const payload = {
    model: model || 'gpt-4o',
    messages: (messages || []).map((m) => ({
      role: m.role || 'user',
      content: String(m.content || ''),
    })),
  };
  if (temperature !== undefined && temperature !== null) payload.temperature = Number(temperature);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `${provider} error HTTP ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content || '';
  const inTok = data.usage?.prompt_tokens || 0;
  const outTok = data.usage?.completion_tokens || 0;

  return {
    content: text,
    model: data.model || model,
    provider,
    tokens: { input: inTok, output: outTok, total: inTok + outTok },
    cost: parseFloat(((inTok * 2.5 + outTok * 10) / 1000000).toFixed(6)),
    live: true,
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Security & CORS headers (restricted to loopback origins by default)
  const origin = req.headers.origin;
  const isLoopbackOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
  if (isLoopbackOrigin || process.env.ALLOW_ALL_ORIGINS === 'true') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  if (req.method === 'OPTIONS') {
    if (isLoopbackOrigin || process.env.ALLOW_ALL_ORIGINS === 'true') {
      res.writeHead(204);
    } else {
      res.writeHead(403);
    }
    res.end();
    return;
  }

  // API 1: /api/status - reports live connectivity or simulation mode
  if (pathname === '/api/status' && req.method === 'GET') {
    const envConfig = getEnvConfig();
    const activeProviders = [];
    if (isValidKey(envConfig.ANTHROPIC_API_KEY)) activeProviders.push('anthropic');
    if (isValidKey(envConfig.OPENAI_API_KEY)) activeProviders.push('openai');
    if (isValidKey(envConfig.GEMINI_API_KEY)) activeProviders.push('gemini');
    if (isValidKey(envConfig.OPENROUTER_API_KEY)) activeProviders.push('openrouter');
    if (isValidKey(envConfig.MISTRAL_API_KEY)) activeProviders.push('mistral');
    if (isValidKey(envConfig.DEEPSEEK_API_KEY)) activeProviders.push('deepseek');
    if (envConfig.OLLAMA_API_BASE) activeProviders.push('ollama');

    const live = activeProviders.length > 0;
    const preferredModel = isValidKey(envConfig.ANTHROPIC_API_KEY)
      ? 'claude-sonnet-5'
      : (isValidKey(envConfig.OPENAI_API_KEY) ? 'gpt-5' : null);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify({
      live,
      activeProviders,
      preferredModel,
      reason: live
        ? `Live API connected (${activeProviders.join(', ')})`
        : 'Simulation mode (no active API key in .env)',
    }));
    return;
  }

  // API 2: /api/chat - proxy endpoint for chat completions
  if (pathname === '/api/chat' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
    });

    req.on('end', async () => {
      let body = {};
      try {
        body = JSON.parse(rawBody);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }

      const envConfig = getEnvConfig();
      const requestedModel = body.model || envConfig.MODEL || 'claude-sonnet-5';
      const resolved = resolveProvider(requestedModel, envConfig);

      // If no key or provider is available, gracefully return simulation indicator
      if (!resolved) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({
          simulated: true,
          reason: `No API key found in .env for ${requestedModel}; using simulated mode.`,
        }));
        return;
      }

      try {
        let result = null;
        if (resolved.provider === 'anthropic') {
          result = await callAnthropic({
            apiKey: resolved.apiKey,
            model: requestedModel,
            messages: body.messages,
            temperature: body.temperature,
          });
        } else {
          result = await callOpenAICompatible({
            endpoint: resolved.endpoint,
            apiKey: resolved.apiKey,
            model: requestedModel,
            messages: body.messages,
            temperature: body.temperature,
            provider: resolved.provider,
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.warn(`[PROXY] Upstream error for ${requestedModel}:`, err.message);
        // Fall back gracefully to simulation mode
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({
          simulated: true,
          warning: `Upstream error: ${err.message}. Falling back to simulation mode.`,
          error: err.message,
        }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const safePath = path.normalize(filePath);
  const relPath = path.relative(__dirname, safePath);
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden\n');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}\n`);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const envConfig = getEnvConfig();
  const activeProviders = [];
  if (isValidKey(envConfig.ANTHROPIC_API_KEY)) activeProviders.push('anthropic');
  if (isValidKey(envConfig.OPENAI_API_KEY)) activeProviders.push('openai');
  if (isValidKey(envConfig.GEMINI_API_KEY)) activeProviders.push('gemini');
  if (isValidKey(envConfig.OPENROUTER_API_KEY)) activeProviders.push('openrouter');

  console.log(`\n======================================================`);
  console.log(`  RubyLLM Interactive Playground & Proxy`);
  console.log(`  Cockpit UI ready at: http://${HOST}:${PORT}`);
  if (activeProviders.length > 0) {
    console.log(`  ⚡ Live LLM Proxy Active: ${activeProviders.join(', ')}`);
  } else {
    console.log(`  🌱 Simulation Mode: Zero setup (no keys in .env)`);
  }
  console.log(`======================================================\n`);
});
