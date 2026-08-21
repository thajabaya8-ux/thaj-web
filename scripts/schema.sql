-- THAJ — Postgres schema (Neon), ported from thaj-site/server/db.js (SQLite)

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
