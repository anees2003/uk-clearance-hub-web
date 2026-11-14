# 03 — Security

Status: **draft for approval** (Phase 3). Evidence comes from the code at commit `559ee08` plus the Phase 0 browser checks (14 Nov 2026). Ratings: **High** must be fixed before launch, **Medium** should be fixed before launch, **Low** is tidy-up or defence in depth.

## 1. Threat model

**Target system:**
- A React SPA, hosted on Vercel today.
- From Step 8, an Express API with one owner login, a database and photo storage.
- Public pages server-rendered (Step 29).

**What we protect, most important first:**
1. **Integrity of the public site:** no defacement, no injected scripts, no fake prices.
2. **The owner account.** Whoever holds it controls everything visitors see.
3. **Visitor privacy:** the site should collect nothing beyond what is strictly necessary.
4. **The owner's data:** email, password hash, and photos, which may contain home GPS location.
5. **Availability:** pages never blank (S7), and the catalogue reachable.

**Who attacks:**
- Opportunistic bots: credential stuffing, scanners, upload abuse, search spam.
- Supply-chain compromise: a push to the asset repo, a compromised npm package, a CDN.
- Someone holding a stolen owner session.
- A malicious file passed to the owner and uploaded.

**Trust boundaries:**
- Browser ↔ our origin.
- Our origin ↔ third-party hosts: jsDelivr, raw.githack.com, gstatic, Google Fonts.
- Dashboard ↔ API: anything sent to the API is untrusted, **including what the owner sends**.

## 2. Findings

| ID | Area | Finding | Rating | Fix | Step |
|---|---|---|---|---|---|
| SEC-01 | 3rd party | `bed.glb`, logos, icon and `og:image` load from `jsDelivr gh/anees2003/uk-clearance-hub@main`. **Anyone who can push to that repo changes the live site**, and jsDelivr caches `@main` for hours, which also slows down a fix | Medium | Pin every jsDelivr URL to a commit SHA, which jsDelivr serves as immutable. Turn on GitHub 2FA and protect `main` on both repos. Updating an asset becomes: push, then bump the SHA in one place (`modelUrl.ts`/`brand.ts`) | 36, 37 |
| SEC-02 | 3rd party | drei `preset="studio"` fetches its HDR from **raw.githack.com**, a free proxy with no SLA, on every `SharedViewCanvas` route. Only `StudioScene` rewrites it to a commit-pinned jsDelivr URL (Phase 0 finding) | Medium | Self-host `studio_small_03_1k.hdr` (CC0) in `/public/3d/` and pass `files="/3d/studio_small_03_1k.hdr"`, so the shared rewrite isn't needed | 6a |
| SEC-03 | 3rd party | The Draco decoder loads from `www.gstatic.com/draco/versioned/decoders/1.5.5/`, drei's default, on every 3D page | Low | Serve three.js's own copy (`node_modules/three/examples/jsm/libs/draco/`) from `/draco/`, copied at build, and call `useGLTF(MODEL_URL, '/draco/')`. This also simplifies the CSP | 6a |
| SEC-04 | Privacy | Google Fonts are loaded on every page, so **every visitor's IP goes to Google before any consent**. That is a UK GDPR transparency issue, and the main thing in the way of removing the cookie banner | Medium | Self-host the `.woff2` files (already planned) | 33 |
| SEC-05 | Headers | `vercel.json` sends **no security headers** | Medium | The headers in §3, tested first as `Content-Security-Policy-Report-Only` in staging, then enforced | 35 |
| SEC-06 | Headers / CSP | The inline `<script>` in `index.html` (theme bootstrap plus a `console.warn` patch) blocks a strict CSP | Low | Move the theme bootstrap into a blocking `/theme-init.js` in `<head>`, so it still runs before first paint, and delete the warn patch. An external file survives edits; a CSP hash breaks on every change | 5, 35 |
| SEC-07 | XSS (future) | Steps 29–31 will put **owner-entered text into server HTML and JSON-LD**. Today React escapes everything, and JSON-LD goes in via `textContent`, which is safe. But a stolen owner session plus unescaped server HTML = **stored XSS for every visitor** | **High** | **HTML-escape** every value in server templates. In JSON-LD, escape `<`, `>`, `&`, U+2028 and U+2029 as `\uXXXX`. Descriptions are **plain text only**: no HTML or Markdown, and line breaks become `<br>` after escaping. A test with `</script><script>alert(1)</script>` in every text field checks it | 29, 30, 31 |
| SEC-08 | XSS / spam | `/deals?q=<anything>` is **indexable**, with the search text in `<title>` ("Results for '…'"). This invites search spam. The query is rendered as React text, so it isn't an XSS hole | Low | `noindex,follow` on search results. Cap `q` at 100 characters | 30 |
| SEC-09 | Links | Every `target="_blank"` link has `rel="noopener noreferrer"`. `isValidDealUrl` is HTTPS-only. **There is no open redirect**: the only redirects are internal (`/beds/:slug`, `/clearance-deals`) | OK | Removing `dealUrl` (step 27) also removes outbound affiliate links and `sponsored`. **New rule:** the dashboard never accepts URLs, which removes the `javascript:` URL and open-redirect class entirely | 7, 27 |
| SEC-10 | Messages | WhatsApp and mailto payloads use `encodeURIComponent`, so CR/LF can't inject mail headers. **Today they carry internal IDs** (`UKCH-P-…`, `SUP-…`) and Lead IDs | Low | The new prefilled text holds only the product name and the product page URL. Cap the total under 1,500 characters. Tests cover emoji, quotes, `&` and newlines in names | 7 |
| SEC-11 | PECR | `ukch_source_channel` (referral attribution) is written to `sessionStorage` **before consent**. Attribution isn't "strictly necessary", so this would breach PECR if deployed. The site isn't deployed, so nothing is exposed today | Medium | Removed with the old model (step 27). §4 has the storage inventory afterwards | 27 |
| SEC-12 | Leftovers | `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. `.env.example` invites a `GEMINI_API_KEY`. The `clean` script references `server.js` | Low | Delete them, and rewrite `.env.example` with the real server variables. **Rule: never prefix a secret with `VITE_`**, because Vite bundles those into the public JavaScript | 5 |
| SEC-13 | Dev | `npm run dev` binds **`--host=0.0.0.0`**, so anyone on the same Wi-Fi can reach the dev server and its source files | Low | Bind to localhost by default, and add `dev:lan` for phone testing on purpose | 5 |
| SEC-14 | Supply chain | `npm audit`: **esbuild 0.27.3–0.28.0, GHSA-g7r4-m6w7-qqqr** (arbitrary file read through *esbuild's own* dev server on Windows). We never run `esbuild --serve`; Vite uses its own server and esbuild only comes in through `tsx`/tooling, so it **isn't exploitable here** | Low | Bump esbuild anyway, so `npm audit` reports 0 | 6 |
| SEC-15 | Supply chain | npm 11 **allow-scripts** warnings:<br>• `esbuild` postinstall `node install.js`: optimises or checks the platform binary. The `@esbuild/win32-x64` optional dependency is present, and tests and build pass as installed.<br>• `protobufjs` postinstall: a CLI version check, pulled in only by `@google/genai`.<br>• `@google/genai` preinstall: `echo 'preinstall: no-op'` | Low | **Approve none.** `@google/genai` (and with it protobufjs) is removed in step 6. Re-check after step 6 that tests and build pass with esbuild's script still blocked. If `sharp` is added (step 12), review its install script then; it uses prebuilt optional binaries | 6, 12 |
| SEC-16 | Accounts | The GitHub account (both repos) and the Vercel/hosting account are effectively root access to the site | Medium | Turn on 2FA everywhere, protect `main`, and turn on Dependabot alerts (a free GitHub setting, not a package). Owner/admin action | 37 |
| SEC-17 | Privacy | Phone photos carry **GPS location and device data**, which could reveal the owner's home or warehouse | **High** | Re-encoding strips all metadata (SEC-25). A test checks for no EXIF/XMP in the output | 12 |

### Dashboard and API (High priority, as you asked)

| ID | Control | Design | Rating | Step |
|---|---|---|---|---|
| SEC-20 | **Hashed passwords** | See the password design below this table | High | 10 |
| SEC-21 | **Login rate limiting** | See the rate-limiting design below this table | High | 10, 11 |
| SEC-22 | **Session cookies** | See the session design below this table | High | 10 |
| SEC-23 | **CSRF** | See the CSRF design below this table | High | 10 |
| SEC-24 | **Server-side validation** | See the validation design below this table | High | 7, 13, 14 |
| SEC-25 | **Upload checks** | See the upload design below this table | High | 12 |
| SEC-26 | **Backups** | See the backup design below this table | High | 14, 15 |
| SEC-27 | **Password reset** | As in 01-plan §3a, with a 32-byte token stored as SHA-256 | High | 11 |
| SEC-28 | Secrets | `DATABASE_URL`, the email API key and `OWNER_EMAIL` live only in the host's environment settings. `.env*` is already git-ignored (checked). Rotate anything that leaks | High | 8 |
| SEC-29 | Errors and logs | JSON errors never include stack traces. Log auth events (sign-in success or failure, reset, password change) **without** passwords or tokens, kept 30 days | Medium | 8, 10 |
| SEC-30 | Takeover alert | **Email the owner on every new sign-in** ("New sign-in to your UK Clearance Hub dashboard – if this wasn't you, reset your password"). A non-technical alarm with almost no cost. TOTP 2FA is P2 (an authenticator app is friction for this owner); passkeys can come later | Medium | 11 |
| SEC-31 | Exposure | `/admin` and `/api` send `X-Robots-Tag: noindex`; responses are `Cache-Control: no-store`; no CORS headers, so same-origin only. Light per-IP limits on public API reads; public catalogue responses cached at the edge | Medium | 8, 30 |

**SEC-20 — Hashed passwords**
- `node:crypto` **scrypt**, no package: N = 2^15, r = 8, p = 3 (an OWASP-equivalent setting at about 32 MB, so it fits small servers), with `maxmem` set.
- A random 16-byte salt per user, and the parameters stored with the hash so they can be raised later.
- Comparison with `timingSafeEqual`.
- Policy (NCSC style): **at least 12 characters**, no complexity rules, a small built-in list of common passwords blocked, and paste and password managers allowed.
- There is **no sign-up route**. The owner is created with `npm run owner:create`.

**SEC-21 — Login rate limiting**
- Counters are stored **in the database**, so they survive restarts and serverless instances.
- Per IP: after 5 failures in 15 minutes, each further attempt is slowed.
- Per account: after 10 failures in an hour, sign-in is locked for 15 minutes. Password reset still works.
- The error is always the same: "Email or password is incorrect".
- The same mechanism limits reset requests (3 an hour) and uploads (60 an hour).

**SEC-22 — Session cookies**
- A random 32-byte session ID, stored server-side as SHA-256 with an expiry: **14 days idle, 30 days maximum**, because the owner signs in on his phone.
- A **new ID on every sign-in**, which prevents session fixation.
- Cookie: `__Host-ukch_s`, with `HttpOnly`, `Secure`, `SameSite=Lax` and `Path=/`.
- Sign-out deletes the session on the server. A password change or reset ends **all** sessions.

**SEC-23 — CSRF**
- A **synchronizer token** per session, sent in an `X-CSRF-Token` header on every request that changes something.
- The **`Origin` header must match** the site.
- `SameSite=Lax` as a backstop.
- No GET request ever changes data.

**SEC-24 — Server-side validation**
- The **same `shared/fields.ts` rules** run on every write.
- **Unknown fields are rejected** (an allowlist).
- Types, enums, and the lengths are checked: name ≤ 120, short description ≤ 300, full description ≤ 5,000, intro ≤ 600, question ≤ 150, answer ≤ 600, Google title ≤ 60 (soft limit), Google description ≤ 155 (soft limit).
- Price is whole pence, from 1 to 10,000,000.
- The category must exist, and photo references must belong to that product.
- Text is NFC-normalised, with control characters stripped, and is plain text only.
- JSON bodies are capped at 100 KB.
- Error messages are plain English, one per field.

**SEC-25 — Upload checks**
- Sign-in and a CSRF token are required.
- **15 MB or less per file, checked before buffering**, and at most 6 photos per product.
- The type comes from **magic bytes**: JPEG, PNG and WebP only. **SVG, GIF and HEIC are rejected** with a plain message.
- Decoding is capped at about 50 megapixels, which stops decompression bombs.
- **Every photo is re-encoded.** That strips all metadata and destroys polyglot files.
- **Random file names**; the owner's file names are never used.
- Files are served with the right `Content-Type` and `nosniff`, from storage that **cannot be listed**.
- When a product loses a photo, the file is deleted.

**SEC-26 — Backups**
- An **automatic daily database backup**, kept 30 days, with point-in-time restore where the provider offers it.
- Photo storage is **versioned**, or copied nightly.
- A **weekly copy at a second provider**.
- **A restore is tested before launch** (step 15).
- Deleted products are **kept 30 days (soft delete)**, so a mistaken delete can be undone without a full restore.

## 3. Security headers

Applied to every response (Vercel `headers` and/or Express, per the hosting ADR). This assumes SEC-02, SEC-03 and SEC-04 are done, so the only third party is jsDelivr.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  connect-src 'self' blob: data: https://cdn.jsdelivr.net;
  img-src 'self' data: blob: https://cdn.jsdelivr.net <photo-storage-host>;
  font-src 'self';
  style-src 'self' 'unsafe-inline';
  object-src 'none'; base-uri 'self'; form-action 'self';
  frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
```

Why each relaxation is needed:
- `'wasm-unsafe-eval'`: the Draco decoder is WebAssembly.
- `blob:` workers: `DRACOLoader` builds its worker from a Blob.
- `blob:`/`data:` in `connect-src`/`img-src`: GLB-embedded textures are decoded through Blob URLs.
- `style-src 'unsafe-inline'`: server-rendered `style=""` attributes and GSAP/Lenis inline styles. This carries low risk while scripts are locked down.
- `mailto:` and `wa.me` links are navigations, so `form-action` doesn't affect them.
- **Check:** every route, both themes, the 3D pages and the dashboard, with zero CSP errors in the console in Report-Only before enforcing.

## 4. Privacy and storage inventory (after step 27)

| Where | Key | Purpose | Consent needed? |
|---|---|---|---|
| `localStorage` | `uk-clearance-hub-theme` | Remembers the light/dark choice the visitor made | No: it stores a setting the visitor chose. To be confirmed by the adviser (CLAUDE.md §10 item 2) |
| `sessionStorage` | `ukch_deals_scroll_y` | Restores the list position on Back | No: needed for the feature the visitor is using |
| Cookie (dashboard only) | `__Host-ukch_s` | Owner sign-in | No: strictly necessary |
| Removed | `ukch_source_channel`, `ukch_cookie_consent_v1` | Attribution; consent record | Gone in steps 27 and 34 |
| Server logs | IP address, user agent | Security and operations | Listed in the Privacy Notice, kept 30 days |

- **Visitors' personal data handled by the site:** none, apart from server logs. There is no enquiry form (D2), and WhatsApp and email happen in the visitor's own apps.
- **The owner:** his email, a password hash, and auth logs.
- The cookie banner can be removed (step 34) once SEC-04 is fixed and an audit confirms nothing optional loads. `/cookies` keeps the inventory table.

## 5. Third-party runtime dependencies and fallbacks

| Host | Used for | After the fixes | If it fails |
|---|---|---|---|
| `cdn.jsdelivr.net` (`@<sha>`) | `bed.glb`, logos, icon, `og:image` default | Pinned and immutable (SEC-01) | Logo falls back to the text wordmark (exists); 3D falls back to a static panel (step 2); the page never blanks (step 1) |
| `raw.githack.com` | Studio HDR | **Removed** (SEC-02) | — |
| `www.gstatic.com` | Draco decoder | **Removed** (SEC-03) | — |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Inter, Plus Jakarta Sans | **Removed** (SEC-04) | System font stack (already in `--font-*`) |
| Email provider (Phase 4) | Password reset, sign-in alerts | API key in host environment settings | Reset falls back to `npm run owner:reset` |
| Database and photo storage (Phase 4) | Catalogue | Provider backups (SEC-26) | Public pages show the API-down fallback (step 22), never blank |

## 6. Changes to the step list (applied to 02-steps.md)

- **New step 6a:** self-host the studio HDR and the Draco decoder (SEC-02, SEC-03). I'll ask before downloading the HDR.
- **Step 5 extended:** `/theme-init.js`, delete the warn patch, `dev` binds to localhost (SEC-06, SEC-12, SEC-13).
- **Steps 7, 10–15, 30 and 35 extended** with the SEC items listed against them.
- **Step 37 extended:**
  - 2FA, branch protection and Dependabot (SEC-16)
  - `npm audit` = 0
  - CSP enforced with 0 violations
- **Gate:** every **High** item is checked off with a passing test before launch (S11).
