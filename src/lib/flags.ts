/**
 * Flag helpers.
 *
 * The teams table stores a clean `flag_code` (ISO-3166 alpha-2, plus the special
 * subdivision codes `GB-ENG` / `GB-SCT`). The stored `flag_emoji` values are
 * unreliable (some are corrupted), and emoji flags render inconsistently across
 * platforms (England, Scotland, Cape Verde, Curaçao show as tofu boxes on many
 * Windows/Android setups). So flag rendering is keyed off `flag_code`, falling
 * back to a mapping from the FIFA 3-letter code, and finally to a code badge.
 */

// FIFA 3-letter code -> flag image code (ISO alpha-2, or subdivision code).
const FIFA3_TO_FLAG_CODE: Record<string, string> = {
  ALG: "DZ",
  ARG: "AR",
  AUS: "AU",
  AUT: "AT",
  BEL: "BE",
  BIH: "BA",
  BRA: "BR",
  CAN: "CA",
  CIV: "CI",
  COD: "CD",
  COL: "CO",
  CPV: "CV",
  CRO: "HR",
  CUW: "CW",
  CZE: "CZ",
  ECU: "EC",
  EGY: "EG",
  ENG: "GB-ENG",
  ESP: "ES",
  FRA: "FR",
  GER: "DE",
  GHA: "GH",
  HAI: "HT",
  IRN: "IR",
  IRQ: "IQ",
  JOR: "JO",
  JPN: "JP",
  KOR: "KR",
  KSA: "SA",
  MAR: "MA",
  MEX: "MX",
  NED: "NL",
  NOR: "NO",
  NZL: "NZ",
  PAN: "PA",
  PAR: "PY",
  POR: "PT",
  QAT: "QA",
  RSA: "ZA",
  SCO: "GB-SCT",
  SEN: "SN",
  SUI: "CH",
  SWE: "SE",
  TUN: "TN",
  TUR: "TR",
  URU: "UY",
  USA: "US",
  UZB: "UZ",
};

/**
 * Resolve the best flag code (for image lookup) from the available identifiers.
 * Prefers an explicit `flag_code`, then maps the FIFA 3-letter `code`.
 * Returns null when nothing usable is available.
 */
export function resolveFlagCode(
  flag_code?: string | null,
  code?: string | null
): string | null {
  // A real ISO flag code is 2 letters (e.g. "BR") or a subdivision code
  // (GB-ENG / GB-SCT). Anything else passed as flag_code (e.g. a 3-letter FIFA
  // code like "BRA") is NOT a valid image code, so fall through to the FIFA map.
  if (flag_code) {
    const fc = flag_code.toUpperCase();
    if (/^[A-Z]{2}$/.test(fc) || /^GB-[A-Z]{3}$/.test(fc)) {
      return fc;
    }
    const mappedFromFlag = FIFA3_TO_FLAG_CODE[fc];
    if (mappedFromFlag) return mappedFromFlag;
  }
  if (code) {
    const mapped = FIFA3_TO_FLAG_CODE[code.toUpperCase()];
    if (mapped) return mapped;
    if (/^[A-Za-z]{2}$/.test(code)) return code.toUpperCase();
  }
  return null;
}

/**
 * Build the flag image URL (SVG) for a resolved flag code.
 * Uses flagcdn.com which supports ISO alpha-2 plus `gb-eng` / `gb-sct`.
 */
export function flagImageUrl(resolvedCode: string): string {
  return `https://flagcdn.com/${resolvedCode.toLowerCase()}.svg`;
}

/**
 * Short, clean text badge to show when no flag image is available.
 * Prefers the 3-letter code, then the flag code, then "??".
 */
export function flagBadgeText(
  code?: string | null,
  flag_code?: string | null
): string {
  if (code && code.trim()) return code.toUpperCase().slice(0, 3);
  if (flag_code && flag_code.trim()) {
    return flag_code.replace(/^GB-/i, "").toUpperCase().slice(0, 3);
  }
  return "??";
}
