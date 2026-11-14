# 01 — Plan

Status: **approved 14 Nov 2026**, with the five additions marked *(added)*. Inputs: the Phase 0 browser checks (14 Nov 2026), the previous audit, and the owner's decisions and UX answers in `00-dashboard-impact.md` §4–4d.

## 1. Goal, and why

**Goal:** turn UK Clearance Hub into a simple, reliable product showcase that a non-technical owner runs on his own. Visitors browse by picture, find a product and press "Ask on WhatsApp". The owner adds and edits products from his phone in a dashboard.

**Why:**
- **Confusing to use.** The homepage has 9 sections and the header has 3 layers. "Home & Living" drops shoppers into a long 3D story.
- **Unsafe to launch.**
  - Sample deals show fake "verified saving" badges (UK CMA / DMCC Act 2024 risk).
  - Pages go blank when a CDN fails.
  - Text fails WCAG AA contrast.
- **The owner cannot run it.** Every product change today means editing `src/data/deals.ts`.

## 2. Scope

**In scope**
- Reliability: error boundaries and fallback UI for the 3D layer and every route. Remove the raw.githack.com dependency on every 3D route, not only `/home-living`.
- Accessibility: fix contrast through the design tokens, fix the hidden focus stop in the mobile menu, and bring the tokens back in line with CLAUDE.md.
- New data model, plus a field-rules module shared by the dashboard and the server.
- Express API with database, photo storage and one owner login (security per Phase 3).
- Owner dashboard:
  - Categories: name, show in menu, menu order, image.
  - Products: list with search and category filter; add/edit with a live card preview; delete after a confirm step.
  - Works well on a phone.
- Public site reads categories and products from the API:
  - The menu is built from data.
  - Product pages show exactly two buttons: "Ask on WhatsApp" and "Email us".
  - The sitemap is generated from Published products.
- Remove the old model: savings badges, supplier IDs, `dealUrl`, Lead IDs, source-channel tracking, `threeDConfig` and the enquiry form. This also closes B2 and B5.
- UX simplification:
  - Header: one row.
  - Homepage: short — hero, picture category tiles and featured products.
  - 3D story: out of the shopping path.
  - Copy: plain words, with a minimal supplier disclosure.
- Speed: no 3D on the homepage or product pages, and photos resized when uploaded.
- Security headers, sent by the Express server (Vercel was removed from the plan on 14 Nov), and clean-up of the AI Studio leftovers.

**Out of scope**
- `bed.glb` compression: an optional pre-launch item, owned by the other repo.
- Analytics or tracking scripts.
- More than one dashboard user, or roles.
- Newsletter, reviews, wishlists.
- Google Merchant Center product feed: incompatible with a showcase that has no checkout (§3e).
- Supplier management in the dashboard.
- Rewriting the informative guides beyond the copy and the wording on how to contact us.

**Anti-goals (never)**
- A cart, checkout, on-site payments or customer accounts.
- Breaking the 3D scroll assembly (`useAssemblyTimeline.ts`, `BedSet.tsx`) or changing `MODEL_URL`, or moving, renaming or recreating `bed.glb`.
- A third-party CMS, or tracking scripts.
- Showing IDs, slugs or dates in any UI.
- Technical terms in the dashboard.
- Any owner action that can break the public site, e.g. deleting a category that still has products, or publishing a product with no photo.
- Packages added without an ADR and owner approval (CLAUDE.md §2 rule 1).

## 3. Prioritised backlog

**P0: launch blockers (risk, reliability, foundation)**

| # | Item | Reason |
|---|---|---|
| P0-1 | Remove saving badges and the "verified savings" wording now (interim fix) | Fake savings are a live legal risk if this build is reachable. A small change, ahead of the full model swap |
| P0-2 | Error boundaries: app, route, and 3D canvas; the HDR redirect applied on every 3D route | B1: any CDN failure blanks the page. `/about` and the other guide pages still fetch raw.githack.com |
| P0-3 | Contrast fix in `theme.css`/`theme.ts`; tokens synced with the CLAUDE.md table | B3: orange, sky-blue, WhatsApp-green and amber all fail AA, plus 3 more pairs in light mode |
| P0-4 | Shared field rules (`/shared`) with unit tests | One source of truth for dashboard and server validation |
| P0-5 | API + database + photo storage + owner auth | The owner cannot run the site without it. Phase 3 High items apply |
| P0-5a | *(added)* **Password reset by email link**, part of login | The owner will forget his password. See §3a |
| P0-5b | *(added)* **Automatic photo processing on upload**, part of photo storage | Phone photos are 3–8 MB, so S10 (about 3 s on 4G) fails without it. See §3b |
| P0-10 | *(added)* **Empty states** on the homepage, category pages and dashboard | The sample deals are being removed, so the site starts empty. See §3c |
| P0-6 | Dashboard: categories and products (list, search, filter, add/edit, preview, confirm delete) | Success criterion 1: the owner adds 10 products in week one |
| P0-7 | Public site reads the API: dynamic menu, category list, product page with the two buttons, generated sitemap | The website must show the owner's data |
| P0-8 | Remove the old model and its code (savings, supplier, `dealUrl`, Lead ID, source channel, enquiry modal, `threeDConfig`) | Closes B2 and B5 for good, and removes dead paths |
| P0-9 | API-down fallback: a friendly message and the WhatsApp/email contact instead of an empty page | Success criterion 4 now covers the API too |

**P1: the UX goal and hardening**

| # | Item | Reason |
|---|---|---|
| P1-1 | One-row header (logo, categories, small search, theme toggle; a menu button on mobile) | Owner goal: one simple header row |
| P1-2 | Homepage at no more than 5 sections: a hero with a one-line value proposition, picture category tiles, featured products, one trust/how-it-works strip with the supplier line, and a contact band | The 5-second rule. Browsing by picture comes first, and WhatsApp is not the first thing |
| P1-3 | 3D story reached only from one clearly labelled link or banner (proposed in Phase 4(d)) | D5: menu categories go straight to products |
| P1-4 | Plain-English copy pass and the minimal supplier disclosure (How it works, Terms, next to the contact buttons) | D6. Removes Lead ID, condition-grading and referral jargon |
| P1-5 | Mobile menu: the closed panel is `inert`, so it has no focus stops | B4: one hidden Tab stop sits inside `aria-hidden` |
| P1-6 | Security headers (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy, nosniff) | Phase 3 detail |
| P1-7 | *(revised)* **Cookie banner:** remove it only after confirming nothing optional is stored or loaded (no analytics, pixels or chat widgets). **Self-host the fonts** instead of using Google Fonts. Keep `/cookies` and list exactly what is stored | Once source tracking is gone, the banner covers about half the 375px screen for no reason. See §3d |
| P1-8 | No 3D on the homepage (hero slide 3 preview) | Speed: the homepage loads in about 3 s on 4G |
| P1-9 | *(expanded)* **Server-rendered page tags** on every public page: title, description, canonical, robots, Open Graph/Twitter, `og:locale en_GB`. Products get optional title/description overrides in the dashboard | Search engines and link previews read the HTML, not the JavaScript. See §3e |
| P1-10 | *(added)* **Structured data**, server-rendered: Product + Offer, BreadcrumbList, Organization, WebSite, FAQPage. Every page type is parsed in tests | Product rich results, and machine-readable facts for AI answers. See §3e |
| P1-11 | *(added)* **AEO content:** each category gets an intro and a 3–5 question Q&A, editable in the dashboard; a factual FAQ and Delivery & Returns page; clean semantic HTML | Direct answers that AI Overviews, ChatGPT and Perplexity can quote. See §3f |
| P1-12 | *(added)* **robots.txt and a generated sitemap**, listing Published products and non-empty categories | Lets crawlers in and tells them what exists. See §3e |

**P2: tidy-up**

| # | Item | Reason |
|---|---|---|
| P2-1 | Delete `SharedProductPreviewCanvas.tsx`, `metadata.json`, the console.warn patch and the AI Studio lines in `vite.config.ts` | Dead code and leftovers |
| P2-2 | Remove `@google/genai`; keep `express`, now used; replace `dotenv` with Node 24 `--env-file` | Unused dependencies. CLAUDE.md lists updated in the same commit |
| P2-3 | Rename the package from `react-example` to `uk-clearance-hub-web` | Hygiene |
| P2-4 | Bump esbuild past the Windows dev-server advisory (GHSA-g7r4-m6w7-qqqr) | The one low-severity `npm audit` finding |
| P2-5 | Pin jsDelivr assets to a commit SHA (decided in Phase 3) | Anyone who pushes to `anees2003/uk-clearance-hub@main` changes the live site |

## 3a–3e. Notes on the added items

**3a. Password reset (P0-5a).** Proposal: a **"Forgot password?" link on the login page sends a single-use reset link by email**.
- **Recipient:** the link always goes to the owner's address, fixed in server settings. It is never typed into the form, so nobody can redirect it.
- **Expiry and storage:** the link works for 30 minutes and can be used once. Only a hash of the token is stored.
- **Rate limits:** 3 requests per hour.
- **Same reply every time:** the form shows the same message whether or not an email went out.
- **What a reset does:** sets the new password and signs out every other session.
- **Developer fallback:** a developer-only command, `npm run owner:reset`, for when email itself is broken.

Email sending needs a small provider (Phase 4), called with plain `fetch` so no package is needed. Alternatives I rejected:
- **Recovery codes printed at setup:** a non-technical owner will lose them.
- **Developer-only reset:** the owner can't help himself, and it doesn't scale.

**3b. Photo processing (P0-5b).**
- **In the dashboard, before upload:** the browser shrinks each photo to about 2000px with `<canvas>` (no package), so uploading over 4G stays quick. The file picker accepts `image/jpeg,image/png,image/webp`, which makes iPhones convert HEIC to JPEG automatically.
- **On the server, always, whatever the browser did:**
  - checks the real file type and a size limit
  - **re-encodes** each photo to WebP at 3 widths (400 / 800 / 1600px), and makes the main photo a 1200×630 JPEG of 300 KB or less for WhatsApp previews
  - **strips all metadata**, including **GPS location from phone photos**
  - targets a card image of 80 KB or less
- **On the site:** `srcset` and `loading="lazy"`.
- The re-encoder is most likely `sharp`, a native package, so it needs an ADR and your approval in Phase 4.

**3c. Empty states (P0-10).**

| Where | Shown when empty |
|---|---|
| Homepage, no featured products | The Featured section is hidden; the category tiles stay |
| Homepage, no categories with products | One friendly block: "New clearance products are on their way", with Ask on WhatsApp and Email us |
| Category page, no published products | "Nothing here just now", a link back to all categories, and the contact buttons |
| Product page for a Draft or deleted product | The existing branded 404, with links to the categories |
| Dashboard, no categories | One big button: "Add your first category", with a one-line hint that products go inside categories |
| Dashboard, no products | One big button: "Add your first product". It becomes "Add a category first" when there are no categories |

Development and tests use seed fixtures (`npm run seed`). Production starts empty.

**3d. Cookie banner and fonts (P1-7).**
- **Today's audit:** the only external hosts are jsDelivr, Google Fonts and plain links (wa.me and the social sites). There are no analytics, pixels or chat widgets.
- **Stored today:** the theme in `localStorage`, the /deals scroll position in `sessionStorage`, the consent record itself, and the source channel, which is being removed.
- **Fonts:** Inter and Plus Jakarta Sans as `.woff2` files in `/public/fonts`. No package is needed, and I'll ask before downloading them.
- **Banner removal:** the banner and its consent code are removed only after a fresh audit at implementation time. `/cookies` stays and lists exactly what is stored.

**3e. SEO for a UK audience (P1-9, P1-10, P1-12).**

**Key constraint: the content itself must be in the server HTML, not only the tags.** Social preview crawlers (WhatsApp, Facebook) and most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't run JavaScript. So product names, descriptions, prices, category intros and Q&A must be in the HTML the server sends. Today the site is a client-only SPA. Phase 4 chooses how to do this: full SSR, pre-rendering on publish, or a server-rendered content shell that React then replaces. It is the largest SEO item.

*Per-page tags*

| Page | `<title>` (≤ 60 chars) | Description (≤ 155 chars) | Robots |
|---|---|---|---|
| Homepage | Fixed, written once | Fixed | index |
| Category | "<Category> Clearance Deals \| UK Clearance Hub" | From the category intro | index if it has Published products, otherwise noindex |
| Product | Override, or auto: name + "£price" + key detail (Condition) | Override, or auto: from the short description | index if Published |
| Guides, legal | Fixed per page | Fixed | index |
| Search results, filtered/sorted variants, empty states, 404 | Unique, generated | Generated | **noindex,follow** |
| Dashboard and `/api` | — | — | noindex, plus an `X-Robots-Tag` header |

- **Rules for every page:**
  - A self-referencing canonical, as an absolute `https://ukclearancehub.co.uk/...` URL with tracking and filter parameters stripped.
  - `<html lang="en-GB">`, `og:locale` `en_GB`, prices as "£", UK spelling and UK delivery wording.
- **Product overrides in the dashboard:** two optional fields, Google title and Google description.
  - Each has a live character counter (60 / 155) and a Google-style preview ("How this looks on Google").
  - They are auto-filled from the product's details until the owner edits them, and **Reset to automatic** restores that.
- **Owner simplicity comes first (condition of approval, 14 Nov 2026).**
  - Every SEO/AEO field sits in a collapsed **"Advanced (optional)"** section that is closed by default: Google title, Google description, the "How this looks on Google" preview, and the category Intro and Q&A.
  - Everything works with them left empty. Titles and descriptions are generated, and unanswered questions are hidden.
  - Adding a product needs **only the basic fields**.
- **WhatsApp previews come first (14 Nov 2026).**
  - WhatsApp shows `og:image`, `og:title` and `og:description` but ignores price-specific tags, so **the price goes into `og:title`**, e.g. "Savoy Ottoman Bed Frame – £699". When there is no price, the title is just the name.
  - `og:image` is the main photo as a 1200×630 JPEG of 300 KB or less, because WhatsApp drops large or slow images. It is an absolute HTTPS URL, with `og:image:width` and `og:image:height` set.

*Structured data (JSON-LD in the server HTML)*
- **Product pages:** `Product` with name, image (all photos), description, `sku`, and `itemCondition`:
  - New → `NewCondition`
  - Refurbished → `RefurbishedCondition`
  - Graded and Ex-display → `UsedCondition` (decided 14 Nov). The visible label stays as the owner picked it.

  The `Offer` holds price, `priceCurrency` GBP, `availability` (`InStock` or `OutOfStock`) and the URL.
  - **`seller` is omitted** (decided 14 Nov): suppliers sell, and no supplier names are shown.
  - **`sku`** is a generated, stable product code. It appears only in the JSON-LD and is never shown on the page.
  - **A product with no price outputs no `Product`/`Offer` markup.** Google requires an offer, review or rating for product rich results, and we have none of those without a price. Those pages keep their BreadcrumbList.
- **BreadcrumbList** on category and product pages.
- **Organization** on the homepage: name, logo, email `admin@ukclearancehub.co.uk`, telephone, and the 5 social profiles in `sameAs`.
- **WebSite** on the homepage: name and URL, with no `SearchAction` (Google retired the sitelinks search box in 2024).
- **FAQPage** on category Q&A blocks and on `/faq`. Google stopped showing FAQ rich results for most commercial sites in 2023, but the markup is still valid and helps machines read the answers.
- **Tests:** for each page type, a test renders the server HTML, parses every JSON-LD block and checks the required properties.

*robots.txt and sitemap*
- **`robots.txt`:** `User-agent: *` allows everything except `/admin` and `/api/`, and lists the sitemap.
  - Training crawlers stay **allowed** (decided 14 Nov), so there are no per-bot groups. A per-bot group would make that bot ignore the `*` rules.
  - This allows Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User, and the training crawlers.
- **Sitemap:** generated on request from Published products and from categories that have Published products, with `lastmod` from the updated date.

*Dropped (decided 14 Nov)*
- **Google Merchant Center feed.** Free listings require the link to reach a page where the shopper can add the product to a cart and check out. We have no cart or checkout, and suppliers sell, so the feed would be disapproved. Revisit only if the model changes.

**3f. AEO content (P1-11).**
- **Category model** gains **Intro** (optional, about 40–80 words) and **Questions & answers** (0–5 pairs).
  - A new category starts with 3 suggested questions and **blank answers**: "Are these items new?", "How long does UK delivery take?" and "Can I return a clearance item?". The owner writes the facts; we never invent delivery or returns claims.
  - Only answered questions are shown.
  - Each answer is written as a direct answer in the first sentence.
- **`/faq` and `/delivery-returns`:** rewritten as plain, factual answers using the same pattern, with FAQPage markup on `/faq`.
- **Semantic HTML, checked on every public page:** exactly one `<h1>`, a logical `h2`/`h3` order, real text (never text in images), descriptive `alt` text, and `<main>`, `<nav>` and `<footer>` landmarks.

**CLAUDE.md change, applied 14 Nov 2026 with the "Advanced (optional)" condition:**
- §7.0 gains the Category fields **Intro** and **Questions & answers** (0–5), and the Product fields **Google title** and **Google description** (optional, auto-filled).
- The JSON-LD rule becomes the rules above.
- §10 item 5 adds Bing Webmaster Tools, and records that the Merchant Center feed was dropped and why.

## 4. Success criteria

| # | Criterion | How it's measured |
|---|---|---|
| S1 | A first-time visitor understands the business within 5 s | At 375px, the first screen shows a one-sentence headline saying what the site is, plus category tiles. A 5-second test with 3 non-technical people: at least 2 of 3 describe it correctly |
| S2 | Any published product is reachable in **at most 2 clicks** from the homepage | Homepage → category → product, or homepage → featured product. Checked against the route map |
| S3 | **One** header row at 375px and 1366px | Browser check, both themes |
| S4 | Homepage has **at most 5 sections** between header and footer (today: 9) | Browser check |
| S5 | Every product page shows "Ask on WhatsApp" and "Email us" on the first screen at 375px, with the product name prefilled and text that identifies the site | Browser check, plus a unit test of the link builder |
| S6 | All text meets **4.5:1** (large text 3:1) and UI parts meet **3:1**, in both themes | The contrast scan from Phase 0 run on every route, with 0 failures |
| S7 | No route ever goes blank when jsDelivr, raw.githack.com, gstatic or the API is blocked | The Phase 0 fetch-blocking check, repeated per host on `/`, a category, a product, `/home-living`, `/about` |
| S8 | The owner adds **at least 10 products in week one**, each in **under 5 minutes**, without help | Before launch: a non-technical tester adds a product with 3 photos on a phone, with no instructions, in under 5 minutes |
| S9 | The owner cannot break the site | Server tests: invalid fields are rejected, a category with products cannot be deleted, Drafts never appear publicly |
| S10 | *(tightened)* The homepage loads in **about 3 s** on a phone over 4G. **Product and category pages pass Core Web Vitals on mobile**: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 | Before launch: PageSpeed Insights / Lighthouse mobile. After launch: field data in Search Console once there are about 28 days of traffic. `/home-living` is excluded |
| S11 | All Phase 3 **High** findings fixed before launch | Checklist in `03-security.md` |
| S12 | Each commit: `npm test`, `npm run lint` and `npm run build` green | Run before every commit |
| S13 | WhatsApp enquiries are countable without tracking | The prefilled text reads like *"Hi UK Clearance Hub, I'm interested in <product name> (seen on your website)."* No target yet: set after month one |
| S14 | *(priority)* **A product link shared on WhatsApp shows the product's photo, name and price in the preview** (name only when there is no price) | Fetch the product URL without JavaScript (`curl`) and confirm `og:title` (name + £price), `og:image` (≤ 300 KB, absolute URL) and `og:description`. Then paste 3 product links into a real WhatsApp chat on iPhone and Android in staging |
| S15 | *(added)* No optional storage and no third-party requests on page load except the asset CDN | Network panel on `/`: no Google Fonts and no other third parties. Storage audit matches `/cookies` |
| S16 | *(added)* Every public page has a **unique** title (≤ 60), description (≤ 155) and an absolute canonical, **in the server HTML** | A test crawls the seeded site's server HTML and checks uniqueness and length. `curl` spot checks |
| S17 | *(added)* Every **priced** product page passes Google's **Rich Results Test** for Product. Products without a price output no Product markup (§3e) | Rich Results Test on 3 products in staging, plus the JSON-LD parsing tests |
| S18 | *(added)* Each category page shows an **intro and a Q&A block that the owner edits** in the dashboard, both in the server HTML | Browser, plus `curl`: text present without JavaScript |
| S19 | *(added)* The **sitemap lists only Published products** and non-empty categories. The Merchant Center feed was dropped (§3e) | Sitemap builder unit test, plus a staging check after a product is unpublished |
| S20 | *(added)* **A non-technical owner adds a product without opening "Advanced (optional)"**, and the product still gets a generated title, description and social preview | Part of the S8 usability test. The tester is never told the section exists. Then check the product's server HTML |

## 5. Risks and assumptions

**Risks**
- **Hosting persistence.** The database file and photos need a persistent disk, which Vercel can't provide.
  - The client has IONOS hosting, plan unknown, so hosting is deferred (04-architecture ADR F). The server stays portable, with SQLite and photos on ordinary disk under `DATA_DIR`.
  - **Node.js needs an IONOS VPS or Cloud Server.** Shared Web Hosting can't run it.
  - Confirmed in step 40.
- **Server-rendered content (the largest SEO/AEO risk).** Social preview crawlers and most AI crawlers don't run JavaScript, so a client-only SPA is invisible to them.
  - Rendering public pages on the server touches the router, the data loading, and code that uses `window` (GSAP, Lenis, three.js).
  - Phase 4 compares full SSR, pre-render-on-publish and a content shell.
  - The 3D story stays client-only in every option.
- **API outage hides the catalogue.** Mitigated by P0-9 fallback messaging and short-lived caching (Phase 4).
- **Single owner account.** A forgotten password locks him out. A recovery path is defined in Phase 3.
- **Native packages.** An image re-encoder such as `sharp` must work on Windows for development and on the Linux host. Checked in Phase 4.
- **Size.** P0-5 and P0-6 are the largest items, both L. Each one is split into several shippable commits in Phase 2.
- **3D regressions.** Header and homepage changes must not touch the scroll assembly. `/home-living` gets a browser check on every UI step.
- **Legal.** The minimal supplier disclosure and condition labels still need the pre-launch adviser review (CLAUDE.md §10 item 2).

- **iPhone photos (HEIC).** Mitigated by the `accept` list in §3b. Tested on a real iPhone before launch.

**Assumptions** (confirmed by the owner, 14 Nov 2026, unless marked)
- The current build is **not deployed**. So P0-1 is folded into the model-removal step instead of shipping as a throwaway interim fix.
- The guide pages move to the footer (approved).
- `admin@ukclearancehub.co.uk` is monitored and is the "Email us" target.
- The owner uses WhatsApp, ideally WhatsApp Business, on +44 7344 540043, and has a smartphone for the dashboard.
- Volumes stay small: one owner, hundreds of products at most, low traffic. A free or very cheap tier is enough.
- Express stays the server framework (owner decision).
- The informative guides (`/mattress-guide`, `/bed-size-guide`, `/delivery-returns`, `/faq`, `/about`, `/contact`) stay, with copy updates only. They move out of the header into the footer.
- `admin@ukclearancehub.co.uk` is monitored for "Email us" messages.
