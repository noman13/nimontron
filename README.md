# Nimontron

*Nimontron* (নিমন্ত্রণ) means "invitation" in Bengali. This is a hand-illustrated, phone-first digital wedding invitation for **Sanjida & Saif**, served by a Cloudflare Worker.

**Live:** https://biyer.nimontron.workers.dev

It opens from a sealed envelope with confetti and music. Inside are:
- the bride and groom under a floral arch
- a scratch-to-reveal wedding date
- event cards with calendar, map and directions buttons
- dress code with guest figures
- a day-by-day programme
- countdowns
- call/WhatsApp contacts
- a closing dance scene

Every illustration is drawn in code (SVG from `public/art.js`), so the only binary assets are the link-preview picture and the music.

For coding agents and contributors, the architecture, conventions and working agreements are in **[AGENTS.md](AGENTS.md)**.

## What's where

| File | What it's for |
| --- | --- |
| `public/config.js` | **All the details**: names, parents, events, venues, programme, dress code, contacts, music settings, wording. Edit this. |
| `public/index.html` | Page shell + the link-preview text (title/description shown on WhatsApp). |
| `public/styles.css` | Colours, fonts and layout. Colour tokens are at the top. |
| `public/art.js` | The illustrations: couple, guest figures, florals, icons, wax seal, background tiles. |
| `public/app.js` | Builds the page from `config.js` and runs the interactions (envelope, scratch card, maps, programme, countdowns, music, confetti). |
| `public/assets/music.mp3` | Background music (trimmed song, about 2 MB). |
| `public/assets/og-image.jpg` | The picture shown when the link is shared. Regenerate after changing names, dates or the couple artwork. |
| `src/worker.js` | Cloudflare Worker: serves the site and personalises the link preview for `?to=` links. |
| `wrangler.jsonc` | Cloudflare settings (the Worker's name, which sets the address). |
| `tools/og.html`, `tools/make-og.ps1` | Generate the link-preview picture. |

## Changing details

1. Edit `public/config.js`. Keep the quotes and commas. Times include Bangladesh's UTC offset, e.g. `"2026-12-12T20:00:00+06:00"`.
2. If names or dates change, also update the `<title>` and `og:` lines near the top of `public/index.html`.
3. Regenerate the share picture (uses Microsoft Edge, already on Windows):

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\make-og.ps1
   ```

Maps: `mapQuery` is what Google Maps searches for. Use the place name **or** a plus code, not both together: combined, Google shows no pin.

To remove a section, set it to `false` under `show` at the bottom of `config.js`. To remove the Arabic opening line, set `blessing: null`.

### Music

- **What it is:** `public/assets/music.mp3` is the first 2:14.8 of the original song, at 128 kbps. The full-length source isn't kept in this repository.
- **When it starts:** when the envelope is tapped, because browsers need one tap before they allow sound. With `?open=1` it starts on the first tap anywhere.
- **Looping:** the first play starts at `start`. Every repeat runs from `loopStart` to `loopEnd` without a gap.
  - `loopStart` (1.08 s) skips the song's silent first second.
  - `loopEnd` (2:14.74) is just before the beat drop.
  - All three are set in `config.js`.
- **Pausing:** a round button in the corner pauses and resumes it.

To use a different song, cut it with ffmpeg, for example:

```powershell
ffmpeg -i song.mp3 -vn -map_metadata -1 -t 134.80 -af "afade=t=out:st=134.60:d=0.14" -ar 44100 -b:a 128k public\assets\music.mp3
```

## Preview on your computer

```powershell
npm install
npm run dev
```

Open http://localhost:8787. Add `?open=1` to skip the envelope while editing, or `?to=Rahman+Family` to see a personalised envelope.

## Put it online (Cloudflare Workers, free plan is enough)

```powershell
npx wrangler login
npm run deploy
```

The address is `https://<name>.<subdomain>.workers.dev`:
- **`biyer`** is the `name` in `wrangler.jsonc`.
- **`nimontron`** is the Cloudflare account's workers.dev subdomain. You can change it in the dashboard under Workers & Pages → Account details → Subdomain.
- **After renaming the subdomain,** the https certificate can take a few minutes. Until then browsers show `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`.
- **To use your own domain:** Cloudflare dashboard → Workers & Pages → biyer → Settings → Domains & Routes → Add custom domain.

You can also drag the `public` folder into Cloudflare Pages (or any static host). Everything works the same, except the WhatsApp preview title isn't personalised per guest.

## Sending invitations

Personal link: `https://biyer.nimontron.workers.dev/?to=Rahman+Family` (use `+` or `%20` for spaces). It does three things:
- shows "Dear Rahman Family" on the envelope
- adds the name to the WhatsApp preview title
- adds "Made with ❤️ for Rahman Family" at the bottom

WhatsApp remembers a link's preview. After changing the share picture, add `&v=2` (or any new value) to the link to make it fetch the new one.

## Notes

- The page asks search engines not to list it (`noindex`), since it shows family names and phone numbers. Anyone with the link can still open it. Keep this repository private for the same reason.
- Animations and falling petals switch off for visitors who've turned on "reduce motion" on their phone.
- An event's "Add to calendar" button disappears once that event is over, and its countdown turns into a thank-you line.
- Fonts load from Google Fonts: Great Vibes (names and titles), Cormorant Garamond (text), Josefin Sans (labels), Amiri (Arabic).
