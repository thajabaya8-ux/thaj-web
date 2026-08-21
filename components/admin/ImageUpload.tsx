'use client';
import { abs, useAdmin } from '@/lib/adminContext';

export default function ImageUpload({ value, onChange, aspectRatio = '3/4' }: {
  value: string; onChange: (path: string) => void; aspectRatio?: string;
}) {
  const { toast, L } = useAdmin();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'Upload failed');
      onChange(body.path);
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="field">
      <label>{L('Photo', 'الصورة')}</label>
      <div className="adm-upload">
        {value ? <img src={abs(value)} style={{ width: 110, aspectRatio, objectFit: 'cover', background: 'var(--sand)' }} alt="" /> : null}
        <input type="file" accept="image/*" onChange={onFile} />
      </div>
    </div>
  );
}
