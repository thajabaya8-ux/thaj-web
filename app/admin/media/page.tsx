'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import { IMG } from '@/lib/img';
import ImageUpload from '@/components/admin/ImageUpload';
import type { Settings } from '@/lib/types';

function MediaSlot({ label, value, fallback, onSaved }: {
  label: string; value: string; fallback: string; onSaved: (path: string) => void;
}) {
  return (
    <div className="adm-media-slot">
      <ImageUpload value={value || fallback} onChange={onSaved} aspectRatio="16/9" />
      <div className="lbl" style={{ color: 'var(--ink-faint)', marginTop: -8 }}>{label}</div>
    </div>
  );
}

export default function MediaPage() {
  const { data: settings, loading, error, reload } = useAdminFetch<Settings>('/settings');
  const { call, toast, L } = useAdmin();

  const save = async (key: string, path: string) => {
    try { await call('/settings', { method: 'PUT', body: JSON.stringify({ [key]: path }) }); toast(L('Saved', 'اتحفظت')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!settings) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Site images', 'صور الموقع')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('Every non-product photo on the site, in one place — replace any of them, live, right away.', 'كل صور الموقع اللي مش تابعة لمنتج، في مكان واحد — استبدلي أي واحدة وهتتحدث على الموقع فورًا.')}
        </span>
      </div>

      <div className="lbl" style={{ color: 'var(--gold)', margin: '30px 0 14px' }}>
        {L('Decorative photos (hero backdrops, atelier steps)', 'صور زخرفية (خلفيات، خطوات الأتيليه)')}
      </div>
      <div className="adm-media-grid">
        {IMG.map((fallback, i) => {
          const key = `img_stock_${String(i + 1).padStart(2, '0')}`;
          return (
            <MediaSlot
              key={key}
              label={`${L('Photo', 'صورة')} ${i + 1}`}
              value={settings[key] || ''} fallback={fallback}
              onSaved={(p) => save(key, p)}
            />
          );
        })}
      </div>
    </>
  );
}
