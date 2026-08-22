-- THAJ — Postgres schema (Neon), ported from thaj-site/server/db.js (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pieces ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SAR' CHECK (currency IN ('SAR','EGP'));
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS pants_image TEXT;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS pants_price INTEGER;

CREATE TABLE IF NOT EXISTS journal (
  id TEXT PRIMARY KEY,
  sort INTEGER NOT NULL DEFAULT 0,
  cat_en TEXT, cat_ar TEXT,
  title_en TEXT NOT NULL, title_ar TEXT NOT NULL,
  body_en TEXT DEFAULT '[]',
  body_ar TEXT DEFAULT '[]',
  image TEXT
);

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
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'under_review',
  receipt_key TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  shipping_json TEXT,
  user_id INTEGER REFERENCES users(id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER;
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

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  name TEXT, email TEXT,
  date TEXT, time TEXT, type TEXT, mode TEXT, notes TEXT,
  status TEXT NOT NULL DEFAULT 'Requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
