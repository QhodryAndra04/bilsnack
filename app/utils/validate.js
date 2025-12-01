// Basic sanitizers for product inputs
function sanitizeImages(images) {
  if (!Array.isArray(images)) return null;
  const out = images
    .map((i) => {
      if (typeof i === 'string') return i;
      if (i && typeof i === 'object') {
        const original = typeof i.original === 'string' ? i.original : (typeof i.url === 'string' ? i.url : null);
        const thumb = typeof i.thumb === 'string' ? i.thumb : original;
        if (original) return { original, thumb };
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

function sanitizeColors(colors) {
  if (!Array.isArray(colors)) return null;
  const out = colors
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object') {
        const name = typeof c.name === 'string' ? c.name : '';
        const hex = typeof c.hex === 'string' ? c.hex : null;
        if (hex) return { name, hex };
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIntOrZero(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeInStock(v) {
  // Accept boolean, numeric, or string values. Return 1 (true) or 0 (false) or null when undefined.
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v ? 1 : 0;
  if (typeof v === 'string') {
    const lower = v.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y') return 1;
    if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'n') return 0;
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed ? 1 : 0;
  }
  return null;
}

module.exports = {
  sanitizeImages,
  sanitizeColors,
  toNumberOrNull,
  toIntOrZero,
  sanitizeInStock,
};
