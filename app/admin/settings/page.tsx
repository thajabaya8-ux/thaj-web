'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Settings } from '@/lib/types';

const FIELDS: [string, string][] = [
  ['hero_eyebrow_en', 'Home hero eyebrow (EN)'], ['hero_eyebrow_ar', 'Home hero eyebrow (AR)'],
  ['hero_title_en', 'Home hero title (EN)'], ['hero_title_ar', 'Home hero title (AR)'],
  ['contact_email', 'Contact email'],
  ['contact_location_en', 'Contact location (EN)'], ['contact_location_ar', 'Contact location (AR)']
];

export default function SettingsPage() {
  const { data: settings, loading, error } = useAdminFetch<Settings>('/settings');
  const { call, toast } = useAdmin();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body: Record<string, string> = {};
    FIELDS.forEach(([k]) => { body[k] = (f.elements.namedItem(k) as HTMLInputElement).value; });
    try { await call('/settings', { method: 'PUT', body: JSON.stringify(body) }); toast('Settings saved'); }
    catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!settings) return null;

  return (
    <>
      <div className="adm-head"><h1>Settings</h1></div>
      <form className="form" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
        {FIELDS.map(([k, label]) => (
          <div className="field" key={k}><label>{label}</label><input name={k} defaultValue={settings[k] || ''} /></div>
        ))}
        <button className="btn fill" style={{ width: 'max-content' }} type="submit">Save settings</button>
      </form>
    </>
  );
}
