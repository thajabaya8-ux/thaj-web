import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

interface RawOrder {
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: number;
  deposit_amount: number | null;
  amount_paid: number;
  items: string;
  shipping_json: string | null;
  created_at: Date | string;
}

function parseItems(raw: string): { id: string; qty?: number }[] {
  try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function parseGov(raw: string | null): { governorate?: string; governorateName?: string; governorateNameAr?: string } {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const orders = await sql`SELECT status, payment_status, payment_method, total, deposit_amount, amount_paid, items, shipping_json, created_at FROM orders` as unknown as RawOrder[];

  const totalOrders = orders.length;
  // A cancelled order's own payment_status never changes when it's
  // cancelled (see app/api/admin/orders/[id]/route.ts) — it stays
  // whatever it last was, 'approved' included, so every revenue figure
  // below has to check status too, not just payment_status, or an
  // approve-then-cancel still counted as real money in.
  const approved = orders.filter((o) => o.payment_status === 'approved');
  const approvedActive = approved.filter((o) => o.status !== 'Cancelled');
  const underReview = orders.filter((o) => o.payment_status === 'under_review');
  const rejected = orders.filter((o) => o.payment_status === 'rejected');

  const totalRevenue = approvedActive.reduce((s, o) => s + (o.total || 0), 0);
  const totalDeposits = approvedActive.reduce((s, o) => s + (o.amount_paid || 0), 0);
  const avgOrderValue = totalOrders ? Math.round(orders.reduce((s, o) => s + (o.total || 0), 0) / totalOrders) : 0;

  const byMethod: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const m = o.payment_method || 'unknown';
    if (!byMethod[m]) byMethod[m] = { count: 0, revenue: 0 };
    byMethod[m].count++;
    if (o.payment_status === 'approved' && o.status !== 'Cancelled') byMethod[m].revenue += o.total || 0;
  }

  const byGov: Record<string, { key: string; name: string; nameAr: string; count: number; revenue: number }> = {};
  for (const o of orders) {
    const ship = parseGov(o.shipping_json);
    const key = ship.governorate || 'unknown';
    if (!byGov[key]) byGov[key] = { key, name: ship.governorateName || key, nameAr: ship.governorateNameAr || key, count: 0, revenue: 0 };
    byGov[key].count++;
    if (o.payment_status === 'approved' && o.status !== 'Cancelled') byGov[key].revenue += o.total || 0;
  }

  const pieceCounts: Record<string, number> = {};
  for (const o of orders) {
    for (const it of parseItems(o.items)) pieceCounts[it.id] = (pieceCounts[it.id] || 0) + (it.qty || 1);
  }
  const pieceIds = Object.keys(pieceCounts);
  const pieceRows = pieceIds.length ? await sql`SELECT id, name_en, name_ar FROM pieces WHERE id = ANY(${pieceIds})` : [];
  const topPieces = pieceRows
    .map((p) => ({ id: p.id, name: p.name_en, nameAr: p.name_ar, count: pieceCounts[p.id] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const revenueByMonthRows = await sql`
    SELECT to_char(created_at, 'YYYY-MM') AS month, SUM(total)::int AS total
    FROM orders WHERE payment_status = 'approved' AND status != 'Cancelled' GROUP BY month ORDER BY month DESC LIMIT 6
  `;
  const revenueByMonth = [...revenueByMonthRows].reverse();

  return NextResponse.json({
    totalOrders,
    approvedCount: approved.length,
    underReviewCount: underReview.length,
    rejectedCount: rejected.length,
    totalRevenue,
    totalDeposits,
    avgOrderValue,
    byMethod: Object.entries(byMethod).map(([method, v]) => ({ method, ...v })),
    byGovernorate: Object.values(byGov).sort((a, b) => b.count - a.count),
    topPieces,
    revenueByMonth
  });
}
