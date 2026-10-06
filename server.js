// "Let's See" — zero-dependency Node server (Node 18+).
// Public site: /public   Private dashboard: /admin (HTTP Basic auth, see .env)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- tiny .env loader (no dependencies) ----
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Lets See <onboarding@resend.dev>';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'responses.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ADMIN_DIR = path.join(__dirname, 'admin');

// Storage: Upstash Redis (needed on Vercel) when configured, otherwise a local JSON file.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_KEY = 'lets-see:responses';
const useRedis = !!(REDIS_URL && REDIS_TOKEN);

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST', headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error('redis: ' + (j.error || r.status));
  return j.result;
}
async function loadAll() {
  if (useRedis) { const v = await redis(['GET', REDIS_KEY]); return v ? JSON.parse(v) : []; }
  try { return JSON.parse(await fs.promises.readFile(DATA_FILE, 'utf8')); } catch { return []; }
}
async function saveAll(list) {
  if (useRedis) return redis(['SET', REDIS_KEY, JSON.stringify(list)]);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(list, null, 2));
  await fs.promises.rename(tmp, DATA_FILE);
}
let queue = Promise.resolve();
function withStore(fn) {
  const run = queue.then(async () => {
    const list = await loadAll();
    const result = await fn(list);
    await saveAll(list);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

// ---- helpers ----
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; script-src 'self'",
};
function send(res, code, body, headers = {}) {
  res.writeHead(code, { ...SECURITY, ...headers });
  res.end(body);
}
function json(res, code, obj) {
  send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
}
function readBody(req, limit = 100 * 1024) {
  if (req.body !== undefined) return Promise.resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const str = (v, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v, maxItems = 30) => (Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, 200)).filter(Boolean) : []);

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function adminAuth(req, res) {
  if (!ADMIN_PASSWORD) {
    send(res, 503, 'Admin is disabled. Set ADMIN_PASSWORD in .env to enable it.', { 'Content-Type': 'text/plain' });
    return false;
  }
  const h = req.headers.authorization || '';
  if (h.startsWith('Basic ')) {
    const [u, ...p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
    if (safeEqual(u, ADMIN_USER) && safeEqual(p.join(':'), ADMIN_PASSWORD)) return true;
  }
  send(res, 401, 'Authentication required', { 'WWW-Authenticate': 'Basic realm="Lets See admin"', 'Content-Type': 'text/plain' });
  return false;
}

// very small in-memory rate limit (IPs are never written to disk)
const hits = new Map();
function limited(req) {
  const ip = req.socket.remoteAddress || '?';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 12;
}

// ---- readable text for email / webhook ----
function toText(r) {
  const L = [];
  L.push(`Submitted: ${r.submittedAt}`);
  if (r.notReady) L.push('STATUS: Not ready yet (she chose the quiet option).');
  if (r.name) L.push(`Name: ${r.name}`);
  const row = (k, v) => { if (v && (!Array.isArray(v) || v.length)) L.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`); };
  row('Mood', r.mood); row('Mood (own words)', r.moodCustom);
  row('Setting', r.setting); row('Setting (own words)', r.settingCustom);
  row('Pace', r.pace);
  row('Conversation', r.conversation); row('Conversation (own topic)', r.conversationCustom);
  for (const [k, v] of Object.entries(r.details || {})) row(`Detail / ${k}`, v);
  row('Wildcard', r.wildcard);
  if (r.customPlan && Object.values(r.customPlan).some(Boolean)) {
    L.push('--- Her own version ---');
    for (const [k, v] of Object.entries(r.customPlan)) row(k, v);
  }
  row('Final note', r.note);
  if (r.surprise) L.push('Surprise: she is happy to be surprised by one detail.');
  if (r.followup) row('Follow-up', `${r.followup.feeling || ''} ${r.followup.text || ''}`.trim());
  return L.join('\n');
}

async function notify(r) {
  const text = toText(r);
  const jobs = [];
  if (WEBHOOK_URL) {
    jobs.push(fetch(WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text, response: r }),
    }));
  }
  if (RESEND_API_KEY && NOTIFY_EMAIL) {
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [NOTIFY_EMAIL], subject: "Let's See — her version", text }),
    }));
  }
  const out = await Promise.allSettled(jobs);
  out.forEach((o) => { if (o.status === 'rejected') console.error('notify failed:', o.reason && o.reason.message); });
}

function clean(b) {
  const d = b.details && typeof b.details === 'object' ? b.details : {};
  const cp = b.customPlan && typeof b.customPlan === 'object' ? b.customPlan : {};
  const details = {}; const customPlan = {};
  for (const k of Object.keys(d).slice(0, 12)) details[str(k, 40)] = str(d[k], 200);
  for (const k of Object.keys(cp).slice(0, 12)) customPlan[str(k, 60)] = str(cp[k]);
  return {
    name: str(b.name, 120),
    mood: list(b.mood), moodCustom: str(b.moodCustom),
    setting: list(b.setting), settingCustom: str(b.settingCustom),
    pace: str(b.pace, 300),
    conversation: list(b.conversation), conversationCustom: str(b.conversationCustom),
    details, wildcard: str(b.wildcard), customPlan,
    note: str(b.note), surprise: !!b.surprise, notReady: !!b.notReady,
  };
}

// ---- routes ----
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.searchParams.get('__route') || decodeURIComponent(url.pathname);

  if (req.method === 'POST' && p === '/api/submit') {
    if (limited(req)) return json(res, 429, { error: 'slow down' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'bad request' }); }
    const rec = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...clean(body) };
    await withStore((l) => { l.push(rec); });
    await notify(rec); // never throws; awaited so serverless hosts don't cut it off
    return json(res, 200, { ok: true, id: rec.id });
  }

  if (req.method === 'POST' && p === '/api/followup') {
    if (limited(req)) return json(res, 429, { error: 'slow down' });
    let body;
    try { body = JSON.parse(await readBody(req, 20 * 1024)); } catch { return json(res, 400, { error: 'bad request' }); }
    const id = str(body.id, 60);
    const followup = { feeling: str(body.feeling, 120), text: str(body.text, 2000), at: new Date().toISOString() };
    const found = await withStore((l) => {
      const r = l.find((x) => x.id === id);
      if (r) r.followup = followup;
      return r;
    });
    if (!found) return json(res, 404, { error: 'not found' });
    await notify({ ...found, followup });
    return json(res, 200, { ok: true });
  }

  if (p === '/admin' || p.startsWith('/admin/')) {
    if (!adminAuth(req, res)) return;
    if (p === '/admin/api/responses' && req.method === 'GET') {
      const l = await loadAll();
      return json(res, 200, l.slice().reverse());
    }
    const delMatch = p.match(/^\/admin\/api\/responses\/([\w-]+)$/);
    if (delMatch && req.method === 'DELETE') {
      await withStore((l) => { const i = l.findIndex((x) => x.id === delMatch[1]); if (i >= 0) l.splice(i, 1); });
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && (p === '/admin' || p === '/admin/' || p === '/admin/admin.js')) {
      const f = p === '/admin/admin.js' ? 'admin.js' : 'index.html';
      return send(res, 200, await fs.promises.readFile(path.join(ADMIN_DIR, f)), { 'Content-Type': MIME[path.extname(f)], 'Cache-Control': 'no-store' });
    }
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  const rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
  try {
    const data = await fs.promises.readFile(file);
    return send(res, 200, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  } catch {
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  }
}

const app = (req, res) => {
  handle(req, res).catch((e) => { console.error(e); if (!res.headersSent) json(res, 500, { error: 'server error' }); });
};
module.exports = app;

if (require.main === module) {
  http.createServer(app).listen(PORT, () => {
    console.log(`Let's See running at http://localhost:${PORT}`);
    console.log(ADMIN_PASSWORD ? `Admin: http://localhost:${PORT}/admin` : 'Admin disabled (set ADMIN_PASSWORD in .env).');
    console.log(useRedis ? 'Storage: Upstash Redis' : 'Storage: data/responses.json');
  });
}
