'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, abs } from '@/lib/adminContext';
import { availableStock } from '@/lib/siteContext';
import type { Collection, Piece } from '@/lib/types';

// Below this many pieces left, the stock pill reads "Low stock" instead
// of plain "In stock" — a simple fixed threshold, not yet an admin
// setting.
const LOW_STOCK = 3;

export default function CategoryPiecesPage() {
  const { key } = useParams<{ key: string }>();
  const { data: collections, loading: loadingColls } = useAdminFetch<Collection[]>('/collections');
  const { data: pieces, loading: loadingPieces, reload } = useAdminFetch<Piece[]>('/pieces');
  const { call, toast, L, AR } = useAdmin();
  const router = useRouter();

  const collection = collections?.find((c) => c.key === key);
  const inCategory = (pieces || []).filter((p) => p.coll === key);

  const onDelete = async (id: string) => {
    if (!confirm(L('Delete this piece? This cannot be undone.', 'تحذفي القطعة دي؟ الخطوة دي ما بترجعش.'))) return;
    try { await call(`/pieces/${id}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسحت')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  const onToggleVisible = async (p: Piece) => {
    try {
      await call(`/pieces/${p.id}`, { method: 'PUT', body: JSON.stringify({ visible: !p.visible }) });
      toast(p.visible ? L('Hidden from the site', 'اتخفت من الموقع') : L('Now showing on the site', 'بقت ظاهرة في الموقع'));
      reload();
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  const onToggleFeatured = async (p: Piece) => {
    try {
      await call(`/pieces/${p.id}`, { method: 'PUT', body: JSON.stringify({ featured: !p.featured }) });
      toast(p.featured ? L('Removed from the homepage', 'اتشالت من الصفحة الرئيسية') : L('Now featured on the homepage', 'بقت ظاهرة في الصفحة الرئيسية'));
      reload();
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  const onDeleteCategory = async () => {
    if (!confirm(L('Delete this category? It must have no pieces assigned.', 'تحذفي الفئة دي؟ لازم متكونش فيها قطع.'))) return;
    try { await call(`/collections/${key}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسحت')); router.push('/admin/collections'); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loadingColls || loadingPieces) return null;
  if (!collection) return <p className="body" style={{ padding: '26px 0' }}>{L('Category not found.', 'الفئة مش موجودة.')}</p>;

  return (
    <>
      <div className="adm-head">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {collection.img ? <img className="thumb" src={abs(collection.img)} alt="" style={{ width: 50 }} /> : null}
          <div>
            <h1>{AR() ? collection.nameAr : collection.name}</h1>
            <Link className="link" href="/admin/collections">{L('← All categories', '← كل الفئات')}</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn" href={`/admin/collections/${key}/edit`}>{L('Edit category', 'تعديل الفئة')}</Link>
          <button className="btn" onClick={onDeleteCategory}>{L('Delete category', 'حذف الفئة')}</button>
          <Link className="btn fill" href={`/admin/pieces/new?coll=${key}`}>{L('Add piece', 'إضافة قطعة')}</Link>
        </div>
      </div>

      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto' }}>
        <span></span><span>{L('Piece', 'القطعة')}</span><span>{L('Price', 'السعر')}</span><span>{L('Availability', 'التوفر')}</span><span>{L('Stock', 'المخزون')}</span><span></span>
      </div>
      {inCategory.length ? inCategory.map((p) => {
        const avail = availableStock(p);
        const stockPill = avail <= 0 ? 'bad' : avail <= LOW_STOCK ? 'g' : 'ok';
        const stockLabel = avail <= 0 ? L('Out of stock', 'نفدت الكمية') : avail <= LOW_STOCK ? L('Low stock', 'مخزون قليل') : L('In stock', 'متوفرة');
        return (
        <div className="adm-row" style={{ gridTemplateColumns: '50px 2fr 1fr 1fr 1fr auto', opacity: p.visible ? 1 : .55 }} key={p.id}>
          {p.img ? <img className="thumb" src={abs(p.img)} alt="" /> : <span className="thumb" style={{ display: 'block', background: 'var(--sand)' }} />}
          <div><div className="h-s" style={{ fontSize: 15 }}>{p.n}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{p.ed ? `${p.ed} · ` : ''}{p.ar}{p.pantsImg ? ` · ${L('+ trousers', '+ بنطلون')}` : ''}{!p.visible ? ` · ${L('hidden', 'مخفية')}` : ''}{p.featured ? ` · ${L('featured', 'مميزة')}` : ''}</div></div>
          <span>
            {p.salePrice != null ? (<><span className="price-strike">{p.price.toLocaleString('en-US')}</span> {p.salePrice.toLocaleString('en-US')}</>) : p.price.toLocaleString('en-US')} {p.currency}
          </span>
          <span className={`pill ${p.av === 'Available' ? '' : 'g'}`}>{p.av}</span>
          <span className={`pill ${stockPill}`} title={p.reserved ? L(`${p.reserved} reserved by pending orders`, `${p.reserved} محجوزة لطلبات قيد المراجعة`) : ''}>
            {p.stock} {AR() ? '' : '·'} {stockLabel}
          </span>
          <div className="actions">
            <span onClick={() => onToggleVisible(p)}>{p.visible ? L('Hide', 'إخفاء') : L('Show', 'إظهار')}</span>
            <span onClick={() => onToggleFeatured(p)}>{p.featured ? L('Unfeature', 'إلغاء التمييز') : L('Feature', 'تمييز')}</span>
            <Link href={`/admin/pieces/${p.id}/edit`}>{L('Edit', 'تعديل')}</Link>
            <span onClick={() => onDelete(p.id)}>{L('Delete', 'حذف')}</span>
          </div>
        </div>
        );
      }) : (
        <p className="body" style={{ padding: '26px 0' }}>
          {L('No pieces in this category yet.', 'مافيش قطع في الفئة دي لسه.')} <Link className="link" href={`/admin/pieces/new?coll=${key}`}>{L('Add the first one', 'ضيفي أول واحدة')}</Link>
        </p>
      )}
    </>
  );
}
