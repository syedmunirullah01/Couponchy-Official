import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buildCountryPath } from "@/lib/countries";
import { getProductPageData, getProductPageMetadata } from "@/server/services/catalog-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getMetadataDefaults } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { store, product } = await params;
  const countryCode = await resolveRequestCountryCode();
  const productMetadata = await getProductPageMetadata(store, product, countryCode);

  return getMetadataDefaults(productMetadata?.title || "Product", productMetadata || {});
}

export default async function Page({ params }) {
  const { store, product } = await params;
  const countryCode = await resolveRequestCountryCode();
  const data = await getProductPageData(store, product, countryCode);

  if (!data) {
    notFound();
  }

  const { singleStore, productItem } = data;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
      <Link href={buildCountryPath(`/stores/${singleStore.categorySlug}/${singleStore.slug}`, singleStore.countryCode)} className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Back To Store
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
          {productItem.image ? (
            <Image src={productItem.image} alt={productItem.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
          )}
        </div>
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">{singleStore.name}</p>
          <h1 className="text-4xl font-black tracking-[-0.05em] text-white">{productItem.title}</h1>
          <p className="text-base leading-8 text-[var(--muted)]">{productItem.description}</p>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-black text-[var(--text)]">${productItem.price}</span>
            {productItem.originalPrice ? <span className="text-lg text-[var(--muted)] line-through">${productItem.originalPrice}</span> : null}
          </div>
          <div className="flex gap-3">
            <Button asChild className="rounded-lg">
              <Link href={productItem.productUrl}>{productItem.ctaLabel || "View Product"}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <Link href={buildCountryPath(`/stores/${singleStore.categorySlug}/${singleStore.slug}`, singleStore.countryCode)}>Store Page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
