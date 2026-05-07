// =============================================================
// scripts/dev-server.js
// Local-only dev server: serves the static site AND handles
// /api/contact by reusing api/contact.js.
//
// Run:  npm run dev   (then open http://localhost:3000)
//
// No Vercel, no login, no deploy. Reads .env automatically.
// =============================================================

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, join, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = resolve(ROOT, '.env');
const PORT = Number(process.env.PORT || 3000);

// --- Load .env into process.env (same parser as test-mail.js) ---
async function loadEnv(path) {
  try {
    const raw = await readFile(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch (e) {
    console.warn(`Could not read ${path}:`, e.code);
  }
}
await loadEnv(ENV_PATH);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.txt':  'text/plain; charset=utf-8',
};

// Mimic Vercel's res.status().json() helpers so api/contact.js works unchanged.
function vercelize(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(obj));
    return res;
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res) {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const safe = normalize(join(ROOT, url));
  if (!safe.startsWith(ROOT)) {           // prevent ../ traversal
    res.statusCode = 403;
    return res.end('Forbidden');
  }
  try {
    const data = await readFile(safe);
    const ext = extname(safe).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      console.error('static error', e);
      res.statusCode = 500;
      res.end('Server error');
    }
  }
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];

  if (path === '/api/contact') {
    vercelize(res);
    if (req.method === 'POST') {
      req.body = await readJsonBody(req);
    }
    try {
      const { default: handler } = await import('../api/contact.js');
      return handler(req, res);
    } catch (e) {
      console.error('handler error', e);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  const who = process.env.SMTP_USER || '(SMTP_USER missing!)';
  console.log('');
  console.log('  Kismath dev server');
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → /api/contact sends via ${who}`);
  console.log('');
  console.log('  Ctrl-C to stop');
});
