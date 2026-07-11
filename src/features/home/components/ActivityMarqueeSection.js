import { activityMarqueeItems } from "@/features/home/data/activity-marquee-data";
import { cn } from "@/lib/utils";

const statusToneClasses = {
  success: "bg-[var(--color-primary)]",
  warning: "bg-[var(--color-primary-hover)]",
  muted: "bg-[var(--muted)]",
};

function ActivityMarqueeTrack({ items, t }) {
  const getActionText = (action) => {
    if (action === "Code verified") return t.codeVerified || action;
    if (action === "Code submitted") return t.codeSubmitted || action;
    if (action === "Deal activated") return t.dealActivated || action;
    if (action === "Coupon updated") return t.couponUpdated || action;
    return action;
  };

  const getStatusText = (statusLabel) => {
    if (statusLabel === "Verified") return t.verified || statusLabel;
    if (statusLabel === "New code") return t.newCode || statusLabel;
    if (statusLabel === "Pending review") return t.pendingReview || statusLabel;
    if (statusLabel === "Live deal") return t.liveDeal || statusLabel;
    if (statusLabel === "Fresh update") return t.freshUpdate || statusLabel;
    return statusLabel;
  };

  return (
    <div className="flex min-w-max shrink-0 animate-[activityMarquee_55s_linear_infinite] items-center">
      {items.map((item, index) => (
        <div
          key={`${item.store}-${item.code}-${index}`}
          className="flex items-center gap-4 border-r border-[var(--border)] px-8 py-5 text-[13px] uppercase tracking-[0.16em] text-[var(--muted)]"
        >
          <span className="font-bold text-[var(--text)]">[{item.store}]</span>
          <span>{getActionText(item.action)}:</span>
          <span className="font-bold text-[var(--text)]">{item.code}</span>
          <span className="flex items-center gap-2 font-bold">
            <span className={cn("h-2 w-2 rounded-full", statusToneClasses[item.statusTone])} />
            <span
              className={cn(
                item.statusTone === "success" && "text-[var(--color-primary)]",
                item.statusTone === "warning" && "text-[var(--color-primary-hover)]",
                item.statusTone === "muted" && "text-[var(--muted)]"
              )}
            >
              {getStatusText(item.statusLabel)}
            </span>
          </span>
          <span>{item.actor}</span>
        </div>
      ))}
    </div>
  );
}

export default function ActivityMarqueeSection({ t: propT, items }) {
  let itemsToUse = items && items.length > 0 ? items : activityMarqueeItems;
  // Repeat items if it's too short so it doesn't leave blank gaps during animation
  while (itemsToUse.length < 10) {
    itemsToUse = [...itemsToUse, ...itemsToUse];
  }
  const marqueeItems = [...itemsToUse, ...itemsToUse];

  const t = propT || {
    codeVerified: "Code verified",
    codeSubmitted: "Code submitted",
    dealActivated: "Deal activated",
    couponUpdated: "Coupon updated",
    verified: "Verified",
    newCode: "New code",
    pendingReview: "Pending review",
    liveDeal: "Live deal",
    freshUpdate: "Fresh update",
  };

  return (
    <section className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]/72">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-[linear-gradient(90deg,var(--page-bg),transparent)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-[linear-gradient(270deg,var(--page-bg),transparent)]" />

        <div className="flex overflow-hidden">
          <ActivityMarqueeTrack items={marqueeItems} t={t} />
          <ActivityMarqueeTrack items={marqueeItems} t={t} />
        </div>
      </div>
    </section>
  );
}
