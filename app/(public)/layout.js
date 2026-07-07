import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllEvents } from "@/server/repositories/events-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import { sanitizeCountryList, SUPPORTED_COUNTRIES } from "@/lib/countries";

// Always fetch fresh data — never serve stale cached layout
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }) {
  const [categories, stores, offers, events, settings] = await Promise.all([
    getAllCategories(),
    getAllStores(),
    getAllOffers(),
    getAllEvents(),
    getSettings(),
  ]);

  const countries = sanitizeCountryList(settings.general?.countries || SUPPORTED_COUNTRIES);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--page-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.08),transparent_25%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.08),transparent_28%)]" />
      <Navbar 
        initialCategories={categories}
        initialStores={stores}
        initialOffers={offers}
        initialEvents={events}
        initialCountries={countries}
      />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </div>
  );
}

