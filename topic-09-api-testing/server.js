// Tiny REST API for Topic 9 — API Testing
// No UI pages — only JSON endpoints.
//
// Routes:
//   GET    /api/products          list all
//   GET    /api/products/:id      one product
//   POST   /api/products          create  (auth required)
//   PUT    /api/products/:id      replace (auth required)
//   PATCH  /api/products/:id      partial update (auth required)
//   DELETE /api/products/:id      delete  (auth required)
//   POST   /api/login             {email,password} → {token}
//   GET    /api/me                needs Authorization: Bearer <token>
//
// Auth: any email with password length >= 4 → token "tok_<email>"
// Data: in-memory array (resets when server restarts)

import http from 'node:http';

const PORT = 3456;

// ---- in-memory database ----
let products = [
  { id: 1, name: 'Apple', price: 1, stock: 10 },
  { id: 2, name: 'Banana', price: 2, stock: 5 },
  { id: 3, name: 'Mango', price: 3, stock: 7 },
];
let nextId = 4;

const users = [
  { email: 'amit@gmail.com', password: '123456', name: 'Amit' },
];

function json(res, status, body) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({ __invalid: true });
      }
    });
  });
}

function requireAuth(req, res) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    json(res, 401, { error: 'Missing Authorization header' });
    return false;
  }
  const token = header.slice(7);
  if (!token.startsWith('tok_')) {
    json(res, 401, { error: 'Invalid token' });
    return false;
  }
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  // ---------- LOGIN ----------
  if (pathname === '/api/login' && method === 'POST') {
    const body = await readBody(req);
    const user = users.find((u) => u.email === body.email);
    if (!user || user.password !== body.password) {
      json(res, 401, { error: 'Invalid credentials' });
      return;
    }
    json(res, 200, {
      token: `tok_${user.email}`,
      user: { email: user.email, name: user.name },
    });
    return;
  }

  // ---------- ME (protected) ----------
  if (pathname === '/api/me' && method === 'GET') {
    if (!requireAuth(req, res)) return;
    const token = req.headers.authorization.slice(7);
    const email = token.replace('tok_', '');
    json(res, 200, { email, loggedIn: true });
    return;
  }

  // ---------- PRODUCTS ----------
  if (pathname === '/api/products' && method === 'GET') {
    const name = url.searchParams.get('name');
    let list = products;
    if (name) {
      list = products.filter((p) =>
        p.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    json(res, 200, { count: list.length, data: list });
    return;
  }

  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);

  if (productMatch && method === 'GET') {
    const id = Number(productMatch[1]);
    const product = products.find((p) => p.id === id);
    if (!product) {
      json(res, 404, { error: `Product ${id} not found` });
      return;
    }
    json(res, 200, product);
    return;
  }

  if (pathname === '/api/products' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    const body = await readBody(req);
    if (body.__invalid || !body.name || body.price === undefined) {
      json(res, 400, { error: 'name and price are required' });
      return;
    }
    const product = {
      id: nextId++,
      name: body.name,
      price: body.price,
      stock: body.stock ?? 0,
    };
    products.push(product);
    json(res, 201, product);
    return;
  }

  if (productMatch && method === 'PUT') {
    if (!requireAuth(req, res)) return;
    const id = Number(productMatch[1]);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      json(res, 404, { error: `Product ${id} not found` });
      return;
    }
    const body = await readBody(req);
    if (body.__invalid || !body.name || body.price === undefined) {
      json(res, 400, { error: 'PUT requires full object: name, price, stock' });
      return;
    }
    const updated = {
      id,
      name: body.name,
      price: body.price,
      stock: body.stock ?? 0,
    };
    products[idx] = updated;
    json(res, 200, updated);
    return;
  }

  if (productMatch && method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    const id = Number(productMatch[1]);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      json(res, 404, { error: `Product ${id} not found` });
      return;
    }
    const body = await readBody(req);
    if (body.__invalid) {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    // merge only provided fields
    products[idx] = { ...products[idx], ...body, id };
    json(res, 200, products[idx]);
    return;
  }

  if (productMatch && method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    const id = Number(productMatch[1]);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      json(res, 404, { error: `Product ${id} not found` });
      return;
    }
    const [removed] = products.splice(idx, 1);
    json(res, 200, { deleted: true, product: removed });
    return;
  }

  json(res, 404, { error: 'Not found', path: pathname });
});

server.listen(PORT, () => {
  console.log(`API Testing server → http://localhost:${PORT}/api/products`);
});
