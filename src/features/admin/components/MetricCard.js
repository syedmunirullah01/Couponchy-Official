import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function MetricCard({ label, value, change }) {
  return (
    <Card className="bg-[linear-gradient(180deg,rgba(139, 92, 246,0.08),transparent_55%),var(--surface)]">
      <CardHeader className="pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--color-primary)]">{change}</p>
      </CardContent>
    </Card>
  );
}
