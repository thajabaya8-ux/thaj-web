/* ==========================================================
   THAJ — shared domain types
   Mirrors the shapes returned by the Express/SQLite API
   (thaj-site/server/mappers.js) and consumed across the site
   and admin panel.
   ========================================================== */

export type PieceCurrency = 'SAR' | 'EGP';

export interface PieceColor {
  id: string;
  nameEn: string;
  nameAr: string;
  hex: string;
  images: string[];
}

export interface Piece {
  id: string;
  n: string;
  ar: string;
  ed: string;
  price: number;
  currency: PieceCurrency;
  coll: string;
  fabric: string;
  colour: string;
  occ: string;
  sil: string;
  av: string;
  mat: string;
  matAr: string;
  silf: string;
  silfAr: string;
  pal: string;
  palAr: string;
  d: string;
  dAr: string;
  story: string[];
  storyAr: string[];
  img: string;
  images: string[];
  pantsImg: string | null;
  pantsPrice: number | null;
  salePrice: number | null;
  visible: boolean;
  stock: number;
  // Units tied up in orders still under review — not yet a permanent
  // deduction. available = stock - reserved is what's actually purchasable.
  reserved: number;
  // Admin-curated pick for the homepage's featured composition.
  featured: boolean;
  // Colour variants, each with its own photo set — see PieceColor.
  // Empty for a piece that doesn't offer a colour choice.
  colors: PieceColor[];
  // Which standard sizes (SIZES in lib/siteContext.tsx) this piece comes
  // in. Empty means "every standard size" — the pre-existing behaviour
  // every piece had before this field existed.
  sizes: string[];
}

export interface Collection {
  key: string;
  name: string;
  nameAr: string;
  ar: string;
  line: string;
  lineAr: string;
  concept: string;
  conceptAr: string;
  mood: string;
  moodAr: string;
  img: string;
}

export type CollectionMap = Record<string, Collection>;

export interface OrderLineItem {
  id: string;
  size: string;
  qty?: number;
  withPants?: boolean;
  // The chosen PieceColor's id, if the piece offers colours.
  color?: string;
}

export type PaymentMethod = 'vodafone_cash' | 'instapay';
export type PaymentStatus = 'under_review' | 'approved' | 'rejected';

export interface Governorate {
  key: string;
  name: string;
  nameAr: string;
  price: number;
  active: boolean;
}

export type SocialPlatform = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok' | 'twitter' | 'snapchat' | 'youtube' | 'pinterest';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  active: boolean;
}

export interface ShippingInfo {
  name?: string;
  phone?: string;
  governorate?: string;
  governorateName?: string;
  governorateNameAr?: string;
  city?: string;
  address?: string;
  notes?: string;
}

export interface Order {
  id?: string | number;
  n: string;
  d: string;
  tot: number;
  st: string;
  name?: string;
  email?: string;
  phone?: string;
  items: OrderLineItem[];
  // Deposit checkout (EGP) — undefined on pre-existing orders that predate it.
  subtotal?: number;
  shippingFee?: number;
  depositAmount?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  shipping?: ShippingInfo;
  hasReceipt?: boolean;
}


export interface Settings {
  hero_eyebrow_en?: string;
  hero_eyebrow_ar?: string;
  hero_title_en?: string;
  hero_title_ar?: string;
  contact_email?: string;
  contact_location_en?: string;
  contact_location_ar?: string;
  egp_per_sar?: string;
  deposit_percent?: string;
  vodafone_cash_number?: string;
  vodafone_cash_name?: string;
  instapay_handle?: string;
  instapay_name?: string;
  admin_whatsapp_number?: string;
  meta_pixel_id?: string;
  meta_capi_token?: string;
  [key: string]: string | undefined;
}

export interface CartItem {
  pid: string;
  size: string;
  q: number;
  withPants?: boolean;
  color?: string;
}

export interface Review {
  id: number;
  pieceId: string;
  pieceName?: string;
  pieceNameAr?: string;
  name: string;
  email?: string;
  message: string;
  d: string;
}

export interface Facets {
  coll: string;
  fabric: string;
  colour: string;
  occ: string;
  sil: string;
}

export interface CheckoutDraft {
  fn?: string;
  ln?: string;
  email?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  address?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export interface AdminUser {
  email: string;
}

export type CustomerStatus = 'active' | 'suspended';

export interface Customer {
  id: number;
  name: string | null;
  email: string;
  status: CustomerStatus;
  createdAt: string;
  lastLogin: string | null;
}

export interface CollectionProgress {
  key: string;
  name: string;
  count: number;
  pct: number;
}

export interface RevenueMonth {
  month: string;
  total: number;
}

export interface DashboardData {
  pieces: number;
  collections: number;
  ordersPending: number;
  collectionProgress: CollectionProgress[];
  revenueByMonth: RevenueMonth[];
  recentOrders: Order[];
}
