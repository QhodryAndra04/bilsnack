/*
  E2E helper script:
  - ensures admin exists (runs seed_admin.js)
  - logs in as admin
  - uploads a small test image
  - creates a product via /api/admin/products

  Usage: node scripts/e2e_create_product.js
  Ensure server is running and DB is reachable. You can set env vars:
    SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, API_BASE
*/

const child = require('child_process');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const API_BASE = process.env.API_BASE || process.env.VITE_API_URL;
if (!API_BASE) {
  console.error('API_BASE or VITE_API_URL environment variable must be set');
  process.exit(1);
}
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@billsnack.id';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin';

async function runSeed() {
  console.log('Running seed_admin.js to ensure admin exists...');
  try {
    child.execSync('node scripts/seed_admin.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Seed script failed', err);
    // continue, maybe admin already exists
  }
}

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json(); // { user, token }
}

async function uploadImage(token) {
  // small 1x1 png base64
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  const buffer = Buffer.from(base64, 'base64');
  const tmpPath = path.join(__dirname, 'tmp-e2e-image.png');
  fs.writeFileSync(tmpPath, buffer);

  const form = new FormData();
  form.append('files', fs.createReadStream(tmpPath));
  const headers = form.getHeaders();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: form, headers });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  fs.unlinkSync(tmpPath);
  return data.files || [];
}

async function createProduct(token, imageUrls) {
  const payload = {
    name: 'E2E Test Snack',
    category: 'Test',
    description: 'Created by e2e script',
    price: 9.99,
    stock: 50,
    images: imageUrls,
    originalPrice: 12.99,
    rating: 4.5,
    reviewCount: 10,
    colors: [{ name: 'Default', hex: '#FFFFFF' }]
  };
  const res = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create product failed: ${res.status} ${txt}`);
  }
  return res.json();
}

(async () => {
  try {
    await runSeed();
    const loginRes = await login();
    const token = loginRes.token;
    console.log('Logged in. Token length:', token ? token.length : 0);
    const files = await uploadImage(token);
    console.log('Uploaded files:', files);
    const product = await createProduct(token, files);
    console.log('Created product:', product);
    console.log('E2E create product finished successfully. Check /shop to see it.');
  } catch (err) {
    console.error('E2E script error', err);
    process.exit(1);
  }
})();
