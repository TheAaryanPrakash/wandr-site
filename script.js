(function () {
  var cfg = window.WANDR_CONFIG || { mode: "soon", stores: {}, beta: {} };
  var soon = cfg.mode === "soon", beta = cfg.mode === "beta", live = cfg.mode === "live";
  var root = document.documentElement;
  root.classList.add("js");

  // ── Platform detection ───────────────────────────────────────
  var ua = navigator.userAgent || "";
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var platform = isIOS ? "ios" : isAndroid ? "android" : "desktop";
  var q = new URLSearchParams(location.search).get("platform"); // ?platform=ios|android|desktop for previews
  if (q === "ios" || q === "android" || q === "desktop") platform = q;
  root.setAttribute("data-platform", platform);
  var mobile = platform !== "desktop";

  // ── Download buttons (generic glyphs, not official badge art) ─
  var ICONS = {
    ios: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm5 16.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM8 4.5v11h8v-11H8Z"/></svg>',
    android: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.3v17.4c0 .5.5.8.9.5l15-8.7c.4-.2.4-.8 0-1L5.9 2.8c-.4-.2-.9.1-.9.5Z"/></svg>'
  };
  var LABEL = {
    ios: ["Download on the", "App Store"],
    android: ["Get it on", "Google Play"]
  };
  var BETA_LABEL = {
    ios: ["Join the beta on", "TestFlight"],
    android: ["Join the beta on", "Google Play"]
  };
  function storeButton(key, primary) {
    var a = document.createElement("a");
    a.className = "store" + (primary ? " primary" : "");
    a.dataset.store = key;
    a.href = soon ? "#download" : (beta ? cfg.beta[key] : cfg.stores[key]);
    if (!soon) { a.rel = "noopener"; a.target = "_blank"; }
    var L = beta ? BETA_LABEL[key] : LABEL[key];
    a.innerHTML = ICONS[key] + "<span><small>" + L[0] + "</small><b>" + L[1] + "</b></span>" +
      (soon ? '<span class="soon">Coming soon</span>' : beta ? '<span class="soon">Beta</span>' : "");
    if (soon) a.addEventListener("click", function (e) { e.preventDefault(); notify(); });
    return a;
  }
  document.querySelectorAll("[data-download]").forEach(function (el) {
    var order = platform === "android" ? ["android", "ios"] : ["ios", "android"];
    el.appendChild(storeButton(order[0], mobile));
    el.appendChild(storeButton(order[1], false));
  });

  // ── Coming-soon prompt ──────────────────────────────────────
  var toast = document.getElementById("toast"), tt;
  function mailto() {
    return "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent("Notify me when Wandr launches");
  }
  function notify() {
    toast.innerHTML = 'Wandr isn\'t in the stores yet. <a href="' + mailto() + '">Email us</a> and we\'ll let you know.';
    toast.hidden = false;
    clearTimeout(tt);
    tt = setTimeout(function () { toast.hidden = true; }, 6000);
  }
  document.querySelectorAll("[data-notify]").forEach(function (a) {
    if (!soon) { a.hidden = true; return; }
    a.href = mailto();
  });
  document.querySelectorAll("[data-contact]").forEach(function (a) { a.href = "mailto:" + cfg.contactEmail; });
  var sub = document.querySelector("[data-cta-sub]"), pill = document.querySelector(".pill");
  if (live) {
    if (sub) sub.textContent = "Free on iPhone and Android. Record your first journey in under a minute.";
    if (pill) pill.lastChild.textContent = " Now on iPhone & Android";
  } else if (beta) {
    if (sub) sub.textContent = "Wandr is in open beta on iPhone and Android. Join, take it on a drive, and tell us what you think.";
    if (pill) pill.lastChild.textContent = " Beta open on iPhone & Android";
  }

  // ── QR code (desktop only) ──────────────────────────────────
  var qrBlock = document.querySelector("[data-qr]");
  if (qrBlock && !mobile && window.qrcode) {
    var qr = qrcode(0, "M");
    qr.addData(cfg.qrTarget || location.href);
    qr.make();
    var svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    document.getElementById("qr").innerHTML = svg;
    qrBlock.hidden = false;
  }

  // ── Mobile top banner + sticky bar ──────────────────────────
  var bar = document.getElementById("appbar"), sticky = document.getElementById("stickybar");
  var dismissed = false;
  try { dismissed = sessionStorage.getItem("wandr-appbar") === "1"; } catch (e) {}
  if (mobile) {
    var name = platform === "ios" ? "App Store" : "Google Play";
    var bname = platform === "ios" ? "TestFlight" : "Google Play";
    document.querySelector("[data-appbar-cta]").textContent = soon ? "Notify me" : beta ? "Join beta" : "Get";
    document.querySelector("[data-appbar-sub]").textContent = soon ? "Coming soon on " + name : beta ? "Beta open on " + bname : "Free on " + name;
    document.querySelector("[data-sticky-cta]").textContent = soon ? "Get notified at launch" : beta ? "Join the beta" : "Get Wandr on " + name;
    if (!dismissed) bar.hidden = false;
    sticky.hidden = false;
    var dl = document.getElementById("download");
    function onScroll() {
      var past = window.scrollY > 500;
      var r = dl.getBoundingClientRect();
      var atCta = r.top < window.innerHeight * 0.6;
      sticky.classList.toggle("show", past && !atCta);
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    document.querySelectorAll("[data-appbar-cta],[data-sticky-cta]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (soon) { e.preventDefault(); notify(); }
        else { e.preventDefault(); window.open(beta ? cfg.beta[platform] : cfg.stores[platform], "_blank", "noopener"); }
      });
    });
    document.getElementById("appbarX").addEventListener("click", function () {
      bar.hidden = true;
      try { sessionStorage.setItem("wandr-appbar", "1"); } catch (e) {}
    });
  }

  // ── Reveal on scroll ────────────────────────────────────────
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
  } else els.forEach(function (el) { el.classList.add("in"); });

  document.getElementById("yr").textContent = new Date().getFullYear();
})();
