// Server for Topic 10 — Authentication
// Static pages + cookie session API
//
//   POST /api/login    {email,password} → Set-Cookie: session=... + JSON
//   GET  /api/me       requires Cookie session → who am I
//   POST /api/logout   clears session cookie
//   GET  /api/secret   protected data

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, 'site');
const PORT = 3456;

const SESSIONS = new Map(); // token → email
const USER = { email: 'amit@gmail.com', password: '123456', name: 'Amit' };

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function getSessionToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  // ---------- API ----------
  if (pathname === '/api/login' && method === 'POST') {
    const body = await readBody(req);
    if (body.email !== USER.email || body.password !== USER.password) {
      json(res, 401, { error: 'Invalid credentials' });
      return;
    }
    const token = `sess_${USER.email}_${Date.now()}`;
    SESSIONS.set(token, USER.email);
    json(
      res,
      200,
      { ok: true, user: { email: USER.email, name: USER.name } },
      {
        // HttpOnly → JavaScript cannot read it (browser still sends it)
        'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Lax`,
      }
    );
    return;
  }

  if (pathname === '/api/me' && method === 'GET') {
    const token = getSessionToken(req);
    if (!token || !SESSIONS.has(token)) {
      json(res, 401, { error: 'Not logged in' });
      return;
    }
    json(res, 200, {
      email: SESSIONS.get(token),
      name: USER.name,
      loggedIn: true,
    });
    return;
  }

  if (pathname === '/api/secret' && method === 'GET') {
    const token = getSessionToken(req);
    if (!token || !SESSIONS.has(token)) {
      json(res, 401, { error: 'Not logged in' });
      return;
    }
    json(res, 200, { secret: 'Golden banana recipe', loggedIn: true });
    return;
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const token = getSessionToken(req);
    if (token) SESSIONS.delete(token);
    json(
      res,
      200,
      { ok: true },
      { 'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0' }
    );
    return;
  }

  // ---------- static ----------
  if (method === 'GET') {
    let filePath = path.join(SITE, pathname === '/' ? 'login.html' : pathname);
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(SITE)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Auth demo → http://localhost:${PORT}/login.html`);
});
