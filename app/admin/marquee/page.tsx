'use client';
import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import type { Piece } from '@/lib/types';

export default function MarqueePage() {
  const { data: allPieces, loading: loadingAll } = useAdminFetch<Piece[]>('/pieces');
  const { data: current, loading: loadingCurrent } = useAdminFetch<Piece[]>('/marquee');
  const { call, toast, L, AR } = useAdmin();
  const [selected, setSelected] = useState<Piece[] | null>(null);
  const [addId, setAddId] = useState('');
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (current && selected === null) setSelected(current); }, [current, selected]);

  const loading = loadingAll || loadingCurrent || selected === null;
  const available = (allPieces || []).filter((p) => !(selected || []).some((s) => s.id === p.id));

  const add = () => {
    const p = (allPieces || []).find((x) => x.id === addId);
    if (!p) return;
    setSelected((cur) => [...(cur || []), p]);
    setAddId('');
  };
  const remove = (id: string) => setSelected((cur) => (cur || []).filter((p) => p.id !== id));
  const move = (i: number, d: -1 | 1) => setSelected((cur) => {
    if (!cur) return cur;
    const j = i + d;
    if (j < 0 || j >= cur.length) return cur;
    const next = [...cur];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      await call('/marquee', { method: 'PUT', body: JSON.stringify({ pieceIds: (selected || []).map((p) => p.id) }) });
      toast(L('Saved', 'اتحفظت'));
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  if (loading) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Homepage strip', 'الشريط المتحرك')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('The scrolling strip on the homepage shows only the pieces you pick here, in this order. Empty by default.', 'الشريط المتحرك في الصفحة الرئيسية بيعرض بس القطع اللي تختاريها هنا، بنفس الترتيب. فاضي افتراضيًا.')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <select value={addId} onChange={(e) => setAddId(e.target.value)} style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 14px', fontSize: 12.5, flex: 1 }}>
          <option value="">{L('Choose a piece to add…', 'اختاري قطعة تضيفيها…')}</option>
          {available.map((p) => <option key={p.id} value={p.id}>{p.n} / {p.ar}</option>)}
        </select>
        <button className="btn" type="button" disabled={!addId} onClick={add}>{L('Add', 'إضافة')}</button>
      </div>

      {selected && selected.length ? selected.map((p, i) => (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr auto' }} key={p.id}>
          {p.img ? <img className="thumb" src={abs(p.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{p.n}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{AR() ? p.ar : ''}</div></div>
          <div className="actions" style={{ gap: 10 }}>
            <span onClick={() => move(i, -1)} style={{ opacity: i === 0 ? .3 : 1, cursor: i === 0 ? 'default' : 'pointer' }}>‹</span>
            <span onClick={() => move(i, 1)} style={{ opacity: i === selected.length - 1 ? .3 : 1, cursor: i === selected.length - 1 ? 'default' : 'pointer' }}>›</span>
            <span onClick={() => remove(p.id)}>{L('Remove', 'إزالة')}</span>
          </div>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('Nothing picked yet — the strip is hidden on the site until you add a piece.', 'مفيش حاجة متختارة لسه — الشريط مختفي في الموقع لحد ما تضيفي قطعة.')}</p>}

      <button className="btn fill" style={{ width: 'max-content', marginTop: 24 }} disabled={saving} onClick={save}>
        {saving ? L('Saving…', 'بيتحفظ…') : L('Save order', 'حفظ الترتيب')}
      </button>
    </>
  );
}
