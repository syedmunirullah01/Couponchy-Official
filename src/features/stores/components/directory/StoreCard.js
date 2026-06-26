import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StoreCard({ store }) {
  return (
    <Link
      href={`/stores/${store.categorySlug}/${store.slug}`}
      className="group block rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190a_0%,#102008_100%)] p-6 text-center transition hover:border-[var(--accent)]/60"
    >
      {store.logoImage ? (
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <Image src={store.logoImage} alt={`${store.name} logo`} fill className="object-contain" unoptimized />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "mx-auto flex h-24 w-24 items-center justify-center rounded-full text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]",
            store.logoClassName
          )}
        >
          <span>{store.logoText}</span>
        </div>
      )}
      <h3 className="mt-6 text-[18px] font-bold tracking-tight text-white transition group-hover:text-[var(--accent)]">
        {store.name}
      </h3>
      <p className="mt-1 text-[13px] font-bold text-[var(--accent)]">{store.count}</p>
    </Link>
  );
}

