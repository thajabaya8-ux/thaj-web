'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { IMG } from '@/lib/img';

export default function MaisonPage() {
  const { L, ord } = useSite();
  const four: [string, string][] = [
    [L('Materials', 'الخامات'), L('Jacquard, crepe, silk-satin, washed linen, voile. Bought in small lengths, often the last of a run.', 'جاكار، كريب، ساتان حرير، كتان مغسول، فوال. بتتشترى بأطوال صغيرة، وغالبًا آخر تشغيلة.')],
    [L('Craft', 'الصنعة'), L('Lace set by hand against the wearer, not the block. Crushing done after dye, in small batches.', 'الدانتيل بيتركّب باليد على اللابسة، مش على الباترون. والكرمشة بعد الصباغة، في دفعات صغيرة.')],
    [L('Palette', 'الألوان'), L('Onyx, ivory, champagne, olive, burgundy, tobacco. Gold appears once per piece, if at all.', 'عقيق، عاجي، شمبانيا، زيتي، خمري، تبغي. الدهب بيظهر مرة واحدة في القطعة، لو ظهر أصلًا.')],
    [L('Time', 'الوقت'), L('A toile hangs for a week. Linen is washed three times. Ivory is cut last.', 'التواليه بتتعلّق أسبوع. الكتان بيتغسل تلات مرات. والعاجي بيتقص في الآخر.')]
  ];
  return (
    <>
      <section className="hero bleed rv" style={{ height: 'min(84vh,820px)' }}>
        <img src={`/${IMG[2]}`} alt="THAJ" style={{ objectPosition: '50% 58%' }} />
        <div className="h-in">
          <div className="lbl">{L('The Maison', 'الدار')}</div>
          <h1>{L('A house built on proportion, not ornament.', 'دار مبنية على النسبة، مش على الزخرفة.')}</h1>
        </div>
      </section>
      <section className="pad wrap-n">
        <p className="h-m rv" style={{ marginBottom: 34 }}>{L('THAJ makes abayas in Riyadh. Eleven pieces at a time, catalogued and numbered, in a palette that stays deliberately narrow.', 'ثاج بتصنع عبايات في الرياض. إحدى عشرة قطعة في المرة، مفهرسة ومرقّمة، وبلوحة ألوان ضيقة عن قصد.')}</p>
        <div className="split" style={{ gridTemplateColumns: 'repeat(12,1fr)', alignItems: 'start', gap: 'clamp(24px,4vw,60px)' }}>
          <div style={{ gridColumn: '1/7' }}>
            <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Philosophy', 'الفلسفة')}</div>
            <p className="body rv">{L('Where the body is not described, the seam is the only line available. That single constraint governs everything the house does: where a shoulder sits, how far a sleeve falls, whether a closure exists at all.', 'لما الجسم مايتوصفش، الدرزة بتبقى الخط الوحيد المتاح. القيد الواحد ده بيحكم كل حاجة في الدار: الكتف بيقع فين، الكم بينزل قد إيه، وهل في قفلة أصلًا ولا لأ.')}</p>
            <p className="body rv" style={{ marginTop: 16 }}>{L('We do not add. We move things two centimetres and look again.', 'إحنا مابنزوّدش. بنحرّك الحاجات سنتيمترين ونبص تاني.')}</p>
          </div>
          <div style={{ gridColumn: '7/13' }}>
            <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Origin', 'الأصل')}</div>
            <p className="body rv">{L("The reference points are close and unphotogenic: the proportion of a doorway in old Riyadh, the grey of a shaded courtyard at two in the afternoon, a carpet's burgundy faded unevenly on one side.", 'المراجع قريبة وغير تصويرية: نسبة مدخل باب في الرياض القديمة، ورمادي فناء مظلّل الساعة اتنين بعد الضهر، وخمري سجادة باهت من ناحية أكتر من التانية.')}</p>
            <p className="body rv" style={{ marginTop: 16 }}>{L('Saudi, without the costume of it.', 'سعودية، من غير التنكّر بيها.')}</p>
          </div>
        </div>
      </section>
      <section className="dark pad">
        <div className="wrap">
          <div className="split" style={{ gridTemplateColumns: 'repeat(12,1fr)', alignItems: 'start' }}>
            {four.map(([t, d], i) => (
              <div className="rv" style={{ gridColumn: 'span 3' }} key={t}>
                <div className="lbl" style={{ color: 'var(--champagne)', marginBottom: 14 }}>{ord(i + 1)}</div>
                <h3 className="h-s" style={{ marginBottom: 12 }}>{t}</h3>
                <p className="body" style={{ fontSize: 12.5 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pad wrap-n" style={{ textAlign: 'center' }}>
        <h2 className="h-l rv"><span className="clip">{L('Visit the atelier', 'زوري الأتيليه')}</span></h2>
        <div className="rv" style={{ marginTop: 28 }}><Link className="btn" href="/atelier">{L('The making', 'الصناعة')}</Link></div>
      </section>
    </>
  );
}
