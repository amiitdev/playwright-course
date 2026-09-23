// Tiny web server for THIS topic only.
// Why? Network waiting (waitForResponse) needs real http:// requests.
// file:// pages often cannot fetch() reliably.
//
// Routes:
//   GET /               → site/index.html
//   GET /api/products   → JSON after ~1s delay (simulates slow API)
//   GET /api/user       → JSON after ~1.5s delay

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, 'site');
const PORT = 3456;

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- fake slow API ---
  if (url.pathname === '/api/products') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        products: [
          { id: 1, name: 'Apple', price: 1 },
          { id: 2, name: 'Banana', price: 2 },
        ],
      }));
    }, 1000); // 1 second delay — test MUST wait for this response
    return;
  }

  if (url.pathname === '/api/user') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ name: 'Amit', loggedIn: true }));
    }, 1500);
    return;
  }

  // --- static files from site/ ---
  let filePath = path.join(SITE, url.pathname === '/' ? 'index.html' : url.pathname);
  filePath = path.normalize(filePath);

  // security: stay inside site/
  if (!filePath.startsWith(SITE)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Shopping App (waiting demos) → http://localhost:${PORT}`);
});
