// ─────────────────────────────────────────────────────────────
// Wandr site config: the ONE place to edit download links.
//
// mode:
//   "beta"  -> buttons say "Join the beta" and use the beta links below
//   "soon"  -> buttons show "Coming soon" and open an email prompt
//   "live"  -> buttons link to the real store pages
// ─────────────────────────────────────────────────────────────
window.WANDR_CONFIG = {
  mode: "soon",

  beta: {
    ios: "https://testflight.apple.com/join/XXXXXXXX", // placeholder TestFlight public link
    android: "https://play.google.com/apps/testing/app.wandr", // placeholder Play testing link
  },

  stores: {
    ios: "https://apps.apple.com/app/wandr/id0000000000", // placeholder
    android: "https://play.google.com/store/apps/details?id=app.wandr", // placeholder
  },

  // Desktop QR code target. Use a page that redirects by device, or the site itself.
  qrTarget: "https://wandr.app", // placeholder

  contactEmail: "hello@wandr.app", // placeholder
};
