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
  CartItem, CheckoutDraft, Collection, CollectionMap, Facets, Order, PaymentMethod, Piece, PieceColor, PieceCurrency, Settings
} from '@/lib/types';
import { trackPixel, trackPurchase } from '@/lib/pixel';
import { trackEvent } from '@/lib/analytics';

type Lang = 'en' | 'ar';

// Shared with lib/adminContext.tsx — the site and the admin panel are
// separate route trees (never mounted together) with their own language
// state, so this is how one's choice reaches the other: whichever was
// changed most recently, written here, is what the other reads on mount.
const LANG_KEY = 'thaj-lang';
const CART_KEY = 'thaj-cart';
const WISH_KEY = 'thaj-wish';
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

// Height in cm, not a garment size — how abaya length is actually chosen
// in Egypt, not the Saudi dress-size numbers this used to hold. Every
// single centimetre from 150 to 180, not 5cm bands — a height is an
// exact match now, not a range someone has to be told they fall inside.
export const SIZES = Array.from({ length: 31 }, (_, i) => String(150 + i));

// The price actually charged — the sale price when the piece is on sale,
// the regular price otherwise. serverMappers.pieceOut already guarantees
// salePrice is null unless it's genuinely lower than price.
export const effectivePrice = (p: Piece): number => p.salePrice ?? p.price;

// A colour's own available units — same stock-minus-reserved shape as
// the piece level, just scoped to one colour's own pool.
export const colorAvailable = (c: PieceColor): number => Math.max(0, c.stock - c.reserved);
// Either the admin's manual override or the computed count hitting zero
// is enough to show this colour as sold out.
export const colorSoldOut = (c: PieceColor): boolean => c.soldOut || colorAvailable(c) <= 0;

// What's actually purchasable right now — real stock minus whatever's
// tied up in orders still under review (not yet a permanent deduction,
// but still not free to sell to someone else). Once a piece has colour
// variants, its stock lives per-colour, not on the piece itself, so the
// piece is only fully sold out when every one of its colours is.
export const availableStock = (p: Piece): number =>
  p.colors.length ? p.colors.reduce((s, c) => s + colorAvailable(c), 0) : Math.max(0, p.stock - p.reserved);

interface SiteContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  AR: () => boolean;
  L: <T = string>(e?: T, a?: T) => T;
  num: (n: number | string) => string;
  ord: (i: number) => string;
  money: (n: number, currency: PieceCurrency) => string;
  authRole: AuthRole;
  logout: () => Promise<void>;
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
  addToCart: (id: string, size?: string, withPants?: boolean, color?: string) => void;
  qty: (i: number, d: number) => void;
  rmItem: (i: number) => void;
  toggleWish: (id: string) => void;
  coData: CheckoutDraft;
  setCoData: React.Dispatch<React.SetStateAction<CheckoutDraft>>;
  coStep: number;
  setCoStep: React.Dispatch<React.SetStateAction<number>>;
  uploadReceipt: (file: File) => Promise<string | null>;
  submitOrder: (paymentMethod: PaymentMethod, receiptKey: string, govName?: string, govNameAr?: string) => Promise<Order | null>;
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
  initialSettings?: Settings;
  children: ReactNode;
}

export function SiteProvider({ initialPieces, initialCollections, initialSettings, children }: SiteProviderProps) {
  const [lang, setLangState] = useState<Lang>('en');
  const [authRole, setAuthRole] = useState<AuthRole>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

  // Picks up a language choice made in the admin panel (or a previous
  // visit) on mount. Deferred to an effect rather than read into the
  // initial state, since the server always renders the 'en' default and
  // reading localStorage synchronously there would mismatch it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === 'ar' || saved === 'en') setLangState(saved);
    } catch { /* localStorage unavailable — keep the default */ }
  }, []);

  // Cart and wishlist previously lived in plain useState with nothing
  // backing it — a refresh (or just closing the tab) silently emptied
  // both. Same deferred-read pattern as language above, so the server's
  // first render (always empty) isn't mismatched by the client's.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedWish = localStorage.getItem(WISH_KEY);
      if (savedWish) setWish(JSON.parse(savedWish));
    } catch { /* localStorage unavailable, or saved JSON was malformed — keep empty */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* best-effort */ }
  }, [cart]);
  useEffect(() => {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); } catch { /* best-effort */ }
  }, [wish]);

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

  // Only once we know someone's actually signed in — this used to be
  // seeded for every visitor from a server-side fetch of the 100 most
  // recent orders across the whole site (see the removed getOrders() in
  // lib/api.ts), which meant anyone landing on /account saw everyone's
  // order history, not just their own. /api/account/orders is scoped to
  // the session's own user.
  useEffect(() => {
    if (!authRole) return;
    let cancelled = false;
    fetch('/api/account/orders', { credentials: 'same-origin' }).then(async (r) => {
      if (cancelled || !r.ok) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders(await r.json());
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [authRole]);

  // A hard navigation, not a client-side route change — /account and
  // /wishlist are server-side gated (proxy.ts), so this has to actually
  // leave the page rather than just resetting local state, or a stale
  // client-rendered view of a now-inaccessible page could stick around.
  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch { /* best-effort */ }
    window.location.href = '/';
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

  const setLang = useCallback((l: Lang) => {
    setLangState((cur) => (cur === l ? cur : l));
    try { localStorage.setItem(LANG_KEY, l); } catch { /* best-effort */ }
  }, []);

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

  const addToCart = useCallback((id: string, size?: string, withPants?: boolean, color?: string) => {
    const useSize = size || '160';
    setCart((cur) => {
      const i = cur.findIndex((c) => c.pid === id && c.size === useSize && !!c.withPants === !!withPants && (c.color || undefined) === (color || undefined));
      if (i > -1) { const next = [...cur]; next[i] = { ...next[i], q: next[i].q + 1 }; return next; }
      return [...cur, { pid: id, size: useSize, q: 1, withPants: !!withPants, color: color || undefined }];
    });
    setDrawerOpen(true);
    const p = byId(id);
    toast(p ? `${pName(p)}${L(' added', ' اتضافت')}` : L('Added', 'اتضافت'));
    if (p) {
      const value = p.price + (withPants && p.pantsPrice ? p.pantsPrice : 0);
      trackPixel('AddToCart', {
        content_ids: [p.id], content_name: L(p.n, p.ar), content_type: 'product',
        contents: [{ id: p.id, quantity: 1 }], value, currency: p.currency,
        size: useSize, color: color || null, with_pants: !!withPants
      });
    }
  }, [byId, pName, L, toast]);

  // Reads the target item from `cart` directly (not inside the setCart
  // updater) so trackEvent() — a side effect — never runs from within a
  // state updater function, which React expects to stay pure.
  const qty = useCallback((i: number, d: number) => {
    const item = cart[i];
    if (!item) return;
    const q = item.q + d;
    const p = byId(item.pid);
    trackEvent('UpdateQuantity', {
      product_id: item.pid, product_name: p ? pName(p) : item.pid, size: item.size, color: item.color || null,
      previous_quantity: item.q, new_quantity: Math.max(0, q), direction: d > 0 ? 'increase' : 'decrease'
    });
    setCart((cur) => {
      const next = [...cur];
      if (q < 1) { next.splice(i, 1); } else { next[i] = { ...next[i], q }; }
      return next;
    });
  }, [cart, byId, pName]);
  const rmItem = useCallback((i: number) => {
    const item = cart[i];
    if (item) {
      const p = byId(item.pid);
      trackEvent('RemoveFromCart', {
        product_id: item.pid, product_name: p ? pName(p) : item.pid, size: item.size, color: item.color || null, quantity: item.q
      });
    }
    setCart((cur) => cur.filter((_, idx) => idx !== i));
  }, [cart, byId, pName]);

  const toggleWish = useCallback((id: string) => {
    setWish((cur) => {
      const has = cur.includes(id);
      toast(has ? L('Removed from archive', 'اتشالت من أرشيفك') : L('Saved to archive', 'اتحفظت في أرشيفك'));
      const p = byId(id);
      trackEvent(has ? 'RemoveFromWishlist' : 'AddToWishlist', { product_id: id, product_name: p ? pName(p) : id });
      return has ? cur.filter((x) => x !== id) : [...cur, id];
    });
  }, [L, toast, byId, pName]);

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

  const submitOrder = useCallback(async (paymentMethod: PaymentMethod, receiptKey: string, govName?: string, govNameAr?: string) => {
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
      // The order-tracking-by-number API deliberately strips name/phone/
      // shipping (it's a public bearer-token lookup, not just this
      // customer's own view) — so the printable waybill on the confirm
      // page reads its details from here instead: this is the one moment
      // this browser tab legitimately still has them, right after typing
      // them in. sessionStorage, not localStorage — gone once the tab
      // closes, and never touches the server.
      try {
        sessionStorage.setItem('thaj-last-order-shipping', JSON.stringify({
          orderNumber: created.n, name: shipping.name, phone: shipping.phone,
          govName, govNameAr, city: shipping.city, address: shipping.address, notes: shipping.notes
        }));
      } catch { /* best-effort */ }
    } catch (err) {
      toast(err instanceof Error && err.message !== 'order failed' ? err.message : L('Could not reach the server — order not saved.', 'معرفناش نوصل للسيرفر — الطلب ما اتسجّلش.'));
    }
    if (created) { setCart([]); setCoStep(0); setCoData({}); }
    return created;
  }, [cart, coData, egpPerSar, L, toast]);

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
    lang, setLang, AR, L, num, ord, money, authRole, logout, fa, stLabel, paymentStatusLabel, paymentMethodLabel, esc,
    pieces, collections, settings, orders,
    byId, pName, collName, dateLabel, orderItemsLabel, AVAIL_AR,
    cart, wish, cartTotalEgp, itemPrice, itemPriceEgp, egpPerSar, addToCart, qty, rmItem, toggleWish,
    coData, setCoData, coStep, setCoStep, uploadReceipt, submitOrder, submitReview,
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
