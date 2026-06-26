import Link from "next/link";
import { buildCountryPath } from "@/lib/countries";

function getOfferValue(offer) {
  const source = [offer.title, offer.description, offer.code].filter(Boolean).join(" ");
  const percentMatch = source.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    return `${percentMatch[1]}%`;
  }

  const amountMatch = source.match(/\$ ?(\d[\d,]*)/);
  if (amountMatch) {
    return `$${amountMatch[1]}`;
  }

  return offer.type === "Deal" ? "Deal" : "Code";
}

export default function OfferCard({ offer, store }) {
  const offerHref = offer.affiliateLink || store.affiliateLink || "#";
  const isExternal = Boolean(offer.affiliateLink || store.affiliateLink);
  const actionHref = isExternal || offerHref === "#" ? offerHref : buildCountryPath(offerHref, store.countryCode);
  const offerValue = getOfferValue(offer);
  const actionLabel = offer.ctaLabel || (offer.type === "Coupon" ? "Reveal Code" : "Get Deal");

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_65%),#10110d] transition hover:border-[var(--accent)]/28 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]">
      <div className="grid items-stretch md:grid-cols-[144px_minmax(0,1fr)_210px]">
        <div className="flex flex-col items-center justify-center border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-6 py-6 text-center md:border-b-0 md:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Top offer</p>
          <p className="mt-3 text-[44px] font-black leading-none tracking-[-0.08em] text-white">{offerValue}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
            {offer.type === "Coupon" && offerValue !== "Code" ? "off code" : offer.type}
          </p>
        </div>

        <div className="border-b border-[var(--border)] px-6 py-6 md:border-b-0 md:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-white">
              {offer.type}
            </span>
            <span className="rounded-full border border-[var(--color-primary)]/22 bg-[var(--color-primary)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Verified
            </span>
          </div>
          <h3 className="mt-4 text-[28px] font-black leading-[1.05] tracking-[-0.05em] text-white">{offer.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">{offer.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>{offer.views}</span>
            <span>{offer.date}</span>
            <span>{store.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-5">
          <Link
            href={actionHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="group/cta flex w-full max-w-[320px] items-center justify-between overflow-hidden rounded-[16px] border border-[var(--color-primary)]/30 bg-[var(--color-primary)] shadow-[0_18px_34px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(0,0,0,0.32)]"
          >
            <span className="flex min-w-0 flex-1 items-center px-8 py-2 text-left">
              <span className="block text-[14px] font-black uppercase tracking-[0.2em] text-black">{actionLabel}</span>
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
    </article>
  );
}
