# AGENTS.md

Guide for coding agents and contributors working on **Nimontron**, a hand-illustrated digital wedding invitation (Sanjida & Saif, Chattogram, December 2026). Live at https://biyer.nimontron.workers.dev.

## Architecture

```
browser ──► Cloudflare Worker (src/worker.js, run_worker_first)
              ├─ env.ASSETS.fetch(request)          serves everything in public/
              └─ HTML responses only: HTMLRewriter   og:image → absolute URL, og:url added,
                                                     og:title gets "Dear <guest> ·" for ?to= links,
                                                     X-Robots-Tag: noindex
```

The page is plain HTML/CSS/JS with **no build step and no framework**. Scripts load in this order and share globals:

| File | Role |
| --- | --- |
| `public/config.js` | `window.WEDDING`: the single source of truth for all content (people, events, venues, programme, dress code, contacts, music, wording, `show` toggles). |
| `public/art.js` | `window.Art`: every illustration as SVG strings. Shared `<defs>` (gradients, patterns, filters) are injected once by `Art.ensureDefs()`. Contents: the couple (`groom(pose)`, `bride(pose)`, `couple(pose)`), guest figures (`guest(kind, c1, c2)`), botanical line art (`vine`, `flower`, `corner`, `divider`, `archFrame`), scenes (`archScene`, `closingScene`), the wax seal, programme icons (`icon(name)`), and data-URI background tiles (`botanicalTile`, `edgeVineTile`). |
| `public/app.js` | One IIFE: renders every section from `config.js` into `#invite` and `#envelope`, then wires the behaviour (envelope, scratch card, calendar `.ics`/Google links, maps, programme day picker, countdowns, confetti, falling petals, `Music` module). |
| `public/styles.css` | Design tokens on `:root` (palette, couple colours, fonts), layout, art classes and animations. |
| `public/index.html` | Shell and static link-preview meta. Mirror name/date changes here by hand. |
| `tools/og.html` + `tools/make-og.ps1` | Render `public/assets/og-image.jpg` (1200×630) with headless Edge from the same art code. |

**Section order** (from `render()` in `app.js`): hero (blessing, names, arch scene, families) → welcome → scratch-to-reveal date → events (each card has date, time, venue, address, phone, Add to calendar, Show map, Directions) → dress code → programme → countdowns → get in touch → closing scene → footer. Dividers go between sections. Sections can be turned off with `show.*` in `config.js`.

**Music** (`Music` module in `app.js`): plays `config.music.src` through Web Audio. It starts at `start`, then loops on the exact sample between `loopStart` and `loopEnd`. It is created on the envelope tap, or on the first `click`/`keydown` when the envelope is skipped. If Web Audio is missing, it falls back to an `<audio>` element.

## Conventions

- **Content lives in `config.js` only.** Never hard-code names, dates, venues or phone numbers in `app.js` or `art.js`. When names or dates change, update the `index.html` meta by hand and regenerate the share image.
- **Escape all config text** with `esc()` before putting it in template strings.
- **Art is code.** Draw new illustrations as SVG in `art.js`, using classes coloured by CSS custom properties, not hard-coded fills. Random-looking florals use the seeded `rng(seed)`, so they render identically every time.
- **Couple coordinate system:** one shared space, ground at y ≈ 460.
  - Groom: x ≈ 38–156, facing right, turban top at y ≈ 26.
  - Bride: x ≈ 126–320, facing left, head at y ≈ 72–150.
  - Poses: `walk` (arch scene and share image), `twirl` (closing scene), `solo` (unused).
  - Draw order matters: arms before the hijab so it drapes over the shoulders, ears after hair.
- **No external JavaScript.** Only Google Fonts load from outside: Great Vibes (script), Cormorant Garamond (text), Josefin Sans (labels), Amiri (Arabic).
- **Mobile first.** The content column is at most 480px; at 640px and up it becomes a card on a sage background with corner bouquets. Layouts must work at 375px and 320px with no horizontal scroll.
- **Accessibility:**
  - Respect `prefers-reduced-motion`: no confetti, petals or sway.
  - Interactive elements are real buttons, links or form controls.
  - Decorative SVG gets `aria-hidden`; scenes get `role="img"` and a label.
- **Spelling and wording the couple uses:** "Akdh", "panjabi", "Qawwali", "Mehendi", "Walima"; British spelling ("colour"); the footer reads "Made with ❤️".

## Working agreements

- **Plan first when asked.** When the request says "give me the plan" (or similar), reply with a plan only and wait for "go ahead".
- **Never deploy without an explicit yes.** Always ask before `npm run deploy`. After deploying, verify the live site: files served, page renders, no console errors.
- **Check visual work visually.**
  - Render close-ups of changed art and look at both scenes (arch and twirl) at phone width.
  - Use a separate browser tab for debug overlays, not the user's tab.
  - Regenerate `og-image.jpg` after any change to names, dates or the couple.
- **Fix what you notice** (overflow, clipping, contrast) and say so, but keep changes scoped to the request.

## Current design decisions (settled through feedback; don't revert)

- **Palette:**
  - The page uses ivory paper with sage/olive line art, taken from a green reference card.
  - Blush, peach and marigold accents are used sparingly.
  - A faint sprig pattern covers the page, with climbing vines on both edges and corner bouquets.
- **Groom:**
  - Off-white sherwani with a beige outline, and a deep-red safa (low, rounded, diagonal wraps, gold edge, brooch and feather) and stole.
  - Black hair with a gradient fade, a short full beard with a thin moustache, and a slim face with a sharp jaw. The hair and beard are modelled on a photo the user shared.
- **Bride:**
  - Deep-red lehenga (`#8E1F2A`), with the hijab and long veil in the same red.
  - Full sleeves with gold bangles.
  - **Side profile** facing the groom, with a sharp straight jawline and a small chin. A three-quarter view was tried and rejected because the face shape wasn't readable.
- **Dress-code figures** are generic guests (panjabi, suit, everyday dress with the dupatta on one shoulder). They wear no turban and nothing bridal.
- **Removed on request:** the RSVP form, the D1 database and the `/admin` page. Guests call or WhatsApp instead.
- **Events and venues are one section.** Countdown labels use the serif font, not the script, for readability.

## Gotchas

- **Google Maps:** `mapQuery` must be the venue name **or** a plus code. Combining both makes the embed show no pin. `mapsUrl` keeps the exact-place link (the old goo.gl links were resolved to full URLs).
- **Global `svg { max-width: 100% }`:** an SVG that must overflow its box (`.scratch-frame`) needs `max-width: none`.
- **Scratch card:** set `strokeStyle` to an opaque colour before the `destination-out` strokes. A translucent one only fades the cover.
- **Audio permission:** phones grant sound permission on `click` (or `touchend`), not on `pointerdown`. Only start music from a real guest action. `?open=1` must not use up the start.
- **Headless Edge** clamps the window to about 500px wide, so 375px full-page captures look clipped on the right. Check phone layouts in the browser pane instead.
- **PowerShell `Start-Process -ArgumentList`** doesn't quote paths with spaces (the project path has them). Quote each argument yourself, as `make-og.ps1` does.
- **Cloudflare:**
  - A new account needs its workers.dev subdomain registered (run `npx wrangler deploy` in an interactive terminal, or use the dashboard).
  - After a subdomain rename, https takes minutes to work (`ERR_SSL_VERSION_OR_CIPHER_MISMATCH` until then).
  - Asset files must be under 25 MiB.
- **WhatsApp** caches link previews per URL. Add a new `&v=N` to see an updated share image.

## Commands

```powershell
npm install                       # once (installs wrangler)
npm run dev                       # local preview with the Worker at http://localhost:8787 (?open=1 skips the envelope)
npm run deploy                    # publish (ask the owner first)
powershell -ExecutionPolicy Bypass -File tools\make-og.ps1   # regenerate the share image
```

## Privacy

`config.js` holds family names, phone numbers and venues. The site sends `noindex`, but **this repository is public**, so treat everything committed as published. Never commit secrets, and don't commit source media: reference videos, full-length songs and personal photos are git-ignored by pattern.
