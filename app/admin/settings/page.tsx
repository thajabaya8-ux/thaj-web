'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Settings } from '@/lib/types';

const FIELDS: [string, string, string][] = [
  ['hero_eyebrow_en', 'Home hero eyebrow (EN)', 'عنوان فرعي للصفحة الرئيسية (إنجليزي)'],
  ['hero_eyebrow_ar', 'Home hero eyebrow (AR)', 'عنوان فرعي للصفحة الرئيسية (عربي)'],
  ['hero_title_en', 'Home hero title (EN)', 'العنوان الرئيسي (إنجليزي)'],
  ['hero_title_ar', 'Home hero title (AR)', 'العنوان الرئيسي (عربي)'],
  ['contact_email', 'Contact email', 'إيميل التواصل'],
  ['contact_location_en', 'Contact location (EN)', 'موقع التواصل (إنجليزي)'],
  ['contact_location_ar', 'Contact location (AR)', 'موقع التواصل (عربي)'],
  ['egp_per_sar', 'Egyptian pounds per 1 Saudi riyal', 'الجنيه المصري مقابل ريال سعودي واحد']
];

export default function SettingsPage() {
  const { data: settings, loading, error } = useAdminFetch<Settings>('/settings');
  const { call, toast, L } = useAdmin();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body: Record<string, string> = {};
    FIELDS.forEach(([k]) => { body[k] = (f.elements.namedItem(k) as HTMLInputElement).value; });
    try { await call('/settings', { method: 'PUT', body: JSON.stringify(body) }); toast(L('Settings saved', 'الإعدادات اتحفظت')); }
    catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!settings) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Settings', 'الإعدادات')}</h1></div>
      <form className="form" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
        {FIELDS.map(([k, en, ar]) => (
          <div className="field" key={k}>
            <label>{L(en, ar)}</label>
            {k === 'egp_per_sar'
              ? <input name={k} type="number" step="0.01" min="0" defaultValue={settings[k] || ''} />
              : <input name={k} defaultValue={settings[k] || ''} />}
          </div>
        ))}
        <button className="btn fill" style={{ width: 'max-content' }} type="submit">{L('Save settings', 'حفظ الإعدادات')}</button>
      </form>
    </>
  );
}
