'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function CollectionsPage() {
  const { L, esc, collections, pieces } = useSite();
  return (
    <>
      <Mast
        label={L('Chapters', 'الفصول')}
        title={L('Four rooms', 'أربع غرف')}
        desc={L('Each collection is its own room. Enter one and the house changes tone.', 'كل مجموعة غرفة لوحدها. ادخلي واحدة وهتلاقي نبرة البيت اتغيّرت.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="compose">
          {Object.entries(collections).map(([k, c], i) => (
            <Link key={k} className={`card rv ${['c-1 tall', 'c-2', 'c-3', 'c-4 wide'][i]}`} href={`/collections/${k}`}>
              <div className="frame"><div className="veil" /><img src={`/${c.img}`} loading="lazy" alt="" /></div>
              <div className="meta">
                <h3>{esc(L(c.name, c.nameAr))}</h3>
                <div className="pr" style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase' }}>
                  {pieces.filter((p) => p.coll === k).length} {L('pieces', 'قطع')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
