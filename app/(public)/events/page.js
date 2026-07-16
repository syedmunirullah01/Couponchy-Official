import { getAllEvents } from "@/server/repositories/events-repository";
import { getSeoAlternates } from "@/server/services/seo-alternates";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { normalizeCountryCode, buildCountryPath } from "@/lib/countries";
import {
  getTranslatedEvents,
  COUNTRY_TO_LANG,
} from "@/server/services/translation-service";
import LinkNext from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  const titles = {
    en: "Shopping Events & Seasonal Sales | CouponChy",
    de: "Shopping-Events & Saisonale Sales | CouponChy",
    fr: "Événements shopping et soldes saisonniers | CouponChy",
    nl: "Shopping-evenementen & Seizoensuitverkoop | CouponChy",
    pl: "Wydarzenia zakupowe i wyprzedaże sezonowe | CouponChy",
    it: "Eventi di shopping e saldi stagionali | CouponChy",
    es: "Eventos de compras y rebajas de temporada | CouponChy",
    ar: "مواسم التسوق والتنزيلات الموسمية | CouponChy",
    ja: "ショッピングイベント＆季節限定セール | CouponChy",
    pt: "Eventos de compras e saldos sazonais | CouponChy",
    sv: "Shoppingevents & säsongsrea | CouponChy"
  };

  const descriptions = {
    en: "Explore upcoming shopping events, seasonal sales, Black Friday, Cyber Monday, holiday promotions, and exclusive savings from top brands.",
    de: "Entdecken Sie anstehende Shopping-Events, saisonale Verkäufe, Black Friday, Cyber Monday, Feiertagsaktionen und exklusive Rabatte von Top-Marken.",
    fr: "Découvrez les événements shopping à venir, les soldes saisonniers, le Black Friday, le Cyber Monday, les promotions de vacances et les économies exclusives des meilleures marques.",
    nl: "Bekijk aankomende shopping-evenementen, seizoensgebonden uitverkoop, Black Friday, Cyber Monday, feestdagenpromoties en exclusieve kortingen van topmerken.",
    pl: "Sprawdź nadchodzące wydarzenia zakupowe, wyprzedaże sezonowe, Black Friday, Cyber Monday, promocje świąteczne i ekskluzywne oszczędności od najlepszych marek.",
    it: "Scopri i prossimi eventi di shopping, i saldi stagionali, Black Friday, Cyber Monday, le promozioni festive e i risparmi esclusivi delle migliori marche.",
    es: "Explore los próximos eventos de compras, rebajas de temporada, Black Friday, Cyber Monday, promociones festivas y ahorros exclusivos de las principales marcas.",
    ar: "استكشف مواسم التسوق القادمة، والتنزيلات الموسمية، وعروض البلاك فرايدي، وسايبر مونداي، والتخفيضات الموسمية، والمدخرات الحصرية من أشهر الماركات.",
    ja: "近日開催のショッピングイベント、季節限定セール、ブラックフライデー、サイバーマンデー、ホリデープロモーション、人気ブランド of 限定割引をご覧ください。",
    pt: "Explore os próximos eventos de compras, saldos sazonais, Black Friday, Cyber Monday, promoções de feriados e economias exclusivas das principais marcas.",
    sv: "Utforska kommande shoppingevents, säsongsreor, Black Friday, Cyber Monday, semesterkampanjer och exklusiva besparingar från populära varumärken."
  };

  const title = titles[lang] || titles.en;
  const description = descriptions[lang] || descriptions.en;
  const alternates = await getSeoAlternates("/events", countryCode);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function EventsListPage() {
  const countryCode = await resolveRequestCountryCode();
  const [events] = await Promise.all([
    getAllEvents(),
  ]);

  const currentCountry = String(countryCode || "US").toUpperCase();
  const visibleEvents = events.filter((event) => {
    const eventCountry = String(event.countryCode || "GLOBAL").toUpperCase();
    return event.status === "enabled" && (eventCountry === "GLOBAL" || eventCountry === currentCountry);
  });

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const [translatedEvents] = await Promise.all([
    getTranslatedEvents(visibleEvents, lang),
  ]);

  return (
    <div className="relative min-h-screen bg-[var(--page-bg)] py-16">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-primary)]/[0.03] blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.02] blur-[130px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="border-b border-white/[0.08] pb-8 mb-12">
          <span className="rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Holiday campaigns
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Shopping Events & Seasonal Sales
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Explore upcoming shopping events, seasonal sales, Black Friday, Cyber Monday, holiday promotions, and exclusive savings from top brands.
          </p>
        </div>

        {translatedEvents.length === 0 ? (
          <div className="rounded-[28px] border border-white/5 bg-[#0e0e12] p-12 text-center">
            <p className="text-lg font-bold text-white">No active shopping events found</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Check back soon for seasonal campaigns and exclusive holiday sales.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {translatedEvents.map((event) => (
              <LinkNext
                key={event.id}
                href={buildCountryPath(`/events/${event.slug}`, countryCode)}
                className="group relative overflow-hidden rounded-[28px] border border-white/5 bg-[#0e0e12] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-[180px]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_35%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
                      Active Campaign
                    </span>
                    <svg className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--color-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-xl font-black text-white group-hover:text-[var(--color-primary)] transition-colors">
                    {event.name}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)] line-clamp-2">
                    {event.shortDescription || "Discover active deals, verified coupon codes, and promo cards for this seasonal event."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  <span>Explore Offers</span>
                  <span className="text-white/30 font-mono">Keyword: {event.keyword}</span>
                </div>
              </LinkNext>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
