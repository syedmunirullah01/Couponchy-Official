import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/Button";

export default function FeaturedProductsSection({ featuredProducts, title = "Featured Products" }) {
  if (!featuredProducts?.length) {
    return (
      <section>
        <SectionHeader title={title} />
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--text)]">No products available</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Add products from admin and feature them here to create a richer homepage mix.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title={title} href="/stores" />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {featuredProducts.map((product) => (
          <article
            key={product.id}
            className="group relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] transition duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[0_22px_48px_rgba(0,0,0,0.45)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139, 92, 246,0.14),transparent_36%)] opacity-0 transition duration-500 group-hover:opacity-100" />
            <div className="grid h-full grid-cols-1 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[240px] sm:h-full sm:min-h-0 overflow-hidden bg-[var(--surface-soft)]">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex rounded-full border border-[var(--border)] bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)] backdrop-blur">
                  {product.status || "Active"}
                </div>
              </div>

              <div className="relative flex flex-col justify-between gap-5 p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{product.storeName}</p>
                    <h3 className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">{product.title}</h3>
                    <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{product.description || "Featured product curated from the Couponchy store catalog."}</p>
                  </div>

                  <div className="flex items-end gap-3">
                    <span className="text-2xl font-black text-[var(--text)]">${product.price}</span>
                    {product.originalPrice ? (
                      <span className="text-sm text-[var(--muted)] line-through">${product.originalPrice}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Ready to explore</p>
                  <Button asChild variant="outline" size="sm" className="rounded-full px-5">
                    <Link href={product.productUrl}>{product.ctaLabel || "View Product"}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
