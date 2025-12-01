/* eslint-env node */

class NotificationService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Create notification for order purchase
   * @param {number} orderId - Order ID
   * @param {Array} orderItems - Order items with products
   * @returns {Promise<void>}
   */
  async notifyOrderPurchase(orderId, orderItems) {
    try {
      // Get order details
      const { data: orders, error: orderError } = await this.supabase
        .from('orders')
        .select('id, user_id, total_price, created_at')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.warn(`Order ${orderId} not found:`, orderError);
        return;
      }

      const order = orders;
      // buyerUserId not used currently
      const _buyerUserId = order.user_id;

      // For each product in order, notify the reseller
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // Get product details
          const { data: product, error: productError } = await this.supabase
            .from('products')
            .select('id, name, price, reseller_id')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.warn(`Product ${item.product_id} not found`);
            continue;
          }

          const resellerId = product.reseller_id;

          // Notify reseller if product has reseller_id (not admin products)
          if (resellerId) {
            await this.createNotification(
              resellerId,
              'order_purchase',
              `📦 Produk ${product.name} dibeli!`,
              `Pesanan baru! ${item.quantity} x ${product.name} (Rp${Number(product.price).toLocaleString('id-ID')})`,
              orderId,
              product.id
            );
          }
        }
      }

      // Also notify admin about all orders
      await this.createNotification(
        null, // null = admin (we'll query admin users)
        'order_purchase',
        '📦 Pesanan baru diterima!',
        `Order #${orderId} - Total: Rp${Number(order.total_price).toLocaleString('id-ID')} - ${orderItems.length} item`,
        orderId,
        null,
        'admin'
      );

      console.log(`Notifications created for order ${orderId}`);
    } catch (err) {
      console.error('Error creating purchase notification:', err);
    }
  }

  /**
   * Create a notification record
   * @param {number|null} userId - User ID to notify (null for admin)
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} orderId - Related order ID
   * @param {number} productId - Related product ID
   * @param {string} recipientType - 'reseller', 'admin', or null
   * @returns {Promise<void>}
   */
  async createNotification(userId, type, title, message, orderId, productId, recipientType = 'reseller') {
    try {
      if (recipientType === 'admin') {
        // Get all admin users
        const { data: admins, error: adminError } = await this.supabase
          .from('users')
          .select('id')
          .eq('role', 'admin');

        if (adminError) throw adminError;

        // Create notification for all admin users
        for (const admin of admins) {
          await this.supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              type,
              title,
              message,
              order_id: orderId,
              product_id: productId,
            });
        }
      } else if (userId) {
        // Create notification for specific user
        await this.supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type,
            title,
            message,
            order_id: orderId,
            product_id: productId,
          });
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }

  /**
   * Get unread notifications for a user
   * @param {number} userId - User ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Notifications
   */
  async getUnreadNotifications(userId, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting unread notifications:', err);
      return [];
    }
  }

  /**
   * Get all notifications for a user (paginated)
   * @param {number} userId - User ID
   * @param {number} offset - Offset
   * @param {number} limit - Limit
   * @returns {Promise<{notifications: Array, total: number}>}
   */
  async getNotifications(userId, offset = 0, limit = 20) {
    try {
      const { data: notifications, error: notifError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (notifError) throw notifError;

      const { count, error: countError } = await this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      return {
        notifications: notifications || [],
        total: count || 0,
      };
    } catch (err) {
      console.error('Error getting notifications:', err);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }

  /**
   * Count unread notifications
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  async countUnread(userId) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error counting unread notifications:', err);
      return 0;
    }
  }

  /**
   * Delete old notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<void>}
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      console.log(`Deleted old notifications older than ${daysOld} days`);
    } catch (err) {
      console.error('Error deleting old notifications:', err);
    }
  }

  /**
   * Send notification to Telegram (for reseller bot)
   * @param {number} userId - User ID
   * @param {string} message - Message to send
   * @returns {Promise<boolean>}
   */
  async sendTelegramNotification(userId, message) {
    try {
      // Get chat_id from telegram_users table
      const { data: telegramUser, error } = await this.supabase
        .from('telegram_users')
        .select('chat_id')
        .eq('user_id', userId)
        .eq('bot_type', 'reseller')
        .single();

      if (error || !telegramUser) {
        console.warn(`No Telegram chat found for user ${userId}`);
        return false;
      }

      const chatId = telegramUser.chat_id;
      const botToken = process.env.TELEGRAM_RESELLER_BOT_TOKEN;

      if (!botToken) {
        console.warn('TELEGRAM_RESELLER_BOT_TOKEN not set');
        return false;
      }

      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      return response.ok;
    } catch (err) {
      console.error('Error sending Telegram notification:', err);
      return false;
    }
  }
}

module.exports = NotificationService;
