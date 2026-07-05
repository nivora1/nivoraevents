// Shared formatters for prices, experience, etc.
// Vendors enter raw numeric values; these helpers format for display.

export const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");

export const toNumberOrNull = (v: string | number | null | undefined): number | null => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const d = digitsOnly(v);
  if (!d) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
};

/** Indian grouping, e.g. 125000 -> "₹1,25,000". */
export const formatInrGrouped = (n: number): string =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Human-friendly INR: < 1 lakh keeps commas, ≥ 1 lakh uses "lakh" with up to 2 decimals. */
export const formatInrShort = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 100000) return formatInrGrouped(n);
  const lakhs = n / 100000;
  const rounded = Math.round(lakhs * 100) / 100;
  let str = rounded.toString();
  if (str.includes(".")) str = str.replace(/0+$/, "").replace(/\.$/, "");
  return `₹${str} lakh`;
};

export const formatExperience = (v: string | number | null | undefined): string => {
  const n = toNumberOrNull(v);
  if (n == null) return "";
  return `${n} year${n === 1 ? "" : "s"}`;
};

export const formatPricePerPlate = (v: string | number | null | undefined): string => {
  const n = toNumberOrNull(v);
  if (n == null) return "";
  return `${formatInrGrouped(n)}/plate`;
};

/** Display a vendor's stored price_range value. Pure numeric strings get formatted; legacy free-form strings pass through. */
export const displayVendorPrice = (
  service: "photography" | "catering" | string | undefined,
  raw: string | null | undefined,
): string => {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (service === "catering") return formatPricePerPlate(n);
    return formatInrShort(n);
  }
  return trimmed;
};
