// tests/helpers.js — shared login helper for API tests
// ES6 export

import { expect } from '@playwright/test';

/** Login and return bearer token string */
export async function getToken(request, email = 'amit@gmail.com', password = '123456') {
  const res = await request.post('/api/login', {
    data: { email, password },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.token).toBeTruthy();
  return body.token;
}

/** Headers object with Authorization: Bearer … */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
