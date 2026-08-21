'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import ThajMarkAr from './ThajMarkAr';

export default function Footer() {
  const { L, AR, settings } = useSite();
  return (
    <footer id="foot">
      <div className="wrap">
        <div className="fgrid">
          <div className="fcol">
            <h5>{L('The Maison', 'الدار')}</h5>
            <Link className="fl" href="/maison">{L('Our story', 'قصتنا')}</Link>
            <Link className="fl" href="/atelier">{L('The atelier', 'الأتيليه')}</Link>
            <Link className="fl" href="/journal">{L('Journal', 'المجلة')}</Link>
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
            <span className="fl">{settings.contact_email}</span>
            <span className="fl">{L('Shipping & returns', 'الشحن والإرجاع')}</span>
            <span className="fl">{L('Care & repair', 'العناية والإصلاح')}</span>
          </div>
        </div>
        {AR() ? <ThajMarkAr /> : <img className="fmark" src="/assets/logo/logo-beige.png" alt="THAJ" />}
        <div className="fbot">
          <span>© 2026 THAJ · {L('Kingdom of Saudi Arabia', 'المملكة العربية السعودية')}</span>
          <span className="arabic" style={{ letterSpacing: 0 }}>الأناقة صمت</span>
          <span>{L('Privacy · Terms', 'الخصوصية · الشروط')}</span>
        </div>
      </div>
    </footer>
  );
}
