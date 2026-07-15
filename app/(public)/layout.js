import Navbar from "@/components/layout/Navbar";
import ScrollToTopButton from "@/components/layout/ScrollToTopButton";
import ScrollProgressIndicator from "@/components/layout/ScrollProgressIndicator";
import Footer from "@/components/layout/Footer";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllEvents } from "@/server/repositories/events-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { sanitizeCountryList, SUPPORTED_COUNTRIES } from "@/lib/countries";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import {
  COUNTRY_TO_LANG,
  getTranslatedCategories,
  getTranslatedEvents,
  getTranslatedNavbar,
} from "@/server/services/translation-service";

// Always fetch fresh data — never serve stale cached layout
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }) {
  const [categories, stores, offers, events, settings, countryCode] = await Promise.all([
    getAllCategories(),
    getAllStores(),
    getAllOffers(),
    getAllEvents(),
    getSettings(),
    resolveRequestCountryCode(),
  ]);

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const currentCountry = String(countryCode || "US").toUpperCase();
  const visibleEvents = events.filter((event) => {
    const eventCountry = String(event.countryCode || "GLOBAL").toUpperCase();
    return eventCountry === "GLOBAL" || eventCountry === currentCountry;
  });

  const [translatedCategories, translatedEvents, translatedNavbar] = await Promise.all([
    getTranslatedCategories(categories, lang),
    getTranslatedEvents(visibleEvents, lang),
    getTranslatedNavbar(lang),
  ]);

  const countries = sanitizeCountryList(settings.general?.countries || SUPPORTED_COUNTRIES);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--page-bg)]" suppressHydrationWarning>
      {/* Dynamic background ambient glow overlay */}
      <div className="pointer-events-none absolute inset-0 bg-ambient-glow" suppressHydrationWarning></div>
      <Navbar
        initialCategories={translatedCategories}
        initialStores={stores}
        initialOffers={offers}
        initialEvents={translatedEvents}
        initialCountries={countries}
        initialCountryCode={countryCode}
        logoUrl={settings?.general?.logoUrl}
        t={translatedNavbar}
      />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
      <ScrollProgressIndicator />
    </div>
  );
}


