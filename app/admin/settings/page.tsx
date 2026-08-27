'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Settings } from '@/lib/types';

const NUMBER_FIELDS = new Set(['egp_per_sar', 'deposit_percent']);

const CONTENT_FIELDS: [string, string, string][] = [
  ['contact_email', 'Contact email', 'إيميل التواصل'],
  ['contact_location_en', 'Contact location (EN)', 'موقع التواصل (إنجليزي)'],
  ['contact_location_ar', 'Contact location (AR)', 'موقع التواصل (عربي)'],
  ['egp_per_sar', 'Egyptian pounds per 1 Saudi riyal', 'الجنيه المصري مقابل ريال سعودي واحد']
];

const PAYMENT_FIELDS: [string, string, string][] = [
  ['deposit_percent', 'Deposit required (%)', 'نسبة العربون (%)'],
  ['vodafone_cash_name', 'Vodafone Cash — account name', 'فودافون كاش — اسم الحساب'],
  ['vodafone_cash_number', 'Vodafone Cash — number', 'فودافون كاش — الرقم'],
  ['instapay_name', 'InstaPay — account name', 'إنستاباي — اسم الحساب'],
  ['instapay_handle', 'InstaPay — handle / mobile / IBAN', 'إنستاباي — المعرّف / الموبايل / الآيبان'],
  ['admin_whatsapp_number', "Admin's WhatsApp number (for order alerts)", 'رقم واتساب الأدمن (لإشعارات الطلبات)']
];

const MARKETING_FIELDS: [string, string, string][] = [
  ['meta_pixel_id', 'Meta Pixel ID', 'معرّف Meta Pixel'],
  ['meta_capi_token', 'Meta Conversions API token (optional)', 'توكن Meta Conversions API (اختياري)']
];

const POLICY_FIELDS = ['return_policy_en', 'return_policy_ar'];

const ALL_FIELDS = [...CONTENT_FIELDS, ...PAYMENT_FIELDS, ...MARKETING_FIELDS];
const ALL_KEYS = [...ALL_FIELDS.map(([k]) => k), ...POLICY_FIELDS];

export default function SettingsPage() {
  const { data: settings, loading, error } = useAdminFetch<Settings>('/settings');
  const { call, toast, L } = useAdmin();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body: Record<string, string> = {};
    ALL_KEYS.forEach((k) => { body[k] = (f.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement).value; });
    try { await call('/settings', { method: 'PUT', body: JSON.stringify(body) }); toast(L('Settings saved', 'الإعدادات اتحفظت')); }
    catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!settings) return null;

  const renderField = ([k, en, ar]: [string, string, string]) => (
    <div className="field" key={k}>
      <label>{L(en, ar)}</label>
      {NUMBER_FIELDS.has(k)
        ? <input name={k} type="number" step="0.01" min="0" defaultValue={settings[k] || ''} />
        : <input name={k} defaultValue={settings[k] || ''} />}
    </div>
  );

  return (
    <>
      <div className="adm-head"><h1>{L('Settings', 'الإعدادات')}</h1></div>
      <p className="body" style={{ fontSize: 12, marginBottom: 18, color: 'var(--ink-faint)', maxWidth: 640 }}>
        {L('Editing the homepage’s own wording — hero, section headings, descriptions — moved to its own page: ', 'تعديل كلام الصفحة الرئيسية نفسها — الهيرو، عناوين الأقسام، الأوصاف — بقى ليه صفحة لوحده: ')}
        <Link href="/admin/homepage">{L('Homepage content', 'محتوى الصفحة الرئيسية')}</Link>.
      </p>
      <form className="form" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
        {CONTENT_FIELDS.map(renderField)}
        <div className="lbl" style={{ color: 'var(--gold)', margin: '10px 0 6px' }}>
          {L('Payment & checkout', 'الدفع والشراء')}
        </div>
        <p className="body" style={{ fontSize: 12, marginBottom: 18, color: 'var(--ink-faint)' }}>
          {L('Shown to shoppers at checkout, in EGP — these are the numbers customers transfer their deposit to. Shipping fees are managed per governorate on the ', 'بتتعرض للعميلات وقت الدفع، بالجنيه المصري — دي الأرقام اللي العميلة بتحوّل عليها العربون. رسوم الشحن بتتدار لكل محافظة من صفحة ')}
          <Link href="/admin/shipping">{L('Shipping page', 'الشحن')}</Link>.
        </p>
        {PAYMENT_FIELDS.map(renderField)}
        <div className="lbl" style={{ color: 'var(--gold)', margin: '10px 0 6px' }}>
          {L('Return & exchange policy', 'سياسة الاسترجاع والاستبدال')}
        </div>
        <p className="body" style={{ fontSize: 12, marginBottom: 18, color: 'var(--ink-faint)' }}>
          {L('One policy, shown in two places: its own row on the Shipping & Returns page, and a short note on every product page.', 'سياسة واحدة، بتتعرض في مكانين: صف لوحده في صفحة الشحن والإرجاع، وملاحظة قصيرة في كل صفحة منتج.')}
        </p>
        <div className="f2">
          <div className="field">
            <label>{L('Policy (EN)', 'السياسة (إنجليزي)')}</label>
            <textarea name="return_policy_en" rows={4} defaultValue={settings.return_policy_en || ''} />
          </div>
          <div className="field">
            <label>{L('Policy (AR)', 'السياسة (عربي)')}</label>
            <textarea name="return_policy_ar" rows={4} dir="rtl" defaultValue={settings.return_policy_ar || ''} />
          </div>
        </div>
        <div className="lbl" style={{ color: 'var(--gold)', margin: '10px 0 6px' }}>
          {L('Marketing', 'التسويق')}
        </div>
        <p className="body" style={{ fontSize: 12, marginBottom: 18, color: 'var(--ink-faint)' }}>
          {L('Powers Meta Pixel tracking site-wide (page views, add-to-cart, purchases…). The API token is optional — it only enables the server-side Conversions API for extra reliability.', 'بيشغّل تتبّع Meta Pixel في كل الموقع (زيارات، إضافة للسلة، طلبات…). التوكن اختياري — بيفعّل بس الـ Conversions API من السيرفر لدقة أعلى.')}
        </p>
        {MARKETING_FIELDS.map(renderField)}
        <button className="btn fill" style={{ width: 'max-content' }} type="submit">{L('Save settings', 'حفظ الإعدادات')}</button>
      </form>
    </>
  );
}
