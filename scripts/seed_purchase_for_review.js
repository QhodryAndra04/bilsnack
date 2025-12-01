/*
  seed_purchase_for_review.js
  - Creates a completed order and one order_item for a given user email and product id.
  - Use this instead of SQL seed files to avoid editor SQL parser warnings.

  Usage:
    node ./server/scripts/seed_purchase_for_review.js --email user@example.com --productId 1 --qty 1
*/
const pool = require('../db');

function parseArgs() {
  const out = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v || true;
    }
  }
  return out;
}

async function run() {
  const args = parseArgs();
  const email = args.email || args.e;
  const productId = args.productId || args.productid || args.pid;
  const qty = Number(args.qty || 1);
  if (!email || !productId) {
    console.error('Usage: node seed_purchase_for_review.js --email=you@example.com --productId=1 [--qty=1]');
    process.exit(2);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const now = new Date();
    const [userRows] = await conn.execute('SELECT id, email FROM users WHERE email = ? LIMIT 1', [email]);
    const userId = userRows.length ? userRows[0].id : null;

    const [pRows] = await conn.execute('SELECT id, name, price FROM products WHERE id = ? LIMIT 1', [productId]);
    if (!pRows.length) throw new Error('Product not found');
    const product = pRows[0];

    const subtotal = Number(product.price) * qty;
    const [orderRes] = await conn.execute(
      'INSERT INTO orders (user_id, email, name, phone, address, city, province, postal_code, subtotal, discount, delivery_fee, total, status, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, null, null, null, null, null, null, subtotal, 0, 0, subtotal, 'completed', JSON.stringify({ seeded_for: 'review' }), now]
    );
    const orderId = orderRes.insertId;
    await conn.execute('INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, total_price, selected_options) VALUES (?, ?, ?, ?, ?, ?, ?)', [orderId, product.id, product.name, product.price, qty, subtotal, null]);
    await conn.commit();
    console.log('Created seeded order', orderId);
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('Failed to seed order', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

if (require.main === module) run();
