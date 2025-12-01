/* eslint-env node */

class TelegramCommandHandler {
  constructor(supabase, telegramService) {
    this.supabase = supabase;
    this.telegramService = telegramService;
  }

  /**
   * Handle incoming Telegram message
   * @param {Object} message - Telegram message object
   * @param {number} chatId - Chat ID to respond to
   * @returns {Promise<void>}
   */
  async handleMessage(message, chatId) {
    const text = message.text || '';
    const command = text.split(' ')[0].toLowerCase();
    const _args = text.split(' ').slice(1).join(' ');

    try {
      switch (command) {
        case '/start':
          await this.handleStart(chatId);
          break;
        case '/stock':
          await this.handleStock(chatId);
          break;
        case '/harga':
          await this.handlePrice(chatId, _args);
          break;
        case '/cek_barang':
          await this.handleCheckProduct(chatId, _args);
          break;
        case '/stock_tersedia':
          await this.handleAvailableStock(chatId);
          break;
        case '/stock_habis':
          await this.handleOutOfStock(chatId);
          break;
        case '/bantuan':
        case '/help':
          await this.handleHelp(chatId);
          break;
        default:
          // If not a command, try to search for product
          if (text.length > 0 && !text.startsWith('/')) {
            await this.handleProductSearch(chatId, text);
          }
          break;
      }
    } catch (err) {
      console.error('Error handling Telegram command:', err);
      await this.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses perintah Anda. Silakan coba lagi.');
    }
  }

  /**
   * Send message to Telegram chat
   * @param {number} chatId - Chat ID
   * @param {string} message - Message to send
   */
  async sendMessage(chatId, message) {
    try {
      const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
      const response = await fetch(`${apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      return await response.json();
    } catch (err) {
      console.error('Error sending Telegram message:', err);
    }
  }

  /**
   * Handle /start command
   */
  async handleStart(chatId) {
    const message = `
<b>🍿 Selamat datang di Bilsnack Bot!</b>

Saya adalah bot untuk cek informasi produk dan stock barang Bilsnack.

<b>Perintah yang tersedia:</b>
/stock - Lihat semua produk & stock
/harga [nama_barang] - Cek harga produk
/cek_barang [nama] - Cek detail produk
/stock_tersedia - Lihat produk yang tersedia
/stock_habis - Lihat produk yang habis
/bantuan - Tampilkan bantuan

<i>Atau ketik nama barang untuk mencarinya</i>
`;
    await this.sendMessage(chatId, message);
  }

  /**
   * Handle /stock command - Show all products with stock
   */
  async handleStock(chatId) {
    try {
      const { data: rows, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock, category, in_stock')
        .or('stock.gt.0,in_stock.eq.true')
        .order('name')
        .limit(20);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        await this.sendMessage(chatId, '❌ Tidak ada produk ditemukan.');
        return;
      }

      let message = '<b>📦 Daftar Produk & Stock</b>\n\n';
      rows.forEach((product, index) => {
        const statusEmoji = product.in_stock || product.stock > 0 ? '✅' : '⚠️';
        message += `${index + 1}. <b>${product.name}</b>\n`;
        message += `   Harga: Rp${Number(product.price).toLocaleString('id-ID')}\n`;
        message += `   Stock: ${product.stock} ${statusEmoji}\n`;
        message += `   Kategori: ${product.category || 'N/A'}\n\n`;
      });

      message += `<i>Total produk: ${rows.length}</i>`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleStock:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil data stock.');
    }
  }

  /**
   * Handle /harga command - Check price of specific product
   */
  async handlePrice(chatId, productName) {
    if (!productName) {
      await this.sendMessage(chatId, '❌ Gunakan: /harga [nama_barang]\n\nContoh: /harga Keripik Nanas');
      return;
    }

    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock, category')
        .ilike('name', `%${productName}%`)
        .limit(1)
        .single();

      if (error || !product) {
        await this.sendMessage(chatId, `❌ Produk "${productName}" tidak ditemukan.`);
        return;
      }

      const message = `
<b>💰 Informasi Harga</b>

<b>Produk:</b> ${product.name}
<b>Kategori:</b> ${product.category || 'N/A'}
<b>Harga:</b> <b>Rp${Number(product.price).toLocaleString('id-ID')}</b>
<b>Stock:</b> ${product.stock} unit
<b>Status:</b> ${product.stock > 0 ? '✅ Tersedia' : '❌ Habis'}
`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handlePrice:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil harga produk.');
    }
  }

  /**
   * Handle /cek_barang command - Check product details
   */
  async handleCheckProduct(chatId, productName) {
    if (!productName) {
      await this.sendMessage(chatId, '❌ Gunakan: /cek_barang [nama_barang]\n\nContoh: /cek_barang Keripik Nanas');
      return;
    }

    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock, category, in_stock, rating, review_count, description')
        .ilike('name', `%${productName}%`)
        .limit(1)
        .single();

      if (error || !product) {
        await this.sendMessage(chatId, `❌ Produk "${productName}" tidak ditemukan.`);
        return;
      }

      const statusEmoji = product.in_stock || product.stock > 0 ? '✅' : '❌';
      const message = `
<b>📦 Detail Produk</b>

<b>Nama:</b> ${product.name}
<b>Harga:</b> Rp${Number(product.price).toLocaleString('id-ID')}
<b>Kategori:</b> ${product.category || 'N/A'}
<b>Stock:</b> ${product.stock} unit
<b>Status:</b> ${statusEmoji} ${product.in_stock || product.stock > 0 ? 'Tersedia' : 'Habis'}
<b>Rating:</b> ⭐ ${product.rating || '0'} (${product.review_count || '0'} reviews)
${product.description ? `\n<b>Deskripsi:</b>\n${product.description.substring(0, 200)}${product.description.length > 200 ? '...' : ''}` : ''}
`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleCheckProduct:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil detail produk.');
    }
  }

  /**
   * Handle /stock_tersedia command - Show available products
   */
  async handleAvailableStock(chatId) {
    try {
      const { data: rows, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock, category')
        .or('stock.gt.0,in_stock.eq.true')
        .order('stock', { ascending: false })
        .limit(15);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        await this.sendMessage(chatId, '❌ Tidak ada produk yang tersedia.');
        return;
      }

      let message = '<b>✅ Produk Tersedia</b>\n\n';
      rows.forEach((product, index) => {
        message += `${index + 1}. <b>${product.name}</b>\n`;
        message += `   Rp${Number(product.price).toLocaleString('id-ID')} | Stock: ${product.stock}\n`;
      });

      message += `\n<i>Total: ${rows.length} produk tersedia</i>`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleAvailableStock:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil data produk.');
    }
  }

  /**
   * Handle /stock_habis command - Show out of stock products
   */
  async handleOutOfStock(chatId) {
    try {
      const { data: rows, error } = await this.supabase
        .from('products')
        .select('id, name, price, category')
        .eq('stock', 0)
        .eq('in_stock', false)
        .order('name')
        .limit(15);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        await this.sendMessage(chatId, '✅ Semua produk tersedia! Tidak ada yang habis.');
        return;
      }

      let message = '<b>❌ Produk Habis</b>\n\n';
      rows.forEach((product, index) => {
        message += `${index + 1}. ${product.name} (Rp${Number(product.price).toLocaleString('id-ID')})\n`;
      });

      message += `\n<i>Total: ${rows.length} produk habis</i>`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleOutOfStock:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil data produk.');
    }
  }

  /**
   * Handle /bantuan command - Show help
   */
  async handleHelp(chatId) {
    const message = `
<b>📚 Panduan Penggunaan Bilsnack Bot</b>

<b>Perintah Utama:</b>

📦 <b>/stock</b>
   Menampilkan daftar semua produk dengan stock
   
💰 <b>/harga [nama_barang]</b>
   Cek harga produk tertentu
   Contoh: /harga Keripik Nanas
   
🔍 <b>/cek_barang [nama]</b>
   Lihat detail produk lengkap
   Contoh: /cek_barang Kacang Goreng
   
✅ <b>/stock_tersedia</b>
   Lihat semua produk yang masih tersedia
   
❌ <b>/stock_habis</b>
   Lihat produk yang sedang habis
   
🆘 <b>/bantuan</b>
   Tampilkan panduan ini

<b>Pencarian Sederhana:</b>
Ketik nama barang langsung untuk mencarinya
Contoh: Dodol Susu

<i>Butuh bantuan lebih lanjut? Hubungi admin kami.</i>
`;
    await this.sendMessage(chatId, message);
  }

  /**
   * Handle product search - Search for product by name
   */
  async handleProductSearch(chatId, searchTerm) {
    try {
      const { data: rows, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock, category, in_stock')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;

      if (!rows || rows.length === 0) {
        await this.sendMessage(chatId, `❌ Produk "${searchTerm}" tidak ditemukan.\n\nCoba gunakan /stock untuk melihat semua produk.`);
        return;
      }

      if (rows.length === 1) {
        const product = rows[0];
        const statusEmoji = product.in_stock || product.stock > 0 ? '✅' : '❌';
        const message = `
<b>🎁 ${product.name}</b>

<b>Harga:</b> Rp${Number(product.price).toLocaleString('id-ID')}
<b>Kategori:</b> ${product.category || 'N/A'}
<b>Stock:</b> ${product.stock} unit
<b>Status:</b> ${statusEmoji} ${product.in_stock || product.stock > 0 ? 'Tersedia' : 'Habis'}

<i>Gunakan /cek_barang ${product.name} untuk info lebih lengkap</i>
`;
        await this.sendMessage(chatId, message);
      } else {
        let message = `<b>🔍 Hasil pencarian untuk "${searchTerm}"</b>\n\n`;
        rows.forEach((product, index) => {
          const statusEmoji = product.in_stock || product.stock > 0 ? '✅' : '❌';
          message += `${index + 1}. <b>${product.name}</b> ${statusEmoji}\n`;
          message += `   Rp${Number(product.price).toLocaleString('id-ID')} | Stock: ${product.stock}\n\n`;
        });
        message += `Ketik /cek_barang [nama] untuk detail lebih lengkap`;
        await this.sendMessage(chatId, message);
      }
    } catch (err) {
      console.error('Error in handleProductSearch:', err);
      await this.sendMessage(chatId, '❌ Error saat mencari produk.');
    }
  }
}

module.exports = TelegramCommandHandler;
