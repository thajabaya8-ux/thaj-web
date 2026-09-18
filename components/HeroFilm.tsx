'use client';
/* ==========================================================
   THAJ — mobile hero film
   Under 900px the homepage hero becomes a full-bleed, auto-advancing
   product-image film instead of a static panel. Two <img> layers
   cross-fade (the next image is preloaded before it's shown), each
   slide gets a slow constant-speed zoom, and a bottom bar tracks
   progress + the current piece's name/edition/price.

   SLIDE_MS/FADE_MS below are the one place the timing lives — the
   zoom, the progress-bar fill and the autoplay timer all read them
   (JS constants -> CSS custom properties), so nothing can drift out
   of sync with the others.
   ========================================================== */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSite, effectivePrice } from '@/lib/siteContext';
import type { Piece } from '@/lib/types';

const SLIDE_MS = 5000;
const FADE_MS = 1500;
const MOBILE_MQ = '(max-width: 900px)';
const RESIZE_DEBOUNCE_MS = 160;
const SWIPE_PX = 48;
const TAP_PX = 10;
const TAP_MS = 350;

// A fresh instance per slide (mounted with key={current} by the parent)
// so "start empty, then animate to full" falls out of the component's own
// mount lifecycle instead of an effect resetting state back to false.
function HfFillCurrent({ reduced }: { reduced: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setOn(true)); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [reduced]);
  return <span className={`hf-seg-fill${reduced ? ' done' : on ? ' fill' : ''}`} />;
}

export default function HeroFilm({ pieces }: { pieces: Piece[] }) {
  const { L, esc, pName, money, settings, collections } = useSite();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [tabActive, setTabActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [current, setCurrent] = useState(0);
  const [layers, setLayers] = useState<[number, number]>([0, pieces.length > 1 ? 1 : 0]);
  const [top, setTop] = useState<0 | 1>(0);

  const mountedRef = useRef(true);
  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);
  const goToRef = useRef<(dir: 1 | -1) => void>(() => {});

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Viewport + reduced-motion — the film only ever runs under 900px,
  // matching the breakpoint the rest of the hero's CSS already switches
  // on. Debounced so a mid-resize drag doesn't restart it every pixel.
  useEffect(() => {
    const mqMobile = window.matchMedia(MOBILE_MQ);
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyReduced = () => setReduced(mqReduced.matches);
    let t: ReturnType<typeof setTimeout>;
    const applyMobile = () => setIsMobile(mqMobile.matches);
    const onMobileChange = () => { clearTimeout(t); t = setTimeout(applyMobile, RESIZE_DEBOUNCE_MS); };
    applyMobile();
    applyReduced();
    mqMobile.addEventListener('change', onMobileChange);
    mqReduced.addEventListener('change', applyReduced);
    return () => {
      clearTimeout(t);
      mqMobile.removeEventListener('change', onMobileChange);
      mqReduced.removeEventListener('change', applyReduced);
    };
  }, []);

  useEffect(() => {
    const onVis = () => setTabActive(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const goTo = useCallback((dir: 1 | -1) => {
    if (!mountedRef.current || pieces.length < 2) return;
    const nextIdx = (current + dir + pieces.length) % pieces.length;
    const back = top === 0 ? 1 : 0;
    const commit = () => {
      if (!mountedRef.current) return;
      setLayers((cur) => { const next: [number, number] = [...cur]; next[back] = nextIdx; return next; });
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        setTop(back);
        setCurrent(nextIdx);
      });
    };
    if (reduced) { commit(); return; }
    const img = new Image();
    img.onload = commit;
    img.onerror = commit;
    img.src = `/${pieces[nextIdx].img}`;
  }, [current, top, pieces, reduced]);

  useEffect(() => { goToRef.current = goTo; }, [goTo]);

  // Autoplay — a fresh timeout per slide (not setInterval) so any manual
  // swipe, which changes `current` itself, naturally resets the count.
  const running = isMobile && tabActive && !reduced && pieces.length > 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => goToRef.current(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [running, current]);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('button, a, input, select, textarea')) { gesture.current = null; return; }
    gesture.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || pieces.length < 1) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const dt = Date.now() - g.t;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < TAP_PX && Math.abs(dy) < TAP_PX && dt < TAP_MS) {
      const p = pieces[current];
      if (p) router.push(`/product/${p.id}`);
    }
  }, [goTo, pieces, current, router]);

  if (!pieces.length) return null;
  const p = pieces[current];
  if (!p) return null;

  return (
    <div
      className={`hf-root${reduced ? ' reduced' : ''}`}
      style={{ ['--slide-ms' as string]: `${SLIDE_MS}ms`, ['--fade-ms' as string]: `${reduced ? 0 : FADE_MS}ms` }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="hf-stage">
        {layers.map((pieceIdx, i) => {
          const lp = pieces[pieceIdx];
          if (!lp) return null;
          return (
            <img
              key={i}
              className={`hf-img${top === i ? ' on' : ''}`}
              src={`/${lp.img}`}
              alt={pName(lp)}
              aria-hidden={top === i ? undefined : true}
            />
          );
        })}
        <div className="hf-scrim" /><div className="hf-vignette" />
      </div>

      <div className="hf-copy">
        <div className="hf-eyebrow">{L(esc(settings.hero_eyebrow_en), esc(settings.hero_eyebrow_ar))}</div>
        <img className="hf-logo" src="/assets/logo/logo-beige.png" alt="THAJ" />
        <h1 className="hf-title">{L(esc(settings.hero_title_en), esc(settings.hero_title_ar))}</h1>
        <div className="hf-cta">
          <Link className="btn hf-btn" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link>
          <Link className="btn hf-btn" href={Object.keys(collections)[0] ? `/collections/${Object.keys(collections)[0]}` : '/collections'}>{L('See the chapter', 'شوفي الفصل')}</Link>
        </div>
      </div>

      <div className="hf-bar">
        <div className="hf-progress">
          {pieces.map((piece, i) => (
            <span className="hf-seg" key={piece.id}>
              {i < current ? <span className="hf-seg-fill done" />
                : i === current ? <HfFillCurrent key={current} reduced={reduced} />
                : <span className="hf-seg-fill" />}
            </span>
          ))}
        </div>
        <div className="hf-meta">
          <span className="hf-name">{pName(p)}</span>
          <span className="hf-price">{p.ed ? `${esc(p.ed)} · ` : ''}{money(effectivePrice(p), p.currency)}</span>
        </div>
      </div>
    </div>
  );
}
