import Image from "next/image";
import Link from "next/link";

function StoreBadge({ size = "large", logoText, logoClassName, logoImage, name }) {
  const base = size === "large" ? "h-24 w-24" : "h-16 w-16";
  return (
    <div className={`grid ${base} place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] ${logoImage ? "p-0" : "p-2"} shadow-sm`}>
      {logoImage ? (
        <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-2">
          <Image src={logoImage} alt={`${name} logo`} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-[14px] text-center ${logoClassName}`}>
          <span>{logoText}</span>
        </div>
      )}
    </div>
  );
}

export function BrandMark(props) {
  return <StoreBadge {...props} />;
}

function getTopSavingsHighlights(singleStore) {
  return [
    `${singleStore.activeCoupons} active coupon${singleStore.activeCoupons === 1 ? "" : "s"}`,
    `${singleStore.activeDeals} live deal${singleStore.activeDeals === 1 ? "" : "s"}`,
    singleStore.rating,
  ];
}

export default function StoreHeader({ singleStore, storeTabs, offerTabs }) {
  const highlights = getTopSavingsHighlights(singleStore);
  const storeTabTargets = {
    Coupons: "#coupons",
    "Store Info": "#store-info",
    FAQs: "#faqs",
  };

  return (
    <section className="mb-8 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(139, 92, 246,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%),#0f100d] p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">{singleStore.name} savings intelligence</p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <BrandMark
              logoText={singleStore.logoText}
              logoClassName={singleStore.logoClassName}
              logoImage={singleStore.logoImage}
              name={singleStore.name}
            />
            <div className="flex-1">
              <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                {singleStore.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">{singleStore.partnerText}</p>
              <p className="mt-2 text-sm text-white/56">{singleStore.validatedText}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-medium text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-6 border-b border-[var(--border)] pb-2">
            {storeTabs.map((tab, index) => (
              <Link
                key={tab}
                href={storeTabTargets[tab] || "#"}
                className={`border-b-2 pb-2 text-sm font-bold uppercase tracking-[0.12em] ${
                  index === 0 ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-white/58"
                }`}
              >
                {tab}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Available now</p>
          <div className="mt-4 space-y-3">
            {offerTabs.map((tab, index) => (
              <div
                key={tab}
                className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${
                  index === 0
                    ? "border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 text-white"
                    : "border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-white/68"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
