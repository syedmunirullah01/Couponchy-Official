export const COUNTRY_COOKIE_KEY = "couponchy_country";

export function getCountryFlag(countryCode) {
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "";
  }
}

export const SUPPORTED_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", flagUrl: "https://flagcdn.com/w40/us.png" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", flagUrl: "https://flagcdn.com/w40/gb.png" },
  { code: "CA", name: "Canada", flag: "🇨🇦", flagUrl: "https://flagcdn.com/w40/ca.png" },
  { code: "AU", name: "Australia", flag: "🇦🇺", flagUrl: "https://flagcdn.com/w40/au.png" },
  { code: "IN", name: "India", flag: "🇮🇳", flagUrl: "https://flagcdn.com/w40/in.png" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", flagUrl: "https://flagcdn.com/w40/ae.png" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", flagUrl: "https://flagcdn.com/w40/sa.png" },
  { code: "DE", name: "Germany", flag: "🇩🇪", flagUrl: "https://flagcdn.com/w40/de.png" },
];

export const DEFAULT_COUNTRY_CODE = "US";
export const COUNTRY_HEADER_KEY = "x-country-code";

export function sanitizeCountryList(countries) {
  const source = Array.isArray(countries) && countries.length ? countries : SUPPORTED_COUNTRIES;
  const seen = new Set();

  const normalized = source
    .map((country) => {
      const code = String(country?.code || "")
        .trim()
        .toUpperCase();
      const name = String(country?.name || "")
        .trim()
        .replace(/\s+/g, " ");

      if (!/^[A-Z]{2}$/.test(code)) {
        return null;
      }

      if (seen.has(code)) {
        return null;
      }

      seen.add(code);

      return {
        code,
        name: name || code,
        flag: country?.flag || getCountryFlag(code),
        flagUrl: country?.flagUrl || `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
      };
    })
    .filter(Boolean);

  if (!normalized.some((country) => country.code === DEFAULT_COUNTRY_CODE)) {
    normalized.unshift({
      code: DEFAULT_COUNTRY_CODE,
      name: "United States",
      flag: getCountryFlag(DEFAULT_COUNTRY_CODE),
      flagUrl: `https://flagcdn.com/w40/${DEFAULT_COUNTRY_CODE.toLowerCase()}.png`,
    });
  }

  return normalized;
}

export function normalizeCountryCode(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  const isSupported = /^[A-Z]{2}$/.test(normalized);
  return isSupported ? normalized : DEFAULT_COUNTRY_CODE;
}

export function getCountryByCode(value, countries = SUPPORTED_COUNTRIES) {
  const code = normalizeCountryCode(value);
  const countryList = sanitizeCountryList(countries);
  return countryList.find((country) => country.code === code) || countryList[0] || { code, name: code };
}

export function getCountrySegment(value) {
  return normalizeCountryCode(value).toLowerCase();
}

export function getCountryCodeFromSegment(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  const isSupported = /^[A-Z]{2}$/.test(normalized);
  return isSupported ? normalized : null;
}

export function getCountryCodeFromPathname(pathname) {
  const [, segment] = String(pathname || "").split("/");
  return getCountryCodeFromSegment(segment);
}

export function removeCountryPrefix(pathname) {
  const normalizedPath = String(pathname || "/");
  const countryCode = getCountryCodeFromPathname(normalizedPath);

  if (!countryCode) {
    return normalizedPath || "/";
  }

  const withoutPrefix = normalizedPath.replace(/^\/[^/]+/, "");
  return withoutPrefix || "/";
}

export function buildCountryPath(pathname, countryCode = DEFAULT_COUNTRY_CODE) {
  const cleanPath = removeCountryPrefix(pathname);
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  if (normalizedCountryCode === DEFAULT_COUNTRY_CODE) {
    return cleanPath || "/";
  }

  const segment = getCountrySegment(normalizedCountryCode);
  return cleanPath === "/" ? `/${segment}` : `/${segment}${cleanPath}`;
}
