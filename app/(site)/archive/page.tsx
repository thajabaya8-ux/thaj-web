'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function ArchivePage() {
  const { L, AR, esc, pName, collName, pieces, AVAIL_AR } = useSite();
  return (
    <>
      <Mast
        label={L('The Archive', 'الأرشيف')}
        title={L('Every piece, editioned', 'كل قطعة، بإصدار')}
        desc={L('A museum catalogue rather than a shop. Pieces held here include those no longer for sale.', 'كتالوج متحفي أكتر منه متجر. القطع هنا فيها اللي مابقاش للبيع.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="arch-row arch-head">
          <span className="th"></span>
          <span className="th">{L('Piece', 'القطعة')}</span>
          <span className="th hide-m">{L('Material', 'الخامة')}</span>
          <span className="th hide-m">{L('Silhouette', 'السيلويت')}</span>
          <span className="th hide-m">{L('Chapter', 'الفصل')}</span>
          <span className="th">{L('Status', 'الحالة')}</span>
        </div>
        {pieces.map((p) => (
          <Link key={p.id} className="arch-row rv" href={`/product/${p.id}`}>
            <img className="thumb" src={`/${p.img}`} loading="lazy" alt="" />
            <div>
              <div className="nm">{pName(p)}</div>
              {p.ed && <div className="lbl" style={{ color: 'var(--ink-faint)', marginTop: 6 }}>{esc(p.ed)}</div>}
            </div>
            <div className="body hide-m" style={{ fontSize: 12, lineHeight: 1.7 }}>{esc(L(p.mat, p.matAr))}</div>
            <div className="body hide-m" style={{ fontSize: 12, lineHeight: 1.7 }}>{esc(L(p.silf, p.silfAr))}</div>
            <div className="body hide-m" style={{ fontSize: 12, lineHeight: 1.7 }}>{collName(p.coll)}</div>
            <div><span className={`pill ${p.av === 'Available' ? '' : 'g'}`}>{esc(AR() ? (AVAIL_AR[p.av] || p.av) : p.av)}</span></div>
          </Link>
        ))}
      </section>
    </>
  );
}
