'use client';
import { useRef, useState } from 'react';
import { abs, useAdmin } from '@/lib/adminContext';

const MAX = 10;

export default function MultiImageUpload({ value, onChange, label, max = MAX }: {
  value: string[]; onChange: (images: string[]) => void; label?: string; max?: number;
}) {
  const { toast, L } = useAdmin();
  const fieldLabel = label ?? L('Photos', 'الصور');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || 'Upload failed');
    return body.path as string;
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const room = max - value.length;
    if (room <= 0) { toast(L(`You can have up to ${max} photos`, `الحد الأقصى ${max} صور`)); return; }
    const batch = Array.from(files).slice(0, room);
    setBusy(true);
    try {
      const paths = await Promise.all(batch.map(upload));
      onChange([...value, ...paths]);
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const removeAll = () => onChange([]);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="field">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <label style={{ margin: 0 }}>{fieldLabel} <span style={{ opacity: 0.6 }}>({value.length}/{max})</span></label>
        {value.length > 0 && (
          <button type="button" className="link" onClick={removeAll} style={{ marginBottom: 9 }}>
            {L('Remove all', 'مسح الكل')}
          </button>
        )}
      </div>
      <div className="adm-gallery">
        {value.map((path, i) => (
          <div className="adm-gallery-tile" key={path + i}>
            <img src={abs(path)} alt="" />
            {i === 0 && <span className="cover">{L('Cover', 'الغلاف')}</span>}
            <button type="button" className="rm" onClick={() => remove(i)} aria-label="Remove photo">×</button>
            <div className="mv">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">‹</button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move later">›</button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <label className={`adm-gallery-add ${busy ? 'busy' : ''}`}>
            <input ref={inputRef} type="file" accept="image/*" multiple disabled={busy} onChange={(e) => onFiles(e.target.files)} />
            {busy ? L('Uploading…', 'بيترفع…') : L('+ Add photo', '+ إضافة صورة')}
          </label>
        )}
      </div>
    </div>
  );
}
