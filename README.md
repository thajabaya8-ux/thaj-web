# THAJ — web (Next.js 16 + React 19)

The THAJ public site and admin panel, rebuilt in Next.js (App Router) + React. This is the front-end only — it talks to the existing Express + SQLite API in the sibling `thaj-site/` project over `/api/*` and `/assets/*`, proxied transparently via `next.config.mjs` rewrites so the browser only ever sees one origin.

## Running it

Two servers, both required:

```bash
# terminal 1 — the API (from the thaj-site/ project)
cd ../thaj-site
npm run dev            # → http://localhost:8000

# terminal 2 — this app
cd thaj-web
npm install
npm run dev             # → http://localhost:3000
```

- Public site: `http://localhost:3000/`
- Admin panel: `http://localhost:3000/admin` — same credentials as `thaj-site/.env`.

`.env.local` points this app at the API (`EXPRESS_API_URL`, defaults to `http://localhost:8000`) — only needed server-side, since the browser never talks to port 8000 directly.

## Structure

```
thaj-web/
├── app/
│   ├── layout.js              minimal root shell — just <html>/<body> + design tokens
│   ├── globals.css             copied from thaj-site/css/style.css — same design system
│   ├── (site)/                 the public site (route group — doesn't affect URLs)
│   │   ├── layout.js            header/footer/drawer/search/curtain + SiteProvider
│   │   ├── page.js               home, and one folder per route (shop/, product/[id]/, …)
│   └── admin/
│       ├── layout.js             imports admin.css, wraps in AdminProvider + AdminGate
│       ├── admin.css              copied from thaj-site/admin/css/admin.css
│       └── page.js, pieces/, collections/, orders/, settings/
├── components/                  Header, Footer, ProductCard, CartDrawer, SearchOverlay, …
│   └── admin/                    Sidebar, LoginForm, PieceForm, CollectionForm, ImageUpload
├── lib/
│   ├── siteContext.js            client state: language, cart, wishlist, checkout draft (React Context)
│   ├── adminContext.js            admin session state + the api() fetch helper
│   ├── api.js                     server-side fetch helpers (used in layout.js / page.js)
│   └── useAdminFetch.js           shared fetch-on-mount hook for the admin screens
└── next.config.mjs               the /api and /assets rewrite proxy
```

## What carried over unchanged

- The entire design system (`globals.css`, `admin/admin.css`) — same tokens, same class names, same RTL rules.
- The backend, API shape, validation, auth, and every fix from the security audit — none of that lives here.
- React's JSX escapes all text content by default, so the XSS-escaping helper (`esc()`) that was load-bearing in the old vanilla-JS templates is no longer needed for that purpose here.

## What's genuinely different

- Real URLs and browser back/forward (the old app was a single-page in-memory router).
- Page content (pieces, collections, settings) is fetched server-side on first load — no boot-time loading flash.
- The admin's list/edit screens are real routes (`/admin/pieces/[id]/edit`) instead of a client-side view toggle.
