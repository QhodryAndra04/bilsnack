/*
  trackingService.js
  - Small pluggable carrier tracking service abstraction.
  - Currently provides a mocked `fetchCarrierStatus` implementation.
  - Replace or extend implementations with real carrier API calls (JNE/JNT/SiCepat) when credentials are available.
*/
const fetchCarrierStatus = async ({ provider, trackingNumber }) => {
  // Placeholder implementation: return a mocked timeline entry and status
  // Real implementations should call the carrier's API and return a normalized shape:
  // { provider, trackingNumber, status, history: [{ status, location, timestamp, note }, ...] }
  if (!trackingNumber) return null;

  // Simple deterministic mock based on trackingNumber last char
  const last = String(trackingNumber).slice(-1);
  const now = new Date().toISOString();
  return {
    provider: provider || 'mock',
    trackingNumber,
    status: 'Dalam Pengiriman',
    history: [
      { status: 'Dikirim', location: 'Gudang', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), note: 'Paket diterima di gudang' },
      { status: 'Dalam Pengiriman', location: last === '0' ? 'Jakarta' : 'Bandung', timestamp: now }
    ]
  };
};

module.exports = { fetchCarrierStatus };
