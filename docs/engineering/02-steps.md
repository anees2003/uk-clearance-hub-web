# 02 — Steps

Status: **DRAFT** (Phase 2). Phase 3 (security) and Phase 4 (architecture) will revise this list. Steps marked **Needs ADR** can't start until Phase 4 decides them.

**Rules for every step**
- One step = one commit.
- TDD where the logic is testable (`node:test`, same style as the existing `*.test.ts` files).
- Before each commit:
  - `npm test`, `npm run lint` and `npm run build` all green
  - Browser check at 1366px and 375px, dark and light themes
  - `/home-living` scroll assembly still works, for any step that touches UI
- Windows: stop the dev server (Ctrl+C) before `npm ci`.

Sizes: **S** is under half a day, **M** about a day, **L** two days or more (split further if it grows). Backlog IDs refer to `01-plan.md`.

---

## Stage A — Make the current site safe (no backend needed)

### 1. App and route error boundaries — P0-2 (part 1)
- **Files:** `src/components/ui/ErrorBoundary.tsx` (new), `Layout.tsx`, `App.tsx`, `ui/index.ts`
- **Done when:**
  - Any error while a route renders or loads shows a branded fallback inside the normal header and footer. It says "Sorry, this page didn't load" and offers Try again, a link to the homepage, WhatsApp and Email us.
  - Moving to another route clears the error.
  - An outer boundary catches errors in `Layout` itself.
- **Verify:** browser. Repeat the Phase 0 B1 check (block `bed.glb`, go to `/about`): the page shows the fallback and is never blank.
- **Size:** S. **Needs:** —

### 2. 3D fallback and one shared asset-URL module — P0-2 (part 2)
- **Files:**
  - `src/three/assetUrls.ts` (new) and its test: the githack → jsDelivr rewrite, registered by every canvas
  - `StudioScene.tsx`, `SharedViewCanvas.tsx`: wrap each `<Canvas>` in a 3D boundary with a static fallback panel
  - `HeroBannerCarousel.tsx`, while it still exists
  - `studioProgressStore.ts`, `Preloader.tsx`: report a load failure so the preloader exits instead of waiting
- **Done when:**
  - With jsDelivr, raw.githack.com or gstatic blocked, `/home-living`, `/about`, `/contact` and `/mattress-guide` keep all their text, and the 3D slot shows "3D view unavailable".
  - The preloader exits.
  - No route requests raw.githack.com.
- **Verify:** unit test of the URL rewrite. Browser check blocking each host in turn (S7).
- **Size:** M. **Needs:** 1

### 3. Accessible colour tokens — P0-3
- **Files:**
  - `theme.css`, `theme.ts`, `theme.test.ts`
  - New "on-colour" tokens (e.g. `--on-accent`, `--on-primary`, `--on-success`) used wherever text sits on a coloured fill: `Button`, `ProductCard`, `Header`, `HomePage`, `CookieConsentBanner`, `FloatingWhatsAppButton`, `BedDetailPage`, `HomeLivingPage`
  - CLAUDE.md §4 table
- **Done when:**
  - A unit test computes the WCAG ratio for every text/fill token pair in both themes: text 4.5 or more, UI parts 3 or more.
  - A drift test checks that `theme.ts` matches the values in `theme.css`.
  - The CLAUDE.md table matches both.
- **Verify:** tests, plus the Phase 0 contrast scan on `/`, `/deals`, a product, `/faq`, `/about` and `/terms` in both themes, with 0 failures (S6).
- **Size:** M. **Needs ADR** 4(c): the exact new values.

### 4. Closed mobile menu is inert — P1-5
- **Files:** `Header.tsx`
- **Done when:**
  - The closed panel has `inert`, and a Tab walk at 375px never lands inside it.
  - When the menu is open, focus is trapped, Escape closes it and focus goes back to the menu button.
- **Verify:** browser Tab walk, as in Phase 0.
- **Size:** S. **Needs:** —

### 5. Remove dead code and AI Studio leftovers — P2-1
- **Files:**
  - Delete `src/three/SharedProductPreviewCanvas.tsx` and `metadata.json`
  - `three/index.ts`
  - `index.html`: drop the `console.warn` patch, and move the theme bootstrap into a blocking `/public/theme-init.js` (SEC-06)
  - `vite.config.ts`: drop the AI Studio HMR lines
  - `.env.example`: no `GEMINI_API_KEY`, plus a "never prefix secrets with `VITE_`" note (SEC-12)
  - `package.json`: `dev` binds to localhost, and `dev:lan` is added for phone testing (SEC-13)
- **Done when:**
  - Nothing imports the deleted files, and the build and the 3D pages are unchanged.
  - There is still no flash of the wrong theme on load.
- **Verify:** build, plus a browser check of `/home-living` and `/about`.
- **Size:** S. **Needs:** —

### 6. Dependency tidy-up — P2-2, P2-3, P2-4
- **Files:** `package.json`, `package-lock.json`, CLAUDE.md §2 lists
- **Done when:**
  - `@google/genai` and `dotenv` are removed (the server will use Node 24 `--env-file`).
  - The package is named `uk-clearance-hub-web`.
  - esbuild is past GHSA-g7r4-m6w7-qqqr.
  - `npm ci` is clean and `npm audit` reports 0.
- **Verify:**
  - `npm ci`, `npm audit`, test, lint, build.
  - Confirm no install script needs approving (SEC-15).
- **Size:** S. **Needs:** —

### 6a. Self-host the studio HDR and the Draco decoder — SEC-02, SEC-03
- **Files:**
  - `/public/3d/studio_small_03_1k.hdr` (CC0, downloaded with your OK)
  - `/public/draco/*`, copied from `node_modules/three/examples/jsm/libs/draco/` at build
  - `StudioScene.tsx`, `SharedViewCanvas.tsx`: `files=` instead of `preset=`
  - `BedSet.tsx`: `useGLTF(MODEL_URL, '/draco/')`
  - `assetUrls.ts`: the githack rewrite is no longer needed
  - CLAUDE.md §5
- **Done when:**
  - 3D pages make no requests to raw.githack.com or gstatic.
  - The lighting looks the same in both themes.
- **Verify:** network panel, plus a side-by-side screenshot of `/home-living` and `/about`.
- **Size:** S. **Needs:** 2

## Stage B — Shared rules (pure TypeScript, no backend needed)

### 7. Field rules and contact links — P0-4
- **Files:**
  - `shared/fields.ts`: category and product rules, required fields, lengths, enums, Condition defaulting to New, price stored in pence, 1–6 photos, plain-English error messages
  - `shared/slug.ts`: generated, unique, frozen after first publish
  - `shared/contactLinks.ts`: WhatsApp and mailto links with the prefilled text from S13
  - `shared/seoText.ts`: auto title (≤ 60) and description (≤ 155) built from name, £ price and Condition, cutting at a word boundary; the Condition → `itemCondition` mapping
  - Category fields Intro and Questions & answers (0–5, with the 3 suggested questions), and the Product overrides Google title and Google description (01-plan §3e–3f)
  - Tests for each
  - `package.json`: test glob widened to `shared/` and `server/`
  - `tsconfig.json`
- **Done when:**
  - The tests cover every required field, every limit, the slug freeze and the link encoding.
  - **Security (SEC-24, SEC-09, SEC-10):**
    - The rules reject unknown fields.
    - Text is NFC-normalised, with control characters stripped.
    - No field accepts a URL.
    - The prefilled message holds only the product name and page URL, and stays under 1,500 characters.
- **Verify:** tests.
- **Size:** M. **Needs:** —

## Stage C — Server (Express)

### 8. Server skeleton — P0-5
- **Files:**
  - `server/app.ts`: app factory, used by tests
  - `server/index.ts`, `server/config.ts`
  - Health endpoint
  - JSON error handler that never sends stack traces
  - `vite.config.ts`: `/api` dev proxy
  - Scripts `dev:api` and `start`
  - `.env.example`
- **Done when:** `GET /api/health` returns 200, an unknown `/api` route returns a JSON 404, and the dev site can reach the API through the proxy.
- **Verify:** `node:test` against an ephemeral port.
- **Size:** S. **Needs ADR:** hosting runtime (a long-running Node process or serverless).

### 9. Database and storage adapters — P0-5
- **Files:** `server/db/*` (schema, migrations, repositories), `server/storage/*` (photo store adapter: local folder in development, the chosen store in production)
- **Done when:** migrations run from empty, and the repositories create, read, update and delete categories and products in tests using a temporary DB.
- **Verify:** tests.
- **Size:** M. **Needs ADR:** database and photo storage.

### 10. Owner login and sessions — P0-5
- **Files:** `server/auth/*` (scrypt hashing, sessions, cookie flags, CSRF, login rate limiting, logout), `npm run owner:create`
- **Done when:** these all pass:
  - wrong password → generic error
  - more than N failed attempts → temporary block
  - missing or invalid CSRF token → 403
  - session cookie is `HttpOnly`, `Secure` and `SameSite`
  - logout invalidates the server-side session
  - **Per 03-security SEC-20 to SEC-23 and SEC-29:**
    - scrypt (N = 2^15, r = 8, p = 3) with the parameters stored, the 12-character minimum and the common-password list
    - rate-limit counters kept in the database (5 per IP per 15 minutes, 10 per account per hour)
    - a new session ID on sign-in; `__Host-ukch_s`; 14 days idle, 30 days maximum
    - the CSRF token plus the `Origin` check
    - auth events logged without secrets
- **Verify:** tests.
- **Size:** M/L. **Needs:** 9, plus the Phase 3 details

### 11. Password reset by email — P0-5a
- **Files:** `server/auth/reset.ts`, `server/email.ts` (provider via `fetch`, no package), `npm run owner:reset`
- **Done when:** these all pass:
  - the link only ever goes to the owner's configured address
  - the token is single-use, lasts 30 minutes and is stored hashed
  - the reply is the same whether or not an email was sent
  - there are at most 3 requests an hour
  - a successful reset ends every other session
  - **every new sign-in emails the owner an alert (SEC-30)**
- **Verify:** tests with a fake email sender. One real send in staging.
- **Size:** M. **Needs ADR:** email provider. **Needs:** 10

### 12. Photo upload and processing — P0-5b
- **Files:** `server/photos/*`: multipart parsing, real type check (magic bytes), size limit, WebP re-encode at 400/800/1600px, a 1200×630 JPEG of 300 KB or less for WhatsApp/OG previews, metadata and GPS stripped
- **Done when:** these all pass:
  - a non-image renamed `.jpg` is rejected
  - a file over the limit is rejected before it is fully read
  - the output has no EXIF
  - all 3 sizes exist
  - a typical 5 MB phone photo gives a card image of 80 KB or less
  - **Per SEC-25 and SEC-17:**
    - only JPEG, PNG and WebP are accepted, judged by magic bytes; SVG, GIF and HEIC are rejected with a plain message
    - files of 15 MB or less, checked before buffering; decoding capped at about 50 megapixels
    - random file names, storage that cannot be listed, served with `nosniff`
    - an upload limit of 60 an hour
    - a test proves the output has no EXIF/XMP/GPS
- **Verify:** tests with fixture images.
- **Size:** M/L. **Needs ADR:** re-encoder package (likely `sharp`) and the multipart approach. **Needs:** 9

### 13. Categories API — P0-5
- **Done when:** these all pass:
  - create, edit and reorder work; Show in menu toggles
  - the optional image uses the step 12 pipeline
  - deleting a category that still has products returns the plain message from 01-plan §3c
  - every field is validated with `shared/fields.ts`, including Intro and Q&A
  - the public endpoint returns only menu-visible categories, in menu order, and only the answered Q&A
- **Verify:** tests.
- **Size:** M. **Needs:** 7, 10, 12

### 14. Products API — P0-5
- **Done when:** these all pass:
  - create, edit, publish/unpublish, Featured and delete work
  - the slug is frozen at first publish, and a stable `sku` is generated (JSON-LD only)
  - the Google title and description overrides are stored, and an empty override means automatic
  - **delete is a 30-day soft delete (SEC-26)**: the product is hidden at once and purged after 30 days
  - the dashboard list supports search and a category filter
  - public endpoints return Published products only, list by category, and fetch one product by slug
  - every field is validated server-side
- **Verify:** tests.
- **Size:** M/L. **Needs:** 7, 10, 12, 13

### 15. Backups — Phase 3
- **Done when:**
  - The database and photos are backed up on a schedule, per the hosting ADR: daily, kept 30 days, photo storage versioned, plus a weekly copy at a second provider (SEC-26).
  - A restore is tested once and written up in `docs/engineering/runbook.md`.
- **Verify:** a manual restore into a scratch environment.
- **Size:** S/M. **Needs ADR:** hosting. **Needs:** 9

## Stage D — Owner dashboard

**Needs ADR:** where the dashboard lives (likely a lazy-loaded `/admin` route in this Vite app, set to noindex).

### 16. Dashboard shell, login and reset screens — P0-6
- **Done when:**
  - The dashboard has login, "Forgot password?" and set-new-password screens, sign-out, and a simple phone-first layout with two tabs: Products and Categories.
  - All labels are in plain UK English.
- **Verify:** browser at 375px and 1366px.
- **Size:** M. **Needs:** 10, 11

### 17. Categories screen — P0-6, P0-10
- **Done when:**
  - The owner can add and edit a category, toggle Show in menu and set an image.
  - Ordering works by drag and drop, with up/down buttons as the phone fallback.
  - Trying to delete a category that still has products shows the blocked message.
  - With no categories, the screen shows the empty state.
- **Verify:** browser, including touch at 375px.
- **Size:** M. **Needs:** 13, 16

### 18. Products list — P0-6, P0-10
- **Done when:** there is search, a category filter and a Draft/Published badge, and the empty state reads "Add your first product", or "Add a category first" when there are no categories.
- **Verify:** browser.
- **Size:** S/M. **Needs:** 14, 16

### 19. Product form: fields and saving — P0-6
- **Done when:**
  - Every field appears with a plain label and inline errors taken from `shared/fields.ts`.
  - The owner can save as Draft or Publish.
  - Server errors appear next to the field they belong to.
- **Verify:** browser, plus a test that the form maps errors to fields.
- **Size:** M. **Needs:** 18

### 20. Product form: photos — P0-6, P0-5b
- **Done when:**
  - The owner can add 1–6 photos by drag and drop or the phone picker.
  - The browser pre-shrinks each photo before upload.
  - Photos can be reordered, and the first is labelled "Main photo".
  - Each photo can be removed, with upload progress shown.
- **Verify:** browser on desktop and a real phone (S8).
- **Size:** M/L. **Needs:** 12, 19

### 21. Product form: live preview and delete confirm — P0-6
- **Done when:**
  - The preview card updates as the owner types and looks like the public card.
  - Delete asks "Delete '<name>'? This can't be undone", with Cancel as the default.
- **Verify:** browser. Then the S8/S20 usability test: a non-technical person adds a product with 3 photos on a phone in under 5 minutes, without opening "Advanced (optional)".
- **Size:** M. **Needs:** 20

### 21a. Category intro and Q&A editor — P1-11
- **Done when:**
  - The category form has a collapsed **"Advanced (optional)"** section, closed by default. Saving a category never requires opening it.
  - Inside it are an **Intro** box with a word counter and a **Questions & answers** list (add, edit, reorder, remove, at most 5).
  - New categories show the 3 suggested questions with empty answers.
  - A hint says "Only answered questions appear on the website".
- **Verify:** browser at 375px, plus a field-rules test.
- **Size:** M. **Needs:** 13, 17

### 21b. "How this looks on Google" fields — P1-9
- **Done when:**
  - Inside the product form's collapsed **"Advanced (optional)"** section (closed by default) are a Google-style preview and two optional fields with live counters (60 / 155).
  - A product can be saved and published without the section ever being opened (S20).
  - The fields are auto-filled until edited, and **Reset to automatic** restores them.
  - Going over the limit shows a plain warning, not an error.
- **Verify:** browser, plus a `seoText` test.
- **Size:** S/M. **Needs:** 19

## Stage E — Public site on the API, simplified

### 22. Catalogue client and API-down fallback — P0-7, P0-9
- **Files:** `src/data/catalogue.ts` and its test (fetch, cache, error state), plus a fallback block
- **Done when:** with the API stopped, every public route shows "We can't show products right now", with WhatsApp and Email us, and is never blank (S7).
- **Verify:** test, plus a browser check with the API stopped.
- **Size:** M. **Needs:** 14

### 23. One-row header and footer from data — P0-7, P1-1
- **Files:** `Header.tsx`, `Footer.tsx`, `navigation.ts` and its test, `brand.ts`
- **Done when:**
  - The header is one row: logo, menu categories in order, a small search and the theme toggle, with a menu button on mobile.
  - The utility bar and the extra nav row are gone.
  - The guides move to the footer.
  - A new category with Show in menu on appears without any code change.
- **Verify:** browser, both widths and both themes (S3).
- **Size:** M/L. **Needs:** 22

### 24. Category pages — P0-7, P0-10
- **Files:** `ClearanceDealsPage.tsx`, simplified
- **Done when:**
  - Filters are only price and In stock, and the old savings, condition and subcategory filters are gone.
  - Cards show Condition, and a price only when one is set.
  - The category intro sits under the `<h1>`, and the answered Q&A sits below the products.
  - Empty state per 01-plan §3c.
  - The route shape follows Phase 4(d).
- **Verify:** browser.
- **Size:** M. **Needs ADR:** 4(d) routes. **Needs:** 22

### 25. Product page — P0-7
- **Files:** `BedDetailPage.tsx`, renamed to `ProductPage.tsx`, and `ProductCard.tsx`
- **Done when:**
  - The page has a gallery (main photo first), name, Condition, price or nothing, both descriptions and Availability.
  - "Ask on WhatsApp" and "Email us" are on the first screen at 375px (S5), with the supplier line next to them.
  - Related products come from the same category.
  - A Draft or missing product shows the 404.
- **Verify:** browser, plus a test of the link text.
- **Size:** M. **Needs:** 22

### 26. Homepage rebuild and 3D-story entry — P1-2, P1-3, P1-8, P0-10
- **Files:** `HomePage.tsx`, `homePageData.ts` and its test; `HeroBannerCarousel.tsx` replaced by a static hero
- **Done when:**
  - The homepage has at most 5 sections: a hero with a one-line value proposition, picture category tiles, featured products, one trust/how-it-works strip, and contact.
  - There is no 3D on the homepage.
  - One clearly labelled link leads to the 3D story, per Phase 4(d).
  - Empty states per §3c.
- **Verify:** browser (S1, S2, S4), plus Lighthouse mobile LCP of 3.0 s or less (S10).
- **Size:** L. **Needs:** 22, 23

### 27. Remove the old deal model — P0-8, P0-1
- **Files:**
  - Delete `deals.ts`, `suppliers.ts`, `leadFlow.ts`, `ReservationEnquiryModal.tsx` and their tests
  - `HomeLivingPage.tsx`: its products grid now comes from the API
  - `ScrollToTop.tsx`, `seo.ts`
  - CLAUDE.md: delete §7 (legacy) and the transition note
- **Done when:**
  - No "Save X%", "Was £", "verified", Lead ID or source-channel code remains, so B2 and B5 are closed.
  - `ukch_source_channel` is never written.
- **Verify:** `grep` returns nothing; tests and browser pass.
- **Size:** M. **Needs:** 24, 25, 26

### 28. Plain-English copy, factual FAQ and the supplier line — P1-4, P1-11
- **Files:** `AboutPage`, `DeliveryReturnsPage`, `FaqPage`, `LegalPages` (How it works, Terms, Privacy), `MattressGuidePage`, `BedSizeGuidePage`, `informativePages.ts`
- **Done when:**
  - There is no Lead ID, referral or condition-grading jargon.
  - The supplier line appears exactly on How it works, on Terms and next to the contact buttons.
  - `/faq` and `/delivery-returns` give direct, factual answers in the first sentence. Facts come from the owner, never invented.
  - Every public page has one `<h1>`, a logical `h2`/`h3` order, and landmarks.
- **Verify:** read-through, a `grep` for banned terms, and a heading-outline check per route.
- **Size:** M/L. **Needs:** 27, plus the owner's delivery and returns facts

## Stage F — SEO, privacy, hardening, launch check

### 29. Server-rendered page content — P1-9, P1-11
- **Done when:**
  - For the homepage, category, product, `/faq` and `/delivery-returns`, the HTML the server sends already contains the `<h1>`, intro, product names, descriptions, prices and the answered Q&A. React then takes over.
  - The 3D story stays client-only.
- **Verify:** `curl` each page type and confirm the text is present without JavaScript (S18). Browser check that nothing flashes or doubles.
- **Size:** L (likely split in Phase 4). **Needs ADR:** full SSR, pre-render on publish, or content shell, compared in Phase 4 on cost and maintenance for a non-technical owner, with one recommended. **WhatsApp previews (S14) are the deciding criterion.** **Needs:** 24, 25, 26

### 30. Server-rendered page tags — P1-9
- **Files:** `server/seo/head.ts` and its test; `src/utils/seo.ts`, reduced to client-side updates after navigation
- **Done when:**
  - Every public page has, in the server HTML: a unique title (≤ 60), description (≤ 155), absolute canonical, robots per the 01-plan §3e table, Open Graph, Twitter card, and `og:locale` `en_GB`.
  - Product overrides are used when set.
  - Search, filtered/sorted, empty, 404 and dashboard pages are `noindex,follow`, and `/admin` and `/api` also send `X-Robots-Tag`.
  - The search query is capped at 100 characters (SEC-08).
  - **Every value in the server HTML is HTML-escaped (SEC-07).** A test puts `</script><script>alert(1)</script>` in every text field and finds no unescaped output.
- **Verify:** a test that crawls the seeded server HTML and checks uniqueness and length (S16). `curl` checks. Paste a product link into WhatsApp (S14).
- **Size:** M/L. **Needs:** 29, 21b

### 31. Structured data — P1-10
- **Files:** `server/seo/jsonLd.ts` and its test
- **Done when:**
  - Product + Offer (no `seller`; no Product markup when there is no price), BreadcrumbList, Organization, WebSite (no `SearchAction`) and FAQPage are present per 01-plan §3e.
  - `<`, `>`, `&`, U+2028 and U+2029 in JSON-LD text are escaped as `\uXXXX` (SEC-07).
- **Verify:** for each page type, a test parses every JSON-LD block from the server HTML and checks the required properties. Rich Results Test on 3 priced products in staging (S17).
- **Size:** M. **Needs:** 30

### 32. robots.txt and generated sitemap — P1-12
- **Files:** server routes `/robots.txt` and `/sitemap.xml`, with a sitemap builder test; delete `public/robots.txt` and `public/sitemap.xml`
- **Done when:**
  - `robots.txt` allows all except `/admin` and `/api/` and lists the sitemap.
  - The sitemap lists Published products and non-empty categories with `lastmod`.
  - An unpublished product drops out at once.
- **Verify:** tests (S19), plus a `curl` in staging.
- **Size:** S/M. **Needs:** 14

### 33. Self-hosted fonts — P1-7
- **Files:** `/public/fonts/*.woff2`, `index.html`, `index.css`
- **Done when:** no request goes to fonts.googleapis.com or fonts.gstatic.com, and the text looks the same.
- **Verify:** network panel (S15).
- **Size:** S. **Needs:** your OK to download the font files

### 34. Cookie banner removal — P1-7
- **Files:** remove `CookieConsentBanner.tsx`, `CookieConsentContext.tsx` and `cookieConsent.ts` and their tests; update `/cookies`, `Footer.tsx` and `FloatingWhatsAppButton.tsx`
- **Done when:**
  - A fresh audit confirms nothing optional is stored or loaded.
  - `/cookies` lists exactly what is stored.
  - There is no banner.
- **Verify:** storage and network audit (S15).
- **Size:** S/M. **Needs:** 27, 33, plus Phase 3 confirmation

### 35. Security headers — P1-6
- **Files:** `vercel.json` and/or the server, per the hosting ADR
- **Done when:**
  - The exact header set in 03-security §3 is sent: CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP.
  - It ran as Report-Only in staging first, then is enforced.
  - Nothing breaks.
- **Verify:**
  - Response headers checked with `curl`.
  - A browser console free of CSP errors on every route, both themes, the 3D pages and the dashboard.
- **Size:** S/M. **Needs:** 5, 6a, 33, the hosting ADR

### 36. Pin CDN assets to a commit SHA — P2-5
- **Files:** `modelUrl.ts`, `brand.ts`, `index.html`
- **Done when:** jsDelivr URLs use `@<sha>` instead of `@main`.
- **Verify:** browser, plus a unit test that no `@main` URL remains.
- **Size:** S. **Needs:** Phase 3 decision

### 37. Launch-readiness check
- **Files:** `docs/engineering/05-launch-check.md`
- **Done when:**
  - S1–S19 are each recorded as pass or fail, with evidence.
  - Core Web Vitals pass on mobile for product and category pages (PageSpeed Insights, S10).
  - The sitemap is submitted to **Google Search Console** and **Bing Webmaster Tools**. The owner does this with his own accounts, and I prepare the steps.
  - **Security gate:**
    - Every **High** item in 03-security is ticked, each with a passing test.
    - `npm audit` reports 0.
    - The CSP is enforced with 0 violations.
    - 2FA is on for GitHub and the hosting accounts, `main` is protected on both repos, and Dependabot alerts are on (SEC-16).
    - A backup restore has been tested.
- **Verify:** this step is the verification.
- **Size:** M. **Needs:** all of the above

---

**Order notes**
- Stage A and steps 7 and 36 can start before Phase 4. Everything that says **Needs ADR** waits.
- The Google Merchant Center feed is **not** a step: it was dropped (01-plan §3e).
- P0-1 (the interim badge fix) is **folded into step 27**, because the build isn't deployed (01-plan §5).
- Step 4 is a small fix to the current header, which step 23 replaces. It is kept because the cost is tiny and it fixes an accessibility failure now.
