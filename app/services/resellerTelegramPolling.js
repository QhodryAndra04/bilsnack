/* eslint-env node */
const ResellerTelegramCommandHandler = require('./resellerTelegramCommands');

class ResellerTelegramPolling {
  constructor(supabase) {
    this.supabase = supabase;
    this.isRunning = false;
    this.commandHandler = new ResellerTelegramCommandHandler(supabase, null);
    this.lastUpdateId = 0;
    this.pollingInterval = 1000; // 1 second
  }

  /**
   * Start polling for Reseller Bot updates
   */
  async start() {
    if (this.isRunning) {
      console.log('Reseller Telegram polling is already running');
      return;
    }

    console.log('Starting Reseller Telegram Bot polling...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.pollUpdates();
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      } catch (err) {
        console.error('Error in Reseller Telegram polling:', err);
        // Wait before retrying on error
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval * 5));
      }
    }
  }

  /**
   * Poll for updates from Telegram API
   */
  async pollUpdates() {
    try {
      const botToken = process.env.TELEGRAM_RESELLER_BOT_TOKEN;
      if (!botToken) {
        console.warn('TELEGRAM_RESELLER_BOT_TOKEN not set, skipping polling');
        return;
      }

      const apiUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
      const params = new URLSearchParams({
        offset: this.lastUpdateId + 1,
        timeout: 30,
      });

      const response = await fetch(`${apiUrl}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000), // 35 second timeout (5s more than API timeout)
      });

      if (!response.ok) {
        if (response.status === 409) {
          console.warn('Telegram API 409 Conflict - Another instance is polling. Stopping this instance.');
          this.stop();
          return;
        }
        console.error(`Telegram API error: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          this.lastUpdateId = update.update_id;

          // Handle message updates
          if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;

            if (message.text) {
              console.log(`[Reseller Bot] Message from ${chatId}: ${message.text}`);
              await this.commandHandler.handleMessage(message, chatId);
            }
          }
        }
      }
    } catch (err) {
      // Handle specific network errors more gracefully
      if (err.cause?.code === 'ECONNRESET' || err.cause?.code === 'ETIMEDOUT' || err.name === 'AbortError') {
        console.warn('[Reseller Bot] Network timeout or connection reset, will retry...');
      } else {
        console.error('Error polling Telegram updates for Reseller:', err.message);
      }
    }
  }

  /**
   * Stop polling
   */
  stop() {
    console.log('Stopping Reseller Telegram Bot polling...');
    this.isRunning = false;
  }
}

module.exports = ResellerTelegramPolling;
