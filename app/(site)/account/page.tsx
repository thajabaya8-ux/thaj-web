'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { SIZES } from '@/lib/siteContext';
import ProductCard from '@/components/ProductCard';
import Mast from '@/components/Mast';

function AccOrders() {
  const { L, orders, dateLabel, orderItemsLabel, stLabel, money, esc } = useSite();
  if (!orders.length) {
    return (
      <p className="body">{L('No orders yet.', 'مافيش طلبات لسه.')} <Link className="link" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link></p>
    );
  }
  return (
    <>
      <div className="orow orow-head" style={{ borderBottom: '1px solid var(--line)' }}>
        {[L('Order', 'الطلب'), L('Date', 'التاريخ'), L('Pieces', 'القطع'), L('Status', 'الحالة')].map((h) => (
          <span className="lbl" style={{ color: 'var(--ink-faint)' }} key={h}>{h}</span>
        ))}
      </div>
      {orders.map((o) => (
        <Link className="orow" href={`/checkout/confirm?order=${encodeURIComponent(o.n)}`} key={o.n}>
          <div><div className="on">{o.n.split('-').pop()}</div><div className="lbl" style={{ color: 'var(--ink-faint)', marginTop: 5 }}>{esc(o.n)}</div></div>
          <div className="body" style={{ fontSize: 12 }}>{dateLabel(o.d)}</div>
          <div className="body" style={{ fontSize: 12 }}>{orderItemsLabel(o)}<br /><b style={{ fontFamily: 'var(--display)', fontSize: 14, color: 'var(--ink)' }}>{money(o.tot, 'EGP')}</b></div>
          <div><span className={`pill ${o.st === 'Delivered' ? '' : 'g'}`}>{stLabel(o.st)}</span></div>
        </Link>
      ))}
    </>
  );
}

function AccPieces() {
  const { L, byId } = useSite();
  const owned = ['najma', 'zaytoon', 'tibr'].map(byId).filter(Boolean);
  return (
    <>
      <p className="body" style={{ marginBottom: 26 }}>{L('Pieces held in your name, with their edition numbers.', 'القطع المسجّلة باسمك، بأرقام إصداراتها.')}</p>
      <div className="grid-shop" style={{ gridTemplateColumns: 'repeat(12,1fr)' }}>
        {owned.map((p) => <div className="acct-tile" style={{ gridColumn: 'span 4' }} key={p!.id}><ProductCard piece={p} /></div>)}
      </div>
    </>
  );
}

function AccSaved() {
  const { L, wish, byId } = useSite();
  if (!wish.length) {
    return <p className="body">{L('Nothing saved yet.', 'مافيش حاجة محفوظة لسه.')} <Link className="link" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link></p>;
  }
  return (
    <div className="grid-shop" style={{ gridTemplateColumns: 'repeat(12,1fr)' }}>
      {wish.map((id) => { const p = byId(id); return p ? <div className="acct-tile" style={{ gridColumn: 'span 4' }} key={id}><ProductCard piece={p} /></div> : null; })}
    </div>
  );
}

function AccInfo() {
  const { L, toast } = useSite();
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); toast(L('Saved', 'اتحفظ')); }}>
      <div className="f2">
        <div className="field"><label>{L('First name', 'الاسم الأول')}</label><input defaultValue={L('Client', 'عميلة')} /></div>
        <div className="field"><label>{L('Last name', 'اسم العائلة')}</label><input defaultValue={L('of the house', 'الدار')} /></div>
      </div>
      <div className="field"><label>{L('Email', 'الإيميل')}</label><input defaultValue="you@domain.com" /></div>
      <div className="field"><label>{L('Phone', 'الموبايل')}</label><input defaultValue="+966" /></div>
      <div className="f2">
        <div className="field"><label>{L('Preferred height', 'الطول المفضّل')}</label><select>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label>{L('Language', 'اللغة')}</label><select><option>English</option><option>العربية</option></select></div>
      </div>
      <button className="btn" style={{ width: 'max-content' }} type="submit">{L('Save', 'حفظ')}</button>
    </form>
  );
}

function AccAddr() {
  const { L, toast } = useSite();
  const rows: [string, string, string][] = [
    [L('Home', 'المنزل'), L('Riyadh · Al Olaya · Building 12', 'الرياض · العليا · مبنى ١٢'), L('Default', 'الافتراضي')],
    [L('Atelier pickup', 'استلام من الأتيليه'), L('THAJ atelier · by appointment', 'أتيليه ثاج · بموعد'), '']
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {rows.map(([t, a, tag]) => (
        <div style={{ border: '1px solid var(--line)', padding: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }} key={t}>
          <div><div className="h-s">{t}</div><p className="body" style={{ fontSize: 12.5, marginTop: 8 }}>{a}</p></div>
          {tag ? <span className="pill g" style={{ height: 'max-content' }}>{tag}</span> : null}
        </div>
      ))}
      <button className="btn" style={{ width: 'max-content' }} onClick={() => toast(L('Address form', 'نموذج عنوان'))}>{L('Add address', 'إضافة عنوان')}</button>
    </div>
  );
}

type TabKey = 'orders' | 'pieces' | 'saved' | 'info' | 'addr';

export default function AccountPage() {
  const { L, acctTab, setAcctTab, logout } = useSite();
  const tabs: [TabKey, string, () => React.ReactElement][] = [
    ['orders', L('Orders', 'الطلبات'), AccOrders],
    ['pieces', L('My pieces', 'قطعي'), AccPieces],
    ['saved', L('My archive', 'أرشيفي'), AccSaved],
    ['info', L('Personal', 'بياناتي'), AccInfo],
    ['addr', L('Addresses', 'العناوين'), AccAddr]
  ];
  const Active = (tabs.find(([k]) => k === acctTab) || tabs[0])[2];

  return (
    <>
      <Mast
        label={L('My THAJ', 'حسابي في ثاج')}
        title={L('Your house record', 'سجلّك في الدار')}
        desc={L('Orders, pieces held in your name, and your saved archive.', 'طلباتك، والقطع المسجّلة باسمك، وأرشيفك المحفوظ.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="acct">
          <div className="side rv">
            {tabs.map(([k, label]) => (
              <button key={k} className={acctTab === k ? 'on' : ''} onClick={() => setAcctTab(k)}>{label}</button>
            ))}
            <button onClick={logout} style={{ color: 'var(--ink-faint)' }}>{L('Log out', 'تسجيل الخروج')}</button>
          </div>
          <div className="rv"><Active /></div>
        </div>
      </section>
    </>
  );
}
