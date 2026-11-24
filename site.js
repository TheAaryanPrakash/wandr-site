// Wandr site v2: motion. Everything here is decoration on top of a page that
// already reads fine without it (and rests under reduced motion).
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(pointer: fine)").matches;
  var wide = function () { return innerWidth > 900; };

  // ── Entrance, once on load ──────────────────────────────────
  function start() { requestAnimationFrame(function () { root.classList.add("loaded"); }); }
  var words = document.querySelectorAll(".hero-title [data-word]");
  words.forEach(function (w, i) { w.style.transitionDelay = 0.15 + i * 0.08 + "s"; });
  document.querySelectorAll("[data-in]").forEach(function (el, i) {
    el.style.transitionDelay = 0.55 + i * 0.1 + "s";
  });
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(start);
  } else start();

  // ── Nav tightens into a glass pill once you scroll ──────────
  function onNav() { root.classList.toggle("scrolled", scrollY > 40); }
  addEventListener("scroll", onNav, { passive: true });
  onNav();

  // ── Reveals: headings wipe up, cards rise, siblings in turn ─
  var revealEls = document.querySelectorAll("[data-reveal],[data-rise]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = el.parentElement.querySelectorAll(":scope > [data-rise]");
        var i = Array.prototype.indexOf.call(sibs, el);
        if (i > 0) el.style.transitionDelay = (i % 6) * 0.08 + "s";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("in"); });

  if (reduce) return;

  // ── Hero: the phone and chips drift with the pointer ────────
  var stage = document.querySelector("[data-parallax]");
  if (stage && finePointer) {
    var hero = document.querySelector(".hero"), tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 22;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 16;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () { tx = ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      stage.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
    }
  }

  // ── Feature tiles: a glow follows the pointer round the edge ─
  document.querySelectorAll(".tile").forEach(function (t) {
    t.addEventListener("pointermove", function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty("--mx", e.clientX - r.left + "px");
      t.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // ── Scroll-driven pieces, one rAF loop ──────────────────────
  var band = document.querySelector("[data-band]");
  var gallery = document.querySelector(".gallery"), track = document.querySelector("[data-track]");
  var progress = document.querySelector("[data-progress]");
  var road = document.querySelector("[data-scrub]"), how = document.querySelector(".how");
  var statement = document.querySelector("[data-words]");

  // The statement's words, each its own span so they can light up in turn.
  var wordSpans = [];
  if (statement) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = part;
            frag.appendChild(s); wordSpans.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(statement);
  }

  function sizeGallery() {
    if (!gallery || !track) return;
    if (!wide()) { gallery.style.removeProperty("--gallery-h"); track.style.transform = ""; return; }
    var travel = Math.max(0, track.scrollWidth - innerWidth);
    gallery.style.setProperty("--gallery-h", innerHeight + travel + "px");
  }
  sizeGallery();
  addEventListener("resize", sizeGallery);
  addEventListener("load", sizeGallery);

  var bandX = 0, lastY = scrollY, vel = 0;
  function frame() {
    var y = scrollY, vh = innerHeight;
    vel += (y - lastY - vel) * 0.1; lastY = y;

    // Band: always drifting, faster (either way) when you scroll.
    if (band) {
      bandX -= 0.6 + Math.min(Math.abs(vel) * 0.35, 14);
      var half = band.scrollWidth / 2;
      if (-bandX > half) bandX += half;
      band.style.transform = "translate3d(" + bandX.toFixed(1) + "px,0,0)";
    }

    // Gallery: scroll down, the phones slide left.
    if (gallery && track && wide()) {
      var g = gallery.getBoundingClientRect();
      var travel = Math.max(0, track.scrollWidth - innerWidth);
      var p = Math.min(1, Math.max(0, -g.top / Math.max(1, g.height - vh)));
      track.style.transform = "translate3d(" + (-p * travel).toFixed(1) + "px,0,0)";
      if (progress) progress.style.setProperty("--p", p.toFixed(4));
    }

    // How: the road draws as the section passes.
    if (road && how) {
      var h = how.getBoundingClientRect();
      var s = Math.min(1, Math.max(0, (vh * 0.85 - h.top) / (h.height * 0.8)));
      road.style.setProperty("--s", s.toFixed(4));
    }

    // Statement: words light up as you read down.
    if (wordSpans.length) {
      var r = statement.getBoundingClientRect();
      var q = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.35)));
      var lit = Math.round(q * wordSpans.length);
      for (var i = 0; i < wordSpans.length; i++) wordSpans[i].classList.toggle("on", i < lit);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── Live tiles ──────────────────────────────────────────────
  // Recording: the distance ticks up while the tile is on screen.
  var ticker = document.querySelector("[data-ticker]"), km = 0, tickTimer = 0;
  // Streak: a year of days lights up, brighter where more was driven.
  var grid = document.querySelector("[data-streak]"), cells = [];
  if (grid) {
    for (var c = 0; c < 126; c++) { var cell = document.createElement("i"); grid.appendChild(cell); cells.push(cell); }
  }
  function level(i) {
    var recent = i / cells.length; // later days drive more, for a streak that builds
    var r = Math.random();
    if (r < 0.22 - recent * 0.15) return 0;
    if (r < 0.5) return 1;
    if (r < 0.75) return 2;
    if (r < 0.92) return 3;
    return 4;
  }
  function lightGrid() {
    cells.forEach(function (cell, i) {
      cell.removeAttribute("data-l");
      setTimeout(function () { cell.setAttribute("data-l", level(i)); }, 200 + i * 14);
    });
  }
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var t = en.target;
      t.classList.toggle("in", en.isIntersecting);
      if (t.classList.contains("t-record")) {
        clearInterval(tickTimer);
        if (en.isIntersecting && ticker) tickTimer = setInterval(function () {
          km += 0.1; if (km > 99) km = 0; ticker.textContent = km.toFixed(1);
        }, 420);
      }
      if (t.classList.contains("t-streak") && en.isIntersecting && !t.dataset.done) {
        t.dataset.done = "1"; lightGrid();
        setInterval(function () {
          var cell = cells[Math.floor(Math.random() * cells.length)];
          cell.setAttribute("data-l", Math.min(4, (+cell.getAttribute("data-l") || 0) + 1));
        }, 900);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll(".t-record,.t-relive,.t-streak").forEach(function (t) { live.observe(t); });
})();
