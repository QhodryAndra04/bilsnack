export function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";

  // If value is already a number, use it directly (avoid stripping decimal dot)
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      Math.round(value)
    );
  }

  // For strings: accept numbers or numeric strings. Strip any non-digit characters except minus, dot and comma.
  let raw = String(value)
    .replace(/[^0-9\-,.]/g, "")
    .trim();
  if (!raw) return "";

  // Heuristic parsing for common formats:
  // - "1.234,56" => dot as thousand, comma as decimal
  // - "1,234.56" => comma as thousand, dot as decimal
  // - "1234.56"  => dot as decimal
  // - "1,234"    => comma as thousand (or decimal) -> try to infer
  try {
    if (raw.indexOf(".") > -1 && raw.indexOf(",") > -1) {
      // both present: decide which is thousand vs decimal by position
      if (raw.indexOf(".") < raw.indexOf(",")) {
        // dot before comma: treat dot as thousand sep, comma as decimal
        raw = raw.replace(/\./g, "").replace(/,/g, ".");
      } else {
        // comma before dot: treat comma as thousand sep
        raw = raw.replace(/,/g, "");
      }
    } else if (raw.indexOf(",") > -1) {
      // only comma present: if multiple commas, treat as thousand separators, else treat as decimal
      const commas = (raw.match(/,/g) || []).length;
      if (commas > 1) {
        raw = raw.replace(/,/g, "");
      } else {
        // single comma - assume decimal separator (common in id-ID)
        raw = raw.replace(/,/g, ".");
      }
    }

    let num = Number(raw);
    if (Number.isNaN(num)) {
      // fallback: remove all non-digits and parse as integer
      num = Number(String(value).replace(/[^0-9-]/g, "")) || 0;
    }

    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      Math.round(num)
    );
  } catch {
    // On any parse error, return the original string trimmed
    return String(value).trim();
  }
}

export default formatPrice;
