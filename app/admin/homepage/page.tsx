'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Settings } from '@/lib/types';

// Every field the homepage actually renders text from, grouped exactly the
// way the page itself is laid out top to bottom, so "which box changes
// which line" is never a guess. `long` fields get a <textarea>; a `note`
// explains a field with special syntax (the {count} token, or raw <br>
// support) right where it's edited, not in a separate help doc.
interface FieldDef { key: string; en: string; ar: string; long?: boolean; note?: [string, string] }
interface SectionDef { title: [string, string]; fields: FieldDef[] }

const SECTIONS: SectionDef[] = [
  {
    title: ['Hero', 'الهيرو (أعلى الصفحة)'],
    fields: [
      { key: 'hero_eyebrow', en: 'Eyebrow (small line above the title)', ar: 'السطر الصغير فوق العنوان' },
      { key: 'hero_title', en: 'Main title', ar: 'العنوان الرئيسي' },
      {
        key: 'home_hero_desc', en: 'Description', ar: 'الوصف', long: true,
        note: ['Use {count} where the live piece count should appear.', 'استخدمي {count} في المكان اللي عايزة عدد القطع يظهر فيه.']
      },
      { key: 'home_hero_cta1', en: 'First button', ar: 'الزرار الأول' },
      { key: 'home_hero_cta2', en: 'Second button', ar: 'الزرار الثاني' },
      { key: 'home_scroll', en: '"Scroll" hint', ar: 'كلمة "انزلي" في الأسفل' }
    ]
  },
  {
    title: ['Section 01 — The Collection', 'القسم الأول — المجموعة'],
    fields: [
      { key: 'home_s1_title', en: 'Section title', ar: 'عنوان القسم' },
      { key: 'home_s1_desc', en: 'Section description', ar: 'وصف القسم', long: true },
      {
        key: 'home_s1_link', en: '"All pieces" link', ar: 'رابط "كل القطع"',
        note: ['Use {count} where the live piece count should appear.', 'استخدمي {count} في المكان اللي عايزة عدد القطع يظهر فيه.']
      }
    ]
  },
  {
    title: ['Section 02 — The Silhouette', 'القسم الثاني — السيلويت'],
    fields: [
      { key: 'home_s2_eyebrow', en: 'Small label above the title', ar: 'السطر الصغير فوق العنوان' },
      {
        key: 'home_s2_title', en: 'Title', ar: 'العنوان',
        note: ['<br> starts a new line — this is the only field that supports it.', '<br> بيعمل سطر جديد — الحقل ده بس اللي بيدعم كده.']
      },
      { key: 'home_s2_desc', en: 'Description', ar: 'الوصف', long: true },
      { key: 'home_s2_cta', en: 'Button', ar: 'الزرار' }
    ]
  },
  {
    title: ['Section 03 — Four Chapters', 'القسم الثالث — أربعة فصول'],
    fields: [
      { key: 'home_s3_title', en: 'Section title', ar: 'عنوان القسم' },
      { key: 'home_s3_desc', en: 'Section description', ar: 'وصف القسم', long: true }
    ]
  },
  {
    title: ['Section 04 — The Atelier', 'القسم الرابع — الأتيليه'],
    fields: [
      { key: 'home_s4_eyebrow', en: 'Small label above the title', ar: 'السطر الصغير فوق العنوان' },
      { key: 'home_s4_title', en: 'Title', ar: 'العنوان' },
      { key: 'home_s4_desc', en: 'Description', ar: 'الوصف', long: true },
      { key: 'home_s4_cta', en: 'Link', ar: 'الرابط' }
    ]
  }
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.flatMap((f) => [`${f.key}_en`, `${f.key}_ar`]));

export default function HomepageContentPage() {
  const { data: settings, loading, error } = useAdminFetch<Settings>('/settings');
  const { call, toast, L } = useAdmin();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const body: Record<string, string> = {};
    ALL_KEYS.forEach((k) => { body[k] = (f.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement).value; });
    try { await call('/settings', { method: 'PUT', body: JSON.stringify(body) }); toast(L('Saved', 'اتحفظ')); }
    catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!settings) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Homepage content', 'محتوى الصفحة الرئيسية')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Every line of wording on the homepage, grouped by section', 'كل كلمة في الصفحة الرئيسية، مقسّمة حسب القسم')}</span>
      </div>
      <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
        {SECTIONS.map((section) => (
          <div key={section.title[0]} style={{ marginBottom: 8 }}>
            <div className="lbl" style={{ color: 'var(--gold)', margin: '18px 0 12px' }}>{L(...section.title)}</div>
            {section.fields.map((f) => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                {f.note && <p className="body" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>{L(...f.note)}</p>}
                <div className="f2">
                  <div className="field">
                    <label>{f.en} (EN)</label>
                    {f.long
                      ? <textarea name={`${f.key}_en`} rows={3} defaultValue={settings[`${f.key}_en`] || ''} />
                      : <input name={`${f.key}_en`} defaultValue={settings[`${f.key}_en`] || ''} />}
                  </div>
                  <div className="field">
                    <label>{f.ar} (AR)</label>
                    {f.long
                      ? <textarea name={`${f.key}_ar`} rows={3} dir="rtl" defaultValue={settings[`${f.key}_ar`] || ''} />
                      : <input name={`${f.key}_ar`} dir="rtl" defaultValue={settings[`${f.key}_ar`] || ''} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button className="btn fill" style={{ width: 'max-content' }} type="submit">{L('Save', 'حفظ')}</button>
      </form>
    </>
  );
}
