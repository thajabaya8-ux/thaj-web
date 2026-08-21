'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import type { JournalArticle } from '@/lib/types';

export default function JournalForm({ article, onSaved }: { article?: JournalArticle; onSaved?: () => void }) {
  const isNew = !article;
  const { call, toast } = useAdmin();
  const router = useRouter();
  const [img, setImg] = useState(article?.img || '');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement).value;
    const body = {
      id: val('id'), cat: val('cat'), catAr: val('catAr'), t: val('t'), tAr: val('tAr'),
      x: val('x').split('\n').map((s) => s.trim()).filter(Boolean),
      xAr: val('xAr').split('\n').map((s) => s.trim()).filter(Boolean),
      img
    };
    try {
      if (isNew) await call('/journal', { method: 'POST', body: JSON.stringify(body) });
      else await call(`/journal/${article.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Saved');
      if (onSaved) onSaved(); else router.push('/admin/journal');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
  };

  const v = (k: 'id' | 'cat' | 'catAr' | 't' | 'tAr') => article?.[k] || '';

  return (
    <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
      <div className="field"><label>ID (slug)</label><input name="id" defaultValue={v('id')} readOnly={!isNew} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" placeholder="e.g. j5" /></div>
      <div className="f2">
        <div className="field"><label>Category (EN)</label><input name="cat" defaultValue={v('cat')} /></div>
        <div className="field"><label>Category (AR)</label><input name="catAr" defaultValue={v('catAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Title (EN)</label><input name="t" defaultValue={v('t')} required /></div>
        <div className="field"><label>Title (AR)</label><input name="tAr" defaultValue={v('tAr')} required /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Body paragraphs (EN, one per line)</label><textarea name="x" style={{ minHeight: 140 }} defaultValue={(article?.x || []).join('\n')} /></div>
        <div className="field"><label>Body paragraphs (AR, one per line)</label><textarea name="xAr" style={{ minHeight: 140 }} defaultValue={(article?.xAr || []).join('\n')} /></div>
      </div>
      <ImageUpload value={img} onChange={setImg} aspectRatio="4/3" />
      <button className="btn fill" style={{ width: 'max-content' }} type="submit">{isNew ? 'Publish article' : 'Save changes'}</button>
    </form>
  );
}
