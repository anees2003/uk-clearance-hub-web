# HANDOFF — read this first

Last updated: **15 Nov 2026**, Phase 5, **step 1 done**. Branch: `claude/hopeful-ride-igp39a`. Not pushed. No PR.

## Current state
- **Phases 0–4 approved. Phase 5 (implementation) is in progress.**
- **Done:** step 1, app and route error boundaries (commit "Step 1 - App and route error boundaries").
  - `src/components/ui/ErrorBoundary.tsx` is used in 3 places:
    - the App boundary in `App.tsx`
    - the Route boundary around `<Outlet/>` in `Layout.tsx`, which resets on path change
    - a **silent** boundary (`fallback={null}`) around the shared 3D canvas in `Layout.tsx`, which step 2 replaces with a visible panel
  - Messages: "Sorry, this page didn't load", with Try again, Home, Ask on WhatsApp and Email us; and "This page needs a refresh", with Reload, for page code that failed to load.
- **Verified in step 1:**
  - **First load of `/home-living` with jsDelivr, githack and gstatic blocked:** the preloader exits in about 3 s and the route fallback shows. It does not hang.
  - **`/about` blocked:** the page text stays.
  - **"Needs a refresh":** checked on a production build with a page's code file removed.
  - Checked at 1366px and 375px, dark and light, with all fallback text at 4.5:1 or more.
- **Tests:** `npm test` passes 66/66; `npm run lint` and `npm run build` pass. `npm audit` still shows 1 low finding (esbuild, fixed in step 6).
- **Findings carried into later steps** (written into `02-steps.md`):
  - **Step 3:** `text-primary-contrast` generates no CSS, because the token isn't in `index.css` `@theme`.
  - **Step 2:** add a maximum preloader wait for a *stalled* (not failed) 3D request.
- **Browser testing tip:** the Playwright MCP's `browser_run_code_unsafe` with `page.context().route(...)` blocks hosts from the very first request. Use it for CDN-failure checks. Its output folder `.playwright-mcp/` must not be committed; delete it after use.
- **Dev:** `npm run dev` serves http://localhost:3000. In the Claude desktop app, `.claude/launch.json` has a `dev` entry for the preview browser.
- **Git identity:** none is configured on this machine. The Phase 0–3 commit used the repo owner's GitHub noreply identity via `git -c user.name=… -c user.email=…` for that commit only. Do the same, or ask the owner to set `git config`.

## What to read, in order
1. `CLAUDE.md`: project rules. Its "(Step 14+)" rules are the target model, and they **override any skill**.
2. `00-dashboard-impact.md`: why there is a dashboard, owner decisions D1–D6, and UX goals (§4–4d).
3. `01-plan.md`: scope, anti-goals, backlog P0/P1/P2, success criteria **S1–S20**.
4. `02-steps.md`: **the final ordered steps 1–41.** This is the to-do list.
5. `03-security.md`: SEC-01 to SEC-31. Every High item needs a passing test.
6. `04-architecture.md`: ADRs A–H.

## Decisions already made (don't reopen)
- **Business:** a showcase, not a shop. Suppliers sell and dispatch. **No cart, checkout, payments or customer accounts.** Each product has exactly "Ask on WhatsApp" and "Email us" (`admin@ukclearancehub.co.uk`), prefilled with the product name and URL. There is no enquiry form.
- **Data model:** CLAUDE.md §7.0.
  - Categories and products are managed in an in-house dashboard.
  - Condition is optional, defaulting to New.
  - The slug is frozen at first publish.
  - Deleting a category that still has products is blocked.
- **Owner simplicity first:** every SEO/AEO field goes in a collapsed "Advanced (optional)" section. Everything works with it left empty.
- **UX:**
  - One-row header and a 5-section homepage, with no 3D on it.
  - Routes: `/category/:slug`, `/deals/:slug`, `/deals`.
  - The 3D story moves to `/bedroom-story` (`/home-living` redirects), reached only from a homepage banner and the footer.
- **Architecture:**
  - One portable Express server on Node 24, with `node:sqlite` and photos on disk under `DATA_DIR`, all settings from env.
  - `sharp` is the only new package.
  - Dashboard: a separate Vite entry, `/admin`.
  - **Content shell (G3)** renders the page text and head tags on the server.
  - **Colours: C1**, navy text on brand fills.
- **Hosting: DEFERRED.** The client has IONOS (plan unknown), and Vercel is removed. Node needs an IONOS VPS or Cloud Server (step 40).
- **SEO:**
  - Server-rendered tags and JSON-LD; Product + Offer only when there is a price, with no `seller`.
  - robots allows all crawlers, AI training included.
  - **No Merchant Center feed.**
  - WhatsApp previews (S14) are the top priority.
- **Security:** scrypt via `node:crypto`; DB-backed rate limits; `__Host-` session cookie; CSRF token plus `Origin` check; upload re-encoding with GPS stripped; daily backups plus an off-site S3-compatible copy.

## Next step to do
**Step 2: 3D boundary and fallback**, in `02-steps.md`.
- Show the owner the plan first and wait for approval, as with step 1.
- It also takes over step 1's silent boundary in `Layout.tsx`, and adds the preloader maximum wait.

Steps 2–8 and 39 need nothing from outside.

Waiting on the owner:
- the HDR and font downloads (steps 7 and 36)
- delivery and returns facts (step 31)
- the Brevo email account (step 12, real send)
- the IONOS plan (step 40)

## Rules for every step (Phase 5)
- **One step = one commit**, in the order of `02-steps.md`. After each one, tell the owner what changed, how it was verified, and what's next.
- **Write a failing test first** where the logic is testable (`node:test` via `tsx`, same style as the existing `*.test.ts` files). Make the smallest change that meets the step's "Done when". Touch only what the step needs.
- **Before each commit:**
  - `npm test`, `npm run lint` and `npm run build` are green.
  - Browser check at **1366px and 375px**, **dark and light**.
  - The 3D scroll assembly still works.
- **CLAUDE.md rules:**
  - semantic theme tokens only (no hex in components)
  - GSAP only from `src/animations/gsap.ts`, with `gsap.context()` + `revert()`
  - **no SplitText** (use `splitLines.ts`)
  - **no package without an ADR and owner approval**
  - UK English and £
  - never show IDs, slugs or dates in any UI
  - never change `MODEL_URL` or `bed.glb`
- **Windows:** stop the dev server before `npm ci`. Use `npm ci`, not `npm install`, unless the step adds a package.
- **If a step turns out bigger than planned, or the plan proves wrong, stop and tell the owner** before continuing.
- **Don't push or open a PR** until the owner asks.
- **Ask before downloading any file** (HDR, fonts), and say what it is, where it comes from and how big it is.
