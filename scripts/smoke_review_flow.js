/**
 * Simple smoke test script for the review flow.
 * Usage:
 *   node smoke_review_flow.js --api <API_URL> --email you@example.com --password secret
 *
 * The script will:
 *  - register a test user (if not exists)
 *  - login
 *  - pick the first product from /api/products (or a provided productId)
 *  - create an order for that product (authenticated)
 *  - check can-review
 *  - post a review
 *  - fetch reviews and product to validate aggregates
 */

(async () => {
  // very small arg parser to avoid extra deps
  const rawArgs = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = rawArgs[i+1] && !rawArgs[i+1].startsWith('--') ? rawArgs[++i] : true;
      args[key] = val;
    }
  }
  const API = args.api || process.env.API_BASE;
  if (!API) {
    console.error('API URL not provided. Use --api or set API_BASE environment variable.');
    process.exit(1);
  }
  const email = args.email || process.env.TEST_EMAIL || 'test-review@example.com';
  const password = args.password || process.env.TEST_PASS || 'password123';
  const productIdArg = args.productId || process.env.TEST_PRODUCT_ID;

  const log = (...s) => console.log('[smoke]', ...s);

  const fetchJson = async (url, opts) => {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json;
  try { json = JSON.parse(text); } catch { json = text; }
    return { ok: res.ok, status: res.status, body: json };
  };

  // register (ignore 409)
  log('Registering user', email);
  let r = await fetchJson(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Test' }) });
  if (!r.ok && r.status !== 409) { console.error('Register failed', r); return process.exit(1); }

  // login
  log('Logging in');
  r = await fetchJson(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error('Login failed', r); return process.exit(1); }
  const token = r.body && r.body.token;
  if (!token) { console.error('No token returned'); return process.exit(1); }

  // pick product
  let prodId = productIdArg;
  if (!prodId) {
    log('Fetching products');
    r = await fetchJson(`${API}/api/products`);
    if (!r.ok || !Array.isArray(r.body) || r.body.length === 0) { console.error('No products found', r); return process.exit(1); }
    prodId = r.body[0].id;
  }
  log('Using product id', prodId);

  // create order
  const payload = {
    customer: { name: 'Smoke Tester', email },
    items: [{ productId: prodId, name: 'smoke-item', unit_price: 1.0, quantity: 1, total_price: 1.0 }],
    subtotal: 1.0,
    discount: 0,
    deliveryFee: 0,
    total: 1.0,
  };
  log('Creating order');
  r = await fetchJson(`${API}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  if (!r.ok) { console.error('Create order failed', r); return process.exit(1); }
  log('Order created', r.body);

  // can-review
  log('Checking can-review');
  r = await fetchJson(`${API}/api/reviews/can-review?productId=${prodId}`, { headers: { Authorization: `Bearer ${token}` } });
  log('can-review result', r.body);

  // post review
  log('Posting review');
  r = await fetchJson(`${API}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: prodId, rating: 5, comment: 'Smoke test review' }) });
  if (!r.ok) { console.error('Post review failed', r); return process.exit(1); }
  log('Posted review', r.body);

  // fetch reviews and product
  log('Fetching reviews');
  r = await fetchJson(`${API}/api/reviews/product/${prodId}`);
  log('Reviews:', r.body && r.body.length ? r.body[0] : r.body);

  log('Fetching product');
  r = await fetchJson(`${API}/api/products/${prodId}`);
  log('Product data:', r.body);

  console.log('Smoke test complete');
  process.exit(0);
})();
