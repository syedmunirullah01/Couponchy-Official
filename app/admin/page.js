import AdminTopbar from "@/features/admin/components/AdminTopbar";
import MetricCard from "@/features/admin/components/MetricCard";
import RecentActivityTable from "@/features/admin/components/RecentActivityTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";

export const metadata = {
  title: "Admin Dashboard | Couponchy",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stores, offers] = await Promise.all([getAllStores(), getAllOffers()]);
  const couponsCount = offers.filter((offer) => offer.type === "Coupon").length;
  const dealsCount = offers.filter((offer) => offer.type === "Deal").length;
  const recentOffers = offers.slice(0, 4).map((offer) => ({
    title: offer.title,
    store: offer.storeName,
    type: offer.type,
    source: offer.source,
    addedAt: new Date(offer.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
  const adminMetrics = [
    { label: "Total Stores", value: String(stores.length).padStart(2, "0"), change: "JSON-backed catalog" },
    { label: "Active Coupons", value: String(couponsCount), change: "Live from offers database" },
    { label: "Active Deals", value: String(dealsCount), change: "Synced from shared store" },
    { label: "Network Integrations", value: "07", change: "Mock integrations placeholder" },
  ];

  return (
    <div>
      <AdminTopbar title="Dashboard" breadcrumbTrail={["Admin", "Dashboard"]} />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {adminMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <RecentActivityTable rows={recentOffers} />
          <Card className="bg-[linear-gradient(180deg,rgba(139, 92, 246,0.12),transparent_70%),var(--surface)]">
            <CardHeader>
              <CardTitle>Publishing Pulse</CardTitle>
              <CardDescription>Current status of the catalog you are building.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Catalog status</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--text)]">{stores.length || offers.length ? "Live" : "Empty"}</p>
                <p className="mt-2 text-sm text-[var(--color-primary)]">
                  {stores.length || offers.length ? "Public pages are rendering your saved data." : "Add stores first, then create coupons or deals."}
                </p>
              </div>
              <div className="space-y-3">
                {[
                  ["Stores in catalog", String(stores.length)],
                  ["Coupons in catalog", String(couponsCount)],
                  ["Deals in catalog", String(dealsCount)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3">
                    <span className="text-sm text-[var(--muted)]">{label}</span>
                    <span className="text-sm font-medium text-[var(--text)]">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
