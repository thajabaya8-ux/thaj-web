'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { SOCIAL_ICONS, SOCIAL_LABELS } from './socialIcons';
import type { SocialLink } from '@/lib/types';

export default function Footer() {
  const { L, settings } = useSite();

  // Self-fetched, like SocialFab — the admin's active platforms (in
  // whatever order they're set at /admin/social) show here automatically,
  // with no extra wiring whenever one is added, changed, or removed.
  const [social, setSocial] = useState<SocialLink[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/social').then((r) => (r.ok ? r.json() : [])).then((s: SocialLink[]) => { if (!cancelled) setSocial(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const whatsapp = social.find((s) => s.platform === 'whatsapp');
  const otherSocial = social.filter((s) => s.platform !== 'whatsapp');

  return (
    <footer id="foot">
      <div className="wrap">
        <div className="fgrid">
          <div className="fcol">
            <h5>{L('The Maison', 'الدار')}</h5>
            <Link className="fl" href="/maison">{L('Our story', 'قصتنا')}</Link>
            <Link className="fl" href="/atelier">{L('The atelier', 'الأتيليه')}</Link>
            <Link className="fl" href="/archive">{L('The archive', 'الأرشيف')}</Link>
          </div>
          <div className="fcol">
            <h5>{L('Shop', 'المتجر')}</h5>
            <Link className="fl" href="/shop">{L('All pieces', 'كل القطع')}</Link>
            <Link className="fl" href="/collections">{L('Collections', 'المجموعات')}</Link>
            <Link className="fl" href="/collections/signature">{L('Signature', 'التوقيع')}</Link>
            <Link className="fl" href="/collections/resort">{L('Resort 26', 'مصيف ٢٦')}</Link>
          </div>
          <div className="fcol">
            <h5>{L('Client', 'العميلة')}</h5>
            <Link className="fl" href="/private">{L('Private appointment', 'موعد خاص')}</Link>
            <Link className="fl" href="/account">{L('My THAJ', 'حسابي')}</Link>
            <Link className="fl" href="/wishlist">{L('My archive', 'أرشيفي')}</Link>
            <Link className="fl" href="/room">{L('Control room', 'غرفة التحكم')}</Link>
          </div>
          <div className="fcol">
            <h5>{L('Contact', 'تواصل')}</h5>
            <span className="fl">{L(settings.contact_location_en, settings.contact_location_ar)}</span>
            {settings.contact_email && <a className="fl" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>}
            {whatsapp && <a className="fl" href={whatsapp.url} target="_blank" rel="noopener noreferrer">{L('Message us on WhatsApp', 'راسلنا على واتساب')}</a>}
            <span className="fl">{L('Shipping & returns', 'الشحن والإرجاع')}</span>
            <span className="fl">{L('Care & repair', 'العناية والإصلاح')}</span>
            {otherSocial.length > 0 && (
              <div className="f-social">
                {otherSocial.map((s) => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" title={L(...SOCIAL_LABELS[s.platform])} aria-label={s.platform}>
                    {SOCIAL_ICONS[s.platform]}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <img className="fmark" src="/assets/logo/logo-beige.png" alt="THAJ" />
        <div className="fbot">
          <span>© 2026 THAJ · {L('Kingdom of Saudi Arabia', 'المملكة العربية السعودية')}</span>
          <span className="arabic" style={{ letterSpacing: 0 }}>الأناقة صمت</span>
          <span>{L('Privacy · Terms', 'الخصوصية · الشروط')}</span>
        </div>
      </div>
    </footer>
  );
}
