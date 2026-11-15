# 02 — Steps

Status: **FINAL ORDER** (14 Nov 2026, after Phases 3 and 4). Renumbered 1–41.

The decisions behind it:
- **Phase 3:** `03-security.md` (SEC-xx).
- **Phase 4:** `04-architecture.md` (ADR A–H). C1 colours, G3 content shell, **F hosting deferred** to the client's IONOS plan.

Only step 40 waits on outside information.

**Rules for every step** (also in `HANDOFF.md`)
- One step = one commit, in this order. If a step turns out bigger than planned, or the plan proves wrong, **stop and tell the owner**.
- Write a **failing test first** where the logic is testable (`node:test`, same style as the existing `*.test.ts` files).
- Before each commit:
  - `npm test`, `npm run lint` and `npm run build` are green.
  - Browser check at **1366px and 375px**, **dark and light**.
  - The `/home-living` scroll assembly still works (`/bedroom-story` from step 29 on), for any step that touches UI.
- Windows: stop the dev server (Ctrl+C) before `npm ci`. Use `npm ci`, not `npm install`, unless the step adds a package.
- Don't push and don't open a PR until the owner asks.

Sizes: **S** is under half a day, **M** about a day, **L** two days or more.

---

## Stage A — Make the current site safe (no backend)

### 1. App and route error boundaries — P0-2, ADR A — ✅ DONE (15 Nov 2026)
> **As built:**
> - The shared 3D canvas in `Layout` sits **outside** `<Outlet/>`, so its errors skip the route boundary. It got its own silent boundary (`fallback={null}`).
> - The route fallback is therefore verified on `/home-living`. On `/about`, the page simply keeps its text.
> - The second message reads "This page needs a refresh", because it fits both a deploy and a network failure.
- **Files:** `src/components/ui/ErrorBoundary.tsx` (new), `Layout.tsx`, `App.tsx`, `ui/index.ts`
- **Done when:**
  - An **App** boundary sits outside the router.
  - A **Route** boundary sits around `<Outlet/>`, keyed by pathname, inside the normal header and footer.
    - Its fallback reads "Sorry, this page didn't load", with Try again, Home, WhatsApp and Email us.
    - A stale lazy chunk instead shows "This page has been updated – Reload".
- **Verify:** Phase 0 B1 repro: block `bed.glb`, go to `/about`. The route fallback appears, and the page is never blank.
- **Size:** S. **Needs:** —

### 2. 3D boundary and fallback — P0-2, ADR A
- **Files:** `StudioScene.tsx`, `SharedViewCanvas.tsx`, `HeroBannerCarousel.tsx` (while it exists), `studioProgressStore.ts` (`failed` flag), `Preloader.tsx`
- **Done when:**
  - A 3D boundary wraps every `<Canvas>`/`View` and shows a static "3D view unavailable" panel. This replaces step 1's silent `fallback={null}` around the shared canvas in `Layout`.
  - The page text stays.
  - The Preloader exits when the 3D asset fails. A **failed** request already exits in about 3 s (checked in step 1).
  - Add a **maximum wait of about 10 s** for a **stalled** request that never fails, with a test.
- **Verify:** block jsDelivr, raw.githack.com and gstatic in turn on `/home-living`, `/about`, `/contact` and `/mattress-guide`. No blank page (S7), and the preloader exits.
- **Size:** M. **Needs:** 1

### 3. Accessible colour tokens (C1) — P0-3, ADR C
- **Files:**
  - `theme.css`, `theme.ts`, `theme.test.ts`
  - CLAUDE.md §4 table
  - Components with text on brand fills: `Button`, `ProductCard`, `Header`, `Footer`, `HomePage`, `CookieConsentBanner`, `FloatingWhatsAppButton`, `BedDetailPage`, `HomeLivingPage`, `ReservationEnquiryModal`, and any others the `grep` finds
- **Done when:**
  - These tokens exist:
    - `--on-accent`, `--on-success`: `#041C58`
    - `--on-primary`: dark `#041C58`, light `#FFFFFF`
    - `--accent-text`: light `#C2410C`, dark `#FD7209`
    - `--amber-text`: light `#8A5A00`, dark `#FFC829`
    - `--success-text`: light `#166534`
    - light `--primary`: `#0F63C4`
    - footer on-navy text tokens
  - **Found in step 1:** `--primary-contrast` is not registered in `index.css` `@theme`, so the `text-primary-contrast` utility generates **no CSS**. It is used in about 15 places, including the "All Categories" chip at 2.54:1. Register it, or replace it with `--on-primary`.
  - `theme.test.ts`:
    - checks every text/fill pair (text ≥ 4.5, UI parts ≥ 3)
    - fails if a `text-*`/`bg-*` colour utility used in `src/` has no matching `@theme` token
    - fails if `theme.css`, `theme.ts` and the CLAUDE.md table differ
    - fails on `text-white` used on a brand fill
- **Verify:** tests, plus the Phase 0 contrast scan on `/`, `/deals`, a product, `/faq`, `/about` and `/terms` in both themes, with 0 failures (S6).
- **Size:** M. **Needs:** —

### 4. Closed mobile menu is inert — P1-5
- **Files:** `Header.tsx`
- **Done when:**
  - The closed panel has `inert`.
  - A Tab walk at 375px never lands inside it.
  - When the menu is open, focus is trapped, Escape closes it, and focus returns to the menu button.
- **Verify:** browser Tab walk.
- **Size:** S. **Needs:** —

### 5. Remove leftovers; theme script out of the HTML — P2-1, SEC-06, SEC-12, SEC-13, ADR B
- **Files:**
  - Delete `src/three/SharedProductPreviewCanvas.tsx` and `metadata.json`
  - `three/index.ts`
  - `index.html` and `src/main.tsx`: delete **both** `console.warn` patches
  - The theme bootstrap moves into a blocking `/public/theme-init.js`
  - `vite.config.ts`: drop the AI Studio lines
  - `.env.example`: no `GEMINI_API_KEY`, plus a "never `VITE_` for secrets" note
  - `package.json`: `dev` binds to localhost, add `dev:lan`, fix the `clean` script
- **Done when:** the build and the 3D pages are unchanged, and there is no flash of the wrong theme.
- **Verify:** build, plus a browser check of `/home-living` and `/about` with a hard reload in both themes.
- **Size:** S. **Needs:** —

### 6. Dependency tidy-up — P2-2..4, SEC-14, SEC-15, ADR E
- **Files:** `package.json`, `package-lock.json`, CLAUDE.md §2 lists
- **Done when:**
  - These are removed: `@google/genai`, `dotenv`, `motion` and `autoprefixer`.
  - esbuild is bumped past GHSA-g7r4-m6w7-qqqr.
  - The package is named `uk-clearance-hub-web`, with `"engines": { "node": ">=24 <25" }`.
  - `npm ci` is clean and `npm audit` reports 0.
  - No install script needs approving.
- **Verify:** `npm ci`, `npm audit`, test, lint, build, and a browser smoke test.
- **Size:** S. **Needs:** 5

### 7. Self-host the studio HDR and the Draco decoder — SEC-02, SEC-03, ADR B
- **Files:**
  - `/public/3d/studio_small_03_1k.hdr` (CC0, **ask the owner before downloading**)
  - `/public/draco/*`, copied from `node_modules/three/examples/jsm/libs/draco/` by a small build script
  - `StudioScene.tsx`, `SharedViewCanvas.tsx`: `files=` instead of `preset=`, and the module-level `setURLModifier` side effect removed
  - `BedSet.tsx`: `useGLTF(MODEL_URL, '/draco/')`
  - CLAUDE.md §5
- **Done when:** there are no requests to raw.githack.com or gstatic, and the lighting is unchanged in both themes.
- **Verify:** network panel, plus side-by-side screenshots.
- **Size:** S. **Needs:** 2

## Stage B — Shared rules

### 8. Shared field rules, SEO text and contact links — P0-4, SEC-24, SEC-09, SEC-10
- **Files:** `shared/fields.ts`, `shared/slug.ts`, `shared/seoText.ts`, `shared/contactLinks.ts`, `shared/types.ts`, plus tests; `package.json` test glob extended to `shared/` and `server/`; `tsconfig.json` (`erasableSyntaxOnly`)
- **Done when:**
  - **Category fields:** basic, plus Advanced (Intro, Q&A 0–5, with 3 suggested questions).
  - **Product fields:** basic, plus Advanced (Google title/description).
  - Condition defaults to New. Price is stored in pence. Photos are 1–6.
  - The lengths from SEC-24 are enforced, and unknown fields are rejected.
  - Text is NFC-normalised with control characters stripped.
  - **No field accepts a URL.**
  - **Slugs** are generated, unique, and frozen at first publish (categories at creation).
  - **`seoText`:** the auto title (≤ 60) and description (≤ 155); `og:title` is name + "£price"; the Condition → `itemCondition` map.
  - **`contactLinks`:** the WhatsApp/mailto text holds only the product name and page URL, under 1,500 characters.
  - Errors are plain English.
- **Verify:** tests.
- **Size:** M. **Needs:** —

## Stage C — Portable server (Express, Node 24)

### 9. Server skeleton — P0-5, ADR F (portable), ADR H
- **Files:**
  - `server/index.ts`, `server/app.ts` (factory), `server/config.ts` (env only: `PORT`, `DATA_DIR`, `PUBLIC_ORIGIN`, …)
  - Dev: Express with Vite in middleware mode on :3000. Prod: `node --env-file=.env server/index.ts`, serving `dist/` with immutable cache headers plus the SPA fallback
  - JSON 404s and an error handler without stack traces
  - `.env.example`
  - **Delete `vercel.json`**
- **Done when:**
  - `npm run dev` serves the site exactly as before, and `GET /api/health` returns 200.
  - `npm run build && npm start` serves the built site.
- **Verify:** a `node:test` app-factory test, plus a browser check of the dev and prod builds.
- **Size:** M. **Needs:** 6, 8

### 10. Database and photo store — P0-5, ADR H
- **Files:** `server/db/` (`node:sqlite`, SQL migrations, repositories), `server/storage/photos.ts` (files under `DATA_DIR/photos`, random names)
- **Done when:** migrations run from empty, and the repository tests pass on a temporary DB.
- **Verify:** tests.
- **Size:** M. **Needs:** 9

### 11. Owner login and sessions — SEC-20..23, SEC-29
- **Files:** `server/auth/*`, `npm run owner:create`
- **Done when:**
  - scrypt N = 2^15, r = 8, p = 3, with the parameters stored; a 12-character minimum and a common-password list.
  - Rate limits kept in the database (5 per IP per 15 minutes, 10 per account per hour), with a generic error.
  - A new session ID on sign-in; the `__Host-ukch_s` cookie (`HttpOnly`, `Secure`, `SameSite=Lax`); 14 days idle, 30 days maximum.
  - The CSRF token plus the `Origin` check.
  - Logout clears the server-side session.
  - Auth events are logged without secrets.
- **Verify:** tests for each of the above.
- **Size:** M/L. **Needs:** 10

### 12. Password reset and sign-in alert — SEC-27, SEC-30
- **Files:** `server/auth/reset.ts`, `server/email.ts` (Brevo via `fetch`), `npm run owner:reset`
- **Done when:**
  - The link only ever goes to `OWNER_EMAIL`. The token is single-use, lasts 30 minutes and is stored hashed.
  - The reply is the same whether or not an email was sent, with at most 3 requests an hour.
  - A reset ends every other session.
  - Every new sign-in emails an alert.
- **Verify:** tests with a fake sender. One real send once there is an email account.
- **Size:** M. **Needs:** 11

### 13. Photo upload and processing — P0-5b, SEC-25, SEC-17, ADR H
- **Files:** `server/photos/*`; **add `sharp`** (CLAUDE.md §2 updated in the same commit)
- **Done when:**
  - Upload: 15 MB or less checked before buffering; the type judged by magic bytes, JPEG/PNG/WebP only (SVG/GIF/HEIC rejected with a plain message); `limitInputPixels` about 50 MP; at most 60 uploads an hour.
  - Output: WebP at 400/800/1600px, plus a **1200×630 JPEG of 300 KB or less** for WhatsApp/OG, with **no EXIF/XMP/GPS**.
  - A 5 MB phone photo gives a card of 80 KB or less.
  - Photos are served with `nosniff` and a long cache.
- **Verify:** tests with fixture images.
- **Size:** M/L. **Needs:** 10, 11

### 14. Categories API — P0-5
- **Done when:**
  - The owner can create, edit, reorder and toggle Show in menu, with an optional image (via step 13).
  - Intro and Q&A are supported.
  - **Deleting a category that still has products is blocked** with a plain message.
  - The public endpoint returns menu-visible categories in order, with answered Q&A only.
  - All writes are validated by `shared/fields.ts`.
- **Verify:** tests.
- **Size:** M. **Needs:** 8, 11, 13

### 15. Products API — P0-5, SEC-26
- **Done when:**
  - The owner can create, edit, publish/unpublish, set Featured and delete. **Delete is a 30-day soft delete.**
  - The slug is frozen at first publish, and a stable `sku` is generated.
  - The Google overrides are stored; empty means automatic.
  - The dashboard list supports search and a category filter.
  - Public endpoints return Published products only: by category, featured, and by slug.
- **Verify:** tests.
- **Size:** M/L. **Needs:** 14

### 16. Backup and restore commands — SEC-26, ADR F
- **Files:** `server/backup.ts`, `npm run backup` (`VACUUM INTO` plus new photos, sent to an S3-compatible bucket from `BACKUP_S3_*` env, SigV4 via `node:crypto`), `npm run restore`, `docs/engineering/runbook.md`
- **Done when:**
  - A backup followed by a restore into an empty `DATA_DIR` gives an identical catalogue.
  - The schedule itself is set per host in step 40.
- **Verify:** test with a local S3-compatible stub, plus a manual restore.
- **Size:** M. **Needs:** 15

## Stage D — Owner dashboard (separate Vite entry `/admin`, ADR H)

### 17. Dashboard shell, sign-in and reset screens — P0-6
- **Done when:**
  - `/admin` is its own bundle, `noindex`.
  - It has sign-in, "Forgot password?", set new password and sign-out.
  - The layout is phone-first, with two tabs: **Products** and **Categories**.
  - Labels are plain UK English.
- **Verify:** browser at 375px and 1366px.
- **Size:** M. **Needs:** 11, 12

### 18. Categories screen — P0-6, P0-10
- **Done when:**
  - The owner can add and edit, toggle Show in menu and set an image.
  - Ordering works by drag on desktop and by **big up/down buttons** on phones.
  - Trying to delete a category with products shows the blocked message.
  - The empty state reads "Add your first category".
- **Verify:** browser, including touch at 375px.
- **Size:** M. **Needs:** 14, 17

### 19. Products list — P0-6, P0-10
- **Done when:** there is search, a category filter and a Draft/Published badge, and the empty state reads "Add your first product", or "Add a category first" when there are no categories.
- **Verify:** browser.
- **Size:** S/M. **Needs:** 15, 17

### 20. Product form: basic fields and saving — P0-6
- **Done when:** the basic fields only appear, with plain labels and inline errors from `shared/fields.ts`, and the owner can **Save as draft** or **Publish**. Server errors appear by the right field.
- **Verify:** browser, plus a test that maps errors to fields.
- **Size:** M. **Needs:** 19

### 21. Product form: photos — P0-6, P0-5b
- **Done when:**
  - The owner can add 1–6 photos by drag or the phone picker (`accept="image/jpeg,image/png,image/webp"`).
  - The browser pre-shrinks each photo to about 2000px.
  - Photos can be reordered and removed, the first is labelled "Main photo", and upload progress shows.
- **Verify:** browser on desktop and a real phone.
- **Size:** M/L. **Needs:** 13, 20

### 22. Product form: live preview and delete confirm — P0-6
- **Done when:**
  - The preview uses the public `ProductCard`, so it matches exactly.
  - Delete asks "Delete '<name>'? This can't be undone", with Cancel as the default.
- **Verify:** browser.
- **Size:** M. **Needs:** 21

### 23. Category "Advanced (optional)": intro and Q&A — P1-11
- **Done when:**
  - The Advanced section is collapsed and closed by default.
  - It holds the Intro with a word counter and the Q&A list (add, edit, reorder, remove, at most 5).
  - It shows "Only answered questions appear on the website".
  - Saving never requires opening it.
- **Verify:** browser at 375px, plus a test.
- **Size:** M. **Needs:** 18

### 24. Product "Advanced (optional)": How this looks on Google — P1-9
- **Done when:**
  - The Advanced section is collapsed and closed by default.
  - It holds the Google preview and two fields with live counters (60 / 155), auto-filled, with "Reset to automatic". Going over the limit shows a warning, not an error.
- **Verify:** browser. Then the **S8/S20 usability test**: a non-technical person adds a product with 3 photos on a phone in under 5 minutes, **without opening Advanced**.
- **Size:** S/M. **Needs:** 22

## Stage E — Public site on the API, simplified (ADR D)

### 25. Bootstrap, catalogue client and API-down fallback — P0-7, P0-9, ADR B
- **Files:** `src/bootstrap.ts` (reads `#ukch-data` if present), `src/data/catalogue.ts` and its test, plus a fallback block
- **Done when:** with the API stopped, every public route shows "We can't show products right now", with WhatsApp and Email us, and is never blank.
- **Verify:** test, plus a browser check with the API stopped (S7).
- **Size:** M. **Needs:** 15

### 26. One-row header and footer from data — P0-7, P1-1
- **Files:** `Header.tsx`, `Footer.tsx`, `navigation.ts` and its test, `brand.ts`
- **Done when:**
  - **Desktop:** logo, up to 5 menu categories plus "More", a small search and the theme toggle.
  - **Mobile:** logo, search icon and menu button.
  - The utility bar and the category row are gone.
  - The guides, WhatsApp and the 3D story link move to the footer.
  - A new menu category appears with no code change.
- **Verify:** browser, both widths and both themes (S3).
- **Size:** M/L. **Needs:** 25

### 27. Category pages `/category/:slug` — P0-7, P0-10
- **Files:** a simplified `ClearanceDealsPage.tsx` (now also `/deals` for all products and search), `App.tsx` routes
- **Done when:**
  - The intro sits under the `<h1>` and the answered Q&A sits below the products.
  - Filters are price and In stock only.
  - Cards show Condition, and a price only when one is set.
  - Empty state per 01-plan §3c.
- **Verify:** browser.
- **Size:** M. **Needs:** 25

### 28. Product page `/deals/:slug` — P0-7
- **Files:** `BedDetailPage.tsx` → `ProductPage.tsx`, `ProductCard.tsx`
- **Done when:**
  - The page has a gallery, name, Condition, price or nothing, descriptions and Availability.
  - **"Ask on WhatsApp" and "Email us" are on the first screen at 375px**, with the supplier line next to them.
  - Related products come from the same category.
  - A Draft or missing product shows the 404.
- **Verify:** browser (S5), plus a link-text test.
- **Size:** M. **Needs:** 25

### 29. Homepage (5 sections) and `/bedroom-story` — P1-2, P1-3, P1-8, P0-10
- **Files:** `HomePage.tsx`, `homePageData.ts` and its test; `HeroBannerCarousel.tsx` → static hero; `HomeLivingPage.tsx` moves to `/bedroom-story`, with `/home-living` redirecting; `Preloader` route check; CLAUDE.md route references
- **Done when:**
  - The homepage has these sections: hero, category tiles, featured (hidden when empty), how it works plus the supplier line, and the 3D story banner.
  - There is **no 3D on the homepage**.
  - At 375px, the tiles start on the first screen.
  - The scroll assembly is unchanged on `/bedroom-story`.
- **Verify:** browser (S1, S2, S4), plus Lighthouse mobile.
- **Size:** L. **Needs:** 26, 27

### 30. Remove the old deal model — P0-8, P0-1 (closes B2, B5, SEC-11)
- **Files:**
  - Delete `deals.ts`, `suppliers.ts`, `leadFlow.ts`, `ReservationEnquiryModal.tsx` and their tests
  - `ScrollToTop.tsx`, `seo.ts`
  - `/bedroom-story` products grid from the API
  - CLAUDE.md: delete §7 (legacy) and the transition note
- **Done when:** a `grep` finds no "Save X%", "Was £", "verified", Lead ID or `ukch_source_channel`.
- **Verify:** `grep`, tests, browser.
- **Size:** M. **Needs:** 27, 28, 29

### 31. Plain-English copy, factual FAQ, semantic HTML — P1-4, P1-11
- **Files:** `AboutPage`, `DeliveryReturnsPage`, `FaqPage`, `LegalPages`, `MattressGuidePage`, `BedSizeGuidePage`, `informativePages.ts`
- **Done when:**
  - There is no jargon.
  - The supplier line appears exactly on How it works, on Terms and next to the contact buttons.
  - The FAQ and delivery answers are direct and factual, **from the owner's facts**.
  - Every page has one `<h1>`, logical `h2`/`h3` and landmarks.
- **Verify:** read-through, a banned-terms `grep`, and a heading-outline check.
- **Size:** M/L. **Needs:** 30, plus the owner's delivery and returns facts

## Stage F — SEO, privacy, hardening, deployment, launch

### 32. Content shell renderer (G3) — P1-9, P1-11, ADR G
- **Files:**
  - `server/render/shell.ts` and its tests
  - Templates for the homepage, category, product, `/faq` and `/delivery-returns`, built on the `/shared` text functions
  - `#ukch-data` JSON
  - `src/main.tsx` keeps `createRoot`
- **Done when:**
  - Without JavaScript, `curl` shows the h1, intro, product names, prices, descriptions and answered Q&A.
  - Every value is HTML-escaped (**SEC-07**).
  - A test compares the key text between the shell and React.
  - There is no visible flash or double render, and CLS stays below 0.1.
- **Verify:** `curl` per page type (S18), the escape test with `</script><script>alert(1)</script>`, and a browser check.
- **Size:** L. **Needs:** 27, 28, 29, 31

### 33. Server-rendered head tags — P1-9, SEC-08
- **Files:** `server/render/head.ts` and its test; `src/utils/seo.ts` reduced to updates after navigation
- **Done when:**
  - Every page has a unique title and description, an absolute canonical, robots per 01-plan §3e, OG/Twitter tags, `og:locale` `en_GB`, the **WhatsApp `og:title` with £price and the 1200×630 `og:image`**.
  - Search, filtered, empty, 404 and admin pages are `noindex,follow`, and `X-Robots-Tag` is set on `/admin` and `/api`.
  - `q` is capped at 100 characters.
- **Verify:** a crawl test over the seeded data (S16), plus `curl`. In staging, paste 3 links into WhatsApp on iPhone and Android (**S14**).
- **Size:** M/L. **Needs:** 32, 24

### 34. Structured data — P1-10, SEC-07
- **Files:** `server/render/jsonLd.ts` and its test
- **Done when:**
  - The page types carry: Product + Offer (no `seller`, and nothing when there is no price), BreadcrumbList, Organization, WebSite (no `SearchAction`) and FAQPage.
  - `<`, `>`, `&`, U+2028 and U+2029 are escaped.
- **Verify:** a parse test per page type, plus the Rich Results Test on 3 priced products (S17).
- **Size:** M. **Needs:** 33

### 35. robots.txt and generated sitemap — P1-12
- **Files:** server routes; delete `public/robots.txt` and `public/sitemap.xml`
- **Done when:** robots allows all except `/admin` and `/api/`, the sitemap lists Published products and non-empty categories with `lastmod`, and an unpublished product drops out at once.
- **Verify:** tests (S19), plus `curl`.
- **Size:** S/M. **Needs:** 15

### 36. Self-hosted fonts — P1-7, SEC-04
- **Files:** `/public/fonts/*.woff2` (**ask before downloading**), `index.html`, `index.css`
- **Done when:** there are no Google Fonts requests and the text looks the same.
- **Verify:** network panel (S15).
- **Size:** S. **Needs:** —

### 37. Cookie banner removal — P1-7
- **Files:** remove `CookieConsentBanner.tsx`, `CookieConsentContext.tsx` and `cookieConsent.ts` and their tests; update `/cookies`, `Footer.tsx` and `FloatingWhatsAppButton.tsx`
- **Done when:**
  - A fresh audit confirms only the items in 03-security §4.
  - `/cookies` lists exactly what is stored.
  - There is no banner.
- **Verify:** storage and network audit (S15).
- **Size:** S/M. **Needs:** 30, 36

### 38. Security headers in Express — P1-6, SEC-05
- **Files:** `server/headers.ts` and its test
- **Done when:** the exact set in 03-security §3 is sent, run as Report-Only first, then enforced.
- **Verify:** `curl`, plus 0 CSP errors on every route, both themes, the 3D pages and `/admin`.
- **Size:** S/M. **Needs:** 7, 9, 36

### 39. Pin CDN assets to a commit SHA — P2-5, SEC-01
- **Files:** `modelUrl.ts`, `brand.ts`, `index.html`, plus a test that no `@main` remains
- **Done when:** every jsDelivr URL uses `@<sha>`.
- **Verify:** test and browser.
- **Size:** S. **Needs:** — (can be done any time)

### 40. IONOS deployment — ADR F (deferred)
- **Before starting:** confirm the client's IONOS plan. **Node.js needs an IONOS VPS or Cloud Server**; shared Web Hosting can't run it.
- **Files:** `docs/engineering/deploy-ionos.md`, plus example `systemd` unit and Caddy (reverse proxy, automatic HTTPS) files
- **Done when:**
  - The guide covers:
    - Node 24, the `DATA_DIR` disk path and the env file
    - the backup timer (step 16), unattended OS updates, SSH keys only
    - a staging site
  - The site runs in staging from the guide.
- **Verify:** follow the guide on the real server, then do a restore test.
- **Size:** M. **Needs:** the client's IONOS details, plus 16 and 38

### 41. Launch-readiness check
- **Files:** `docs/engineering/05-launch-check.md`
- **Done when:**
  - S1–S20 are recorded as pass or fail, with evidence.
  - Core Web Vitals pass on mobile.
  - The owner has submitted the sitemap to **Google Search Console** and **Bing Webmaster Tools**.
  - **Security gate:**
    - every High SEC item is ticked with a passing test
    - `npm audit` reports 0
    - the CSP is enforced with 0 violations
    - 2FA is on for GitHub and IONOS, `main` is protected on both repos, Dependabot is on, and SSH uses keys only
    - a backup restore has been tested
- **Verify:** this step is the verification.
- **Size:** M. **Needs:** all

---

**Can start now:** steps 1–8 and 39.
**Waits on the owner:** files to download (steps 7 and 36), delivery and returns facts (step 31), an email account for Brevo (step 12, real send only), and IONOS details (step 40).
**Not a step:** the Google Merchant Center feed (dropped, 01-plan §3e).
