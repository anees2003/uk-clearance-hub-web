# 04 — Architecture

Status: **decided 14 Nov 2026**, awaiting final approval of Phase 4.
- **C:** C1, navy text on brand colours
- **G:** G3, content shell
- **F:** deferred, for the client's IONOS plan; the server stays portable
- **A, B, D, E, H:** decided as written

## 1. Current architecture (commit `3aa2cb1`)

```
index.html ── inline script: theme pre-paint + console.warn patch, Google Fonts
  └─ src/main.tsx ── second console.warn patch ── createRoot(<App/>)
      └─ App: ThemeProvider > CookieConsentProvider > BrowserRouter > Routes
          └─ Layout (every route)
              ├─ useLenis()  (Lenis ↔ gsap.ticker ↔ ScrollTrigger)
              ├─ Preloader   (waits for bed.glb on 3D routes via studioProgressStore)
              ├─ Header (3 rows: utility bar, main bar, category nav)
              ├─ LazySharedViewCanvas (one fixed <Canvas>, drei View.Port for guide pages)
              ├─ <Suspense><Outlet/></Suspense>   ← 15 lazy route pages
              ├─ FloatingWhatsAppButton, CookieConsentBanner, Footer, ScrollToTop
Pages → static data modules: deals.ts, suppliers.ts, leadFlow.ts, brand.ts,
        navigation.ts, homePageData.ts, informativePages.ts, assemblyChapters.ts
3D:  StudioScene (full-screen, /home-living + 3D deal pages) ─ BedSet ─ useAssemblyTimeline
     SharedViewCanvas (guide pages + homepage hero slide 3) ─ BedSet
     Assets: jsDelivr @main (bed.glb), githack/jsDelivr (HDR), gstatic (Draco)
Hosting: Vercel static, SPA rewrite, no headers.
```

## 2. Problems, tied to findings

| # | Problem | Findings |
|---|---|---|
| A1 | No error boundary anywhere. One failed fetch inside the 3D tree unmounts the whole app | B1 |
| A2 | One-time work (source channel) runs inside route effects, so it only happens on routes that remember to call it | B2 |
| A3 | The githack→jsDelivr URL rewrite is a **side effect of importing `StudioScene`**, so routes that never load that chunk still hit githack | Phase 0 new #1, SEC-02 |
| A4 | Colour values live in 3 places (`theme.css`, `theme.ts`, CLAUDE.md) and have drifted. Components hard-code `text-white` on brand fills | B3, minor "token drift" |
| A5 | Catalogue and categories are **code** (`deals.ts`, `brand.ts`, `navigation.ts`, `homePageData.ts`). Nothing can change without a deploy | owner dashboard decision |
| A6 | Client-only rendering. Crawlers, AI bots and WhatsApp previews see an empty `#root` | 01-plan §3e, S14 |
| A7 | The homepage loads three.js (hero slide 3), and the 3D story sits in the category path | UX goal, S10, D5 |
| A8 | Dead code and unused packages: `SharedProductPreviewCanvas.tsx`, `@google/genai`, `dotenv`, **`motion` (0 imports)**, **`autoprefixer` (no PostCSS config)**, and two `console.warn` patches | minor items, SEC-06, SEC-12 |
| A9 | Static hosting only, so there is nowhere to run an API, keep a database or store photos | dashboard decision |

## 3. Target architecture

```
                    Browser (visitor / owner)
                           │ HTTPS
          ┌────────────────▼─────────────────┐
          │  Node 24 + Express  (one service) │
          │  /assets/*   Vite build, immutable cache
          │  /photos/*   processed WebP/JPEG from disk, long cache, nosniff
          │  /api/public/*  categories, products (Published only), cached
          │  /api/admin/*   owner API: session + CSRF
          │  /admin      dashboard (separate Vite entry, noindex)
          │  /robots.txt, /sitemap.xml   generated
          │  everything else → page renderer (ADR G):
          │     <head> tags + JSON-LD + content HTML + initial data JSON
          └───────┬──────────────────────┬────┘
        SQLite file + photos dir     Email API (reset, sign-in alert)
        on a persistent disk (ADR F)
                │ nightly
        off-site backup copy (Cloudflare R2)
```

**Code layout**
```
/shared   fields.ts, slug.ts, seoText.ts, contactLinks.ts, types.ts   (+ tests; used by all three below)
/server   index.ts, app.ts, config.ts, db/, auth/, photos/, routes/, render/, email.ts, backup.ts
/src      public React app (+ bootstrap.ts, catalogue.ts)
/admin    index.html + main.tsx + screens   (dashboard, own Vite entry)
```

**How it runs**
- **Development:** `npm run dev` starts Express on :3000, with Vite in middleware mode. One process and one port, with no `concurrently` package.
- **Production:** `node server/index.ts`. Node 24 strips TypeScript types natively, so the server needs **no build step**. That requires `erasableSyntaxOnly`, which step 8 sets and checks with TS 7.
- **Database:** `node:sqlite`, built into Node 24 (verified here: SQLite 3.53.1). No database package.

---

## 4. ADRs

### ADR A — Error boundaries and fallback UI
- **Decision:** one hand-written `ErrorBoundary` class, used at 3 levels.
  1. **App:** outside the router. A plain fallback with a reload button, WhatsApp and email.
  2. **Route:** inside `Layout` around `<Outlet/>`, keyed by pathname so navigating clears it.
     - If the error is a stale lazy chunk after a deploy ("Failed to fetch dynamically imported module"), it shows *"This page has been updated – Reload"*.
     - Otherwise it shows *"Sorry, this page didn't load"*. Header and footer stay.
  3. **3D:** around every `<Canvas>` and `View`. R3F passes loader errors up to the nearest boundary outside the canvas.
     - It shows a static "3D view unavailable" panel and calls `publishStudioProgress({ failed: true })`, so the Preloader exits.
- **Alternatives:** the `react-error-boundary` package (an extra dependency for about 40 lines); Suspense fallbacks only (they don't catch errors).
- **Why:** it closes B1 at the smallest scope that keeps the page's text. React 19 still needs a class for boundaries.

### ADR B — App bootstrap
- **Decision:** `src/bootstrap.ts` exports `bootstrap()`, called **once** in `main.tsx` before `createRoot`. It:
  - reads the server's initial data (`<script id="ukch-data" type="application/json">`, ADR G), so the first render needs no fetch
  - adds one `unhandledrejection` logger
- **What stays out of it:** the theme pre-paint stays in `/theme-init.js`, because it must run before CSS paints. The 3D asset paths become constants passed as props (`files="/3d/…"`, `useGLTF(MODEL_URL, '/draco/')`), not import side effects (fixes A3).
- **What goes away:** source-channel tracking is removed (B2 and SEC-11), so it never needs a bootstrap home. Both `console.warn` patches are deleted.
- **Alternative:** keep one-time work in effects. That was the root cause of B2, and StrictMode runs effects twice.

### ADR C — Design-token contrast fix — **your pick**

Measured failing pairs (Phase 0):
- white on orange 2.77
- white on sky blue 2.72
- white on WhatsApp green 1.98
- orange text on white 2.77
- amber text on light 1.46
- light primary on `#EEF2F9` 4.32
- primary on navy footer 3.30

| Option | What changes | Look | Ratios |
|---|---|---|---|
| **C1. Keep brand fills, fix the text colour on them** (recommended) | New tokens `--on-accent: #041C58`, `--on-primary` (dark `#041C58`, light `#FFFFFF`) and `--on-success: #041C58`. Text-only tokens `--accent-text` (light `#C2410C`, dark `#FD7209`), `--amber-text` (light `#8A5A00`, dark `#FFC829`) and `--success-text` (light `#166534`, ≥ 6.35). Light `--primary` `#1170D8` → `#0F63C4`. The footer gets on-navy text tokens | The orange, sky blue and green buttons keep their exact brand colour; the button text becomes navy | navy on orange 5.78 · navy on sky 5.89 · navy on green 8.07 · `#C2410C` on light surfaces ≥ 4.61 · `#8A5A00` ≥ 5.28 · `#0F63C4` ≥ 5.19 |
| C2. Darken the fills, keep white text | Accent fill → `#C2410C`, WhatsApp fill → `#0E7A6D`, dark-theme primary fill → `#1170D8` | Burnt orange and teal buttons, further from the logo | white on `#C2410C` 5.18 · on `#0E7A6D` 5.22 · on `#1170D8` 4.85 |

**Keeping the three in sync (either option):**
- `theme.ts` becomes the single source of the values.
- `theme.test.ts` parses `theme.css` **and the CLAUDE.md §4 table**, and fails on any difference.
- It also checks every text/fill pair against its WCAG minimum.
- Components use `text-on-accent` etc., and `text-white` on a brand fill is banned. A `grep` in the test enforces that.

### ADR D — Information architecture and navigation (from your UX answers)
- **Header: one row.**
  - Desktop: logo (icon + wordmark), up to 5 menu categories in your order with "More" for the rest, a small search field, and the theme toggle.
  - Mobile: logo, search icon, menu button.
  - **Removed:** the utility bar and the separate category row. The WhatsApp number moves to the footer and to every product page.
- **Homepage: 5 sections** (today: 9).
  1. **Hero.** A one-sentence promise ("Genuine clearance deals from trusted UK suppliers – browse, then ask us on WhatsApp"), one button ("Browse categories") and no 3D. It is compact, so at 375px the category tiles start on the first screen (S1).
  2. **Category picture tiles.** Large, using each category's Image, in menu order.
  3. **Featured products.** Up to 8, chosen by the owner; hidden when none.
  4. **How it works.** Three icons: Browse → Ask on WhatsApp or email → The supplier delivers, followed by the supplier line.
  5. **3D bedroom story banner.** One clearly labelled card: "Explore our 3D bedroom – see how a bed set comes together". It is the **only** way into the story from the homepage. The footer also links to it.
- **Routes** (pre-launch, so there is no SEO equity to protect):

  | Route | Page |
  |---|---|
  | `/` | homepage |
  | `/category/:slug` | a category's products, with no 3D |
  | `/deals` | all products, plus search via `?q=` |
  | `/deals/:slug` | a product (kept from today) |
  | `/bedroom-story` | the 3D story (renamed from `/home-living`, which then redirects) |

  The guides and legal pages stay as they are and move to the footer. A category's slug is fixed when it is created, like products (D4).
- **2 clicks (S2):** homepage → tile → product, or homepage → featured → product.
- **Alternatives considered:** keeping a "Home & Living" menu link that goes to the story (rejected by D5); a hero carousel (rejected: it hides content and loads 3D).

### ADR E — Dead code and dependencies
- **Remove:**
  - `src/three/SharedProductPreviewCanvas.tsx`, `metadata.json` and both warn patches
  - `@google/genai` (it also removes protobufjs), `dotenv` (replaced by `node --env-file`), **`motion`** (0 imports) and **`autoprefixer`** (Tailwind v4 prefixes for us; there is no PostCSS config)
- **Keep:** `express` and `@types/express`, now used.
- **Add:** `sharp` only (step 13, ADR H).
- **Bump:** `esbuild`.
- **Rename:** the package to `uk-clearance-hub-web`.
- **CLAUDE.md §2 change** (in the same commit as step 6):

  ```diff
  - "@google/genai", "dotenv", "motion" (dependencies); "autoprefixer" (devDependencies)
  + "sharp" (dependencies, added in step 13 with its ADR)
  ```

  The lists are otherwise unchanged.

### ADR F — Hosting — **DEFERRED** (decided 14 Nov 2026)

The client has already bought **IONOS** hosting, and the plan isn't known yet. Hosting is not chosen now, and **Vercel is removed from the plan**.

**The server must stay portable:**
- **Process:** one standard Node.js 24 process (`node server/index.ts`). There is no serverless code and no provider SDK.
- **Storage:** the **SQLite file and the photos live on ordinary disk** under `DATA_DIR` (e.g. `/var/lib/ukch/ukch.sqlite` and `/var/lib/ukch/photos/`). It works the same on a laptop, a VPS or any Linux server.
- **Settings:** **every setting comes from environment variables**: `PORT`, `DATA_DIR`, `PUBLIC_ORIGIN`, `OWNER_EMAIL`, `EMAIL_API_KEY`, `BACKUP_S3_*`. They are loaded with `node --env-file`, with `.env.example` documenting each one.
- **No provider-specific code:** HTTPS and the security headers are handled by Express, plus the reverse proxy on the host. There is no `vercel.json`, `render.yaml` or Dockerfile requirement.
- **Backups:** `npm run backup` writes `VACUUM INTO` plus the photos to any **S3-compatible** bucket set in env. IONOS offers S3-compatible Object Storage, and Cloudflare R2 also works. The host's scheduler (cron or a systemd timer) runs it.

**What the IONOS plan must provide:** Node.js needs an **IONOS VPS or Cloud Server**. IONOS **shared Web Hosting can't run a Node.js server process**. If the client has only shared hosting, he will need a VPS, which is low-cost at IONOS, and the shared plan can still hold the domain and email.

**Maintenance note for a VPS:** someone must apply OS security updates, which can run unattended. The setup also needs a reverse proxy with automatic HTTPS (e.g. Caddy) and a process manager (systemd). The deployment guide will make this a short, scripted checklist.

**Pre-launch step added (step 40):** confirm the client's IONOS plan, then write and test `docs/engineering/deploy-ionos.md` for that host.

### ADR G — Server-rendered content (S14, S16–S18) — **your pick**

| | G1. Full SSR (React `renderToPipeableStream` + hydrate) | G2. Pre-render on publish | **G3. Content shell** (recommended) |
|---|---|---|---|
| How | The server runs the whole React app per request; the browser hydrates | When the owner saves, the server writes static HTML for the affected pages | The server fills `<head>` (title, OG, JSON-LD) and puts **plain semantic HTML of the page's text** (h1, intro, product cards, details, Q&A) inside `#root`, plus the data as JSON. React then mounts with `createRoot` and replaces it |
| WhatsApp/AI crawlers | ✔ | ✔ | ✔ |
| Dev effort | **L–XL**: every page, GSAP/Lenis/three/`localStorage` code must be made server-safe, plus hydration-mismatch bugs | L: the same server-safety work if rendered with React, plus cache invalidation for homepage, category and sitemap | **M**: about 5 small escaped template functions (home, category, product, faq, delivery). The 3D and animation code is untouched |
| Ongoing maintenance | Highest: every new component must stay server-safe | Medium: stale pages if invalidation misses a case | Low, but **two renderings can drift** (mitigated: both use the same `/shared` text functions, and a test compares key text) |
| Hosting cost | Same (F1) | Same | Same |
| Speed | Good after hydration | Best (static) | Good: real text paints before JavaScript, which helps LCP. Layout shift is kept low because the shell uses the same CSS classes |
| For the owner | Nothing to do | Nothing to do | Nothing to do |

**Recommendation: G3.**
- It gives WhatsApp previews and AI crawlers everything they need.
- It costs the least to build and maintain.
- It leaves the 3D story and GSAP untouched.
- We can move to G1 later without changing any URLs.

### ADR H — Server building blocks (decided: fewest packages)

| Need | Decision | Rejected |
|---|---|---|
| Database | `node:sqlite` (built in), plain SQL migrations | `better-sqlite3` (native package), an ORM |
| Image re-encoding | **`sharp`**, with `limitInputPixels` set | client-side only (insecure); ImageMagick binary (larger attack surface) |
| Multipart upload | Web `Request.formData()` on a stream already limited to 15 MB, no package | `multer`/`busboy`. Kept as a fallback if the built-in proves fragile |
| Password hashing, tokens | `node:crypto` | `bcrypt`/`argon2` packages |
| Sessions, CSRF, rate limits | Hand-written middleware on SQLite tables (03-security SEC-20 to SEC-23) | `express-session`, `csurf` (deprecated), `express-rate-limit` |
| Email | **Brevo** (EU, free tier) over `fetch` | Resend (US) also works |
| Off-site backup | `VACUUM INTO` + photo copy to any S3-compatible bucket (IONOS Object Storage or R2), with SigV4 signing via `node:crypto` | the AWS SDK (heavy) |
| Dashboard location | **Separate Vite entry `/admin`**: its own small bundle, no Lenis/3D/cookie layer. It imports `ProductCard` for an exact live preview | an `/admin` route inside the public app; server-rendered forms (no live preview or drag-and-drop) |
| Drag and drop | Pointer events on desktop, plus **big up/down buttons on phones**, which are more reliable than touch drag. No package | `@dnd-kit` (2–3 packages) |
| Infra config | Nothing provider-specific. `vercel.json` is deleted (step 9); the headers and the SPA fallback move to Express. Example systemd and Caddy files go in the deployment guide (step 40) | `vercel.json`, `render.yaml` |

---

## 5. Risks this design accepts
- **Single instance:** a deploy causes about 30 s of downtime, and a host failure means restoring from the snapshot or R2 copy (at most a day of data loss). Mitigations: deploy outside busy hours, and a free uptime monitor alerts the developer.
- **Shell/React drift (G3):** covered by the shared text functions and a comparison test.
- **`node:sqlite` stability:** the API is release-candidate in Node 24. It's pinned by `"engines": { "node": ">=24 <25" }` and by the Node version in the deployment guide, and `better-sqlite3` is the fallback with the same SQL.
- **Hosting not yet confirmed (ADR F deferred):** if the client's IONOS plan is shared hosting only, a VPS has to be added before launch. The design doesn't change.
