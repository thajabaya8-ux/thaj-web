'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { IMG } from '@/lib/img';
import Mast from '@/components/Mast';

export default function AtelierPage() {
  const { L, ord } = useSite();
  const steps: [string, string, number][] = [
    [L('Fabric', 'القماش'), L('The roll arrives. It is washed three times before anyone measures anything.', 'التوب بيوصل. بيتغسل تلات مرات قبل ما حد يقيس أي حاجة.'), 6],
    [L('Pattern', 'الباترون'), L('A toile in calico. It hangs for a week, and it is honest about where the eye lands.', 'تواليه من الكاليكو. بتتعلّق أسبوع، وأمينة في إنها تقولك العين بتقع فين.'), 10],
    [L('Cutting', 'القص'), L('Ivory last, always — every seam shows on ivory, so it gets the steadiest hands and the earliest hour.', 'العاجي في الآخر دايمًا — كل درزة بتبان عليه، فبياخد أثبت إيدين وأبكر ساعة.'), 8],
    [L('Hand', 'اليد'), L('Lace set against the wearer. Clasps cast, buttons run throat to hip, all of them functional.', 'الدانتيل بيتركّب على اللابسة. المشابك بتتصبّ، والأزرار ماشية من الرقبة للورك، وكلها شغّالة.'), 1],
    [L('Finish', 'التشطيب'), L('The piece is named, numbered, photographed in movement, and entered into the archive.', 'القطعة بتتسمّى، وتترقّم، وتتصوّر وهي بتتحرك، وتتسجّل في الأرشيف.'), 0]
  ];
  return (
    <>
      <Mast
        label={L('The Atelier', 'الأتيليه')}
        title={L('Five rooms, in order', 'خمس غرف، بالترتيب')}
        desc={L('From the roll arriving to the piece being named, numbered and photographed in movement.', 'من لحظة وصول التوب لحد ما القطعة تتسمّى وتترقّم وتتصوّر وهي بتتحرك.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        {steps.map((s, i) => (
          <div className="split rv" key={s[0]} style={{ gridTemplateColumns: 'repeat(12,1fr)', marginBottom: 'clamp(40px,7vw,110px)', alignItems: 'center' }}>
            <div style={{ gridColumn: i % 2 ? '7/13' : '1/7', order: i % 2 ? 2 : 1, position: 'relative', overflow: 'hidden', aspectRatio: i % 2 ? '4/5' : '4/3', background: 'var(--sand)' }}>
              <div className="veil" /><img src={`/${IMG[s[2]]}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${30 + i * 10}%` }} alt="" />
            </div>
            <div style={{ gridColumn: i % 2 ? '1/6' : '8/13', order: i % 2 ? 1 : 2 }}>
              <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{ord(i + 1)}</div>
              <h2 className="h-m" style={{ marginBottom: 16 }}>{s[0]}</h2>
              <p className="body">{s[1]}</p>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}><Link className="link rv" href="/shop">{L('See what comes out of it', 'شوفي اللي بيطلع منه')}</Link></div>
      </section>
    </>
  );
}
