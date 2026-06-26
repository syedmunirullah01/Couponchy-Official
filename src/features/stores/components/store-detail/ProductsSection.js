import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function ProductsSection({ products }) {
  if (!products?.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="text-3xl font-black tracking-[-0.04em] text-white">Products</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Explore store-linked products after browsing coupons and deals.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-soft)]">
              {product.image ? (
                <Image src={product.image} alt={product.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-[var(--text)]">{product.title}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">{product.description}</p>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-xl font-black text-[var(--text)]">${product.price}</span>
                {product.originalPrice ? (
                  <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                ) : null}
              </div>
              <Button asChild variant="outline" className="w-full rounded-lg">
                <Link href={product.productUrl} target="_blank" rel="noreferrer">
                  {product.ctaLabel || "View Product"}
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
