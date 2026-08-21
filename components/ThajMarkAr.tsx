// Arabic counterpart to logo-beige.png / logo-emerald.png (the full mark:
// wordmark + tagline + dot ornament) — live text instead of a raster image.
// The Latin mark curves "THAJ ABAYA BRAND" around the wordmark; that exact
// flourish is hand-drawn vector art and isn't worth faking with imprecise
// arc-text math, so this uses the same word-over-tagline layout the site
// already uses for the bilingual line in Curtain.tsx.
export default function ThajMarkAr({ className }: { className?: string }) {
  return (
    <div className={`thaj-mark-ar ${className || ''}`.trim()}>
      <div className="tm-word">ثاج</div>
      <div className="tm-tag">دار ثاج للأزياء</div>
      <span className="tm-dots"><i /><i /><i /></span>
    </div>
  );
}
