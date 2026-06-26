import { activityMarqueeItems } from "@/features/home/data/activity-marquee-data";
import { cn } from "@/lib/utils";

const statusToneClasses = {
  success: "bg-[var(--color-primary)]",
  warning: "bg-[var(--color-primary-hover)]",
  muted: "bg-[var(--muted)]",
};

function ActivityMarqueeTrack({ items }) {
  return (
    <div className="flex min-w-max shrink-0 animate-[activityMarquee_28s_linear_infinite] items-center">
      {items.map((item, index) => (
        <div
          key={`${item.store}-${item.code}-${index}`}
          className="flex items-center gap-4 border-r border-[var(--border)] px-8 py-5 text-[13px] uppercase tracking-[0.16em] text-[var(--muted)]"
        >
          <span className="font-bold text-[var(--text)]">[{item.store}]</span>
          <span>{item.action}:</span>
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
              {item.statusLabel}
            </span>
          </span>
          <span>{item.actor}</span>
        </div>
      ))}
    </div>
  );
}

export default function ActivityMarqueeSection() {
  const marqueeItems = [...activityMarqueeItems, ...activityMarqueeItems];

  return (
    <section className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]/72">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-[linear-gradient(90deg,var(--page-bg),transparent)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-[linear-gradient(270deg,var(--page-bg),transparent)]" />

        <div className="flex overflow-hidden">
          <ActivityMarqueeTrack items={marqueeItems} />
          <ActivityMarqueeTrack items={marqueeItems} />
        </div>
      </div>
    </section>
  );
}
