# Wandr website

A fast static marketing and download site for the Wandr app. Plain HTML, CSS and
JS: no build step, no framework. Colours come from `lib/core/theme/app_colors.dart`
and the logo from `assets/brand/`.

## Visit Here
https://theaaryanprakash.github.io/wandr-site/

## Run locally

```sh
cd website
python3 -m http.server 8080      # or: npx serve .
```

Open http://localhost:8080. Preview device behaviour on desktop with
`?platform=ios`, `?platform=android` or `?platform=desktop`.

## Deploy on Vercel

1. Import the repo in Vercel and set **Root Directory** to `website`.
2. Framework preset: **Other**. No build command, no output directory.
3. Deploy. `vercel.json` adds clean URLs (`/privacy`, `/terms`) and cache headers.

## Before launch: edit these

- **`config.js`**: the one place for store URLs, the QR target and contact email.
  Set `mode` to `"beta"` (TestFlight / Play testing links), `"soon"` (email prompt)
  or `"live"` (real store links). Buttons, the top banner and the mobile bar
  all update.
- **`index.html`**: the `https://wandr.app` URLs in the `canonical`, `og:` and
  `twitter:` tags (search for `wandr.app`) should be your real domain.
- **`terms.html`, `privacy.html`**: placeholders, write the real text.

## Behaviour

- iPhone: App Store button first. Android: Google Play first. Desktop: both
  buttons plus a QR code to `qrTarget`.
- Mobile visitors get a dismissible top banner and a sticky bottom bar.
- `mode: "beta"` (default) shows "Join the beta" buttons with a Beta tag.
  `mode: "soon"` shows a "Coming soon" tag and a notify-by-email prompt.

## Official store badges

The buttons are on-brand look-alikes with generic glyphs, not Apple or Google
artwork. To use the official badges once you are listed, download them from
Apple's [marketing resources](https://developer.apple.com/app-store/marketing/guidelines/)
and Google's [badge generator](https://play.google.com/intl/en_us/badges/), put
the SVG/PNGs in `assets/`, and replace the inner HTML built by `storeButton()`
in `script.js` with an `<img>`.

## Files

`assets/` icons, favicon and the 1200x630 share image (`og-image.png`).
`vendor/qrcode.js` is qrcode-generator (MIT, Kazuhiko Arase).
The phone screens in `assets/shots/` are real screenshots from the app running on its seeded demo data (no personal data). The group ride phone and the hero phone are CSS mockups. To refresh a screenshot, overwrite the JPG (600x1304).
