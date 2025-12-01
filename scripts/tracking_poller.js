/*
  tracking_poller.js
  - Simple polling script that queries orders with tracking metadata and calls the trackingService
  - Intended to be run manually or via cron. It will update orders.metadata with new history when available.

  Usage (dev):
    node ./scripts/tracking_poller.js
*/
const supabase = require('../lib/supabase');
const { fetchCarrierStatus } = require('../services/trackingService');

async function run() {
  try {
    // find orders that have tracking metadata
    const { data: rows, error } = await supabase
      .from('orders')
      .select('id, metadata')
      .not('metadata', 'is', null);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      console.log('No tracked orders found');
      return;
    }

    for (const r of rows) {
      let meta = null;
      try { meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata; } catch { continue; }
      if (!meta || !meta.tracking || !meta.tracking.tracking_number) continue;
      const provider = meta.tracking.provider || null;
      const trackingNumber = meta.tracking.tracking_number;
      console.log('Polling', r.id, provider, trackingNumber);
      try {
        const status = await fetchCarrierStatus({ provider, trackingNumber });
        if (!status) continue;
        // naive merge: replace meta.tracking with fetched status
        meta.tracking = status;
        const { error: updateError } = await supabase
          .from('orders')
          .update({ metadata: JSON.stringify(meta) })
          .eq('id', r.id);
        if (updateError) throw updateError;
        console.log('Updated order', r.id);
      } catch (e) {
        console.error('Failed to fetch/update for', r.id, e && e.message ? e.message : e);
      }
    }
  } catch (err) {
    console.error('Error in run:', err);
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
