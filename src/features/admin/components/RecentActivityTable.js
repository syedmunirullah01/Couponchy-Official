import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export default function RecentActivityTable({ rows }) {
  return (
    <Card className="rounded-[24px] border border-white/[0.04] bg-gradient-to-b from-white/[0.01] to-transparent shadow-xl">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-black tracking-tight text-white uppercase">Recent Offers</CardTitle>
        <CardDescription className="text-xs text-white/40 mt-1">Latest publishing activity and active offers.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01]">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                <TableHead className="h-11 text-[11px] font-black uppercase tracking-[0.14em] text-white/35 px-4">Coupon / Deal</TableHead>
                <TableHead className="h-11 text-[11px] font-black uppercase tracking-[0.14em] text-white/35 px-4">Store</TableHead>
                <TableHead className="h-11 text-[11px] font-black uppercase tracking-[0.14em] text-white/35 px-4">Type</TableHead>
                <TableHead className="h-11 text-[11px] font-black uppercase tracking-[0.14em] text-white/35 px-4">Source</TableHead>
                <TableHead className="h-11 text-[11px] font-black uppercase tracking-[0.14em] text-white/35 px-4 text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const isCoupon = row.type === "Coupon";
                  return (
                    <TableRow key={`${row.title}-${row.store}`} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="font-semibold text-white text-xs py-3.5 px-4 max-w-[220px] truncate">{row.title}</TableCell>
                      <TableCell className="text-white/60 text-xs py-3.5 px-4 capitalize">{row.store}</TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isCoupon 
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20" 
                            : "bg-white/5 text-white/80 border border-white/10"
                        }`}>
                          {isCoupon ? "Coupon" : "Deal"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className="text-white/45 text-[11px] font-medium">{row.source}</span>
                      </TableCell>
                      <TableCell className="text-white/30 text-xs py-3.5 px-4 text-right font-medium">{row.addedAt}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-white/20 font-medium">
                    No recent activity.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
