'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';
import type { Collection, Piece } from '@/lib/types';

const AVAIL_OPTS = ['Available', 'Two remaining', 'By request', 'Pre-order', 'Archive only'];

export default function PieceForm({ piece, collections, onSaved }: {
  piece?: Piece; collections: Collection[]; onSaved?: () => void;
}) {
  const isNew = !piece;
  const { call, toast } = useAdmin();
  const router = useRouter();
  const [images, setImages] = useState<string[]>(piece?.images || []);
  const [hasPants, setHasPants] = useState(!!piece?.pantsImg);
  const [pantsImg, setPantsImg] = useState(piece?.pantsImg || '');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

    if (!images.length) { toast('At least one photo of the piece is required'); return; }
    if (hasPants && !pantsImg) { toast('Add a trouser photo, or turn the trousers toggle off'); return; }

    const body = {
      id: val('id'), ed: val('ed'), n: val('n'), ar: val('ar'),
      price: parseInt(val('price'), 10) || 0, coll: val('coll'),
      fabric: val('fabric'), sil: val('sil'), colour: val('colour'), occ: val('occ'), av: val('av'),
      mat: val('mat'), matAr: val('matAr'), silf: val('silf'), silfAr: val('silfAr'),
      pal: val('pal'), palAr: val('palAr'), d: val('d'), dAr: val('dAr'),
      story: val('story').split('\n').map((s) => s.trim()).filter(Boolean),
      storyAr: val('storyAr').split('\n').map((s) => s.trim()).filter(Boolean),
      images,
      pantsImg: hasPants ? pantsImg : '',
      pantsPrice: hasPants ? (parseInt(val('pantsPrice'), 10) || 0) : null
    };
    setSaving(true);
    try {
      if (isNew) await call('/pieces', { method: 'POST', body: JSON.stringify(body) });
      else await call(`/pieces/${piece.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Saved');
      if (onSaved) onSaved(); else router.push('/admin/pieces');
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  const v = (k: keyof Piece, d: string | number = '') => piece?.[k] ?? d;

  return (
    <form className="form" style={{ maxWidth: 760 }} onSubmit={onSubmit}>
      <div className="f2">
        <div className="field"><label>ID (slug)</label><input name="id" defaultValue={v('id')} readOnly={!isNew} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" placeholder="e.g. najma" /></div>
        <div className="field"><label>Edition</label><input name="ed" defaultValue={v('ed')} placeholder="ED. 001" /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Name (EN)</label><input name="n" defaultValue={v('n')} required /></div>
        <div className="field"><label>Name (AR)</label><input name="ar" defaultValue={v('ar')} required /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Price (SAR)</label><input name="price" type="number" min="0" defaultValue={v('price', 0)} required /></div>
        <div className="field"><label>Collection</label>
          <select name="coll" defaultValue={v('coll')}>
            {collections.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="f2">
        <div className="field"><label>Fabric (facet)</label><input name="fabric" defaultValue={v('fabric')} /></div>
        <div className="field"><label>Silhouette (facet)</label><input name="sil" defaultValue={v('sil')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Colour (facet)</label><input name="colour" defaultValue={v('colour')} /></div>
        <div className="field"><label>Occasion (facet)</label><input name="occ" defaultValue={v('occ')} /></div>
      </div>
      <div className="field"><label>Availability</label>
        <select name="av" defaultValue={v('av', 'Available')}>{AVAIL_OPTS.map((o) => <option key={o}>{o}</option>)}</select>
      </div>
      <div className="f2">
        <div className="field"><label>Material (EN)</label><input name="mat" defaultValue={v('mat')} /></div>
        <div className="field"><label>Material (AR)</label><input name="matAr" defaultValue={v('matAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Silhouette detail (EN)</label><input name="silf" defaultValue={v('silf')} /></div>
        <div className="field"><label>Silhouette detail (AR)</label><input name="silfAr" defaultValue={v('silfAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Palette (EN)</label><input name="pal" defaultValue={v('pal')} /></div>
        <div className="field"><label>Palette (AR)</label><input name="palAr" defaultValue={v('palAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Description (EN)</label><textarea name="d" defaultValue={v('d')} /></div>
        <div className="field"><label>Description (AR)</label><textarea name="dAr" defaultValue={v('dAr')} /></div>
      </div>
      <div className="f2">
        <div className="field"><label>Story paragraphs (EN, one per line)</label><textarea name="story" style={{ minHeight: 110 }} defaultValue={(piece?.story || []).join('\n')} /></div>
        <div className="field"><label>Story paragraphs (AR, one per line)</label><textarea name="storyAr" style={{ minHeight: 110 }} defaultValue={(piece?.storyAr || []).join('\n')} /></div>
      </div>
      <MultiImageUpload value={images} onChange={setImages} label="Piece photos (up to 5 — first is the cover)" />

      <div className="adm-pants">
        <label className="adm-pants-toggle">
          <input type="checkbox" checked={hasPants} onChange={(e) => setHasPants(e.target.checked)} />
          <span>This piece includes matching trousers</span>
        </label>
        {hasPants && (
          <div className="adm-pants-body">
            <ImageUpload value={pantsImg} onChange={setPantsImg} />
            <div className="field"><label>Trousers price (SAR)</label><input name="pantsPrice" type="number" min="0" defaultValue={piece?.pantsPrice ?? 0} required /></div>
          </div>
        )}
      </div>

      <button className="btn fill" style={{ width: 'max-content' }} type="submit" disabled={saving}>
        {saving ? 'Saving…' : isNew ? 'Create piece' : 'Save changes'}
      </button>
    </form>
  );
}
