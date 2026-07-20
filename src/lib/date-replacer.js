const monthLocaleMap = {
  PL: "pl-PL",
  DE: "de-DE",
  NL: "nl-NL",
  IT: "it-IT",
  FR: "fr-FR",
  ES: "es-ES",
  JA: "ja-JP",
  PT: "pt-PT",
  SV: "sv-SE",
  AR: "ar-SA"
};

const countryToLang = {
  US: "en", GB: "en", CA: "en", AU: "en", IN: "en", PK: "en",
  DE: "de", FR: "fr", NL: "nl", PL: "pl", IT: "it", ES: "es",
  AR: "ar", SA: "ar", AE: "ar", JP: "ja", PT: "pt", BR: "pt",
  SE: "sv"
};

export function getLocalizedMonthYear(countryCode, lang) {
  const now = new Date();
  const country = String(countryCode || "US").toUpperCase();
  const resolvedLang = lang || countryToLang[country] || "en";
  const locale = monthLocaleMap[country] || monthLocaleMap[resolvedLang.toUpperCase()] || "en-US";
  const rawMonth = now.toLocaleString(locale, { month: "long" });
  const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
  const year = now.getFullYear();
  return { month, year };
}

export function replaceDynamicDatePlaceholders(text, countryCode, lang) {
  if (!text || typeof text !== "string") return text;
  
  const now = new Date();
  const year = String(now.getFullYear());
  const { month } = getLocalizedMonthYear(countryCode, lang);

  let updated = text;

  // 1. Replace explicit placeholders (case-insensitive)
  updated = updated
    .replace(/\{month\}|\{Month\}|\{CURRENT_MONTH\}|\{Current Month\}|\%month\%/gi, month)
    .replace(/\{year\}|\{Year\}|\{CURRENT_YEAR\}|\{Current Year\}|\%year\%/gi, year);

  // 2. Replace English month names with current localized month
  const englishMonthsRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi;
  updated = updated.replace(englishMonthsRegex, month);

  // 3. Replace 4-digit years (2020..2039) with current year
  const yearsRegex = /\b202[0-9]\b/g;
  updated = updated.replace(yearsRegex, year);

  return updated;
}
