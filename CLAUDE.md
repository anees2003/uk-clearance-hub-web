# UK Clearance Hub — Project Guide

## 1. Project overview & business model
**UK Clearance Hub** is a commission-based product discovery and referral website for UK clearance shoppers, featuring a photorealistic, scroll-driven 3D bedroom set (`bed.glb`), category deal discovery, and informative guides.

### Business model (critical — applies to all steps from Step 9 onwards)
- **Referral & product discovery platform**: UK Clearance Hub does **NOT** sell or hold stock directly: **no shopping cart, no checkout, and no on-site payments**.
- **Supplier fulfilment**: Verified UK suppliers own the stock, process orders, and handle UK delivery, returns, and statutory warranties.
- **Deal actions**: Each product displays transparent clearance information and links out via **"View Deal"** to the supplier/affiliate URL; customers can also click **"Enquire Now"** or message the team directly on **WhatsApp** (`+44 7344 540043`).
- **No backend / no admin dashboard**: Pure frontend React 19 + TypeScript application; no admin dashboard or backend database is required.
- **Primary site categories**:
  1. **Electronics & Gadgets** (`/deals?category=Electronics+%26+Gadgets`)
  2. **Home Appliances** (`/deals?category=Home+Appliances`)
  3. **Home & Living** (`/deals?category=Home+%26+Living` — houses beds, mattresses, headboards, bedside tables, and the 3D bed story)
  4. **All Deals** (`/deals`)
- **Workflow & repository**: Built in Google AI Studio and synced to GitHub repository `anees2003/uk-clearance-hub-web`.
- **Locale & currency**: Strictly UK English (`colour`, `centre`, `upholstered`, `whilst`, `guarantee`) and Pound Sterling (`£`) pricing throughout.

---

## 2. Tech stack and package rules

### Exact `package.json` dependencies
```json
"dependencies": {
  "@google/genai": "^2.4.0",
  "@react-three/drei": "^10.7.9",
  "@react-three/fiber": "^9.8.2",
  "@react-three/postprocessing": "^3.2.2",
  "@tailwindcss/vite": "^4.3.3",
  "@types/three": "^0.187.0",
  "@vitejs/plugin-react": "^6.1.1",
  "dotenv": "^17.2.3",
  "express": "^4.21.2",
  "gsap": "^3.15.1",
  "lenis": "^1.3.27",
  "lucide-react": "^0.546.0",
  "motion": "^12.23.24",
  "postprocessing": "^6.39.6",
  "react": "^19.0.1",
  "react-dom": "^19.0.1",
  "react-router-dom": "^7.18.5",
  "three": "^0.187.0",
  "vite": "^8.3.0"
}
```

### Exact `package.json` devDependencies
```json
"devDependencies": {
  "@types/express": "^4.17.21",
  "@types/node": "^22.14.0",
  "@types/react": "^19.3.0",
  "@types/react-dom": "^19.3.0",
  "autoprefixer": "^10.4.21",
  "esbuild": "^0.25.0",
  "tailwindcss": "^4.3.3",
  "tsx": "^4.21.0",
  "typescript": "^7.0.2"
}
```

### Package & architecture rules
1. **No extra packages**: Never install packages beyond the agreed list in `package.json` without an explicit requirement.
2. **No GSAP `SplitText`**: Do not use the paid Club GSAP `SplitText` plugin. Always use the custom line-splitting utility `/src/animations/splitLines.ts` (`splitLines(element)`), which wraps words, groups them by `offsetTop`, and creates `.split-line-mask` (`overflow: hidden`) and `.split-line-inner` (`display: block`) wrappers with a full `revert()` method.
3. **Single GSAP registration point**: `ScrollTrigger` and `Flip` are registered once in `/src/animations/gsap.ts`. Always import `{ gsap, ScrollTrigger, Flip }` from `/src/animations/gsap.ts`.
4. **Lenis + ScrollTrigger sync**: Smooth scrolling is managed by `/src/animations/useLenis.ts` (`useLenis()`), which connects `lenis.on('scroll', ScrollTrigger.update)` and drives `lenis.raf(time * 1000)` inside `gsap.ticker` with `gsap.ticker.lagSmoothing(0)`. Use `getLenisInstance()` or `setLenisLocked(locked)` to control scroll programmatically.

---

## 3. 3D model (critical)

- **Canonical URL (`/src/three/modelUrl.ts`)**:
  ```ts
  export const MODEL_URL = "https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/bed.glb";
  ```
  The GLB is hosted in the separate repository `anees2003/uk-clearance-hub` and served via jsDelivr CDN. **Never move, rename, or delete it, and never bundle or recreate the bed model procedurally.** Always load it with `useGLTF(MODEL_URL)` and preload with `useGLTF.preload(MODEL_URL)`.
- **Named nodes (9 children of the `"Bed"` group)**:
  Each node has its pivot at its own bounding centre:
  1. `Base` (`base`)
  2. `Mattress` (`mattress`)
  3. `Headboard` (`headboard`)
  4. `Pillows_Back` (`pillowsBack`)
  5. `Pillows_Front` (`pillowsFront`)
  6. `Nightstand_Left` (`nightstandLeft`)
  7. `Nightstand_Right` (`nightstandRight`)
  8. `Lamp_Left` (`lampLeft`)
  9. `Lamp_Right` (`lampRight`)
- **Coordinate orientation**:
  In local model space, the bed's head points to `-X` and its width runs along `Z`. In `/src/three/BedSet.tsx`, the outer group is rotated (`BED_GROUP_ROTATION = [0, 0.72, 0]`) so the camera views it from a flattering front-three-quarter angle, and translated vertically (`BED_FLOOR_Y_OFFSET = 0.087586`) so the base sits flush on the studio floor (`y = 0`).
- **Material & mesh settings**:
  Every mesh keeps its original PBR textures and materials with:
  - `material.emissiveIntensity = 0.15`
  - `material.envMapIntensity = 1.0`
  - `mesh.castShadow = true` and `mesh.receiveShadow = true`
  - Texture anisotropy set to `gl.capabilities.getMaxAnisotropy()`
- **Licence & attribution**:
  `"Bed 07"` 3D model by **Doaa Sheha** (Sketchfab), licensed under **CC BY 4.0**. The credit (`Bed 07 3D model by Doaa Sheha (Sketchfab), CC BY 4.0.`) must remain in `/src/components/layout/Footer.tsx`.

---

## 4. Brand identity, semantic theme tokens & design system (updated in Step 9 & Step 9B)

Defined in `/src/data/brand.ts`, `/src/data/theme.ts`, `/src/context/ThemeContext.tsx`, `/src/styles/theme.css`, and `/src/index.css`:

### Official brand assets per theme (jsDelivr CDN)
- **Dark theme full logo (`BRAND_LOGO_DARK_URL`)**:
  `https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo-dark.png`
- **Light theme full logo (`BRAND_LOGO_LIGHT_URL` / `BRAND_LOGO_URL`)**:
  `https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo.png`
- **Icon only (both themes, `BRAND_ICON_URL`)**:
  `https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-icon.png`
- **Usage rules**:
  - **Header**: Uses `BRAND_ICON_URL` (`~40px` high) next to the text wordmark `"UK Clearance Hub"` with `"UK Clearance"` in `var(--text)` (`text-text`) and `"Hub"` in `var(--accent)` (`text-accent`), with automatic text-only fallback if the image fails to load.
  - **Preloader & Footer**: Use `getBrandLogoUrl(theme)` (`uk-clearance-hub-logo-dark.png` in dark mode, `uk-clearance-hub-logo.png` in light mode) with width/height attributes, `object-fit: contain`, and text wordmark fallback on error.
  - **Favicon & `apple-touch-icon` (`/index.html`)**: Set to `https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-icon.png`.

### Semantic theme tokens (`[data-theme="dark"]` default & `[data-theme="light"]`)
Every component and page uses semantic CSS variables mapped to Tailwind utilities (zero hard-coded hex colours in components or pages):

| Semantic Variable | Tailwind Utility | Dark Theme (Default) | Light Theme |
| :--- | :--- | :--- | :--- |
| `--bg` | `bg-bg` / `text-bg` | `#07090F` | `#F6F8FC` |
| `--bg-elevated` | `bg-bg-elevated` | `#0D1220` | `#FFFFFF` |
| `--surface` | `bg-surface` | `#111827` | `#FFFFFF` |
| `--surface-2` | `bg-surface-2` | `#172036` | `#EEF2F9` |
| `--border` | `border-border` | `rgba(255, 255, 255, 0.08)` | `rgba(4, 28, 88, 0.10)` |
| `--border-strong` | `border-border-strong` | `rgba(255, 255, 255, 0.16)` | `rgba(4, 28, 88, 0.18)` |
| `--text` | `text-text` | `#F5F7FB` | `#041C58` |
| `--text-muted` | `text-muted` | `#9AA6C2` | `#5B6785` |
| `--primary` | `bg-primary` / `text-primary` | `#16A5F4` | `#1170D8` |
| `--primary-hover` | `hover:bg-primary-hover` | `#3BB7FF` | `#0D5BB5` |
| `--primary-contrast` | `text-primary-contrast` | `#041C58` | `#FFFFFF` |
| `--accent` | `bg-accent` / `text-accent` | `#FD7209` | `#FD7209` |
| `--accent-hover` | `hover:bg-accent-hover` | `#FF8524` | `#E56000` |
| `--amber` | `text-amber` / `bg-amber` | `#FFC829` | `#FFC829` |
| `--navy-deep` | `bg-navy-deep` | `#041C58` | `#041C58` |
| `--success` | `text-success` / `bg-success` | `#22C55E` | `#16A34A` |
| `--focus-ring` | `outline-focus-ring` | `#16A5F4` | `#1170D8` |
| `--shadow` | `shadow-theme` | `0 12px 32px rgba(0, 0, 0, 0.45)` | `0 8px 24px rgba(4, 28, 88, 0.06)` |
| `--shadow-hover` | `shadow-theme-hover` | `0 18px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(22, 165, 244, 0.14)` | `0 14px 32px rgba(4, 28, 88, 0.12)` |
| `--glow-hero` | `bg-hero-glow` | Subtle radial `#16A5F4` + `#FD7209` glow | Subtle radial `#16A5F4` + `#FD7209` glow |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Shared `200–300ms` transition curve | Shared `200–300ms` transition curve |

### Theme switch, persistence & circular View Transition
- **Default & persistence**: Default theme is **`dark`**. Persisted in `localStorage` under `'uk-clearance-hub-theme'` (wrapped in `try/catch`). An inline `<script>` in `/index.html` sets `document.documentElement.dataset.theme` before first paint so there is never a flash of the wrong theme.
- **Toggle controls**:
  - Header desktop & mobile icon buttons (`data-testid="theme-toggle-desktop"`, `data-testid="theme-toggle-mobile-header"`) and mobile menu row (`data-testid="theme-toggle-mobile-menu"`).
  - Accessible `aria-label`: `"Switch to light theme"` when dark, `"Switch to dark theme"` when light, with rotating sun/moon SVG icons (`350ms` cubic-bezier).
- **Circular reveal animation**:
  - Uses `document.startViewTransition` when supported and `prefers-reduced-motion` is not active, animating `::view-transition-new(root)` with `clip-path: circle(0px at Xpx Ypx)` → `circle(maxRadius at Xpx Ypx)` over `700ms` (`cubic-bezier(0.22, 1, 0.36, 1)`).
  - Falls back to a `250ms` CSS colour/background cross-fade when `startViewTransition` is unavailable or reduced motion is preferred.

### Typography (Google Fonts loaded in `/index.html`)
- **Headings**: `"Plus Jakarta Sans"` (weights 600, 700, 800), tight letter-spacing `-0.02em`.
- **Body & UI**: `"Inter"` (weights 400, 500, 600).

### Official contact & social channels (`/src/data/brand.ts`)
- **Email**: `admin@ukclearancehub.co.uk`
- **WhatsApp**: `+44 7344 540043` (`https://wa.me/447344540043`, prefilled link `https://wa.me/447344540043?text=Hi%20UK%20Clearance%20Hub%2C%20I%20have%20a%20question%20about%20a%20deal.`)
- **Social links**:
  - Facebook: `https://www.facebook.com/ukclearancehub.official`
  - Instagram: `https://www.instagram.com/ukclearancehub/`
  - TikTok: `https://www.tiktok.com/@ukclearancehub`
  - X: `https://x.com/ukclearancehub`
  - Snapchat: `https://www.snapchat.com/@ukclearancehub`

---

## 5. Rendering setup & 3D theme syncing

Implemented in `/src/three/StudioScene.tsx`, `/src/three/BedSet.tsx`, `/src/three/SharedProductPreviewCanvas.tsx`, and `/src/three/SharedViewCanvas.tsx`:

- **Renderer & Tone Mapping**:
  - `<Canvas>` with `THREE.PCFShadowMap`, `THREE.ACESFilmicToneMapping`, `toneMappingExposure: 1.0`, `outputColorSpace: THREE.SRGBColorSpace`, `dpr={[1, 1.5]}` on mobile/low-power devices (`<= 4` hardware threads) and `[1, 2]` on desktop (with automatic software-WebGL fallback detection `isSoftwareGl` for headless testing).
  - **Adaptive Quality & Power Saving (Step 13)**:
    - Wrapped in `@react-three/drei`'s `<PerformanceMonitor>`: uses `halfRes` ambient occlusion on mobile/low-power devices, and dynamically disables `N8AO` and `Bloom` (`lowPerfMode`) if frame rates drop below ~50 FPS.
    - Pauses WebGL rendering (`frameloop="never"`) whenever the canvas scrolls offscreen (`IntersectionObserver`) or the browser tab is hidden (`document.visibilityState === 'hidden'`).
    - Cloned materials and scene resources in `BedSet.tsx` are explicitly disposed on unmount.
  - **GLB Asset Size & Compression Guide (`bed.glb`)**:
    - Current CDN asset (`https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/bed.glb`) is `13,864,452 bytes` (`~13.86 MB`) with embedded `2048×2048` PBR textures.
    - `BedSet.tsx` calls `useGLTF(MODEL_URL, true)` with the Draco decoder enabled out of the box, so a compressed `.glb` file works as a zero-code drop-in replacement.
    - To compress `bed.glb` down to `~1.5–2.5 MB` before production hosting, run `@gltf-transform/cli` with `meshopt` (or `draco`) geometry compression and `WebP` / `KTX2` `1024×1024` textures:
      ```bash
      npx @gltf-transform/cli optimize bed.glb bed-compressed.glb \
        --compress meshopt \
        --texture-compress webp \
        --texture-size 1024
      # Or with Draco + KTX2 (Basis Universal):
      npx @gltf-transform/cli optimize bed.glb bed-draco.glb \
        --compress draco \
        --texture-compress ktx2 \
        --texture-size 1024
      ```
- **Camera**:
  - `<PerspectiveCamera makeDefault fov={30} near={0.1} far={100} />`.
  - Driven every frame in `BedSet.tsx` via `useFrame`: interpolates `cameraPosition` and `cameraTarget` from the master GSAP timeline, pushes the camera `1.3x` further back on viewports `< 768px`, applies subtle desktop mouse parallax (`±0.08` units smoothed, decaying to `0` when the mouse stops), applies the one-time `1.5s` hero intro dolly on `"uk-clearance-hub:ready"`, and calls `camera.lookAt(cameraTarget)`.
  - When `prefers-reduced-motion: reduce` is active, scroll-scrubbed flying parts and camera orbits are bypassed and the assembled bed is displayed immediately at a clean front-three-quarter angle.
- **Studio Environment, Lighting & Theme Sync (`STUDIO_3D_THEME_CONFIG`)**:
  - `<Environment preset="studio" resolution={256} environmentIntensity={0.6}>` containing 4 `<Lightformer>` softboxes plus cool blue (`#16A5F4`) and warm orange (`#FD7209`) rim `Lightformer`s.
  - On theme switch (`dark` ↔ `light`), `StudioScene` and `SharedViewCanvas` smoothly tween the studio background, fog, floor colour, shadow opacity, rim light intensities, and bloom over `600ms` using GSAP without reloading `bed.glb`:
    - **Dark studio**: background `#07090F`, floor `#0B0F18`, stronger contact shadows (`0.72`), sky-blue (`0.42`) & warm-orange (`0.22`) rim `Lightformer`s, bloom intensity `0.22`.
    - **Light studio**: background `#F6F8FC`, floor `#F6F8FC`, softer contact shadows (`0.58`), subtle rim `Lightformer`s, bloom intensity `0.15`.

---

## 6. Folder structure

```text
/src
├── App.tsx                                  # Root BrowserRouter, ThemeProvider, Layout wrapper, and React.lazy route definitions
├── main.tsx                                 # React 19 entry point mounting App
├── index.css                                # Global stylesheet importing /src/styles/theme.css
├── context/
│   ├── ThemeContext.tsx                     # ThemeProvider & useTheme() with localStorage persistence & circular View Transition
│   └── CookieConsentContext.tsx             # CookieConsentProvider & useCookieConsent() for UK PECR banner & settings modal
├── styles/
│   └── theme.css                            # Semantic [data-theme="dark"|"light"] variables, Tailwind v4 @theme tokens & mobile rules
├── utils/
│   ├── seo.ts                               # useSeo hook, getDealRobotsDirective, getSitemapUrls, OpenGraph/Twitter & JSON-LD builders
│   ├── seo.test.ts                          # Unit tests for SEO meta lengths, sample noindex/sitemap filtering & JSON-LD
│   ├── studioProgressStore.ts               # Lightweight pub/sub store decoupling Preloader & Layout from Three.js bundles
│   └── useModalFocusTrap.ts                 # WCAG 2.2 AA focus trap, Escape key handler & trigger focus restoration hook
├── animations/
│   ├── gsap.ts                              # Registers GSAP ScrollTrigger & Flip once and exports them
│   ├── useLenis.ts                          # Lenis smooth scroll hook synced with GSAP ticker & prefers-reduced-motion
│   ├── splitLines.ts                        # Custom DOM word/line splitter (.split-line-mask / .split-line-inner)
│   ├── useAssemblyTimeline.ts               # Master scrubbed GSAP timeline for 9-part bed assembly + camera moves (reduced-motion aware)
│   └── useAssemblyTimeline.test.ts          # Node unit tests for assembly math, camera orbit, splitLines & progress
├── three/
│   ├── modelUrl.ts                          # Exports canonical MODEL_URL for bed.glb on jsDelivr CDN
│   ├── bedParts.ts                          # Typed node map, original transform extractor, and BedSetHandle types
│   ├── bedParts.test.ts                     # Unit tests for MODEL_URL and 9-node transform extraction
│   ├── BedSet.tsx                           # Loads/clones bed.glb (Draco enabled), disposes materials, runs per-frame camera & lamps
│   ├── StudioScene.tsx                      # R3F Canvas, adaptive PerformanceMonitor, offscreen pause & theme-synced Environment/Floor/Fog
│   ├── productModelUtils.ts                 # Category node visibility, Z-scale size tweening & material colour tweening
│   ├── SharedProductPreviewCanvas.tsx       # Offscreen single-pass 3D snapshot renderer for product cards
│   ├── SharedViewCanvas.tsx                 # On-demand @react-three/drei View.Port + theme-synced 3D views for informative pages
│   └── index.ts                             # Barrel exports for 3D scene modules
├── data/
│   ├── brand.ts                             # Official dark/light logos, icon, contact details, social URLs, categories & search URL builder
│   ├── theme.ts                             # Pure theme config, palettes, 3D studio theme parameters & circular reveal radius math
│   ├── theme.test.ts                        # Unit tests for theme resolution, toggle helpers, 3D config & circular reveal radius
│   ├── cookieConsent.ts                     # UK PECR cookie consent categories, versioned localStorage persistence & hasConsent()
│   ├── cookieConsent.test.ts                # Unit tests for UK PECR consent categories, version migration & hasConsent()
│   ├── assemblyChapters.ts                  # 8 chapter definitions, panel copy/specs, and ChapterProgress math helpers
│   ├── assemblyChapters.test.ts             # Unit tests for chapter metadata & progress helpers
│   ├── suppliers.ts                         # 3 sample UK suppliers (SUP-001..SUP-003) & getSupplierById helper
│   ├── deals.ts                             # 18 live referral deals + 2 expired/unavailable deals, verified saving & outbound URL helpers
│   ├── leadFlow.ts                          # Lead ID generator (UKCH-YYYYMMDD-XXXX), sessionStorage source channel & WhatsApp/mailto builders
│   ├── deals.test.ts                        # Unit tests for deals, verified savings, outbound URLs, Lead ID format & internal ID DOM safety
│   ├── homePageData.ts                      # Step 11 homepage carousel slides, category stats, featured/new selectors & condition guide
│   ├── homePageData.test.ts                 # Unit tests for Step 11 homepage & /home-living helpers
│   ├── informativePages.ts                  # Pure data & helpers for Mattress Guide, Bed Size Guide, FAQ & Contact validation
│   ├── informativePages.test.ts             # Unit tests for firmness squash math, room-size calculator, FAQ filter/hash & contact form
│   ├── navigation.ts                        # Header categories, Footer Shop/Help/Legal columns, slug formatter & email validator
│   └── navigation.test.ts                   # Unit tests for navigation data, search URL builder & newsletter validation
├── components/
│   ├── home/
│   │   ├── HeroBannerCarousel.tsx           # 3-slide accessible hero carousel with pause toggle, lazy 3D preview & below-banner search
│   │   ├── HeroChapterSection.tsx           # Home & Living hero chapter (#chapter-hero, 100dvh) with intro reveal & scroll-out scrub
│   │   └── AssemblyChapterPanel.tsx         # Renders Hero or alternating chapter text panels (100dvh) with splitLines & ScrollTrigger
│   ├── products/
│   │   ├── DealImagePlaceholder.tsx         # Theme-aware branded gradient placeholder with subcategory line icon & "Image coming soon"
│   │   ├── ProductCard.tsx                  # Retail-style DealCard with verified savings, condition, stock dot & >=44px action buttons
│   │   ├── PriceRangeSlider.tsx             # Custom keyboard-accessible dual-handle GBP price range slider
│   │   └── ReservationEnquiryModal.tsx      # Focus-trapped deal enquiry modal with aria-describedby errors, Lead ID & WhatsApp/Email dispatch
│   ├── layout/
│   │   ├── Header.tsx                       # Sticky theme-aware header with utility bar, icon+wordmark, search, theme toggle & focus-trapped mobile menu
│   │   ├── Footer.tsx                       # Theme-aware footer with theme logo, referral blurb, Shop/Help/Legal columns, Cookie Settings trigger, 5 socials & CC BY 4.0 credit
│   │   ├── CookieConsentBanner.tsx          # UK PECR bottom cookie banner + focus-trapped Cookie Settings modal (Necessary, Analytics, Marketing)
│   │   ├── Preloader.tsx                    # First-load theme-aware preloader (waits for bed.glb only on routes that use the 3D model)
│   │   ├── ScrollToTop.tsx                  # Scrolls to top on new pages & restores /deals scroll position on browser back (POP)
│   │   ├── Layout.tsx                       # App shell with Skip to content link, Suspense, on-demand SharedViewCanvas & ~520ms route transitions
│   │   └── index.ts                         # Barrel exports for layout components
│   └── ui/
│       ├── Button.tsx                       # Primary, accent CTA & outline buttons with hover lift/glow & active:scale-[0.98]
│       ├── ChapterProgress.tsx              # Right-edge 7-stop vertical progress bar (desktop) & top 2px bar (mobile)
│       ├── Container.tsx                    # 1440px max-width container with fluid horizontal padding
│       ├── EditorialPageHero.tsx            # Shared hero component for informative/legal pages with useSeo, line-split heading & optional 3D slot
│       ├── Eyebrow.tsx                      # Uppercase 0.2em tracked eyebrow label with optional accent dot
│       ├── FilmGrain.tsx                    # Subtle fixed SVG noise overlay
│       ├── FloatingWhatsAppButton.tsx       # Fixed bottom-right #25D366 WhatsApp button (auto-hides when modals/menus/sheets/banners open)
│       ├── SectionHeading.tsx               # Reusable section header block
│       └── index.ts                         # Barrel exports for UI primitives
└── pages/
    ├── HomePage.tsx                         # Deals-focused homepage (/) with 3-slide HeroBannerCarousel, search, category tiles, featured/new deals & guides
    ├── HomeLivingPage.tsx                   # Home & Living (/home-living) with fixed StudioScene, 8-chapter 3D bed assembly story, live Home & Living deals & guides
    ├── ClearanceDealsPage.tsx               # All Deals page (/deals) with desktop sidebar, focus-trapped mobile filter sheet, aria-live count & GSAP Flip grid
    ├── BedDetailPage.tsx                    # Deal Detail page (/deals/:slug; /beds/:slug redirects) with lazy 3D/gallery, sample noindex, Lead ID & expired state
    ├── MattressGuidePage.tsx                # /mattress-guide with 3D Mattress View, 1–10 firmness calibrator & comparison table
    ├── BedSizeGuidePage.tsx                 # /bed-size-guide with top-down SVG visualiser & 60cm room-size floor planner
    ├── DeliveryReturnsPage.tsx              # /delivery-returns with UK regions, service tiers, 5-stage GSAP timeline & UK consumer rights
    ├── AboutPage.tsx                        # /about with 3D full bed View, referral story, provenance cards & pinned 5-stage inspection timeline
    ├── FaqPage.tsx                          # /faq with live search, 6 category tabs, 12 accordions, deep-link hashes & #privacy/#cookies/#terms anchors
    ├── ContactPage.tsx                      # /contact with accessible floating-label form, ?topic=supplier support, 3D pillows View & WhatsApp/email links
    ├── LegalPages.tsx                       # /privacy (PrivacyPolicyPage), /cookies (CookiePolicyPage), /terms (TermsOfUsePage) & /how-it-works (HowItWorksPage)
    ├── NotFoundPage.tsx                     # Branded 404 page (*) with deal search bar, popular search chips & links to /deals and /
    ├── PlaceholderPage.tsx                  # Reusable placeholder template
    ├── RoutePages.tsx                       # Exports route components
    └── index.ts                             # Barrel exports for page components
```

---

## 7. Referral product data model, deal management & lead flow (Step 10)

### 7.1 `Deal` data model (`/src/data/deals.ts`) & `Supplier` (`/src/data/suppliers.ts`)
- **Internal IDs (never rendered in the UI)**:
  - `id`: Product ID (`"UKCH-P-0001"` through `"UKCH-P-0020"`).
  - `supplierId`: Internal supplier reference (`"SUP-001"`, `"SUP-002"`, `"SUP-003"`).
  - Neither `id` nor `supplierId` is ever rendered in the DOM; only `supplierName` is shown (`"Sold and delivered by <supplierName>"`), while `id` and `supplierId` are included in outbound WhatsApp/Email enquiry payloads.
- **Public & functional fields**:
  - `slug`, `title`, `brand`, `category` (`"Electronics & Gadgets" | "Home Appliances" | "Home & Living"`), `subcategory`, `shortDescription`, `description`, `highlights` (`string[]`), `specs` (`Record<string, string>`).
  - `images`: `Array<{ src: string; alt: string }>`. When empty (`[]`), the UI renders `<DealImagePlaceholder />` (a theme-aware gradient card with a line icon for the subcategory and `"Image coming soon"`), never stock photos. Converted bed/mattress/headboard/bedside-table deals include `threeDConfig` to render the interactive 3D viewer (`StudioScene`) on `/deals/:slug`.
  - `condition`: `"New" | "Refurbished" | "Graded" | "Ex-display"` + optional `conditionNote`.
  - `price` (current selling price in GBP), optional `referencePrice`, and `priceVerified` (`boolean`). **Verified savings rule**: The struck-through `"Was"` price and orange saving `%` badge are displayed **ONLY** when `referencePrice` exists, `referencePrice > price`, and `priceVerified === true` (`getSavingPercent(deal) !== null`).
  - `stockStatus`: `"In stock" | "Low stock" | "Out of stock" | "Check with supplier"`, paired with `"Subject to supplier confirmation"`.
  - `delivery` & `deliveredBy`: Supplier delivery timeframe and courier method.
  - `dealUrl` (optional HTTPS supplier/affiliate URL), `enquiryEnabled` (`boolean`), `status` (`"active" | "expired" | "unavailable"`), optional `expiresAt` (ISO date), and `isSample` (`boolean` — shows `"Sample listing"` tag while `true`).

### 7.2 How to add, update, expire, or remove a deal (`/src/data/deals.ts`)
1. **Add a deal**: Append a new `Deal` object to `ALL_DEALS` in `/src/data/deals.ts` with a unique `id` (`"UKCH-P-XXXX"`), URL-safe `slug`, `status: 'active'`, `supplierId` matching an entry in `/src/data/suppliers.ts`, and `isSample: false` once live supplier stock is confirmed.
2. **Update a deal**: Edit `price`, `referencePrice`, `priceVerified`, `stockStatus`, `dealUrl` (must be `https://`), or `images` directly on the entry in `ALL_DEALS`.
3. **Expire or mark a deal unavailable**: Set `status: 'expired'` (or set `expiresAt` to a past ISO timestamp) or `status: 'unavailable'`. The deal will automatically be excluded from `/deals` listings, search results, and related deals (`isDealLive(deal) === false`), while direct visits to `/deals/<slug>` will render the `"This deal has ended"` banner, hide the `"View Deal"` button, and suggest live related deals.
4. **Remove a deal permanently**: Delete the object from `ALL_DEALS` in `/src/data/deals.ts` (visiting its old URL will show the styled 404 `"Deal not found"` view with a `"Back to Deals"` button).

### 7.3 Lead ID & no-backend enquiry flow (`/src/data/leadFlow.ts`)
- **Lead ID format**: `"UKCH-YYYYMMDD-XXXX"` (`XXXX` = 4 random uppercase alphanumeric characters), generated via `generateLeadId()` each time a shopper clicks `"View Deal"`, `"Enquire Now"`, or `"WhatsApp Enquiry"`.
- **Source channel tracking**: On first visit, `getOrInitSourceChannel()` reads `utm_source` / `utm_medium` / `ref` from the URL query string (or `"direct"` / `document.referrer` hostname) and stores it in `sessionStorage` (`'ukch_source_channel'`).
- **Outbound referral link**: `buildDealOutboundUrl(dealUrl, leadId, category)` validates `https://` and appends `?utm_source=ukclearancehub&utm_medium=referral&utm_campaign=<category>&ukch_ref=<leadId>` while preserving existing query parameters.
- **Enquiry modal (`ReservationEnquiryModal.tsx`)**: Validates `name` (required), `email` or UK `phone` (at least one required), `preferredContact` (`Email`, `Phone`, `WhatsApp`), optional `message`, and required Privacy Notice consent checkbox. On submit, displays the generated Lead ID and two actions (`"Send via WhatsApp"` and `"Send via Email"` to `admin@ukclearancehub.co.uk` with subject `"Enquiry <LeadID> – <product title>"`). Customer details are never stored in `localStorage` and the form resets after sending.

### 7.4 UK PECR cookie consent, SEO setup & Sample Content Safety (Steps 12 & 13)
- **Cookie Consent Categories (`/src/data/cookieConsent.ts`, `/src/context/CookieConsentContext.tsx`, `/src/components/layout/CookieConsentBanner.tsx`)**:
  - **Storage key & version**: Stored in `localStorage` under `'ukch_cookie_consent_v1'` with `{ version: 1, updatedAt: "<ISO timestamp>", necessary: true, analytics: boolean, marketing: boolean }`. The bottom banner (`data-testid="cookie-consent-banner"`) appears on first visit or whenever `COOKIE_CONSENT_VERSION` is incremented.
  - **Equal prominence (UK PECR)**: `"Accept all"` and `"Reject non-essential"` buttons share identical size and visual prominence, alongside `"Manage settings"`.
  - **Categories**:
    1. **Strictly necessary (`necessary: true`, always on)**: Stores `'uk-clearance-hub-theme'`, `'ukch_cookie_consent_v1'` in `localStorage`, and `'ukch_source_channel'` / `'ukch_deals_scroll_y'` in `sessionStorage`.
    2. **Analytics (`analytics`, off by default)**: Optional anonymous performance/page-view metrics.
    3. **Marketing (`marketing`, off by default)**: Optional referral campaign attribution.
  - **Consent Helper & Modal Trigger**: Call `hasConsent('analytics')` or `hasConsent('marketing')` before loading any future tracking scripts (no tracking scripts are loaded by default). Call `openCookieSettingsModal()` (wired to the Footer `"Cookie Settings"` button and `/cookies` page) to reopen the preferences modal at any time.
- **Per-Route SEO, Sample Content Safety & JSON-LD (`/src/utils/seo.ts`, `/public/robots.txt`, `/public/sitemap.xml`)**:
  - **`useSeo(config)` hook**: Updates `<title>` (`"<Page> | UK Clearance Hub"`, 50–60 chars), `<meta name="description">` (150–160 chars), `<link rel="canonical">` (`https://ukclearancehub.co.uk<path>`), `<meta name="robots">`, Open Graph (`og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:site_name`), and Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
  - **Sample Content Safety (`getDealRobotsDirective` & `getSitemapUrls`)**:
    - Every deal with `isSample: true` (as well as expired/unavailable or missing deals) automatically receives `<meta name="robots" content="noindex,follow">` via `getDealRobotsDirective(deal)` in `BedDetailPage.tsx` and is excluded from `/public/sitemap.xml` via `getSitemapUrls(deals)`.
    - **CRITICAL PRE-LAUNCH REQUIREMENT**: All `isSample: true` listings in `/src/data/deals.ts` and sample suppliers in `/src/data/suppliers.ts` are demonstration placeholders. Before public launch, every sample deal **must** be replaced with real supplier deals (`isSample: false`) backed by written supplier permission, verified current and reference prices (`priceVerified: true` only with documented proof), real product photography, and tested HTTPS `dealUrl` links, after which `/public/sitemap.xml` should be regenerated with `getSitemapUrls(ALL_DEALS)`.
  - **Structured Data (`#ukch-jsonld-schema`)**:
    - `Organization` schema on `/` with official logo, email, telephone, and all 5 `sameAs` social profile URLs.
    - `BreadcrumbList` schema on `/deals`, `/home-living`, `/deals/:slug`, informative guides, and legal pages.
    - `Product` schema on `/deals/:slug` (`buildDealProductJsonLd(deal)`): includes an `Offer` (`priceCurrency: "GBP"`, `price`, `availability`, `seller`) **ONLY** when `!deal.isSample && deal.price > 0` (omits `offers` completely on sample listings).
  - **Crawler files**: `/public/robots.txt` allows all crawlers and links to `https://ukclearancehub.co.uk/sitemap.xml`. `/public/sitemap.xml` lists all 13 indexable static routes (`/`, `/deals`, `/home-living`, `/how-it-works`, `/mattress-guide`, `/bed-size-guide`, `/delivery-returns`, `/about`, `/faq`, `/contact`, `/privacy`, `/cookies`, `/terms`) and excludes all `isSample: true` deals until real supplier deals are added.

---

## 8. Build plan — Steps 1 to 13 (including Step 9B), with status

### Step 1 — Foundation: ✅ Done
- **Summary**: Configured project packages, folder structure, Tailwind v4 design system, SVG film-grain overlay, Lenis + GSAP `ScrollTrigger`/`Flip` integration, React Router routes, scroll-to-top on route change, responsive `Header`, and `Footer`.

### Step 2 — 3D scene: ✅ Done
- **Summary**: Created `/src/three/modelUrl.ts` pointing to `bed.glb`, built `BedSet.tsx` to clone the GLB scene and extract all 9 named nodes with original transforms, applied PBR material tweaks, and built `StudioScene.tsx` with studio `Environment` + 4 `Lightformer`s, directional shadows, floor + `ContactShadows`, fog, and `EffectComposer`.

### Step 3 — Scroll assembly: ✅ Done
- **Summary**: Made `StudioScene` a fixed full-screen background canvas (`100vw × 100vh`, `pointer-events: none`), created 8 `100vh` chapter sections (`chapter-hero` through `chapter-complete`), and implemented the master scrubbed GSAP timeline (`scrub: 1.2`) in `/src/animations/useAssemblyTimeline.ts` for all 9 bed parts.

### Step 4 — Camera + text: ✅ Done
- **Summary**: Added smooth `power2.inOut` camera position and `lookAt` target choreography per chapter to the master timeline, including a `180°` circular orbit in `chapter-complete`, `1.3x` camera distance multiplier on screens `< 768px`, desktop mouse parallax, `/src/animations/splitLines.ts`, and alternating chapter text panels.

### Step 5 — Preloader, hero, progress: ✅ Done
- **Summary**: Built `/src/components/layout/Preloader.tsx` (real progress line and `"000"`–`"100"` tabular counter driven by `useStudioProgress()`, waiting for GLB 100% + `document.fonts.ready` + min `1.2s`, upward `clip-path` wipe exit, `"uk-clearance-hub:ready"` event), `HeroChapterSection.tsx`, and `ChapterProgress.tsx`.

### Step 6 — Home page lower sections: ⏳ Superseded by Step 11
- **Summary**: Superseded by **Step 11** (Deals-focused homepage + move the 3D bed story to the Home & Living page).

### Step 7 — Clearance Deals and Product Detail: ✅ Done
- **Summary**: Built initial product catalogue, `/deals` listing page with URL-synced filters and GSAP `Flip`, and 3D product detail view.

### Step 8 — Informative pages: ✅ Done
- **Summary**: Built all 6 informative UK pages (`/mattress-guide`, `/bed-size-guide`, `/delivery-returns`, `/about`, `/faq`, `/contact`) using `EditorialPageHero` and `<SharedViewCanvas />` (`@react-three/drei` `View.Port`).

### Step 9 — Rebrand + global layout: ✅ Done
- **Summary**: Rebranded the entire application to the official **UK Clearance Hub** identity and referral business model, including official logos on jsDelivr CDN, `Plus Jakarta Sans` + `Inter` typography, sticky Header with utility bar + search + 4 category links, Footer with referral disclosure + 5 social links + CC BY 4.0 credit, and `FloatingWhatsAppButton`.

### Step 9B — Dark theme by default, light/dark theme switch with animation & smooth transitions: ✅ Done
- **Summary**: Converted every colour across all components and pages to semantic CSS variables (`[data-theme="dark"]` default and `[data-theme="light"]` on `<html>`), added dark/light logo switching, implemented `ThemeProvider` with pre-paint `localStorage` hydration and `700ms` circular `document.startViewTransition` reveal, synced the 3D studio scene on theme switch via `600ms` GSAP tweens without reloading `bed.glb`, and added smooth interactive and route transitions.

### Step 10 — Referral product model + listing/detail pages: ✅ Done
- **Summary**:
  1. **Referral data model (`/src/data/deals.ts`, `/src/data/suppliers.ts`)**: Replaced `products.ts` with `deals.ts` defining 18 live sample deals (6 `Electronics & Gadgets`, 6 `Home Appliances`, 6 `Home & Living` including the converted 3D bed/mattress/headboard/bedside-table items plus a sofa and a rug) and 2 expired/unavailable deals, plus 3 sample suppliers in `suppliers.ts`. Implemented strict verified-saving rules (`getSavingPercent` returns `null` unless `referencePrice` exists and `priceVerified` is `true`), `isDealLive`, `getRelatedDeals`, `filterAndSortDeals`, `isValidDealUrl`, and `buildDealOutboundUrl`.
  2. **All Deals page (`/deals`, `/src/pages/ClearanceDealsPage.tsx`)**: Added dynamic header (`"All Deals"`, category name, or `"Results for '<query>'"`), live results count, supplier confirmation notice, desktop left filter sidebar + mobile slide-up filter sheet (category, subcategory, condition, `PriceRangeSlider`, `"In stock only"`, `"Verified savings only"`), 5 sort options, multi-field word search with suggestions + `"Clear search"`, full URL query string sync, and 4/3/2/1 responsive grid with GSAP `Flip` animations.
  3. **Retail Deal Card (`/src/components/products/ProductCard.tsx`, `DealImagePlaceholder.tsx`)**: Built retail-style deal card with theme-aware subcategory line-icon placeholder (`"Image coming soon"`), condition badge, verified saving badge, `"Sample listing"` tag, brand, 2-line title, price + verified struck-through `"Was"` price, coloured stock dot, delivery line, and `"View Deal"` / `"Enquire Now"` buttons.
  4. **Deal Detail page (`/deals/:slug`, `/beds/:slug` redirect, `/src/pages/BedDetailPage.tsx`)**: Added `"Back to Deals"` link preserving listing filters via history state, image gallery with thumbnails (or interactive 3D viewer with UK size & colour swatches for converted bed deals), verified price block, supplier attribution (`"Sold and delivered by <supplierName>"`), `"View Deal"`, `"Enquire Now"`, and `"WhatsApp Enquiry"` actions, highlights, specifications table, delivery & condition grading guide, 3-step `"How buying through UK Clearance Hub works"`, expired/unavailable deal banner (`"This deal has ended"`), and related live deals.
  5. **Lead ID & enquiry flow (`/src/data/leadFlow.ts`, `ReservationEnquiryModal.tsx`)**: Added `"UKCH-YYYYMMDD-XXXX"` Lead ID generator, `sessionStorage` source channel tracker, validated enquiry modal with Privacy Notice consent checkbox, and Lead ID summary screen with `"Send via WhatsApp"` and `"Send via Email"` (`mailto:admin@ukclearancehub.co.uk`) without storing customer data in `localStorage` or exposing internal IDs in the DOM.

### Step 11 — Deals-focused homepage + move the 3D bed story to the Home & Living page: ✅ Done
- **Summary**:
  1. **Moved 3D scroll story to `/home-living` (`/src/pages/HomeLivingPage.tsx`)**: Relocated the complete 8-chapter scroll-driven `StudioScene` + `BedSet` assembly timeline, camera choreography, and `ChapterProgress` from `/` to `/home-living`. Updated the Hero Chapter copy (`"Home & Living"`, `"Build your bedroom."` / `"For less."`, `"Beds, mattresses and bedroom furniture from trusted UK suppliers, at genuine clearance prices."`) and the final `"complete"` chapter CTAs (`"Shop Home & Living Deals"` → `/deals?category=Home%20%26%20Living` and `"Bed Size Guide"` → `/bed-size-guide`). Added a solid `--bg` lower section after the chapters containing the live Home & Living deals grid (`ProductCard`), quick links to `Mattress Guide`, `Bed Size Guide`, and `Delivery & Returns`, and a WhatsApp enquiry CTA. Configured `Preloader` via `doesRouteWaitFor3DModel(pathname)` so `/` no longer waits for `bed.glb`.
  2. **New Deals-Focused Homepage (`/`, `/src/pages/HomePage.tsx`, `/src/components/home/HeroBannerCarousel.tsx`, `/src/data/homePageData.ts`)**: Built a 9-section retail homepage:
     - **Hero Banner Carousel**: 3 slides auto-advancing every 6s with progress bars, swipe on mobile, pause on hover, and keyboard arrows (`"Clearance deals on top tech"`, `"Home appliances for less"`, and `"Build your bedroom for less"` with a live rotating 3D preview of the bed set via `SharedViewCanvas`), plus a large below-banner search bar submitting to `/deals?q=` and 5 suggestion chips (`Air fryer`, `Headphones`, `Washing machine`, `Mattress`, `TV`).
     - **Trust Strip**: 4 compact items (`"Genuine clearance deals"`, `"Trusted UK suppliers"`, `"Delivery handled by suppliers"`, `"Enquire on WhatsApp"`).
     - **Shop by Category**: 4 tiles (`Electronics & Gadgets`, `Home Appliances`, `Home & Living` → `/home-living`, `All Deals` → `/deals`) displaying live deal counts and `"From £<lowest price>"` computed from `DEALS`.
     - **Featured Clearance Deals**: Draggable/scrollable horizontal row of 8 deals ordered by biggest verified saving with desktop prev/next controls and `"View all"` (`/deals`).
     - **New Offers**: `"New this week"` grid of the 8 newest live deals.
     - **How It Works**: 3-step guide (`"Find a deal"`, `"Buy from the supplier"`, `"Supplier delivers"`) with a scroll-drawn connecting line and the affiliate commission disclosure.
     - **Product Condition Guide**: 4 cards explaining `New`, `Refurbished`, `Graded`, and `Ex-display` linking to `/deals?condition=<value>`.
     - **Supplier & Delivery Info**: Two-column supplier & delivery explanation plus an `"Are you a supplier?"` box linking to `/contact?topic=supplier` (which pre-selects the supplier topic on `/contact`).
     - **Follow Us + WhatsApp CTA**: Band featuring the 5 official social links and a green `"Chat on WhatsApp"` button with a prefilled message.

### Step 12 — Privacy, cookies, transitions, SEO: ✅ Done
- **Summary**:
  1. **Copy Audit & Removal of Unverified Claims**: Replaced unverified percentage/warranty/delivery claims across `index.html`, `metadata.json`, `navigation.ts`, `AboutPage.tsx`, `DeliveryReturnsPage.tsx`, `MattressGuidePage.tsx`, `BedSizeGuidePage.tsx`, `informativePages.ts`, and `FaqPage.tsx` with transparent referral-aligned copy (and verified `"Genuine clearance deals"` on the homepage trust strip).
  2. **Legal Pages & `/how-it-works` (`/src/pages/LegalPages.tsx`)**: Built `/privacy` (UK GDPR Privacy Notice with ICO link), `/cookies` (Cookie Policy with categories table and button to reopen Cookie Settings), `/terms` (Terms of Use covering the referral model, affiliate commission disclosure, third-party links, liability placeholder, and England & Wales law), and `/how-it-works` (4-step customer journey, `"Sample listing"` / condition / verified saving explanations, Lead IDs, commission disclosure, and supplier onboarding CTA to `/contact?topic=supplier`). Added the required `"This page should be reviewed by a qualified adviser before launch."` notice at the top of legal pages and wired all Footer Help/Legal links to real pages.
  3. **UK PECR Cookie Consent (`/src/data/cookieConsent.ts`, `/src/context/CookieConsentContext.tsx`, `/src/components/layout/CookieConsentBanner.tsx`)**: Built the first-visit bottom cookie banner with equal-prominence `"Accept all"` and `"Reject non-essential"` buttons plus `"Manage settings"`, the Cookie Settings modal (`Strictly necessary` always on, `Analytics` and `Marketing` off by default), versioned `localStorage` persistence (`ukch_cookie_consent_v1`), `hasConsent(category)` helper, and `"Cookie Settings"` trigger in the Footer.
  4. **Refined Page Transitions & Scroll Restoration (`Layout.tsx`, `ScrollToTop.tsx`)**: Added a top sky-blue → orange gradient route progress bar (`data-testid="route-transition-bar"`), ~520ms route fade/slide transition (`prefers-reduced-motion` aware), Lenis + `ScrollTrigger.refresh()` sync, and `/deals` scroll position restoration on browser back (`POP`).
  5. **SEO, JSON-LD, Crawler Files & Branded 404 (`/src/utils/seo.ts`, `/src/pages/NotFoundPage.tsx`, `/public/robots.txt`, `/public/sitemap.xml`)**: Added `useSeo` across all routes for unique 50–60 char titles, 150–160 char descriptions, canonical URLs, Open Graph/Twitter cards, `Organization` JSON-LD on `/`, `BreadcrumbList` JSON-LD on category/deal/informative/legal pages, and `Product` JSON-LD on `/deals/:slug` (omitting `offers` when `deal.isSample === true`), plus a branded 404 page (`noindex,follow`) with deal search and links to `/deals` and `/`.

### Step 13 — Mobile, performance, final QA: ✅ Done (Project Complete)
- **Summary**:
  1. **Sample Content Safety (`seo.ts`, `BedDetailPage.tsx`, `sitemap.xml`)**: Added `getDealRobotsDirective(deal)` so all `isSample: true` (and expired/unavailable) deal pages emit `<meta name="robots" content="noindex,follow">`, and `getSitemapUrls(deals)` excluding all sample deals from `/public/sitemap.xml` until real supplier deals replace them.
  2. **Route & 3D Code-Splitting (`App.tsx`, `Layout.tsx`, `HeroBannerCarousel.tsx`, `BedDetailPage.tsx`, `studioProgressStore.ts`, `vite.config.ts`)**: Converted all 15 route pages to `React.lazy` + `<Suspense>`, decoupled `Preloader` and `Layout` from Three.js via `studioProgressStore.ts`, lazy-loaded `SharedViewCanvas` and `StudioScene` only when a route or slide mounts a 3D view, and split vendor chunks (`vendor-react`, `vendor-motion`, `vendor-three-core`, `vendor-three-eco`).
  3. **3D Adaptive Quality & Lifecycle (`StudioScene.tsx`, `SharedViewCanvas.tsx`, `BedSet.tsx`, `useAssemblyTimeline.ts`)**: Added DPR `[1, 1.5]` on mobile/low-power devices, `@react-three/drei` `<PerformanceMonitor>` adaptive quality (half-res AO on mobile; disables `N8AO`/`Bloom` when FPS drops), `IntersectionObserver` + `visibilitychange` rendering pause (`frameloop="never"`), Draco decoder support in `useGLTF(MODEL_URL, true)`, material disposal on unmount, and full `prefers-reduced-motion` support (instant assembled bed view without flying parts or camera orbit).
  4. **Mobile & iOS/Android Polish (`theme.css`, `FloatingWhatsAppButton.tsx`, `HeroChapterSection.tsx`, `AssemblyChapterPanel.tsx`, `useLenis.ts`)**: Enforced `>= 14px` minimum mobile text size and `>= 16px` mobile form input font size (preventing iOS zoom), `>= 44×44px` tap targets on interactive buttons/links/swatches/icons, `100dvh` on full-height sections, safe-area inset padding on the floating WhatsApp button and cookie banner, high-contrast mobile chapter cards on `/home-living`, and automatic hiding of `FloatingWhatsAppButton` whenever the cookie banner, cookie settings modal, mobile menu, mobile filter sheet, or deal enquiry modal is open.
  5. **WCAG 2.2 AA Accessibility (`useModalFocusTrap.ts`, `Layout.tsx`, `Header.tsx`, `ClearanceDealsPage.tsx`, `ReservationEnquiryModal.tsx`, `ContactPage.tsx`, `HeroBannerCarousel.tsx`)**: Added `"Skip to main content"` link, focus trapping + `Escape` dismissal + trigger focus restoration across all modals/drawers (`useModalFocusTrap`), `aria-invalid` + `aria-describedby` form error associations, `aria-live="polite"` regions for filter result counts and Lead ID / contact form confirmations, an accessible Play/Pause toggle on `HeroBannerCarousel`, and `aria-hidden="true"` + screen-reader text alternatives on decorative 3D canvases.

---

## 9. Working rules for anyone continuing
- **Work one step at a time**: Complete only the requested step, verify thoroughly in a real browser (`http://localhost:3000`) at desktop and mobile viewports before moving to the next step, and push to GitHub after each step with the commit message `"Step N - <name>"`.
- **Respect the referral business model**: Never add a shopping cart, checkout flow, payment gateway, or admin dashboard. Every product is fulfilled by verified UK suppliers via `"View Deal"`, `"Enquire Now"`, or WhatsApp, and internal product/supplier IDs (`UKCH-P-XXXX`, `SUP-XXX`) must never appear in visible UI text.
- **Protect core 3D systems & semantic theming**: Never break the Step 3 scroll assembly, Step 4 camera timeline, or `MODEL_URL` in `/src/three/modelUrl.ts`. Always use semantic theme tokens (`bg-bg`, `bg-surface`, `text-text`, `text-muted`, `border-border`, `text-primary`, `bg-accent`, etc.) rather than hard-coded hex colours in components or pages.
- **GSAP lifecycle hygiene**: Always scope animations inside `gsap.context(() => { ... }, scopeRef)` and call `ctx.revert()` on unmount or route change; call `ScrollTrigger.refresh()` after the 3D GLB model loads or page layout changes.
- **Editorial & legal standards**: Keep UK English, `£` prices, official brand colours/fonts, and the Sketchfab CC BY 4.0 attribution (`"Bed 07 3D model by Doaa Sheha (Sketchfab), CC BY 4.0."`) in the footer at all times.

---

## 10. Pre-Launch Checklist (Action Items Before Going Live)

Before taking **UK Clearance Hub** live to the public, complete the following business, legal, and asset actions:

- [ ] **1. Replace all sample deals & sample suppliers (`/src/data/deals.ts`, `/src/data/suppliers.ts`)**:
  - Replace all `isSample: true` entries in `ALL_DEALS` with real supplier clearance products (`isSample: false`).
  - Obtain **written permission** from each supplier to display their brand name, product descriptions, and product photography.
  - Verify every `price` and `referencePrice`: only set `priceVerified: true` when you hold dated proof of the supplier's previous selling price or RRP.
  - Test every `dealUrl` (must be `https://`) to confirm the destination page is live and accepts the appended UTM/referral parameters (`?utm_source=ukclearancehub&utm_medium=referral&utm_campaign=...&ukch_ref=...`).
  - Once real deals (`isSample: false`) are added, update `/public/sitemap.xml` using the URLs returned by `getSitemapUrls(ALL_DEALS)`.
- [ ] **2. Legal & compliance sign-off (`/src/pages/LegalPages.tsx`, `/src/pages/ContactPage.tsx`)**:
  - Have a qualified UK legal adviser review `/privacy` (UK GDPR Privacy Notice), `/cookies` (UK PECR Cookie Policy), and `/terms` (Terms of Use & affiliate disclosure), then remove the top `"Editorial / Legal Review Notice"` callout banner in `LegalPages.tsx`.
  - Replace the `"Registered office / correspondence address to be confirmed before launch"` placeholder on `/privacy`, `/terms`, and `/contact` with the official UK business correspondence address and (if registered with the ICO) the ICO registration number.
- [ ] **3. Compress `bed.glb` for faster 3D loading on mobile**:
  - Run `npx @gltf-transform/cli optimize bed.glb bed-compressed.glb --compress meshopt --texture-compress webp --texture-size 1024` (or Draco + KTX2) to reduce the `13.86 MB` (`2048×2048` texture) GLB down to `~1.5–2.5 MB`, upload to the CDN, and update `MODEL_URL` in `/src/three/modelUrl.ts` (`BedSet.tsx` already enables the Draco decoder).
- [ ] **4. Analytics / Marketing scripts (optional)**:
  - If adding analytics or affiliate network pixels later, gate them strictly behind `hasConsent('analytics')` or `hasConsent('marketing')` from `/src/data/cookieConsent.ts` so no non-essential cookies or scripts run before explicit UK PECR opt-in.
- [ ] **5. Domain, DNS & Search Console**:
  - Point `https://ukclearancehub.co.uk` to the production host, verify HTTPS redirects, and submit `https://ukclearancehub.co.uk/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

---

## 11. Change log
- **11 November 2026 — Step 1 (Foundation)**: Set up project structure, Tailwind v4 design system, fluid typography, Lenis + GSAP `ScrollTrigger`/`Flip` integration, 9 React Router routes, `Header`, and `Footer`.
- **11 November 2026 — Step 2 (3D Scene Foundation)**: Added `/src/three/modelUrl.ts`, `BedSet.tsx` with 9-node extraction and original transform preservation, and `StudioScene.tsx` with ACES Filmic tone mapping, studio `Environment` + 4 `Lightformer`s, floor shadows, and postprocessing (`N8AO`, `Bloom`, `SMAA`, `Vignette`).
- **11 November 2026 — Step 3 (Scroll Assembly)**: Built fixed full-screen Home 3D canvas, 8 `100vh` assembly chapters, and `/src/animations/useAssemblyTimeline.ts` driving the 9-part bed assembly and reverse disassembly on scroll.
- **11 November 2026 — Step 4 (Camera Choreography & Chapter Panels)**: Added per-chapter camera framing, `180°` complete orbit, mobile `1.3x` distance scaling, desktop mouse parallax, `/src/animations/splitLines.ts`, and alternating chapter text panels with specs and CTAs.
- **11 November 2026 — Step 5 (Preloader, Hero & Chapter Progress)**: Built the first-visit `Preloader` (`"000"`–`"100"` counter, wordmark reveal, upward `clip-path` wipe, `"uk-clearance-hub:ready"` event), `HeroChapterSection` with intro camera dolly and scroll-out fade, and `ChapterProgress` (desktop right-edge 7-stop bar + mobile top `2px` bar).
- **11 November 2026 — Step 7 (Clearance Deals & Product Detail)**: Built initial product catalogue, `/deals` filterable grid, and 3D product detail page.
- **11 November 2026 — Step 8 (Informative Pages)**: Built `/mattress-guide`, `/bed-size-guide`, `/delivery-returns`, `/about`, `/faq`, and `/contact` with `EditorialPageHero`, `<SharedViewCanvas />` (`@react-three/drei` `View`), interactive firmness calibrator + 3D mattress squash, SVG bed size visualiser + 60cm room floor planner, delivery-day timeline, horizontal pinned inspection timeline, deep-linked FAQ search/tabs, and floating-label contact form.
- **11 November 2026 — Step 9 (Rebrand + Global Layout)**: Rebranded site-wide to the official UK Clearance Hub identity (`uk-clearance-hub-logo.png`, `uk-clearance-hub-icon.png`, Navy `#041C58`, Brand Blue `#1170D8`, Sky Blue `#16A5F4`, Orange `#FD7209`, Amber `#FFC829`, Background `#F6F8FC`, `Plus Jakarta Sans` + `Inter`), built the sticky Header with utility bar, search bar (`/deals?q=…`), `"Shop Deals"` CTA, and 4 category links, built the Footer with referral disclosure and 5 social links, and added `FloatingWhatsAppButton`.
- **11 November 2026 — Step 9B (Dark Theme Default, Animated Theme Switch & Smooth Transitions)**: Converted all colours across the app to semantic CSS variables (`[data-theme="dark"]` default and `[data-theme="light"]` on `<html>`) with zero hard-coded hex values in components/pages; added dark and light logo support (`uk-clearance-hub-logo-dark.png` and `uk-clearance-hub-logo.png`); implemented `ThemeProvider` with pre-paint `localStorage` hydration (`'uk-clearance-hub-theme'`), accessible header/mobile theme toggles, and a `700ms` circular `document.startViewTransition` reveal from click `(x, y)` (with `250ms` cross-fade fallback); synced 3D studio floor, fog, shadows, rim `Lightformer`s, and bloom via `600ms` GSAP tweens without reloading `bed.glb`; and added smooth `200–300ms` interactive transitions and `~400ms` route transitions across the application.
- **11 November 2026 — Step 10 (Referral Product Model, All Deals Listing & Deal Detail Page)**: Replaced `/src/data/products.ts` with `/src/data/deals.ts` (18 live sample deals across `Electronics & Gadgets`, `Home Appliances`, and `Home & Living` + 2 expired/unavailable deals), `/src/data/suppliers.ts` (3 sample UK suppliers), and `/src/data/leadFlow.ts` (`UKCH-YYYYMMDD-XXXX` Lead ID generator, `sessionStorage` source channel tracking, enquiry validation, and WhatsApp/mailto URL builders); built `<DealImagePlaceholder />`, retail `<ProductCard />` (`DealCard`), updated `/deals` (`ClearanceDealsPage.tsx`) with desktop sidebar + mobile slide-up filter sheet, URL query sync, multi-field search, and 4-column GSAP `Flip` grid; and updated `/deals/:slug` (`BedDetailPage.tsx`, with `/beds/:slug` and `/clearance-deals` redirects) featuring `"Back to Deals"` state navigation, interactive 3D viewer for converted bed deals or thumbnail gallery for general deals, verified saving rules, expired deal banner, Lead ID enquiry modal, and 3-step referral guide.
- **11 November 2026 — Step 11 (Deals-Focused Homepage + Move 3D Bed Story to Home & Living Page)**: Moved the 8-chapter 3D bed assembly scroll story (`StudioScene`, `useAssemblyTimeline`, `ChapterProgress`, `AssemblyChapterPanel`) from `/` to `/home-living` (`HomeLivingPage.tsx`) with updated hero copy (`"Home & Living"`, `"Build your bedroom."` / `"For less."`), updated final chapter CTAs (`"Shop Home & Living Deals"` and `"Bed Size Guide"`), and a lower solid `--bg` section featuring the live Home & Living deals grid, buying guide cards, and WhatsApp CTA; updated `Preloader` so `/` does not wait for `bed.glb`; and built the new 9-section deals-focused homepage at `/` (`HomePage.tsx`, `HeroBannerCarousel.tsx`, `homePageData.ts`) including the 3-slide auto-advancing hero carousel (with live rotating 3D bed preview on Slide 3), below-banner search bar + suggestion chips, Trust Strip, Shop by Category tiles with live counts and lowest prices, 8 Featured Clearance Deals carousel, 8 New Offers grid, 3-step How It Works + commission line, 4 Product Condition Guide cards, Supplier & Delivery Info + `/contact?topic=supplier`, and Follow Us + WhatsApp CTA.
- **12 November 2026 — Step 12 (Privacy, Cookies, Legal Pages, Page Transitions & SEO)**: Audited and removed unverified percentage/warranty/delivery claims site-wide; added `/privacy`, `/cookies`, `/terms`, and `/how-it-works` (`LegalPages.tsx`) with UK GDPR/PECR/referral disclosures and the adviser review notice; implemented the UK PECR cookie consent banner & settings modal (`cookieConsent.ts`, `CookieConsentContext.tsx`, `CookieConsentBanner.tsx`) with equal-prominence `"Accept all"` and `"Reject non-essential"` buttons, versioned `localStorage` persistence, and `hasConsent()`; refined route transitions (`Layout.tsx`, `ScrollToTop.tsx`) with a top gradient progress bar (`sky blue → orange`), ~520ms fade/slide transition, and `/deals` scroll restoration on browser back (`POP`); implemented per-route SEO & JSON-LD (`useSeo` in `/src/utils/seo.ts`) with `Organization`, `BreadcrumbList`, and sample-aware `Product` schemas; added `/public/robots.txt`, `/public/sitemap.xml`, and a branded 404 page (`NotFoundPage.tsx`).
- **12 November 2026 — Step 13 (Mobile Polish, Performance, Accessibility & Final QA — Project Complete)**: Excluded `isSample` deals from `/public/sitemap.xml` and set `<meta name="robots" content="noindex,follow">` on sample deal pages via `getDealRobotsDirective`; code-split all 15 routes with `React.lazy` + `<Suspense>` and isolated Three.js into on-demand chunks (`studioProgressStore.ts`, `vite.config.ts`); added adaptive 3D quality (`PerformanceMonitor`, mobile DPR `[1, 1.5]`, offscreen/hidden-tab rendering pause, Draco decoder support, and material disposal on unmount); completed responsive mobile polish (`360px`–`1440px`, `>= 44×44px` tap targets, `>= 14px` mobile text, `>= 16px` mobile inputs, `100dvh` sections, safe-area insets, and auto-hiding `FloatingWhatsAppButton` when overlays open); implemented WCAG 2.2 AA accessibility (`"Skip to main content"`, `useModalFocusTrap` with `Escape` and focus return, `aria-describedby` form errors, `aria-live` status updates, hero carousel Play/Pause toggle, `aria-hidden` 3D canvases with screen-reader descriptions, and `prefers-reduced-motion` support); and added the Pre-Launch Checklist in Section 10.



