'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { stockImg } from '@/lib/img';
import { applyCount } from '@/lib/homeContent';
import ProductCard from '@/components/ProductCard';
import EdHead from '@/components/EdHead';
import HeroFilm from '@/components/HeroFilm';
import type { Piece } from '@/lib/types';

export default function HomePage() {
  const { L, AR, esc, num, pName, pieces, collections, settings } = useSite();
  // The featured composition below is built for exactly four pieces —
  // whichever the admin has picked at /admin/collections (the "Feature"
  // action per piece), in catalogue order. Falls back to the newest four
  // so the homepage isn't empty before the admin has curated anything.
  const featuredPicks = pieces.filter((p) => p.featured);
  const feat = (featuredPicks.length ? featuredPicks : pieces.slice(-4).reverse()).slice(0, 4);

  // Curated by the admin at /admin/marquee — not every piece in the
  // catalogue, and empty (so the strip stays hidden) until they pick some.
  const [marquee, setMarquee] = useState<Piece[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/marquee').then((r) => (r.ok ? r.json() : [])).then((p: Piece[]) => { if (!cancelled) setMarquee(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const strip = [...marquee, ...marquee];
  // Same curated list powers the mobile film below — pieces without a
  // photo can't appear in an image carousel.
  const filmPieces = marquee.filter((p) => p.img);

  return (
    <>
      {/* #hero's className must never change after mount — RouteEffects
          adds the scroll-reveal "in" class to it imperatively, and React
          would wipe that back out the moment it re-renders this element
          with a different className string (which is exactly what a
          data-dependent class here would do once the marquee finishes
          loading). The film flag lives on .hm-in below instead, which
          React is free to re-render normally. */}
      <section className="hero-m bleed rv" id="hero">
        <div className="hm-glow" /><div className="hm-rules" />
        <div className={`hm-in${filmPieces.length ? ' hm-film-active' : ''}`}>
          <div className="hm-copy">
            <div className="lbl hm-eyebrow">{L(esc(settings.hero_eyebrow_en), esc(settings.hero_eyebrow_ar))}</div>
            <img className="hm-logo" src="/assets/logo/logo-beige.png" alt="THAJ" />
            <h1 className="hm-h">{L(esc(settings.hero_title_en), esc(settings.hero_title_ar))}</h1>
            <div className="hm-row">
              <p>{applyCount(L(esc(settings.home_hero_desc_en), esc(settings.home_hero_desc_ar)), num(pieces.length))}</p>
              <div className="hm-cta">
                <Link className="btn" href="/shop">{L(esc(settings.home_hero_cta1_en), esc(settings.home_hero_cta1_ar))}</Link>
                <Link className="btn" href={Object.keys(collections)[0] ? `/collections/${Object.keys(collections)[0]}` : '/collections'}>{L(esc(settings.home_hero_cta2_en), esc(settings.home_hero_cta2_ar))}</Link>
              </div>
            </div>
          </div>
          {marquee.length > 0 && (
            <div className="hm-strip"><div className="hm-track">
              {strip.map((p, i) => (
                <Link key={`${p.id}-${i}`} className="hm-th" href={`/product/${p.id}`} title={pName(p)}>
                  <img src={`/${p.img}`} alt={pName(p)} loading="lazy" /><span>{pName(p)}</span>
                </Link>
              ))}
            </div></div>
          )}
        </div>
        {filmPieces.length > 0 && <HeroFilm pieces={filmPieces} />}
        <div className="hm-scroll">{L(esc(settings.home_scroll_en), esc(settings.home_scroll_ar))}<i></i></div>
      </section>

      <section className="pad wrap">
        <EdHead n="01" title={L(esc(settings.home_s1_title_en), esc(settings.home_s1_title_ar))} aside={L(esc(settings.home_s1_desc_en), esc(settings.home_s1_desc_ar))} />
        <div className="compose">
          {feat[0] && <ProductCard piece={feat[0]} className="c-1 tall" />}
          {feat[1] && <ProductCard piece={feat[1]} className="c-2" />}
          {feat[2] && <ProductCard piece={feat[2]} className="c-3" />}
          {feat[3] && <ProductCard piece={feat[3]} className="c-4 wide" />}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'clamp(40px,6vw,80px)' }}>
          <Link className="link rv" href="/shop">{applyCount(L(esc(settings.home_s1_link_en), esc(settings.home_s1_link_ar)), num(pieces.length))}</Link>
        </div>
      </section>

      <section className="dark pad">
        <div className="wrap split">
          <div style={{ gridColumn: '1/6' }}>
            <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 20 }}>{L(esc(settings.home_s2_eyebrow_en), esc(settings.home_s2_eyebrow_ar))}</div>
            <h2 className="h-l rv"><span className="clip" dangerouslySetInnerHTML={{ __html: L(settings.home_s2_title_en, settings.home_s2_title_ar) || '' }} /></h2>
            <p className="body rv" style={{ marginTop: 26, maxWidth: '40ch' }}>{L(esc(settings.home_s2_desc_en), esc(settings.home_s2_desc_ar))}</p>
            <div className="rv" style={{ marginTop: 32 }}><Link className="btn" href={feat[0] ? `/product/${feat[0].id}` : '/shop'}>{L(esc(settings.home_s2_cta_en), esc(settings.home_s2_cta_ar))}</Link></div>
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
        <EdHead n="03" title={L(esc(settings.home_s3_title_en), esc(settings.home_s3_title_ar))} aside={L(esc(settings.home_s3_desc_en), esc(settings.home_s3_desc_ar))} />
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
            <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 18 }}>{L(esc(settings.home_s4_eyebrow_en), esc(settings.home_s4_eyebrow_ar))}</div>
            <h2 className="h-m rv"><span className="clip">{L(esc(settings.home_s4_title_en), esc(settings.home_s4_title_ar))}</span></h2>
            <p className="body rv" style={{ marginTop: 22 }}>{L(esc(settings.home_s4_desc_en), esc(settings.home_s4_desc_ar))}</p>
            <div className="rv" style={{ marginTop: 28 }}><Link className="link" href="/atelier">{L(esc(settings.home_s4_cta_en), esc(settings.home_s4_cta_ar))}</Link></div>
          </div>
        </div>
      </section>

      <section className="dark pad">
        <div className="wrap-n" style={{ textAlign: 'center' }}>
          <div className="lbl rv" style={{ color: 'var(--champagne)', marginBottom: 22 }}>{L(esc(settings.home_room_eyebrow_en), esc(settings.home_room_eyebrow_ar))}</div>
          <h2 className="h-l rv"><span className="clip">{L(esc(settings.home_room_title_en), esc(settings.home_room_title_ar))}</span></h2>
          <p className="body rv" style={{ margin: '26px auto 34px', maxWidth: '52ch' }}>{L(esc(settings.home_room_desc_en), esc(settings.home_room_desc_ar))}</p>
          <div className="rv"><Link className="btn" href="/private">{L(esc(settings.home_room_cta_en), esc(settings.home_room_cta_ar))}</Link></div>
        </div>
      </section>
    </>
  );
}
