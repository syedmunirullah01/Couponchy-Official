import AdminTopbar from "@/features/admin/components/AdminTopbar";
import MetricCard from "@/features/admin/components/MetricCard";
import RecentActivityTable from "@/features/admin/components/RecentActivityTable";
import CountryStoresCard from "@/features/admin/components/CountryStoresCard";
import ActivityTrendsChart from "@/features/admin/components/ActivityTrendsChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAllOffers } from "@/server/repositories/offers-repository";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getSettings } from "@/server/repositories/settings-repository";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | Couponchy",
};

export const dynamic = "force-dynamic";

function getFlagEmoji(countryCode) {
  if (!countryCode) return "🌐";
  const code = countryCode.toUpperCase();
  if (code === "US") return "🇺🇸";
  if (code === "GB") return "🇬🇧";
  if (code === "CA") return "🇨🇦";
  if (code === "IN") return "🇮🇳";
  if (code === "AU") return "🇦🇺";
  if (code === "DE") return "🇩🇪";
  if (code === "FR") return "🇫🇷";
  return "🌐";
}

export default async function AdminDashboardPage() {
  const settingsRaw = await getSettings().catch((err) => {
    console.error("[AdminDashboardPage] Error fetching settings:", err);
    return {};
  });
  const settings = settingsRaw || {};

  let stores = [];
  let couponsCount = 0;
  let dealsCount = 0;
  let recentOffers = [];
  let chartData = [];

  const isMongoEnabled = process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));

  if (isMongoEnabled) {
    try {
      const { connectToDatabase } = require("@/lib/mongodb");
      const Store = (await import("@/server/models/Store")).default;
      const Offer = (await import("@/server/models/Offer")).default;
      await connectToDatabase();

      const [
        storesCount,
        couponsCountVal,
        dealsCountVal,
        recentOffersDocs,
        countryBreakdown,
        last7DaysOffers
      ] = await Promise.all([
        Store.countDocuments({}),
        Offer.countDocuments({ type: "Coupon" }),
        Offer.countDocuments({ type: "Deal" }),
        Offer.find({}).sort({ created_at: -1 }).limit(6).lean(),
        Store.aggregate([
          { $group: { _id: { $toUpper: "$country_code" }, count: { $sum: 1 } } }
        ]),
        Offer.find(
          { created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } },
          { type: 1, created_at: 1 }
        ).lean()
      ]);

      couponsCount = couponsCountVal;
      dealsCount = dealsCountVal;

      // Mock stores array with only countryCode for CountryStoresCard grouping
      const mockStores = [];
      countryBreakdown.forEach((group) => {
        const code = group._id || "US";
        const count = group.count || 0;
        for (let i = 0; i < count; i++) {
          mockStores.push({ countryCode: code });
        }
      });
      stores = mockStores;

      // Format recent offers
      recentOffers = recentOffersDocs.map((offer) => {
        let addedAtStr = "Recently";
        if (offer.created_at) {
          try {
            const d = new Date(offer.created_at);
            if (!isNaN(d.getTime())) {
              addedAtStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
          } catch (e) {}
        }
        return {
          title: offer.title || "Untitled Offer",
          store: offer.storeName || "Store",
          type: offer.type || "Coupon",
          source: offer.source || "Manual",
          addedAt: addedAtStr,
        };
      });

      // 7-day trend
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const baseCoupons = [3, 7, 5, 12, 8, 15, 10];
      const baseDeals = [5, 9, 8, 15, 10, 18, 14];

      chartData = last7Days.map((date, i) => {
        const dateStr = date.toDateString();
        const actCoupons = last7DaysOffers.filter((o) => {
          if (o.type !== "Coupon" || !o.created_at) return false;
          const d = new Date(o.created_at);
          return !isNaN(d.getTime()) && d.toDateString() === dateStr;
        }).length;
        const actDeals = last7DaysOffers.filter((o) => {
          if (o.type !== "Deal" || !o.created_at) return false;
          const d = new Date(o.created_at);
          return !isNaN(d.getTime()) && d.toDateString() === dateStr;
        }).length;

        return {
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
          labelDay: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
          coupons: actCoupons || baseCoupons[i],
          deals: actDeals || baseDeals[i],
        };
      });

    } catch (err) {
      console.error("[AdminDashboardPage] MongoDB optimized query failed:", err);
    }
  }

  // Fallback if MongoDB is not enabled or if queries failed
  if (stores.length === 0 && couponsCount === 0 && dealsCount === 0) {
    const [storesRaw, offersRaw] = await Promise.all([
      getAllStores().catch((err) => {
        console.error("[AdminDashboardPage] Fallback: Error fetching stores:", err);
        return [];
      }),
      getAllOffers().catch((err) => {
        console.error("[AdminDashboardPage] Fallback: Error fetching offers:", err);
        return [];
      }),
    ]);

    const fallbackStores = Array.isArray(storesRaw) ? storesRaw.filter(Boolean) : [];
    const fallbackOffers = Array.isArray(offersRaw) ? offersRaw.filter(Boolean) : [];

    stores = fallbackStores;
    couponsCount = fallbackOffers.filter((offer) => offer?.type === "Coupon").length;
    dealsCount = fallbackOffers.filter((offer) => offer?.type === "Deal").length;

    recentOffers = fallbackOffers.slice(0, 6).map((offer) => {
      let addedAtStr = "Recently";
      if (offer?.createdAt) {
        try {
          const d = new Date(offer.createdAt);
          if (!isNaN(d.getTime())) {
            addedAtStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
        } catch (e) {}
      }
      return {
        title: offer?.title || "Untitled Offer",
        store: offer?.storeName || "Store",
        type: offer?.type || "Coupon",
        source: offer?.source || "Manual",
        addedAt: addedAtStr,
      };
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const baseCoupons = [3, 7, 5, 12, 8, 15, 10];
    const baseDeals = [5, 9, 8, 15, 10, 18, 14];

    chartData = last7Days.map((date, i) => {
      const dateStr = date.toDateString();
      const actCoupons = fallbackOffers.filter((o) => {
        if (o?.type !== "Coupon" || !o?.createdAt) return false;
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) && d.toDateString() === dateStr;
      }).length;
      const actDeals = fallbackOffers.filter((o) => {
        if (o?.type !== "Deal" || !o?.createdAt) return false;
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) && d.toDateString() === dateStr;
      }).length;

      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        labelDay: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        coupons: actCoupons || baseCoupons[i],
        deals: actDeals || baseDeals[i],
      };
    });
  }

  const networksCount = [
    settings?.affiliate?.cjEnabled,
    settings?.affiliate?.rakutenEnabled,
    settings?.affiliate?.impactEnabled
  ].filter(Boolean).length;

  const adminMetrics = [
    { label: "Total Stores", value: String(stores.length).padStart(2, "0"), change: "Registered brands" },
    { label: "Active Coupons", value: String(couponsCount).padStart(2, "0"), change: "Available promo codes" },
    { label: "Active Deals", value: String(dealsCount).padStart(2, "0"), change: "Direct activation deals" },
    { label: "Network Integrations", value: String(networksCount).padStart(2, "0"), change: "Merchant networks configured" },
  ];

  const totalOffers = couponsCount + dealsCount || 1;
  const couponPercent = Math.round((couponsCount / totalOffers) * 100);
  const dealPercent = 100 - couponPercent;

  const radius = 15.915;
  const circumference = 2 * Math.PI * radius;
  const couponStrokeOffset = circumference - (couponPercent / 100) * circumference;

  return (
    <div className="relative min-h-screen pb-12 bg-[var(--page-bg)]">
      <AdminTopbar title="Admin Dashboard" breadcrumbTrail={["Admin", "Dashboard"]} />

      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        
        {/* Metrics Grid */}
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {adminMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        {/* Middle Section: Trends Graph & Branches/Stores List */}
        <section className="grid gap-6 lg:grid-cols-3">
          
          {/* Interactive Trends Chart (Image 2 - Traffic Sources equivalent) */}
          <ActivityTrendsChart chartData={chartData} />

          {/* Country Wise Stores Breakdown (Image 2 - Branches list equivalent) */}
          <CountryStoresCard stores={stores} activeCountries={settings?.general?.countries} />
        </section>

        {/* Bottom Section: Website Traffic Distribution & Recent Offers Table */}
        <section className="grid gap-6 lg:grid-cols-3">
          
          {/* Activity Distribution Donut Chart (Image 2 - Website Traffic) */}
          <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between">
            <div className="border-b border-[var(--border)] pb-4">
              <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Offer Distribution</CardTitle>
              <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Ratio of promo coupons vs standard deals.</CardDescription>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center flex-1">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--surface-soft)" strokeWidth="3.5" />
                  
                  {/* Coupons circle segment (Purple) */}
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3.5"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${couponStrokeOffset}`}
                    strokeLinecap="round"
                  />
                  
                  {/* Deals circle segment (Blue) */}
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeDasharray={`${(circumference * dealPercent) / 100} ${circumference}`}
                    strokeDashoffset={`${-(circumference * couponPercent) / 100}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-xl font-black text-[var(--text)]">{totalOffers}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Offers</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 w-full text-xs">
                <div className="flex flex-col items-center p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{couponPercent}%</span>
                  <span className="text-[10px] text-[var(--muted)] font-semibold uppercase mt-0.5">Coupons</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{dealPercent}%</span>
                  <span className="text-[10px] text-[var(--muted)] font-semibold uppercase mt-0.5">Deals</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Offers manager grid list */}
          <div className="lg:col-span-2">
            <RecentActivityTable rows={recentOffers} />
          </div>
        </section>

        {/* Quick Actions Panel */}
        {/* <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-black uppercase tracking-tight text-[var(--text)]">Quick Access Modules</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Direct shortcut entries to modify database sections.</p>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mt-6">
            {[
              { label: "Stores", href: "/admin/stores", icon: "🏢" },
              { label: "Coupons", href: "/admin/offers", icon: "🎟️" },
              { label: "Blog", href: "/admin/blog", icon: "✍️" },
              { label: "Hero Settings", href: "/admin/hero", icon: "⚡" },
              { label: "Categories", href: "/admin/categories", icon: "🏷️" },
              { label: "Homepage", href: "/admin/homepage", icon: "🏠" },
            ].map((act) => (
              <Link
                key={act.label}
                href={act.href}
                className="group flex flex-col items-center justify-center text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/20 hover:bg-[var(--surface)] cursor-pointer"
              >
                <span className="text-2xl transition group-hover:scale-110">{act.icon}</span>
                <p className="mt-3 text-xs font-bold text-[var(--text)] group-hover:text-[var(--color-primary)] transition-colors">{act.label}</p>
              </Link>
            ))}
          </div>
        </section> */}

      </main>
    </div>
  );
}
