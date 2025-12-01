/* eslint-env node */
const fetch = require('node-fetch');

class TelegramService {
  constructor(botToken, adminChatId) {
    this.botToken = botToken;
    this.adminChatId = adminChatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Send a message to the admin Telegram chat
   * @param {string} message - The message to send
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async sendMessage(message) {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram service not configured. Skipping message send.');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.adminChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        console.error('Telegram API error:', result.description);
        return null;
      }
      return result;
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return null;
    }
  }

  /**
   * Notify admin of a new order
   * @param {Object} order - Order object with customer and items info
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async notifyNewOrder(order) {
    const {
      id,
      order_number,
      email,
      name,
      phone,
      address,
      city,
      province,
      total,
      items = [],
    } = order;

    // Format items list
    const itemsList = items
      .map((item) => `• <b>${item.name}</b> x${item.quantity} = Rp${item.total_price.toLocaleString('id-ID')}`)
      .join('\n');

    const message = `
<b>🛒 Order Baru Masuk!</b>

<b>Order ID:</b> ${id}
<b>Order Number:</b> <code>${order_number}</code>

<b>👤 Customer Info:</b>
• <b>Nama:</b> ${name || 'N/A'}
• <b>Email:</b> ${email || 'N/A'}
• <b>Phone:</b> ${phone || 'N/A'}

<b>📍 Alamat:</b>
${address || 'N/A'}, ${city || 'N/A'}, ${province || 'N/A'}

<b>📦 Items:</b>
${itemsList}

<b>💰 Total:</b> Rp${Number(total).toLocaleString('id-ID')}

<i>Check dashboard untuk detail lengkap</i>
`;

    return this.sendMessage(message);
  }

  /**
   * Notify admin of order status update
   * @param {Object} order - Order object
   * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async notifyOrderStatusUpdate(order, status) {
    const statusEmoji = {
      pending: '⏳',
      processing: '🔄',
      shipped: '📦',
      delivered: '✅',
      cancelled: '❌',
    };

    const emoji = statusEmoji[status] || '📌';

    const message = `
${emoji} <b>Order Status Update</b>

<b>Order Number:</b> <code>${order.order_number}</code>
<b>Status:</b> <b>${status.toUpperCase()}</b>
<b>Customer:</b> ${order.name}
<b>Total:</b> Rp${Number(order.total).toLocaleString('id-ID')}
`;

    return this.sendMessage(message);
  }

  /**
   * Send stock status message
   * @param {Array} products - Array of products with stock info
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async sendStockStatus(products) {
    if (!products || products.length === 0) {
      return this.sendMessage('📦 <b>Stock Check</b>\n\nTidak ada produk ditemukan.');
    }

    // Categorize products by stock status
    const inStock = products.filter(p => p.in_stock || p.stock > 0);
    const outOfStock = products.filter(p => !p.in_stock && p.stock === 0);

    let message = '<b>📦 Stock Status Update</b>\n\n';

    if (inStock.length > 0) {
      message += '<b>✅ Produk Tersedia:</b>\n';
      inStock.slice(0, 10).forEach((product) => {
        message += `• <b>${product.name}</b>\n  Stock: ${product.stock} | Harga: Rp${Number(product.price).toLocaleString('id-ID')}\n`;
      });
      if (inStock.length > 10) {
        message += `... dan ${inStock.length - 10} produk lainnya\n`;
      }
      message += '\n';
    }

    if (outOfStock.length > 0) {
      message += '<b>❌ Produk Habis:</b>\n';
      outOfStock.slice(0, 5).forEach((product) => {
        message += `• ${product.name}\n`;
      });
      if (outOfStock.length > 5) {
        message += `... dan ${outOfStock.length - 5} produk lainnya\n`;
      }
    }

    message += `\n<i>Total Produk: ${products.length} | Tersedia: ${inStock.length} | Habis: ${outOfStock.length}</i>`;

    return this.sendMessage(message);
  }

  /**
   * Send specific product stock info
   * @param {Object} product - Product object
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async sendProductStock(product) {
    const stockStatus = product.in_stock || product.stock > 0 ? '✅ Tersedia' : '❌ Habis';
    const stockDisplay = product.stock > 0 ? product.stock : '0';

    const message = `
<b>📦 Informasi Produk</b>

<b>Nama:</b> ${product.name}
<b>Kategori:</b> ${product.category || 'N/A'}
<b>Harga:</b> Rp${Number(product.price).toLocaleString('id-ID')}
<b>Stock:</b> ${stockDisplay}
<b>Status:</b> ${stockStatus}
<b>Rating:</b> ${product.rating || '0'} (${product.review_count || '0'} reviews)

<i>Last updated: ${new Date().toLocaleString('id-ID')}</i>
`;

    return this.sendMessage(message);
  }
}

module.exports = TelegramService;
