'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function JournalPage() {
  const { L, esc, journal } = useSite();
  return (
    <>
      <Mast
        label={L('The Journal', 'المجلة')}
        title={L('A publication', 'إصدار')}
        desc={L('Notes from the atelier — on seams, movement, materials and the reference points behind the house.', 'ملاحظات من الأتيليه — عن الدرزة والحركة والخامات والمراجع اللي ورا الدار.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="jgrid">
          {journal.map((j, i) => (
            <Link
              key={j.id}
              className="jcard rv"
              href={`/journal/${j.id}`}
              style={{ gridColumn: `span ${i < 2 ? 6 : 4}`, ...(i === 2 ? { marginTop: 'clamp(20px,4vw,60px)' } : {}) }}
            >
              <div className="frame" style={{ aspectRatio: i === 0 ? '4/3' : '4/5' }}><div className="veil" /><img src={`/${j.img}`} loading="lazy" alt="" /></div>
              <div className="cat lbl">{esc(L(j.cat, j.catAr))}</div>
              <div className={i === 0 ? 'h-m' : 'h-s'}>{esc(L(j.t, j.tAr))}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
