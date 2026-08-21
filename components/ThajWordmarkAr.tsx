// Arabic counterpart to wordmark-beige.png / wordmark-emerald.png — live
// text (Amiri, self-hosted, see app/layout.tsx) instead of a raster image,
// so it recolors with plain CSS instead of needing a second exported PNG
// per theme.
export default function ThajWordmarkAr({ className }: { className?: string }) {
  return <span className={`thaj-wordmark-ar ${className || ''}`.trim()}>ثاج</span>;
}
