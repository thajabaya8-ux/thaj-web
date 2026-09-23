'use client';
/* ==========================================================
   THAJ — customer photo reviews
   Admin-curated strip near the bottom of the homepage: photos customers
   send in (WhatsApp/DM), uploaded at /admin/review-photos with an
   optional caption. Empty by default, same convention as the marquee
   strip — hidden entirely until the admin adds a photo.
   ========================================================== */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSite } from '@/lib/siteContext';
import EdHead from './EdHead';
import type { ReviewPhoto } from '@/lib/types';

export default function CustomerReviews() {
  const { L, AR } = useSite();
  const [photos, setPhotos] = useState<ReviewPhoto[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/review-photos').then((r) => (r.ok ? r.json() : [])).then((p: ReviewPhoto[]) => { if (!cancelled) setPhotos(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!photos.length) return null;

  return (
    <section className="pad wrap">
      <EdHead n="05" title={L('In their own words', 'بكلامهم هم')} aside={L('Real customers, real pieces — sent in, not staged.', 'عميلات حقيقيات وقطع حقيقية — مبعوتة منهم، مش متجهزة.')} />
      <div className="reviews-grid">
        {photos.map((p) => {
          const caption = (AR() ? p.captionAr : p.caption) || p.caption || p.captionAr;
          return (
            <div className="card" style={{ cursor: 'default' }} key={p.id}>
              <div className="frame">
                <Image src={`/${p.img}`} alt={caption || 'THAJ'} fill sizes="(max-width: 640px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
              </div>
              {caption && <div className="meta"><p className="body" style={{ fontSize: 12.5 }}>{caption}</p></div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
