import AdminTopbar from "@/features/admin/components/AdminTopbar";
import MetricCard from "@/features/admin/components/MetricCard";
import RecentActivityTable from "@/features/admin/components/RecentActivityTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | Couponchy",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stores, offers] = await Promise.all([getAllStores(), getAllOffers()]);
  const couponsCount = offers.filter((offer) => offer.type === "Coupon").length;
  const dealsCount = offers.filter((offer) => offer.type === "Deal").length;
  const recentOffers = offers.slice(0, 5).map((offer) => ({
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
    { label: "Total Stores", value: String(stores.length).padStart(2, "0"), change: "JSON-backed catalog database" },
    { label: "Active Coupons", value: String(couponsCount).padStart(2, "0"), change: "Live coupon codes" },
    { label: "Active Deals", value: String(dealsCount).padStart(2, "0"), change: "Direct activation deals" },
    { label: "Network Integrations", value: "07", change: "Active merchant APIs configured" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Glow Spot */}
      <div className="pointer-events-none absolute left-1/3 top-10 h-[500px] w-[500px] rounded-full bg-[var(--color-primary)]/[0.02] blur-[120px]" />

      <AdminTopbar title="Dashboard" breadcrumbTrail={["Admin", "Dashboard"]} />

      <main className="relative space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-primary)]/[0.05] blur-2xl" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            System Control Panel
          </h2>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-white/40 max-w-xl">
            Welcome to the Couponchy manager console. Use this control panel to list stores, moderate promo codes, publish dynamic blog entries, and tune database layouts.
          </p>
        </section>

        {/* Metrics Grid */}
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {adminMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        {/* Dashboard Panels */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">

          {/* Left Column: Recent Activity & Quick Control */}
          <div className="space-y-6">
            <RecentActivityTable rows={recentOffers} />

            {/* Quick Actions Card */}
            <Card className="rounded-[24px] border border-white/[0.04] bg-gradient-to-b from-white/[0.01] to-transparent shadow-xl">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-black tracking-tight text-white uppercase">Quick Control Console</CardTitle>
                <CardDescription className="text-xs text-white/40 mt-1">Direct system configuration pathways.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {[
                    { label: "Stores", href: "/admin/stores", desc: "Manage catalog brands", icon: "🏢" },
                    { label: "Coupons & Deals", href: "/admin/offers", desc: "Moderation system", icon: "🎟️" },
                    { label: "Blog Posts", href: "/admin/blog", desc: "Editorial article publisher", icon: "✍️" },
                    { label: "Hero Settings", href: "/admin/hero", desc: "Configure home banners", icon: "⚡" },
                    { label: "Categories", href: "/admin/categories", desc: "Manage taxonomy filters", icon: "🏷️" },
                    { label: "Homepage Widgets", href: "/admin/homepage", desc: "Re-arrange sections", icon: "🏠" },
                  ].map((act) => (
                    <Link
                      key={act.label}
                      href={act.href}
                      className="group/act relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-white/[0.03] bg-white/[0.01] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.03]"
                    >
                      <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-[var(--color-primary)]/[0.02] blur-xl transition-all duration-500 group-hover/act:bg-[var(--color-primary)]/[0.06]" />
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{act.icon}</span>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/20 transition-all duration-300 group-hover/act:text-[var(--color-primary)] group-hover/act:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-bold text-white group-hover/act:text-[var(--color-primary)] transition-colors">{act.label}</p>
                        <p className="mt-1 text-[10px] font-medium leading-normal text-white/30">{act.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Catalog Pulse Status */}
          <div className="space-y-6">
            <Card className="rounded-[24px] border border-white/[0.04] bg-gradient-to-b from-white/[0.01] to-transparent shadow-xl">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-black tracking-tight text-white uppercase">Publishing Pulse</CardTitle>
                <CardDescription className="text-xs text-white/40 mt-1">Current status of the catalog database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6 pt-0">
                <div className="relative overflow-hidden rounded-[22px] border border-white/[0.04] bg-white/[0.01] p-5">
                  <div className="pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 rounded-full bg-[var(--color-primary)]/[0.03] blur-xl" />
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-primary)]"></span>
                    </span>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Catalog status</p>
                  </div>
                  <p className="mt-4 text-3xl font-black tracking-tight text-white">Live & Syncing</p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--color-primary)]">
                    Public routes are active and rendering your catalog database dynamically.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    ["Stores in catalog", String(stores.length)],
                    ["Coupons in catalog", String(couponsCount)],
                    ["Deals in catalog", String(dealsCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.005] px-4 py-3">
                      <span className="text-xs font-semibold text-white/45">{label}</span>
                      <span className="text-xs font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </section>
      </main>
    </div>
  );
}
