# UK Clearance Hub — Project Guide

## 1. Project overview
**UK Clearance Hub** is a premium, scroll-driven 3D informative website for a UK store selling quality beds, mattresses and bedroom furniture at clearance prices (up to 70% off; ex-display, end-of-line and overstock).

- **Core experience**: A photorealistic 3D bedroom set (`bed.glb`) that assembles part by part as the user scrolls down the Home page, paired with synchronised camera choreography, editorial text chapters, a full-screen preloader, a chapter progress bar, and informative inner pages.
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
4. **Lenis + ScrollTrigger sync**: Smooth scrolling is managed by `/src/animations/useLenis.ts` (`useLenis()`), which connects `lenis.on('scroll', ScrollTrigger.update)` and drives `lenis.raf(time * 1000)` inside `gsap.ticker` with `gsap.ticker.lagSmoothing(0)`. Use `getLenisInstance()` or `setLenisLocked(locked)` to control scroll programatically.

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
  `"Bed 07"` 3D model by **Doaa Sheha** (Sketchfab), licensed under **CC BY 4.0**. The credit (`© UK Clearance Hub. Bed 07 3D model by Doaa Sheha (Sketchfab), CC BY 4.0.`) must remain in `/src/components/layout/Footer.tsx`.

---

## 4. Design system

Defined in `/src/styles/theme.css` (imported by `/src/index.css`) using Tailwind v4 `@theme` tokens and CSS custom properties:

- **Colour palette**:
  - Ivory background: `#F3EFE9` (`--color-ivory`)
  - Charcoal text & primary UI: `#1C1C1E` (`--color-charcoal`)
  - Clearance red accent (used sparingly for badges/dots): `#C8102E` (`--color-clearance-red`)
  - Soft oak secondary accent: `#B89B72` (`--color-soft-oak`)
  - Warm grey muted text: `#8A8580` (`--color-warm-grey`)
  - Hairline divider rule: `rgba(28, 28, 30, 0.12)` (`--color-line`)
- **Typography (Google Fonts loaded in `/index.html`)**:
  - Headings: `"Cormorant Garamond"` (weights 400, 500, 600, regular & italic)
  - Body & UI: `"Inter"` (weights 400, 500)
- **Fluid `clamp()` type classes (`/src/styles/theme.css`)**:
  - `.type-display`: `clamp(3.25rem, 8.5vw + 1rem, 9rem)`, line-height `0.94`, tracking `-0.025em`
  - `.type-h1`: `clamp(2.5rem, 5vw + 0.75rem, 5.25rem)`, line-height `0.98`, tracking `-0.02em`
  - `.type-h2`: `clamp(2rem, 3.5vw + 0.5rem, 3.75rem)`, line-height `1.04`, tracking `-0.015em`
  - `.type-h3`: `clamp(1.375rem, 1.8vw + 0.4rem, 2.125rem)`, line-height `1.15`, tracking `-0.01em`
  - `.type-body`: `clamp(1rem, 0.35vw + 0.9rem, 1.125rem)`, line-height `1.65`
  - `.type-small`: `clamp(0.8125rem, 0.2vw + 0.78rem, 0.9375rem)`, line-height `1.5`
  - `.type-eyebrow`: `clamp(0.6875rem, 0.15vw + 0.65rem, 0.75rem)`, uppercase, letter-spacing `0.2em`, weight `500`
- **Layout & spacing**:
  - Max content width: `1440px` (`--container-max`) with fluid inline padding `clamp(1.5rem, 4vw, 3rem)`
  - Section vertical padding: `.section-spacing` (`clamp(6rem, 10vw, 12rem)`)
  - Grid: `.grid-12` (12-column desktop grid with `24px` gutters)
  - Subtle fixed SVG fractal-noise film-grain overlay across the viewport (`opacity: 0.032`, `pointer-events: none`)
- **Reusable UI & layout components**:
  - `/src/components/ui/Button.tsx` (`Button` — `primary` charcoal and `outline` variants, with a sliding right-arrow icon on hover; supports React Router `to` or `<button>`)
  - `/src/components/ui/Eyebrow.tsx` (`Eyebrow` — uppercase `0.2em` label with optional clearance-red dot)
  - `/src/components/ui/SectionHeading.tsx` (`SectionHeading` — pairs `Eyebrow`, serif heading `h1`/`h2`/`h3`, and optional subcopy)
  - `/src/components/ui/Container.tsx` (`Container` — `1440px` centred wrapper)
  - `/src/components/ui/FilmGrain.tsx` (`FilmGrain` — fixed low-opacity SVG noise overlay)
  - `/src/components/ui/ChapterProgress.tsx` (`ChapterProgress` — Home-only desktop right-edge 7-stop vertical progress bar + mobile top `2px` progress bar)
  - `/src/components/layout/Header.tsx` (`Header` — fixed minimal navbar with wordmark, 6 nav links, `"Up to 70% off"` red pill link, auto-hide on scroll down / reveal on scroll up, and mobile menu drawer)
  - `/src/components/layout/Footer.tsx` (`Footer` — 4-column charcoal footer with newsletter signup + email validation, oversized wordmark, and CC BY 4.0 3D model credit)
  - `/src/components/layout/Preloader.tsx` (`Preloader` — first-visit full-screen charcoal loader with letter-by-letter wordmark, `"000"`–`"100"` counter, clip-path wipe, and `"app:ready"` event)
  - `/src/components/layout/ScrollToTop.tsx` (`ScrollToTop` — resets window and Lenis scroll position on route changes)

---

## 5. Rendering setup

Implemented in `/src/three/StudioScene.tsx` and `/src/three/BedSet.tsx`:

- **Renderer & Tone Mapping**:
  - `<Canvas>` with `THREE.PCFShadowMap`, `THREE.ACESFilmicToneMapping`, `toneMappingExposure: 1.0`, `outputColorSpace: THREE.SRGBColorSpace`, `dpr={[1, 2]}` (with automatic software-WebGL fallback detection `isSoftwareGl` for headless testing).
- **Camera**:
  - `<PerspectiveCamera makeDefault fov={30} near={0.1} far={100} />`.
  - Driven every frame in `BedSet.tsx` via `useFrame`: interpolates `cameraPosition` and `cameraTarget` from the master GSAP timeline, pushes the camera `1.3x` further back on viewports `< 768px`, applies subtle desktop mouse parallax (`±0.08` units smoothed, decaying to `0` when the mouse stops), applies the one-time `1.5s` hero intro dolly on `"app:ready"`, and calls `camera.lookAt(cameraTarget)`.
- **Studio Environment & Lighting**:
  - `<Environment preset="studio" resolution={256} environmentIntensity={0.6}>` (with jsDelivr URL modifier for `drei-assets`) containing 4 `<Lightformer>` softboxes:
    1. Overhead warm rectangle (`intensity={2.0}`, `#FFF6E8`, `position={[0, 5, 0]}`, `scale={[8, 6, 1]}`)
    2. Left rim strip (`intensity={1.35}`, `#FFFDF9`, `position={[-5, 2, -1]}`, `scale={[1.1, 5, 1]}`)
    3. Right rim strip (`intensity={1.35}`, `#FFFDF9`, `position={[5, 2, -1]}`, `scale={[1.1, 5, 1]}`)
    4. Front soft fill (`intensity={0.85}`, `#FFFDF8`, `position={[0, 1.8, 6]}`, `scale={[6, 3, 1]}`)
  - Key `<directionalLight>` at `[3, 5, 2.5]`, colour `#FFF8EE`, `intensity={0.85}`, `castShadow`, `2048×2048` shadow map (`shadow-bias={-0.0001}`, `shadow-normalBias={0.02}`).
  - Two warm bedside `<pointLight>` nodes inside `BedSet.tsx` (`#FFD9A0`, `distance={2.5}`, `decay={2}`) positioned at the left and right lamp shades, animated from `intensity: 0` to `1.2` during the `lighting` chapter.
- **Studio Floor & Shadows (`StudioFloor`)**:
  - Seamless ivory base plane (`120×120`, `#F3EFE9`, `toneMapped={false}`) + directional shadow-catcher plane (`shadowMaterial`, `opacity={0.16}`) + real-time `<ContactShadows opacity={0.6} blur={2.5} far={3} resolution={1024} scale={12} />` that updates dynamically as parts drop in, blended into `<fog attach="fog" args={['#F3EFE9', 10, 26]} />`.
- **Postprocessing (`StudioPostprocessing`)**:
  - `<EffectComposer multisampling={0}>` with `<N8AO aoRadius={0.5} intensity={1.5} halfRes={isMobile} />` (including a Three r170+ MRT `.texture` compatibility shim), `<Bloom intensity={0.15} luminanceThreshold={0.9} mipmapBlur />`, `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />`, `<SMAA />`, and `<Vignette offset={0.35} darkness={0.25} />`.
- **Loading Progress**:
  - `useStudioProgress()` wraps `@react-three/drei`'s `useProgress()` and feeds the Step 5 `Preloader`.

---

## 6. Folder structure

```text
/src
├── App.tsx                                  # Root BrowserRouter, Layout wrapper, and 9 route definitions
├── main.tsx                                 # React 19 entry point mounting App
├── index.css                                # Global stylesheet importing /src/styles/theme.css
├── styles/
│   └── theme.css                            # Tailwind v4 @theme tokens, fluid clamp() typography, grid & keyframes
├── animations/
│   ├── gsap.ts                              # Registers GSAP ScrollTrigger & Flip once and exports them
│   ├── useLenis.ts                          # Lenis smooth scroll hook synced with GSAP ticker & ScrollTrigger
│   ├── splitLines.ts                        # Custom DOM word/line splitter (.split-line-mask / .split-line-inner)
│   ├── useAssemblyTimeline.ts               # Master scrubbed GSAP timeline for 9-part bed assembly + camera moves
│   └── useAssemblyTimeline.test.ts          # Node unit tests for assembly math, camera orbit, splitLines & progress
├── three/
│   ├── modelUrl.ts                          # Exports canonical MODEL_URL for bed.glb on jsDelivr CDN
│   ├── bedParts.ts                          # Typed node map, original transform extractor, and BedSetHandle types
│   ├── bedParts.test.ts                     # Unit tests for MODEL_URL and 9-node transform extraction
│   ├── BedSet.tsx                           # Loads/clones bed.glb, configures PBR/shadows, runs per-frame camera & lamps
│   ├── StudioScene.tsx                      # R3F Canvas, Environment Lightformers, StudioFloor, Postprocessing & useStudioProgress
│   └── index.ts                             # Barrel exports for 3D scene modules
├── data/
│   ├── assemblyChapters.ts                  # 8 chapter definitions, panel copy/specs, and ChapterProgress math helpers
│   ├── navigation.ts                        # Header nav links, Footer columns, slug formatter & email validator
│   └── navigation.test.ts                   # Unit tests for navigation data, header scroll state & newsletter validation
├── components/
│   ├── home/
│   │   ├── HeroChapterSection.tsx           # Step 5 Hero chapter (#chapter-hero) with intro reveal & scroll-out scrub
│   │   └── AssemblyChapterPanel.tsx         # Renders Hero or alternating chapter text panels with splitLines & ScrollTrigger
│   ├── layout/
│   │   ├── Header.tsx                       # Fixed transparent/ivory header with scroll-direction visibility & mobile drawer
│   │   ├── Footer.tsx                       # Charcoal 4-column footer, newsletter form, oversized wordmark & CC BY 4.0 credit
│   │   ├── Preloader.tsx                    # First-load charcoal preloader with letter reveal, 000–100 counter & clip-path wipe
│   │   ├── ScrollToTop.tsx                  # Scrolls window and Lenis to top on route change
│   │   ├── Layout.tsx                       # App shell combining FilmGrain, Preloader, Header, main content & Footer
│   │   └── index.ts                         # Barrel exports for layout components
│   └── ui/
│       ├── Button.tsx                       # Charcoal primary & outline buttons with hover sliding arrow
│       ├── ChapterProgress.tsx              # Home right-edge 7-stop vertical progress bar (desktop) & top 2px bar (mobile)
│       ├── Container.tsx                    # 1440px max-width container with fluid horizontal padding
│       ├── Eyebrow.tsx                      # Uppercase 0.2em tracked eyebrow label with optional red dot
│       ├── FilmGrain.tsx                    # Subtle fixed SVG noise overlay
│       ├── SectionHeading.tsx               # Reusable editorial section header block
│       └── index.ts                         # Barrel exports for UI primitives
└── pages/
    ├── HomePage.tsx                         # Fixed full-screen StudioScene + 8 100vh chapters + ChapterProgress + lower placeholder
    ├── BedDetailPage.tsx                    # Placeholder route for /beds/:slug (Step 7 will build full 3D PDP)
    ├── PlaceholderPage.tsx                  # Reusable editorial placeholder template for inner routes
    ├── RoutePages.tsx                       # Exports route components for Clearance Deals, Guides, Delivery, About, FAQ, Contact
    └── index.ts                             # Barrel exports for page components
```

---

## 7. Build plan — 10 steps, with status

### Step 1 — Foundation: ✅ Done
- **Summary**: Configured project packages, folder structure, Tailwind v4 design system (`#F3EFE9` ivory, `#1C1C1E` charcoal, `#C8102E` clearance red, `#B89B72` soft oak, `#8A8580` warm grey, Cormorant Garamond + Inter fluid typography), SVG film-grain overlay, Lenis + GSAP `ScrollTrigger`/`Flip` integration, all 9 React Router routes (`/`, `/clearance-deals`, `/beds/:slug`, `/mattress-guide`, `/bed-size-guide`, `/delivery-returns`, `/about`, `/faq`, `/contact`), scroll-to-top on route change, responsive auto-hiding `Header`, and 4-column `Footer` with newsletter validation and CC BY 4.0 credit.
- **Key files**: `/src/styles/theme.css`, `/src/animations/gsap.ts`, `/src/animations/useLenis.ts`, `/src/components/ui/*`, `/src/components/layout/Header.tsx`, `/src/components/layout/Footer.tsx`, `/src/App.tsx`.

### Step 2 — 3D scene: ✅ Done
- **Summary**: Created `/src/three/modelUrl.ts` pointing to `bed.glb`, built `BedSet.tsx` to clone the GLB scene, extract all 9 named nodes (`Base`, `Mattress`, `Headboard`, `Pillows_Back`, `Pillows_Front`, `Nightstand_Left`, `Nightstand_Right`, `Lamp_Left`, `Lamp_Right`) and their original transforms via `forwardRef` (`BedSetHandle`), applied PBR material tweaks (`emissiveIntensity = 0.15`, `envMapIntensity = 1.0`, shadows, max anisotropy), and built `StudioScene.tsx` with studio `Environment` + 4 `Lightformer`s, shadow-casting directional light, seamless floor + `ContactShadows`, fog, and `EffectComposer` (`N8AO`, `Bloom`, `ToneMapping`, `SMAA`, `Vignette`).
- **Key files**: `/src/three/modelUrl.ts`, `/src/three/bedParts.ts`, `/src/three/BedSet.tsx`, `/src/three/StudioScene.tsx`.

### Step 3 — Scroll assembly: ✅ Done
- **Summary**: Made `StudioScene` a fixed full-screen background canvas (`100vw × 100vh`, `pointer-events: none`) behind the Home page, created 8 `100vh` chapter sections (`chapter-hero` through `chapter-complete`) followed by the solid `#F3EFE9` lower section, and implemented the single master scrubbed GSAP timeline (`scrub: 1.2`) in `/src/animations/useAssemblyTimeline.ts`. All 9 parts start hidden at `t = 0`: `Base` rises from `-0.6y` (`back.out(1.4)`), `Mattress` drops from `+1.5y` with a landing squash/settle (`scaleY: 0.94 -> 1`), `Headboard` hinges upright from `-90°` around its bottom edge (`computeHeadboardHingePose`), `Pillows_Back` and `Pillows_Front` drop in with `0.18s` stagger and soft bounce, `Nightstand_Left` and `Nightstand_Right` slide in simultaneously from `±1.2z`, and `Lamp_Left` + `Lamp_Right` scale up from the nightstand surface (`computeBasePivotedLampPose`) as warm `#FFD9A0` point lights fade to `1.2`. Scrolling back up smoothly disassembles the bed in reverse.
- **Key files**: `/src/animations/useAssemblyTimeline.ts`, `/src/pages/HomePage.tsx`, `/src/three/BedSet.tsx`.

### Step 4 — Camera + text: ✅ Done
- **Summary**: Added smooth `power2.inOut` camera position and `lookAt` target choreography per chapter to the master timeline, including a constant-radius `180°` circular orbit (`computeOrbitCameraPosition`) around the assembled bed in `chapter-complete`, `1.3x` camera distance multiplier on screens `< 768px` (`computeFinalCameraPosition`), and subtle desktop mouse parallax (`±0.08` units). Built `/src/animations/splitLines.ts` and `/src/components/home/AssemblyChapterPanel.tsx` to render alternating left/right content panels (`01 / 06` through `06 / 06`) with eyebrow, line-masked serif heading, informative UK copy, 3 numbered spec rows with animated divider lines, and the centred `chapter-complete` panel with `"Browse Clearance"` and `"Bed Size Guide"` CTAs.
- **Key files**: `/src/animations/splitLines.ts`, `/src/data/assemblyChapters.ts`, `/src/components/home/AssemblyChapterPanel.tsx`, `/src/animations/useAssemblyTimeline.ts`.

### Step 5 — Preloader, hero, progress: ✅ Done
- **Summary**: Built `/src/components/layout/Preloader.tsx` (charcoal `#1C1C1E` first-load overlay with letter-by-letter masked `"UK Clearance Hub"` wordmark, real progress line and `"000"`–`"100"` tabular counter driven by `useStudioProgress()`, waiting for GLB 100% + `document.fonts.ready` + min `1.2s`, upward `clip-path` wipe exit, `"app:ready"` custom event, and Lenis scroll locking). Built `/src/components/home/HeroChapterSection.tsx` (`"Luxury Sleep."` / italic `"Clearance Prices."` headline, UK subtext, `"Clearance stock updated weekly"` badge with pulsing `#C8102E` dot, looping scroll indicator, `"app:ready"` entrance timeline, one-time `1.5s` camera intro dolly in `BedSet.tsx`, and scrubbed scroll-out fade). Built `/src/components/ui/ChapterProgress.tsx` (fixed right-edge vertical bar with 7 clickable stops on desktop `>= 1024px` using `lenis.scrollTo`, and a top `2px` progress bar on mobile `< 1024px`, visible only across the assembly chapters).
- **Key files**: `/src/components/layout/Preloader.tsx`, `/src/components/home/HeroChapterSection.tsx`, `/src/components/ui/ChapterProgress.tsx`, `/src/data/assemblyChapters.ts`.

### Step 6 — Home page lower sections: ⏳ To do
- **Requirements**:
  Build the Home page sections over a solid ivory (`#F3EFE9`) background after the 3D assembly story (replacing the `"More sections coming"` placeholder):
  1. **Why buy clearance**: 4 editorial cards — *Up to 70% off*, *Inspected quality*, *UK-wide delivery*, *12-month guarantee*.
  2. **Shop by category**: *Beds*, *Mattresses*, *Headboards*, *Bedside tables* with image-mask reveals and small rotating 3D previews or high-quality renders.
  3. **Animated stats counters**: *"10,000+ UK deliveries"*, *"Up to 70% off"*, *"12-month guarantee"*, *"4.8/5 customer rating"*.
  4. **Customer reviews**: Infinite horizontal marquee of verified UK buyer reviews.
  5. **FAQ teaser**: 4 common clearance/delivery questions with animated accordions and a link to `/faq`.
  6. **Final CTA band**: Editorial closing banner with primary actions.
  7. All sections animated with GSAP `ScrollTrigger` reveals (`gsap.context` cleanup).

### Step 7 — Clearance Deals and Product Detail: ⏳ To do
- **Requirements**:
  1. **Product data (`/src/data/products.ts`)**: Structured UK bed, mattress, headboard, and bedside furniture catalogue with slugs, categories, RRP vs. clearance prices in `£`, savings percentages, conditions (*Ex-display*, *End-of-line*, *Overstock*), UK sizes, colour swatches, specs, and features.
  2. **Clearance Deals (`/clearance-deals`)**: Category filter, sort dropdown, price range slider, and smooth layout transitions powered by **GSAP `Flip`** when filtering. Product cards showing *"Was £ / Now £"*, saving badge, and condition label (*Ex-display*, *End-of-line*, *Overstock*).
  3. **Product Detail (`/beds/:slug`)**:
     - Interactive 3D viewer of the same `MODEL_URL` bed model with `OrbitControls` (with polar and distance limits).
     - **UK size switch**: *Single (90×190 cm)*, *Small Double (120×190 cm)*, *Double (135×190 cm)*, *King (150×200 cm)*, *Super King (180×200 cm)* that smoothly tweens the 3D bed's width scale.
     - **Colour swatches**: Smoothly tween the 3D upholstery/frame material colour with GSAP.
     - Specs table, features accordion, UK delivery & returns info, and related products grid.

### Step 8 — Informative pages: ⏳ To do
- **Requirements**:
  Build the 6 informative inner pages with real UK bedroom & clearance content (zero lorem ipsum), each featuring a small 3D or editorial hero and GSAP `ScrollTrigger` reveals:
  1. **`/mattress-guide`**: Interactive firmness scale, sleep positions guide, and mattress types compared (pocket sprung, memory foam, hybrid, orthopaedic).
  2. **`/bed-size-guide`**: UK bed sizes side by side (*Single*, *Small Double*, *Double*, *King*, *Super King*) with architectural dimension lines and room-size tips.
  3. **`/delivery-returns`**: Two-person UK room-of-choice delivery tiers, lead times, packaging/disposal, and 14-day returns policy.
  4. **`/about`**: Brand story, how clearance sourcing works (ex-display, end-of-line, overstock), and a multi-step quality inspection process timeline.
  5. **`/faq`**: 10 comprehensive UK clearance, sizing, warranty, and delivery questions with a smooth GSAP animated accordion.
  6. **`/contact`**: Contact form with floating labels and client-side validation, UK showroom location details, and opening hours.

### Step 9 — Polish: ⏳ To do
- **Requirements**:
  1. **Route page transitions**: Sliding ivory panel transition between routes with proper GSAP `ScrollTrigger` cleanup and `ScrollTrigger.refresh()` after navigation.
  2. **Custom cursor**: Desktop custom cursor follower that scales up over interactive links/buttons and displays a `"Drag"` label when hovering over interactive 3D viewers.
  3. **Micro-interactions**: Magnetic buttons, refined link/card hover states, and consistent GSAP easing tokens across the app.
  4. **SEO & metadata**: Dynamic per-route `<title>` and `<meta name="description">`, Open Graph tags, and custom favicon.

### Step 10 — Mobile, performance and QA: ⏳ To do
- **Requirements**:
  1. **Responsive QA**: Verify layout, typography, 3D framing, and touch interactions across `390px`, `768px`, `1024px`, and `1440px` viewports.
  2. **3D & GPU optimisation**: Clamp `dpr={[1, 1.5]}` on mobile, enable `halfRes` ambient occlusion, reduce postprocessing cost on low-power devices, lazy-load 3D scenes on inner pages, and maintain a smooth 60fps scroll experience.
  3. **Accessibility & reduced motion**: Full `prefers-reduced-motion` fallbacks across all GSAP timelines, visible keyboard focus states, semantic landmarks, `alt` attributes, and WCAG contrast compliance.
  4. **Final build & console hygiene**: Eliminate any remaining console warnings and verify clean production compilation (`npm run build` and `npm run lint`).

---

## 8. Working rules for anyone continuing
- **Work one step at a time**: Complete only the requested step, verify thoroughly in a real browser (`http://localhost:3000`) at desktop and mobile viewports before moving to the next step, and push to GitHub after each step with the commit message `"Step N - <name>"`.
- **Protect core 3D systems**: Never break the Step 3 scroll assembly, Step 4 camera timeline, or `MODEL_URL` in `/src/three/modelUrl.ts`.
- **GSAP lifecycle hygiene**: Always scope animations inside `gsap.context(() => { ... }, scopeRef)` and call `ctx.revert()` on unmount or route change; call `ScrollTrigger.refresh()` after the 3D GLB model loads or page layout changes.
- **Editorial & legal standards**: Keep UK English, `£` prices, and the Sketchfab CC BY 4.0 attribution (`"Bed 07"` by Doaa Sheha) in the footer at all times.

---

## 9. Change log
- **11 November 2026 — Step 1 (Foundation)**: Set up project structure, Tailwind v4 luxury editorial design system, fluid typography, Lenis + GSAP `ScrollTrigger`/`Flip` integration, 9 React Router routes, auto-hiding `Header`, and 4-column `Footer`.
- **11 November 2026 — Step 2 (3D Scene Foundation)**: Added `/src/three/modelUrl.ts`, `BedSet.tsx` with 9-node extraction and original transform preservation, and `StudioScene.tsx` with ACES Filmic tone mapping, studio `Environment` + 4 `Lightformer`s, floor shadows, and postprocessing (`N8AO`, `Bloom`, `SMAA`, `Vignette`).
- **11 November 2026 — Step 3 (Scroll Assembly)**: Built fixed full-screen Home 3D canvas, 8 `100vh` assembly chapters, and `/src/animations/useAssemblyTimeline.ts` driving the 9-part bed assembly and reverse disassembly on scroll.
- **11 November 2026 — Step 4 (Camera Choreography & Chapter Panels)**: Added per-chapter camera framing, `180°` complete orbit, mobile `1.3x` distance scaling, desktop mouse parallax, `/src/animations/splitLines.ts`, and alternating chapter text panels with specs and CTAs.
- **11 November 2026 — Step 5 (Preloader, Hero & Chapter Progress)**: Built the first-visit charcoal `Preloader` (`"000"`–`"100"` counter, wordmark reveal, upward `clip-path` wipe, `"app:ready"` event), `HeroChapterSection` with intro camera dolly and scroll-out fade, and `ChapterProgress` (desktop right-edge 7-stop bar + mobile top `2px` bar).
