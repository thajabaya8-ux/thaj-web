'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { SocialLink } from '@/lib/types';

const PLATFORM_LABEL: Record<string, [string, string]> = {
  instagram: ['Instagram', 'انستجرام'],
  whatsapp: ['WhatsApp', 'واتساب'],
  facebook: ['Facebook', 'فيسبوك'],
  tiktok: ['TikTok', 'تيك توك'],
  twitter: ['X (Twitter)', 'إكس (تويتر)'],
  snapchat: ['Snapchat', 'سناب شات'],
  youtube: ['YouTube', 'يوتيوب'],
  pinterest: ['Pinterest', 'بينترست']
};

export default function SocialPage() {
  const { data, loading, error, reload } = useAdminFetch<SocialLink[]>('/social');
  const { call, toast, L } = useAdmin();
  const [rows, setRows] = useState<SocialLink[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (data) setRows(data); }, [data]);

  const patch = useCallback(async (platform: string, body: { url?: string; active?: boolean }) => {
    setBusy(platform);
    try { await call(`/social/${platform}`, { method: 'PATCH', body: JSON.stringify(body) }); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
    finally { setBusy((cur) => (cur === platform ? null : cur)); }
  }, [call, toast, reload]);

  const onUrlChange = (platform: string, value: string) => {
    clearTimeout(saveTimers.current[platform]);
    saveTimers.current[platform] = setTimeout(() => patch(platform, { url: value.trim() }), 600);
  };

  const onActiveToggle = (platform: string, active: boolean) => {
    setRows((cur) => cur && cur.map((s) => (s.platform === platform ? { ...s, active } : s)));
    patch(platform, { active });
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!rows) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Social', 'السوشيال ميديا')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('The floating bubble on the site shows only the platforms below with a link pasted in and switched on.', 'الدائرة العائمة في الموقع بتعرض بس المنصات اللي تحتها لينك متحط ومفعّلة.')}
        </span>
      </div>

      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr 2.5fr 100px' }}>
        <span>{L('Platform', 'المنصة')}</span>
        <span>{L('Link', 'الرابط')}</span>
        <span>{L('Active', 'مفعّلة')}</span>
      </div>
      {rows.map((s) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1fr 2.5fr 100px', opacity: s.active ? 1 : .5 }} key={s.platform}>
          <span>{L(...(PLATFORM_LABEL[s.platform] || [s.platform, s.platform]))}</span>
          <input
            type="url" placeholder={s.platform === 'whatsapp' ? 'https://wa.me/201234567890' : 'https://…'}
            defaultValue={s.url} disabled={busy === s.platform}
            onChange={(e) => onUrlChange(s.platform, e.target.value)}
            style={{ background: 'none', border: '1px solid var(--line)', padding: '8px 10px', fontSize: 12.5, width: '100%' }}
          />
          <input
            type="checkbox" checked={s.active} disabled={busy === s.platform}
            onChange={(e) => onActiveToggle(s.platform, e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--emerald)' }}
          />
        </div>
      ))}
    </>
  );
}
