'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import type { Collection } from '@/lib/types';

export default function CollectionForm({ collection, onSaved }: { collection?: Collection; onSaved?: () => void }) {
  const isNew = !collection;
  const { call, toast, L } = useAdmin();
  const router = useRouter();
  const [img, setImg] = useState(collection?.img || '');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement).value;
    const body = {
      key: val('key'), name: val('name'), nameAr: val('nameAr'), ar: val('ar'),
      line: val('line'), lineAr: val('lineAr'), concept: val('concept'), conceptAr: val('conceptAr'),
      mood: val('mood'), moodAr: val('moodAr'), img
    };
    try {
      if (isNew) await call('/collections', { method: 'POST', body: JSON.stringify(body) });
      else await call(`/collections/${collection.key}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(L('Saved', 'اتحفظت'));
      if (onSaved) onSaved(); else router.push('/admin/collections');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  const v = (k: keyof Collection) => collection?.[k] || '';

  return (
    <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
      <div className="field"><label>{L('Key (slug)', 'المعرّف (slug)')}</label><input name="key" defaultValue={v('key')} readOnly={!isNew} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" placeholder="e.g. signature" /></div>
      <div className="f2">
        <div className="field"><label>{L('Name (EN)', 'الاسم (إنجليزي)')}</label><input name="name" defaultValue={v('name')} required /></div>
        <div className="field"><label>{L('Name (AR)', 'الاسم (عربي)')}</label><input name="nameAr" defaultValue={v('nameAr')} required /></div>
      </div>
      <div className="field"><label>{L('Short Arabic label (shown beside the EN name)', 'تسمية عربية مختصرة (بتتعرض جنب الاسم الإنجليزي)')}</label><input name="ar" defaultValue={v('ar')} /></div>
      <div className="f2">
        <div className="field"><label>{L('Line (EN)', 'الخط (إنجليزي)')}</label><input name="line" defaultValue={v('line')} /></div>
        <div className="field"><label>{L('Line (AR)', 'الخط (عربي)')}</label><input name="lineAr" defaultValue={v('lineAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Concept (EN)', 'المفهوم (إنجليزي)')}</label><textarea name="concept" defaultValue={v('concept')} /></div>
        <div className="field"><label>{L('Concept (AR)', 'المفهوم (عربي)')}</label><textarea name="conceptAr" defaultValue={v('conceptAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>{L('Mood (EN)', 'المزاج (إنجليزي)')}</label><input name="mood" defaultValue={v('mood')} /></div>
        <div className="field"><label>{L('Mood (AR)', 'المزاج (عربي)')}</label><input name="moodAr" defaultValue={v('moodAr')} /></div>
      </div>
      <ImageUpload value={img} onChange={setImg} />
      <button className="btn fill" style={{ width: 'max-content' }} type="submit">{isNew ? L('Create collection', 'إنشاء المجموعة') : L('Save changes', 'حفظ التعديلات')}</button>
    </form>
  );
}
