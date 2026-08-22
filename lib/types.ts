/* ==========================================================
   THAJ — shared domain types
   Mirrors the shapes returned by the Express/SQLite API
   (thaj-site/server/mappers.js) and consumed across the site
   and admin panel.
   ========================================================== */

export type PieceCurrency = 'SAR' | 'EGP';

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

export interface JournalArticle {
  id: string;
  cat: string;
  catAr: string;
  t: string;
  tAr: string;
  x: string[];
  xAr: string[];
  img: string;
}

export interface OrderLineItem {
  id: string;
  size: string;
  qty?: number;
  withPants?: boolean;
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

export interface Appointment {
  id: string | number;
  name: string;
  email?: string;
  date?: string;
  time?: string;
  type?: string;
  mode?: string;
  status: string;
  notes?: string;
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
  appointmentsPending: number;
  collectionProgress: CollectionProgress[];
  revenueByMonth: RevenueMonth[];
  recentOrders: Order[];
  recentAppointments: Appointment[];
}
