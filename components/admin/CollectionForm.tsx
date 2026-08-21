'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import type { Collection } from '@/lib/types';

export default function CollectionForm({ collection, onSaved }: { collection?: Collection; onSaved?: () => void }) {
  const isNew = !collection;
  const { call, toast } = useAdmin();
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
      toast('Saved');
      if (onSaved) onSaved(); else router.push('/admin/collections');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  const v = (k: keyof Collection) => collection?.[k] || '';

  return (
    <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
      <div className="field"><label>Key (slug)</label><input name="key" defaultValue={v('key')} readOnly={!isNew} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" placeholder="e.g. signature" /></div>
      <div className="f2">
        <div className="field"><label>Name (EN)</label><input name="name" defaultValue={v('name')} required /></div>
        <div className="field"><label>Name (AR)</label><input name="nameAr" defaultValue={v('nameAr')} required /></div>
      </div>
      <div className="field"><label>Short Arabic label (shown beside the EN name)</label><input name="ar" defaultValue={v('ar')} /></div>
      <div className="f2">
        <div className="field"><label>Line (EN)</label><input name="line" defaultValue={v('line')} /></div>
        <div className="field"><label>Line (AR)</label><input name="lineAr" defaultValue={v('lineAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Concept (EN)</label><textarea name="concept" defaultValue={v('concept')} /></div>
        <div className="field"><label>Concept (AR)</label><textarea name="conceptAr" defaultValue={v('conceptAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Mood (EN)</label><input name="mood" defaultValue={v('mood')} /></div>
        <div className="field"><label>Mood (AR)</label><input name="moodAr" defaultValue={v('moodAr')} /></div>
      </div>
      <ImageUpload value={img} onChange={setImg} />
      <button className="btn fill" style={{ width: 'max-content' }} type="submit">{isNew ? 'Create collection' : 'Save changes'}</button>
    </form>
  );
}
