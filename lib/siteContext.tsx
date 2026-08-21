'use client';
/* ==========================================================
   THAJ — site context
   Client-side global state: language, cart, wishlist, checkout
   draft, shop filters, and the drawer/search/menu/toast UI state
   that used to live as module-level variables in js/data.js and
   js/app.js. Content (pieces/collections/journal/settings) is
   fetched once server-side (see lib/api.ts) and handed in as the
   initial value here — no client boot-time fetch/flash.
   ========================================================== */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode
} from 'react';
import type {
  CartItem, CheckoutDraft, Collection, CollectionMap, Facets, JournalArticle, Order, Piece, Settings
} from '@/lib/types';

type Lang = 'en' | 'ar';

const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);

const AVAIL_AR: Record<string, string> = {
  Available: 'متوفرة', 'Two remaining': 'باقي قطعتان', 'By request': 'حسب الطلب',
  'Pre-order': 'حجز مسبق', 'Archive only': 'أرشيف فقط'
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
  Requested: 'مطلوب', Confirmed: 'مؤكد', Declined: 'مرفوض'
};
const AD = '٠١٢٣٤٥٦٧٨٩';

export const SIZES = ['52', '54', '56', '58'];
export const SIZE_MTM = { en: 'Made to measure', ar: 'تفصيل' };

interface SiteContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  AR: () => boolean;
  L: <T = string>(e?: T, a?: T) => T;
  num: (n: number | string) => string;
  ord: (i: number) => string;
  SAR: (n: number) => string;
  fa: (v: string) => string;
  stLabel: (s: string) => string;
  esc: typeof esc;
  pieces: Piece[];
  collections: CollectionMap;
  journal: JournalArticle[];
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
  cartTotal: number;
  addToCart: (id: string, size?: string) => void;
  quickAdd: (id: string) => void;
  qty: (i: number, d: number) => void;
  rmItem: (i: number) => void;
  toggleWish: (id: string) => void;
  coData: CheckoutDraft;
  setCoData: React.Dispatch<React.SetStateAction<CheckoutDraft>>;
  coStep: number;
  setCoStep: React.Dispatch<React.SetStateAction<number>>;
  submitOrder: () => Promise<boolean>;
  submitAppointment: (data: Record<string, string>) => Promise<boolean>;
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
  initialJournal?: JournalArticle[];
  initialOrders?: Order[];
  initialSettings?: Settings;
  children: ReactNode;
}

export function SiteProvider({ initialPieces, initialCollections, initialJournal, initialOrders, initialSettings, children }: SiteProviderProps) {
  const [lang, setLangState] = useState<Lang>('en');
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
  const journal = initialJournal || [];
  const settings = initialSettings || {};

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const AR = useCallback(() => lang === 'ar', [lang]);
  const L = useCallback(<T,>(e?: T, a?: T) => ((lang === 'ar' ? a : e) as T), [lang]);
  const num = useCallback((n: number | string) => (AR() ? String(n).replace(/[0-9]/g, (d) => AD[+d]) : String(n)), [AR]);
  const ord = useCallback((i: number) => num(String(i).padStart(2, '0')), [num]);
  const SAR = useCallback((n: number) => (AR() ? `${(n || 0).toLocaleString('en-US')} ر.س` : `${(n || 0).toLocaleString('en-US')} SAR`), [AR]);
  const fa = useCallback((v: string) => esc(AR() ? (FACET_AR[v] || v) : v), [AR]);
  const stLabel = useCallback((s: string) => esc(AR() ? (STATUS_AR[s] || s) : s), [AR]);
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

  const cartTotal = useMemo(() => cart.reduce((s, c) => {
    const p = byId(c.pid);
    return s + (p ? p.price * c.q : 0);
  }, 0), [cart, byId]);

  const addToCart = useCallback((id: string, size?: string) => {
    const useSize = size || '54';
    setCart((cur) => {
      const i = cur.findIndex((c) => c.pid === id && c.size === useSize);
      if (i > -1) { const next = [...cur]; next[i] = { ...next[i], q: next[i].q + 1 }; return next; }
      return [...cur, { pid: id, size: useSize, q: 1 }];
    });
    setDrawerOpen(true);
    const p = byId(id);
    toast(p ? `${pName(p)}${L(' added', ' اتضافت')}` : L('Added', 'اتضافت'));
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

  const submitOrder = useCallback(async () => {
    const items = cart.map((c) => ({ id: c.pid, size: c.size, qty: c.q }));
    const name = [coData.fn, coData.ln].filter(Boolean).join(' ');
    let ok = true;
    try {
      const r = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, name, email: coData.email, phone: coData.phone })
      });
      if (!r.ok) throw new Error('order failed');
      const order = await r.json();
      setOrders((cur) => [order, ...cur]);
    } catch {
      ok = false;
      toast(L('Could not reach the server — order not saved.', 'معرفناش نوصل للسيرفر — الطلب ما اتسجّلش.'));
    }
    setCart([]); setCoStep(0); setCoData({});
    return ok;
  }, [cart, coData, L, toast]);

  const submitAppointment = useCallback(async (data: Record<string, string>) => {
    try {
      const r = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error('appointment failed');
      toast(L('Request received', 'وصلنا طلبك'));
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
    lang, setLang, AR, L, num, ord, SAR, fa, stLabel, esc,
    pieces, collections, journal, settings, orders,
    byId, pName, collName, dateLabel, orderItemsLabel, AVAIL_AR,
    cart, wish, cartTotal, addToCart, quickAdd, qty, rmItem, toggleWish,
    coData, setCoData, coStep, setCoStep, submitOrder, submitAppointment,
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
