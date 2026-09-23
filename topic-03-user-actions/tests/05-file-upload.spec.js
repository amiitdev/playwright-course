// tests/05-file-upload.spec.js
// ============================================================
// LESSON: file uploads with setInputFiles()
// ES6 import / export
// ============================================================
//
// Playwright does NOT open the OS file dialog.
// You tell it WHICH file to put in the <input type="file">.
//
//   setInputFiles('path/to/file.txt')   → one file
//   setInputFiles(['a.txt','b.txt'])    → multiple files
//   setInputFiles([])                   → clear the input
//
// Our sample file: fixtures/sample-upload.txt

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '..', 'fixtures', 'sample-upload.txt');

test('upload one file by absolute path', async ({ page }) => {
  await page.goto('form.html');

  // No click on the file button — we inject the file directly
  await page.locator('#receipt').setInputFiles(SAMPLE);

  // files.length is now 1 — check via evaluate (read DOM property)
  const count = await page.locator('#receipt').evaluate((el) => el.files.length);
  expect(count).toBe(1);

  const fileName = await page.locator('#receipt').evaluate((el) => el.files[0].name);
  expect(fileName).toBe('sample-upload.txt');
});

test('upload then submit — form sees the file', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit');
  await page.locator('#receipt').setInputFiles(SAMPLE);
  await page.getByRole('button', { name: 'Place order' }).click();

  // our page JS appends: + file: sample-upload.txt
  await expect(page.locator('#result')).toHaveText(
    'Order OK for Amit + file: sample-upload.txt'
  );
});

test('clear file input — setInputFiles([])', async ({ page }) => {
  await page.goto('form.html');

  await page.locator('#receipt').setInputFiles(SAMPLE);
  let count = await page.locator('#receipt').evaluate((el) => el.files.length);
  expect(count).toBe(1);

  await page.locator('#receipt').setInputFiles([]);  // empty array = clear files
  count = await page.locator('#receipt').evaluate((el) => el.files.length);
  expect(count).toBe(0);
});

test('upload with setInputFiles and buffer (no real file needed)', async ({ page }) => {
  await page.goto('form.html');

  // You can create a fake file in memory — useful in CI
  await page.locator('#receipt').setInputFiles({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake content'),
  });

  const fileName = await page.locator('#receipt').evaluate((el) => el.files[0].name);
  expect(fileName).toBe('invoice.pdf');
});
