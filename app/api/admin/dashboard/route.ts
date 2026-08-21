import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { appointmentOut, orderOut } from '@/lib/serverMappers';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const [{ n: pieces }] = await sql`SELECT COUNT(*)::int AS n FROM pieces`;
  const [{ n: collections }] = await sql`SELECT COUNT(*)::int AS n FROM collections`;
  const [{ n: ordersPending }] = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE status != 'Delivered'`;
  const [{ n: appointmentsPending }] = await sql`SELECT COUNT(*)::int AS n FROM appointments WHERE status = 'Requested'`;

  const ordersByStatus = await sql`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`;

  const revenueByMonthRows = await sql`
    SELECT to_char(created_at, 'YYYY-MM') AS month, SUM(total)::int AS total
    FROM orders GROUP BY month ORDER BY month DESC LIMIT 6
  `;
  const revenueByMonth = [...revenueByMonthRows].reverse();

  const collectionProgress = (await sql`
    SELECT c.key, c.name_en, c.name_ar, COUNT(p.id)::int AS n
    FROM collections c LEFT JOIN pieces p ON p.coll_key = c.key
    GROUP BY c.key, c.name_en, c.name_ar, c.sort ORDER BY c.sort
  `).map((r) => ({ key: r.key, name: r.name_en, nameAr: r.name_ar, count: r.n, pct: pieces ? Math.round((r.n / pieces) * 100) : 0 }));

  const recentOrders = (await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 5`).map(orderOut);
  const recentAppointments = (await sql`SELECT * FROM appointments ORDER BY id DESC LIMIT 5`).map(appointmentOut);

  return NextResponse.json({
    pieces, collections, ordersPending, appointmentsPending,
    ordersByStatus, revenueByMonth, collectionProgress, recentOrders, recentAppointments
  });
}
