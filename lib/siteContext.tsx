'use client';
/* ==========================================================
   THAJ — site context
   Client-side global state: language, cart, wishlist, checkout
   draft, shop filters, and the drawer/search/menu/toast UI state
   that used to live as module-level variables in js/data.js and
   js/app.js. Content (pieces/collections/settings) is fetched
   once server-side (see lib/api.ts) and handed in as the initial
   value here — no client boot-time fetch/flash.
   ========================================================== */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode
} from 'react';
import type {
  CartItem, CheckoutDraft, Collection, CollectionMap, Facets, Order, PaymentMethod, Piece, PieceCurrency, Settings
} from '@/lib/types';
import { trackPixel, trackPurchase } from '@/lib/pixel';

type Lang = 'en' | 'ar';
type AuthRole = 'admin' | 'customer' | null | undefined; // undefined = still checking

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);

const AVAIL_AR: Record<string, string> = {
  Available: 'متوفرة', 'Two remaining': 'باقي قطعتان', 'By request': 'حسب الطلب',
  'Pre-order': 'حجز مسبق', 'Archive only': 'أرشيف فقط', 'Sold Out': 'نفدت الكمية'
};
const FACET_AR: Record<string, string> = {
  All: 'الكل',
  Jacquard: 'جاكار', Crepe: 'كريب', Silk: 'حرير', Voile: 'فوال', Linen: 'كتان', Crinkle: 'كرينكل', Print: 'مطبوع',
  'Straight fall': 'سقوط مستقيم', Column: 'عمودي', 'Fitted placket': 'صدر مضبوط', 'Draped khimar': 'خمار منسدل',
  'Open abaya': 'عباية مفتوحة', 'Three-piece set': 'طقم ثلاث قطع', Cape: 'كاب',
  Black: 'أسود', Blush: 'وردي فاتح', Burgundy: 'خمري', Rose: 'وردي', Olive: 'زيتي', Ivory: 'عاجي',
  Grey: 'رمادي', Tobacco: 'تبغي', Monochrome: 'أبيض وأسود',
  Occasion: 'مناسبات', Everyday: 'يومي', Evening: 'سهرة', Day: 'نهاري', Ramadan: 'رمضان'
};
const STATUS_AR: Record<string, string> = {
  Delivered: 'تم التسليم', 'In atelier': 'في الأتيليه', Cancelled: 'ملغى',
  Requested: 'مطلوب', Confirmed: 'مؤكد', Declined: 'مرفوض',
  'Under Review': 'قيد المراجعة', Preparing: 'بيتجهّز', Shipped: 'اتشحن'
};
const PAYMENT_STATUS_AR: Record<string, string> = { under_review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' };
const PAYMENT_STATUS_EN: Record<string, string> = { under_review: 'Under review', approved: 'Approved', rejected: 'Rejected' };
const PAYMENT_METHOD_LABEL: Record<string, [string, string]> = {
  vodafone_cash: ['Vodafone Cash', 'فودافون كاش'], instapay: ['InstaPay', 'إنستاباي']
};
const AD = '٠١٢٣٤٥٦٧٨٩';

export const SIZES = ['52', '54', '56', '58'];
export const SIZE_MTM = { en: 'Made to measure', ar: 'تفصيل' };

// The price actually charged — the sale price when the piece is on sale,
// the regular price otherwise. serverMappers.pieceOut already guarantees
// salePrice is null unless it's genuinely lower than price.
export const effectivePrice = (p: Piece): number => p.salePrice ?? p.price;

// What's actually purchasable right now — real stock minus whatever's
// tied up in orders still under review (not yet a permanent deduction,
// but still not free to sell to someone else).
export const availableStock = (p: Piece): number => Math.max(0, p.stock - p.reserved);

interface SiteContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  AR: () => boolean;
  L: <T = string>(e?: T, a?: T) => T;
  num: (n: number | string) => string;
  ord: (i: number) => string;
  money: (n: number, currency: PieceCurrency) => string;
  authRole: AuthRole;
  fa: (v: string) => string;
  stLabel: (s: string) => string;
  paymentStatusLabel: (s?: string) => string;
  paymentMethodLabel: (m?: string) => string;
  esc: typeof esc;
  pieces: Piece[];
  collections: CollectionMap;
  settings: Settings;
  orders: Order[];
  byId: (id: string) => Piece | undefined;
  pName: (p: Piece) => string;
  collName: (k: string) => string;
  dateLabel: (iso: string) => string;
  orderItemsLabel: (o: Order) => string;
  AVAIL_AR: typeof AVAIL_AR;
  cart: CartItem[];
  wish: string[];
  cartTotalEgp: number;
  itemPrice: (c: CartItem) => number;
  itemPriceEgp: (c: CartItem) => number;
  egpPerSar: number;
  addToCart: (id: string, size?: string, withPants?: boolean) => void;
  quickAdd: (id: string) => void;
  qty: (i: number, d: number) => void;
  rmItem: (i: number) => void;
  toggleWish: (id: string) => void;
  coData: CheckoutDraft;
  setCoData: React.Dispatch<React.SetStateAction<CheckoutDraft>>;
  coStep: number;
  setCoStep: React.Dispatch<React.SetStateAction<number>>;
  uploadReceipt: (file: File) => Promise<string | null>;
  submitOrder: (paymentMethod: PaymentMethod, receiptKey: string) => Promise<Order | null>;
  submitAppointment: (data: Record<string, string>) => Promise<boolean>;
  submitReview: (pieceId: string, data: { name: string; email?: string; message: string }) => Promise<boolean>;
  acctTab: string;
  setAcctTab: React.Dispatch<React.SetStateAction<string>>;
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
  facets: Facets;
  setFacets: React.Dispatch<React.SetStateAction<Facets>>;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toastMsg: string | null;
  toast: (m: string) => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

interface SiteProviderProps {
  initialPieces?: Piece[];
  initialCollections?: Collection[];
  initialOrders?: Order[];
  initialSettings?: Settings;
  children: ReactNode;
}

export function SiteProvider({ initialPieces, initialCollections, initialOrders, initialSettings, children }: SiteProviderProps) {
  const [lang, setLangState] = useState<Lang>('en');
  const [authRole, setAuthRole] = useState<AuthRole>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [coData, setCoData] = useState<CheckoutDraft>({});
  const [coStep, setCoStep] = useState(0);
  const [acctTab, setAcctTab] = useState('orders');
  const [sort, setSort] = useState('featured');
  const [facets, setFacets] = useState<Facets>({ coll: 'All', fabric: 'All', colour: 'All', occ: 'All', sil: 'All' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pieces = useMemo(() => initialPieces || [], [initialPieces]);
  const collections = useMemo(() => {
    const out: CollectionMap = {};
    (initialCollections || []).forEach((c) => { out[c.key] = c; });
    return out;
  }, [initialCollections]);
  const settings = initialSettings || {};

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Admin-editable rate (Settings → "Egyptian pounds per 1 Saudi riyal"),
  // with a sane fallback if it's never been set. Each piece is priced (and
  // shown) in its own fixed currency, set by the admin — this rate only
  // matters for converting SAR-priced pieces into EGP at checkout, since
  // Vodafone Cash / InstaPay deposits are always collected in EGP.
  const egpPerSar = useMemo(() => {
    const n = parseFloat(settings.egp_per_sar || '');
    return Number.isFinite(n) && n > 0 ? n : 13.5;
  }, [settings.egp_per_sar]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(async (r) => {
      if (cancelled) return;
      if (!r.ok) { setAuthRole(null); return; }
      const body = await r.json();
      setAuthRole(body.role === 'admin' ? 'admin' : 'customer');
    }).catch(() => { if (!cancelled) setAuthRole(null); });
    return () => { cancelled = true; };
  }, []);

  const AR = useCallback(() => lang === 'ar', [lang]);
  const L = useCallback(<T,>(e?: T, a?: T) => ((lang === 'ar' ? a : e) as T), [lang]);
  const num = useCallback((n: number | string) => (AR() ? String(n).replace(/[0-9]/g, (d) => AD[+d]) : String(n)), [AR]);
  const ord = useCallback((i: number) => num(String(i).padStart(2, '0')), [num]);
  // Every piece is priced (and shown) in exactly one fixed currency, set
  // by the admin — there is no site-wide display conversion any more.
  const money = useCallback((n: number, currency: PieceCurrency) => {
    const symbol = currency === 'EGP' ? (AR() ? 'ج.م' : 'EGP') : (AR() ? 'ر.س' : 'SAR');
    return `${(n || 0).toLocaleString('en-US')} ${symbol}`;
  }, [AR]);
  const fa = useCallback((v: string) => esc(AR() ? (FACET_AR[v] || v) : v), [AR]);
  const stLabel = useCallback((s: string) => esc(AR() ? (STATUS_AR[s] || s) : s), [AR]);
  const paymentStatusLabel = useCallback((s?: string) => (s ? (AR() ? PAYMENT_STATUS_AR[s] || s : PAYMENT_STATUS_EN[s] || s) : ''), [AR]);
  const paymentMethodLabel = useCallback((m?: string) => (m && PAYMENT_METHOD_LABEL[m] ? PAYMENT_METHOD_LABEL[m][AR() ? 1 : 0] : (m || '')), [AR]);
  const byId = useCallback((id: string) => pieces.find((p) => p.id === id), [pieces]);
  const pName = useCallback((p: Piece) => esc(L(p.n, p.ar)), [L]);
  const collName = useCallback((k: string) => (collections[k] ? esc(L(collections[k].name, collections[k].nameAr)) : ''), [collections, L]);
  const dateLabel = useCallback((iso: string) => {
    const d = new Date((iso || '').replace(' ', 'T'));
    if (isNaN(d.getTime())) return iso || '';
    return AR()
      ? d.toLocaleDateString('ar-SA', { day: '2-digit', month: 'long', year: 'numeric' })
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [AR]);
  const orderItemsLabel = useCallback((o: Order) => o.items.map((it) => {
    const p = byId(it.id);
    return p ? `${pName(p)} · ${esc(it.size)}` : esc(it.size);
  }).join(L(', ', '، ')), [byId, pName, L]);

  const setLang = useCallback((l: Lang) => setLangState((cur) => (cur === l ? cur : l)), []);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // Piece price, plus trousers if this line selected them and the piece
  // still has that option (protects against a piece's pants offer being
  // removed after something was already added to a cart held in state).
  // Returned in the piece's OWN currency — for per-line display only.
  const itemPrice = useCallback((c: CartItem) => {
    const p = byId(c.pid);
    if (!p) return 0;
    const pants = c.withPants && p.pantsPrice ? p.pantsPrice : 0;
    return effectivePrice(p) + pants;
  }, [byId]);

  // Same line total, converted to EGP — pieces can be individually priced
  // in SAR or EGP, but the deposit/checkout total is always EGP (Vodafone
  // Cash / InstaPay are Egyptian-only rails), so this is what the cart and
  // checkout subtotals are built from, never a raw sum of itemPrice().
  const itemPriceEgp = useCallback((c: CartItem) => {
    const p = byId(c.pid);
    if (!p) return 0;
    const raw = itemPrice(c);
    return p.currency === 'EGP' ? raw : Math.round(raw * egpPerSar);
  }, [byId, itemPrice, egpPerSar]);

  const cartTotalEgp = useMemo(() => cart.reduce((s, c) => s + itemPriceEgp(c) * c.q, 0), [cart, itemPriceEgp]);

  const addToCart = useCallback((id: string, size?: string, withPants?: boolean) => {
    const useSize = size || '54';
    setCart((cur) => {
      const i = cur.findIndex((c) => c.pid === id && c.size === useSize && !!c.withPants === !!withPants);
      if (i > -1) { const next = [...cur]; next[i] = { ...next[i], q: next[i].q + 1 }; return next; }
      return [...cur, { pid: id, size: useSize, q: 1, withPants: !!withPants }];
    });
    setDrawerOpen(true);
    const p = byId(id);
    toast(p ? `${pName(p)}${L(' added', ' اتضافت')}` : L('Added', 'اتضافت'));
    if (p) {
      const value = p.price + (withPants && p.pantsPrice ? p.pantsPrice : 0);
      trackPixel('AddToCart', {
        content_ids: [p.id], content_name: L(p.n, p.ar), content_type: 'product',
        contents: [{ id: p.id, quantity: 1 }], value, currency: p.currency
      });
    }
  }, [byId, pName, L, toast]);

  const quickAdd = useCallback((id: string) => {
    const size = '54';
    setCart((cur) => {
      const i = cur.findIndex((c) => c.pid === id && c.size === size);
      if (i > -1) { const next = [...cur]; next[i] = { ...next[i], q: next[i].q + 1 }; return next; }
      return [...cur, { pid: id, size, q: 1 }];
    });
    setDrawerOpen(true);
    const p = byId(id);
    toast(p ? `${pName(p)}${L(' added · size 54', ' اتضافت · مقاس ٥٤')}` : L('Added', 'اتضافت'));
    if (p) {
      trackPixel('AddToCart', {
        content_ids: [p.id], content_name: L(p.n, p.ar), content_type: 'product',
        contents: [{ id: p.id, quantity: 1 }], value: p.price, currency: p.currency
      });
    }
  }, [byId, pName, L, toast]);

  const qty = useCallback((i: number, d: number) => {
    setCart((cur) => {
      const next = [...cur];
      const q = next[i].q + d;
      if (q < 1) { next.splice(i, 1); } else { next[i] = { ...next[i], q }; }
      return next;
    });
  }, []);
  const rmItem = useCallback((i: number) => setCart((cur) => cur.filter((_, idx) => idx !== i)), []);

  const toggleWish = useCallback((id: string) => {
    setWish((cur) => {
      const has = cur.includes(id);
      toast(has ? L('Removed from archive', 'اتشالت من أرشيفك') : L('Saved to archive', 'اتحفظت في أرشيفك'));
      return has ? cur.filter((x) => x !== id) : [...cur, id];
    });
  }, [L, toast]);

  const uploadReceipt = useCallback(async (file: File) => {
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const r = await fetch('/api/orders/receipt', { method: 'POST', body: fd });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'upload failed');
      return body.receiptKey as string;
    } catch (err) {
      toast(err instanceof Error && err.message !== 'upload failed' ? err.message : L('Could not upload the receipt — try again.', 'معرفناش نرفع الإيصال — جرّبي تاني.'));
      return null;
    }
  }, [L, toast]);

  const submitOrder = useCallback(async (paymentMethod: PaymentMethod, receiptKey: string) => {
    const items = cart.map((c) => ({ id: c.pid, size: c.size, qty: c.q, withPants: !!c.withPants }));
    const name = [coData.fn, coData.ln].filter(Boolean).join(' ');
    const shipping = {
      name: name || coData.fn, phone: coData.phone, governorate: coData.governorate,
      city: coData.city, address: coData.address, notes: coData.notes
    };
    let created: Order | null = null;
    try {
      const r = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, name, email: coData.email, phone: coData.phone, shipping, paymentMethod, receiptKey, egpPerSar })
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'order failed');
      created = body as Order;
      setOrders((cur) => [created!, ...cur]);
      trackPurchase(created);
    } catch (err) {
      toast(err instanceof Error && err.message !== 'order failed' ? err.message : L('Could not reach the server — order not saved.', 'معرفناش نوصل للسيرفر — الطلب ما اتسجّلش.'));
    }
    if (created) { setCart([]); setCoStep(0); setCoData({}); }
    return created;
  }, [cart, coData, egpPerSar, L, toast]);

  const submitAppointment = useCallback(async (data: Record<string, string>) => {
    try {
      const r = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error('appointment failed');
      toast(L('Request received', 'وصلنا طلبك'));
      trackPixel('Lead', { content_name: 'Private Room appointment' });
      return true;
    } catch {
      toast(L('Could not reach the server — try again.', 'معرفناش نوصل للسيرفر — جرّبي تاني.'));
      return false;
    }
  }, [L, toast]);

  const submitReview = useCallback(async (pieceId: string, data: { name: string; email?: string; message: string }) => {
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieceId, ...data })
      });
      if (!r.ok) throw new Error('review failed');
      toast(L('Thank you — your note has reached the atelier.', 'شكرًا — رسالتك وصلت للأتيليه.'));
      trackPixel('Contact', { content_ids: [pieceId], content_type: 'product' });
      return true;
    } catch {
      toast(L('Could not reach the server — try again.', 'معرفناش نوصل للسيرفر — جرّبي تاني.'));
      return false;
    }
  }, [L, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); setDrawerOpen(false); setMenuOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const value: SiteContextValue = {
    lang, setLang, AR, L, num, ord, money, authRole, fa, stLabel, paymentStatusLabel, paymentMethodLabel, esc,
    pieces, collections, settings, orders,
    byId, pName, collName, dateLabel, orderItemsLabel, AVAIL_AR,
    cart, wish, cartTotalEgp, itemPrice, itemPriceEgp, egpPerSar, addToCart, quickAdd, qty, rmItem, toggleWish,
    coData, setCoData, coStep, setCoStep, uploadReceipt, submitOrder, submitAppointment, submitReview,
    acctTab, setAcctTab, sort, setSort, facets, setFacets,
    drawerOpen, setDrawerOpen, searchOpen, setSearchOpen, menuOpen, setMenuOpen,
    toastMsg, toast
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite() must be used within <SiteProvider>');
  return ctx;
}
