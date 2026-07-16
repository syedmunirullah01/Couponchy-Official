import "server-only";
import { getSettings } from "@/server/repositories/settings-repository";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";

export async function getSeoAlternates(pathname, countryCode) {
  const settings = await getSettings().catch(() => ({}));
  const countries = settings?.general?.countries?.length
    ? settings.general.countries
    : [
        { code: "US" },
        { code: "GB" },
        { code: "CA" },
        { code: "AU" },
        { code: "IN" },
        { code: "DE" }
      ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  // Remove trailing slashes from baseUrl to prevent double slashes
  const cleanBase = baseUrl.replace(/\/+$/, "");
  
  const cleanPath = String(pathname || "").trim();
  const isHomepage = cleanPath === "" || cleanPath === "/";

  const buildUrl = (code) => {
    const isDefault = code.toUpperCase() === "US";
    const segment = isDefault ? "" : `/${code.toLowerCase()}`;
    
    if (isHomepage) {
      return `${cleanBase}${segment}/`;
    } else {
      const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
      return `${cleanBase}${segment}${formattedPath}`;
    }
  };

  const currentCountry = String(countryCode || "US").toUpperCase();
  const canonical = buildUrl(currentCountry);

  const languages = {};
  languages["en"] = buildUrl("US");
  languages["x-default"] = buildUrl("US");

  for (const c of countries) {
    const code = String(c.code || "").toUpperCase();
    if (code === "US") continue;
    
    const lang = COUNTRY_TO_LANG[code] || "en";
    let hreflangKey;
    if (lang === "en") {
      hreflangKey = `en-${code}`;
    } else {
      hreflangKey = lang.toLowerCase();
    }
    
    languages[hreflangKey] = buildUrl(code);
  }

  return {
    canonical,
    languages,
  };
}
