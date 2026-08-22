'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import type { Collection } from '@/lib/types';

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'category';
}

export default function CollectionForm({ collection, onSaved }: { collection?: Collection; onSaved?: () => void }) {
  const isNew = !collection;
  const { call, toast, L } = useAdmin();
  const router = useRouter();
  const [img, setImg] = useState(collection?.img || '');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value;
    const name = val('name');
    const nameAr = val('nameAr');
    if (!img) { toast(L('Add a photo for the category', 'ضيفي صورة للفئة')); return; }

    const body = { key: isNew ? slugify(name) : collection.key, name, nameAr, img };
    setSaving(true);
    try {
      if (isNew) await call('/collections', { method: 'POST', body: JSON.stringify(body) });
      else await call(`/collections/${collection.key}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(L('Saved', 'اتحفظت'));
      if (onSaved) onSaved(); else router.push('/admin/collections');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  return (
    <form className="form" style={{ maxWidth: 560 }} onSubmit={onSubmit}>
      <div className="f2">
        <div className="field"><label>{L('Name (EN)', 'الاسم (إنجليزي)')}</label><input name="name" defaultValue={collection?.name || ''} required /></div>
        <div className="field"><label>{L('Name (AR)', 'الاسم (عربي)')}</label><input name="nameAr" defaultValue={collection?.nameAr || ''} required /></div>
      </div>
      <ImageUpload value={img} onChange={setImg} />
      <button className="btn fill" style={{ width: 'max-content' }} type="submit" disabled={saving}>
        {saving ? L('Saving…', 'بيتحفظ…') : isNew ? L('Create category', 'إنشاء الفئة') : L('Save changes', 'حفظ التعديلات')}
      </button>
    </form>
  );
}
