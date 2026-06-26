import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { buildCountryPath } from "@/lib/countries";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { normalizeCountryCode } from "@/lib/countries";

export async function generateMetadata() {
  return getMetadataDefaults("Exclusive");
}

export const dynamic = "force-dynamic";

function isExclusiveOffer(offer) {
  const isActive = String(offer.status || "").trim().toLowerCase() === "active";
  const searchableText = [offer.title, offer.description, offer.code, offer.source, offer.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return isActive && searchableText.includes("exclusive");
}

function getMaskedCode(code) {
  if (!code) {
    return "";
  }

  const visibleChars = Math.max(2, Math.ceil(code.length * 0.4));
  const hiddenChars = Math.max(4, code.length - visibleChars);
  return `${code.slice(0, visibleChars)}${"*".repeat(hiddenChars)}`;
}

function getOfferValue(offer) {
  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    return `${percentMatch[1]}% off`;
  }

  if (offer.type === "Deal") {
    return "Hot deal";
  }

  return "Exclusive code";
}

function getOfferMetaLabel(offer) {
  if (offer.status?.toLowerCase().includes("verified")) {
    return "Verified";
  }

  if (offer.type === "Deal") {
    return "Unlocked";
  }

  return "Official";
}

export default async function ExclusivePage() {
  const countryCode = await resolveRequestCountryCode();
  const [offers, stores] = await Promise.all([getAllOffers(), getAllStores()]);
  const scopedStores = stores.filter((store) => normalizeCountryCode(store.countryCode) === countryCode);
  const allowedStoreSlugs = new Set(scopedStores.map((store) => store.slug));
  const scopedOffers = offers.filter((offer) => allowedStoreSlugs.has(offer.storeSlug));

  const exclusiveOffers = scopedOffers.filter(isExclusiveOffer);
  const relatedStores = scopedStores
    .filter((store) => exclusiveOffers.some((offer) => offer.storeSlug === store.slug))
    .map((store) => ({
      ...store,
      exclusiveCount: exclusiveOffers.filter((offer) => offer.storeSlug === store.slug).length,
      href: buildCountryPath(`/stores/${store.categorySlug}/${store.slug}`, countryCode),
    }))
    .sort((a, b) => b.exclusiveCount - a.exclusiveCount || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(139, 92, 246,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%),var(--surface)] p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Exclusive Page</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[var(--text)] sm:text-5xl">Exclusive Coupons & Deals</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Browse limited-time exclusive offers, standout coupon codes, and featured savings from participating stores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text)]">
              {exclusiveOffers.length} Exclusive Offers
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text)]">
              {relatedStores.length} Related Stores
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="rounded-[28px]">
            <CardHeader className="border-b border-[var(--border)] pb-4">
              <CardTitle>Related Stores</CardTitle>
              <CardDescription>Stores currently featuring live exclusive offers.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-3">
              {relatedStores.length ? (
                relatedStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={store.href}
                    className="group block rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent),var(--surface-soft)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text)] transition group-hover:text-white">{store.name}</p>
                        <p className="mt-1 truncate text-sm text-[var(--muted)]">{store.category}</p>
                      </div>
                      <span className="rounded-full border border-[var(--color-primary)]/18 bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                        {store.exclusiveCount}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
                  Abhi koi related store nahi mila.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <div>
          {exclusiveOffers.length ? (
            <div className="grid gap-4">
              {exclusiveOffers.map((offer) => {
                const matchedStore = relatedStores.find((store) => store.slug === offer.storeSlug);
                const storeHref = matchedStore?.href || "#";
                const maskedCode = getMaskedCode(offer.code);
                const offerValue = getOfferValue(offer);
                const offerMeta = getOfferMetaLabel(offer);

                return (
                  <Card
                    key={offer.id}
                    className="group overflow-hidden rounded-[26px] border-[color:rgba(139, 92, 246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_65%),#1f1f1f] shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition hover:border-[var(--color-primary)]/22"
                  >
                    <CardContent className="p-0">
                      <div className="grid items-stretch lg:grid-cols-[160px_minmax(0,1fr)_220px]">
                        <div className="flex flex-col justify-center border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-6 py-5 text-center lg:border-b-0 lg:border-r">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Discount</p>
                          <p className="mt-2 text-[48px] font-black tracking-[-0.08em] text-[var(--text)] leading-none">{offerValue.replace(" off", "")}</p>
                          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {offerValue.includes("%") ? "off" : offer.type}
                          </p>
                        </div>

                        <div className="border-b border-[var(--border)] px-6 py-5 lg:border-b-0 lg:border-r">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{offer.type}</Badge>
                            <span className="rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                              Exclusive
                            </span>
                          </div>

                          <h2 className="mt-3 text-[30px] font-black leading-[1.02] tracking-[-0.05em] text-[var(--text)]">
                            {offer.title}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                            {offer.description || "No description added yet."}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                              {offerMeta}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/20" />
                              {offer.storeName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center px-5 py-5">
                          <Link
                            href={storeHref}
                            className="group/cta flex w-full max-w-[320px] items-center justify-between overflow-hidden rounded-[16px] border border-[var(--color-primary)]/30 bg-[var(--color-primary)] shadow-[0_18px_34px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(0,0,0,0.32)]"
                          >
                            <span className="flex min-w-0 flex-1 items-center px-8 py-2 text-left">
                              <span className="block text-[14px] font-black uppercase tracking-[0.2em] text-black">
                                {offer.code ? "Reveal Code" : offer.ctaLabel || "Activate Deal"}
                              </span>
                            </span>
                            <span className="flex h-full w-[68px] items-center justify-center border-l border-black/12 bg-black/10 text-black transition group-hover/cta:bg-black/14">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="m13 6 6 6-6 6" />
                              </svg>
                            </span>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-[28px] border-dashed p-8 text-center">
              <p className="text-lg font-semibold text-[var(--text)]">No exclusive offers yet</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                New exclusive deals and coupon codes will appear here as soon as matching offers are available.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
