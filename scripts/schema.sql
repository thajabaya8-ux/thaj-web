-- THAJ — Postgres schema (Neon), ported from thaj-site/server/db.js (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  -- Nullable: a Google-signed-in account never sets one. Every login route
  -- has to branch on this being null rather than assuming it's always set.
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  last_login TIMESTAMPTZ,
  -- Google's stable per-account subject id ("sub" in the id_token) — the
  -- lookup key for Google sign-in, separate from email so a later email
  -- change on the Google side doesn't orphan the link.
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS collections (
  key TEXT PRIMARY KEY,
  sort INTEGER NOT NULL DEFAULT 0,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  ar TEXT NOT NULL,
  line_en TEXT, line_ar TEXT,
  concept_en TEXT, concept_ar TEXT,
  mood_en TEXT, mood_ar TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS pieces (
  id TEXT PRIMARY KEY,
  ed TEXT,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  -- Each piece is priced (and displayed) in exactly one currency, set by
  -- the admin — there is no site-wide SAR/EGP display toggle.
  currency TEXT NOT NULL DEFAULT 'SAR' CHECK (currency IN ('SAR','EGP')),
  coll_key TEXT REFERENCES collections(key),
  fabric TEXT, sil TEXT, colour TEXT, occ TEXT,
  mat_en TEXT, mat_ar TEXT,
  silf_en TEXT, silf_ar TEXT,
  pal_en TEXT, pal_ar TEXT,
  availability TEXT DEFAULT 'Available',
  desc_en TEXT, desc_ar TEXT,
  story_en TEXT DEFAULT '[]',
  story_ar TEXT DEFAULT '[]',
  image TEXT,
  images TEXT DEFAULT '[]',
  pants_image TEXT,
  pants_price INTEGER,
  -- When set (and lower than price), the piece is "on sale" — the
  -- storefront shows price struck through, sale_price as the charged
  -- amount, and a percent-off badge. NULL means no discount.
  sale_price INTEGER,
  -- Whether the piece shows anywhere on the public site at all — separate
  -- from availability, which is about stock, not whether it's published.
  visible BOOLEAN NOT NULL DEFAULT true,
  -- Real, owned quantity. Defaults to 999 (not 0) specifically so this
  -- migration doesn't flip every already-live, already-selling piece to
  -- "out of stock" the moment it runs — the admin sets real numbers per
  -- piece at their own pace afterward.
  stock INTEGER NOT NULL DEFAULT 999,
  -- Units tied up in orders still "Under Review" — counted against
  -- availability (available = stock - reserved) but not yet subtracted
  -- from stock itself, since that only happens for real on Approve.
  reserved INTEGER NOT NULL DEFAULT 0,
  -- Admin-curated pick for the homepage's featured composition. Default
  -- false on purpose: the homepage falls back to auto-picking recent
  -- pieces until the admin has actually chosen any, so this migration
  -- doesn't blank the homepage out for every site that hasn't opted in yet.
  featured BOOLEAN NOT NULL DEFAULT false,
  -- Colour variants: [{id, nameEn, nameAr, hex, images:[...]}]. Same
  -- JSON-in-TEXT convention as `images`/`story_en` above rather than a
  -- separate table — one small, genuinely-repeating field, not
  -- relational data anything else needs to join against. Each colour's
  -- own `images` replaces the piece's single `images` gallery on the
  -- product page once any colours exist; a piece with none keeps
  -- working exactly as before (this is additive, not a replacement).
  colors TEXT NOT NULL DEFAULT '[]',
  -- Which of the standard sizes (see SIZES in lib/siteContext.tsx) this
  -- piece actually comes in — e.g. ["52","54"]. Empty means "every
  -- standard size", the same as every piece before this column existed,
  -- so nothing already live loses size options from this migration.
  sizes TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pieces ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SAR' CHECK (currency IN ('SAR','EGP'));
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS pants_image TEXT;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS pants_price INTEGER;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS sale_price INTEGER;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS colors TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS sizes TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 999;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS reserved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT, email TEXT, phone TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'In atelier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Deposit checkout (Vodafone Cash / InstaPay), everything below in EGP
  -- since those are Egyptian payment rails, regardless of what currency
  -- the shopper was browsing in. `total` above becomes the EGP grand
  -- total (subtotal + shipping) for orders placed through this flow.
  -- Pre-existing orders just never populate these columns.
  subtotal INTEGER,
  -- What subtotal would have been at each item's full (non-sale) price —
  -- frozen at order time, same as subtotal, so a later price/sale change
  -- never rewrites what this order's own thank-you page shows it saved.
  original_subtotal INTEGER,
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'under_review',
  receipt_key TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  shipping_json TEXT,
  user_id INTEGER REFERENCES users(id),
  -- Inventory bookkeeping for this order, both default false so pre-existing
  -- orders (created before stock tracking existed) are inert — they never
  -- reserved or deducted anything real, so cancelling/approving one now
  -- must not touch stock. New orders explicitly set reservation_active =
  -- true in their own INSERT. reservation_active: this order currently
  -- holds a `reserved` claim not yet resolved via approve/reject/cancel.
  -- stock_deducted: this order's items have been permanently subtracted
  -- from stock (via Approve) and not yet restored (via Cancel-after-approve).
  reservation_active BOOLEAN NOT NULL DEFAULT false,
  stock_deducted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_subtotal INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'under_review';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_key TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_json TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT false;

-- The "appointments" table itself (private-room booking, now removed as
-- a feature) is deliberately left in the live database rather than
-- dropped here — schema.sql only ever adds, so removing its CREATE just
-- stops a fresh install from getting one. No app code reads or writes it
-- any more.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Customer comments/requests on a specific piece, surfaced to the admin
-- (e.g. "I'd like this in a size 56"). Not shown back to other visitors.
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  piece_id TEXT NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Egypt's 27 governorates, each with its own admin-set shipping price.
-- Checkout looks the price up here server-side; orders.shipping_fee then
-- freezes that value at creation time, so a later price change here never
-- alters an already-placed order.
CREATE TABLE IF NOT EXISTS governorates (
  key TEXT PRIMARY KEY,
  sort INTEGER NOT NULL DEFAULT 0,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Floating social-links bubble (see components/SocialFab.tsx) — one row
-- per platform, admin-managed: paste the profile/chat URL and flip it
-- active or not. Inactive or empty-URL rows never render on the site.
CREATE TABLE IF NOT EXISTS social_links (
  platform TEXT PRIMARY KEY,
  sort INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT false
);

-- Curated, ordered pick-list for the scrolling piece strip on the homepage
-- hero (see components/... the "hm-strip"). Starts empty on purpose — the
-- admin explicitly chooses what shows there from /admin/marquee, instead
-- of it defaulting to every piece in the catalogue. Removing a piece from
-- the catalogue removes it from here too.
CREATE TABLE IF NOT EXISTS marquee_pieces (
  piece_id TEXT PRIMARY KEY REFERENCES pieces(id) ON DELETE CASCADE,
  sort INTEGER NOT NULL DEFAULT 0
);

-- First-party analytics — powers /admin/analytics. `type` is either
-- 'pageview' or one of the same Meta Pixel event names already fired by
-- lib/pixel.ts's trackPixel() (ViewContent, AddToCart, InitiateCheckout,
-- Purchase, Lead, CompleteRegistration, Contact), so this table is always
-- exactly what's been sent to Meta — no separate tracking plan to keep in
-- sync. Pageviews are logged unconditionally by components/Analytics.tsx
-- regardless of whether a Meta Pixel ID is even configured, since this
-- dashboard has to work on its own either way.
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_path ON analytics_events(type, path);
