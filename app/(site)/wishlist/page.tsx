'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import ProductCard from '@/components/ProductCard';
import Mast from '@/components/Mast';

export default function WishlistPage() {
  const { L, AR, wish, byId } = useSite();
  const desc = wish.length
    ? (AR() ? `${wish.length} قطعة محفوظة.` : `${wish.length} piece${wish.length > 1 ? 's' : ''} held.`)
    : L('Empty. Pieces you save are kept here as a collection, not a list.', 'فاضي. القطع اللي بتحفظيها بتتحط هنا كمجموعة، مش كقايمة.');

  return (
    <>
      <Mast label={L('My Archive', 'أرشيفي')} title={L('A private collection', 'مجموعة خاصة')} desc={desc} />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        {wish.length ? (
          <div className="grid-shop">{wish.map((id) => { const p = byId(id); return p ? <ProductCard key={id} piece={p} /> : null; })}</div>
        ) : (
          <div><Link className="btn" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link></div>
        )}
      </section>
    </>
  );
}
