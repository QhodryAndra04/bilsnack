/* eslint-env node */
// Simple distance-based shipping fee calculator.
// In a real implementation you might integrate RajaOngkir or Google Distance Matrix.
// Here we use an approximate distance map (km) from Jakarta as origin.

const CITY_DISTANCE_KM = {
  jakarta: 0,
  bandung: 150,
  bogor: 60,
  depok: 35,
  tangsel: 30,
  surabaya: 780,
  yogyakarta: 540,
  semarang: 450,
  medan: 1900,
  denpasar: 1170,
  bali: 1170,
  malang: 810,
  makassar: 1400,
  palembang: 470,
  lampung: 240,
  pontianak: 740,
  balikpapan: 1240,
  manado: 2200
};

function normalizeCity(raw) {
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim().toLowerCase().replace(/[^a-z]/g, '');
}

function estimateDistanceKm(city) {
  const key = normalizeCity(city);
  if (!key) return 100; // fallback generic distance
  return CITY_DISTANCE_KM[key] != null ? CITY_DISTANCE_KM[key] : 100;
}

// Shipping method configuration
// gosend: local only <= 30km, free; otherwise unavailable.
// jne: base + per km, capped.
// jnt: slightly different base + per km.
// Fallback method flat.
function computeShippingFee({ city, postalCode, method }) {
  const distance = estimateDistanceKm(city);
  const m = (method || '').toLowerCase();
  let fee = 0;
  let available = true;

  switch (m) {
    case 'gosend': {
      if (distance <= 30) {
        fee = 0;
      } else {
        available = false; // outside instant coverage
      }
      break;
    }
    case 'jne': {
      const base = 18000; // Rp
      const perKm = 50; // Rp per km
      fee = base + distance * perKm;
      const cap = 150000;
      if (fee > cap) fee = cap;
      break;
    }
    case 'jnt': {
      const base = 15000;
      const perKm = 55;
      fee = base + distance * perKm;
      const cap = 160000;
      if (fee > cap) fee = cap;
      break;
    }
    default: {
      // Generic fallback courier
      const base = 20000;
      const perKm = 45;
      fee = base + distance * perKm;
      break;
    }
  }

  // Basic postal code adjustment (optional). If postal code indicates remote area (e.g., starts with 9) add surcharge.
  if (postalCode && /^9/.test(String(postalCode))) {
    fee = Math.round(fee * 1.1); // 10% remote surcharge
  }

  fee = Math.max(0, Math.round(fee));

  return { method: m, distanceKm: distance, fee, available };
}

module.exports = { computeShippingFee };
