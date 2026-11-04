// Hermes (the app's JavaScript engine) may not have Intl.DisplayNames; then a
// few common names, or the code.
const REGIONS =
  typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const COMMON: Record<string, string> = { US: 'United States', GB: 'United Kingdom', LT: 'Lithuania', CA: 'Canada', IN: 'India' };

export function countryName(code: string | null | undefined) {
  if (!code) return null;
  try {
    return REGIONS?.of(code) ?? COMMON[code] ?? code;
  } catch {
    return COMMON[code] ?? code;
  }
}
