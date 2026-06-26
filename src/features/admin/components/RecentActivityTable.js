import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export default function RecentActivityTable({ rows }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Offers</CardTitle>
        <CardDescription>Latest publishing activity.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coupon / Deal</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.title}-${row.store}`}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>{row.store}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell className="text-[var(--muted)]">{row.addedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
