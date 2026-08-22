'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { stockImg } from '@/lib/img';
import ProductCard from '@/components/ProductCard';
import EdHead from '@/components/EdHead';

export default function HomePage() {
  const { L, AR, esc, pName, byId, pieces, collections, settings } = useSite();
  const feat = ['najma', 'harir', 'warda', 'fahm'].map(byId).filter(Boolean);
  const strip = [...pieces, ...pieces];

  return (
    <>
      <section className="hero-m bleed rv" id="hero">
        <div className="hm-glow" /><div className="hm-rules" />
        <div className="hm-in">
          <div className="hm-copy">
            <div className="lbl hm-eyebrow">{L(esc(settings.hero_eyebrow_en), esc(settings.hero_eyebrow_ar))}</div>
            <img className="hm-logo" src="/assets/logo/logo-beige.png" alt="THAJ" />
            <h1 className="hm-h">{L(esc(settings.hero_title_en), esc(settings.hero_title_ar))}</h1>
            <div className="hm-row">
              <p>{L('Eleven pieces, catalogued and editioned. Cut in Riyadh, washed three times, and finished by hand before they are named.', 'إحدى عشرة قطعة، مفهرسة ومرقّمة. تُقص في الرياض، وتُغسل ثلاث مرات، وتُنهى باليد قبل أن تُسمّى.')}</p>
              <div className="hm-cta">
                <Link className="btn" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link>
                <Link className="btn" href="/collections/signature">{L('See the chapter', 'شوفي الفصل')}</Link>
              </div>
            </div>
          </div>
          <div className="hm-strip"><div className="hm-track">
            {strip.map((p, i) => (
              <Link key={`${p.id}-${i}`} className="hm-th" href={`/product/${p.id}`} title={pName(p)}>
                <img src={`/${p.img}`} alt={pName(p)} loading="lazy" /><span>{pName(p)}</span>
              </Link>
            ))}
          </div></div>
        </div>
        <div className="hm-scroll">{L('Scroll', 'انزلي')}<i></i></div>
      </section>

      <section className="pad wrap">
        <EdHead n="01" title={L('The Collection', 'المجموعة')} aside={L('Not a grid. Pieces shown at the scale they deserve — some dominate, some are found.', 'مش شبكة. القطع معروضة بالحجم اللي تستاهله — بعضها بيسيطر، وبعضها بيتلقى.')} />
        <div className="compose">
          {feat[0] && <ProductCard piece={feat[0]} className="c-1 tall" />}
          {feat[1] && <ProductCard piece={feat[1]} className="c-2" />}
          {feat[2] && <ProductCard piece={feat[2]} className="c-3" />}
          {feat[3] && <ProductCard piece={feat[3]} className="c-4 wide" />}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'clamp(40px,6vw,80px)' }}>
          <Link className="link rv" href="/shop">{L('All eleven pieces', 'كل الإحدى عشرة قطعة')}</Link>
        </div>
      </section>

      <section className="dark pad">
        <div className="wrap split">
          <div style={{ gridColumn: '1/6' }}>
            <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 20 }}>{L('02 · The Silhouette', '٠٢ · السيلويت')}</div>
            <h2 className="h-l rv"><span className="clip" dangerouslySetInnerHTML={{ __html: L('Fabric first.<br>The garment after.', 'القماش أولًا.<br>القطعة بعدين.') }} /></h2>
            <p className="body rv" style={{ marginTop: 26, maxWidth: '40ch' }}>{L('A piece is discovered here the way it is discovered in the atelier — texture, then fall, then movement, then the whole.', 'القطعة بتتكشف هنا زي ما بتتكشف في الأتيليه — الملمس، بعده السقوط، بعده الحركة، وبعدين الكل.')}</p>
            <div className="rv" style={{ marginTop: 32 }}><Link className="btn" href="/product/harir">{L('Discover a piece', 'اكتشفي قطعة')}</Link></div>
          </div>
          <div style={{ gridColumn: '7/13', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(14px,2vw,28px)' }}>
            <div className="rv" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: 'var(--emerald)' }}>
              <div className="veil" style={{ background: 'var(--emerald-deep)' }} /><img src={`/${stockImg(settings, 4)}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div className="rv" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: 'var(--emerald)', marginTop: 'clamp(24px,5vw,70px)' }}>
              <div className="veil" style={{ background: 'var(--emerald-deep)' }} /><img src={`/${stockImg(settings, 7)}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className="pad wrap">
        <EdHead n="03" title={L('Four Chapters', 'أربعة فصول')} aside={L('Each collection is its own room. Enter one and the house changes tone.', 'كل مجموعة غرفة لوحدها. ادخلي واحدة وهتلاقي نبرة البيت اتغيّرت.')} />
        <div className="compose">
          {Object.entries(collections).map(([k, c], i) => (
            <Link key={k} className={`card rv ${['c-1', 'c-2', 'c-3', 'c-4'][i]}`} href={`/collections/${k}`}>
              <div className="frame" style={{ aspectRatio: i % 2 ? '3/4' : '4/5' }}><div className="veil" /><img src={`/${c.img}`} loading="lazy" alt="" /></div>
              <div className="meta">
                <h3>{esc(L(c.name, c.nameAr))}{AR() ? '' : <i>{esc(c.ar)}</i>}</h3>
                <div className="pr" style={{ fontSize: 11, letterSpacing: '.2em', fontFamily: 'var(--sans)', textTransform: 'uppercase' }}>{esc(L(c.line, c.lineAr))}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="tone pad">
        <div className="wrap split">
          <div className="rv" style={{ gridColumn: '1/7', position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: 'var(--sand)' }}>
            <div className="veil" /><img src={`/${stockImg(settings, 8)}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} alt="" />
          </div>
          <div style={{ gridColumn: '8/13' }}>
            <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 18 }}>{L('04 · The Atelier', '٠٤ · الأتيليه')}</div>
            <h2 className="h-m rv"><span className="clip">{L('Pattern, cut, hand, finish.', 'باترون، قص، يد، تشطيب.')}</span></h2>
            <p className="body rv" style={{ marginTop: 22 }}>{L('A toile in calico hangs for a week before the real cloth is touched. Linen is washed three times before the pattern goes near it. Ivory is cut last, because every seam shows.', 'تواليه من الكاليكو بتتعلّق أسبوع قبل ما نلمس القماش الحقيقي. الكتان بيتغسل تلات مرات قبل ما الباترون يقرب منه. والعاجي بيتقص في الآخر، لأن كل درزة بتبان.')}</p>
            <div className="rv" style={{ marginTop: 28 }}><Link className="link" href="/atelier">{L('Enter the atelier', 'ادخلي الأتيليه')}</Link></div>
          </div>
        </div>
      </section>

      <section className="dark pad">
        <div className="wrap-n" style={{ textAlign: 'center' }}>
          <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 22 }}>{L('By appointment', 'بموعد')}</div>
          <h2 className="h-l rv"><span className="clip">{L('The Private Room', 'الغرفة الخاصة')}</span></h2>
          <p className="body rv" style={{ margin: '26px auto 34px', maxWidth: '52ch' }}>{L('Collection previews before release, bespoke commissions, and personal styling — in Riyadh or by video.', 'معاينة المجموعات قبل النزول، وطلبات تفصيل خاصة، وتنسيق شخصي — في الرياض أو عن طريق فيديو.')}</p>
          <div className="rv"><Link className="btn" href="/private">{L('Request an appointment', 'اطلبي موعد')}</Link></div>
        </div>
      </section>
    </>
  );
}
