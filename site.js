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

  // Positions are measured once (and on resize), never inside the frame
  // loop: reading layout right after writing a transform forces the browser
  // to lay the whole page out again every frame, which is what stutters.
  var M = {};
  function pageTop(el) { var r = el.getBoundingClientRect(); return r.top + scrollY; }
  function measure() {
    M.vh = innerHeight;
    M.wide = wide();
    if (gallery && track) {
      if (!M.wide) { gallery.style.removeProperty("--gallery-h"); track.style.transform = ""; }
      else {
        M.travel = Math.max(0, track.scrollWidth - innerWidth);
        gallery.style.setProperty("--gallery-h", innerHeight + M.travel + "px");
      }
      M.gTop = pageTop(gallery); M.gH = gallery.offsetHeight;
    }
    if (band) { M.half = band.scrollWidth / 2; M.bTop = pageTop(band); M.bH = band.offsetHeight; }
    if (how) { M.hTop = pageTop(how); M.hH = how.offsetHeight; }
    if (statement) { M.sTop = pageTop(statement); M.sH = statement.offsetHeight; }
  }
  measure();
  var resizeTimer;
  addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 120); });
  addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  var bandX = 0, lastY = scrollY, vel = 0, lastP = -1, lastS = -1, lastLit = -1;
  function near(top, h, y) { return y + M.vh > top - 200 && y < top + h + 200; }
  function frame() {
    var y = scrollY, vh = M.vh;
    vel += (y - lastY - vel) * 0.1; lastY = y;

    // Band: always drifting, faster (either way) when you scroll. Only
    // while it is on screen.
    if (band && near(M.bTop, M.bH, y)) {
      bandX -= 0.6 + Math.min(Math.abs(vel) * 0.35, 14);
      if (-bandX > M.half) bandX += M.half;
      band.style.transform = "translate3d(" + bandX.toFixed(1) + "px,0,0)";
    }

    // Gallery: scroll down, the phones slide left.
    if (gallery && track && M.wide) {
      var p = Math.min(1, Math.max(0, (y - M.gTop) / Math.max(1, M.gH - vh)));
      if (Math.abs(p - lastP) > 0.0002) {
        lastP = p;
        track.style.transform = "translate3d(" + (-p * M.travel).toFixed(1) + "px,0,0)";
        if (progress) progress.style.setProperty("--p", p.toFixed(4));
      }
    }

    // How: the road draws as the section passes.
    if (road && how) {
      var s = Math.min(1, Math.max(0, (y + vh * 0.85 - M.hTop) / (M.hH * 0.8)));
      if (Math.abs(s - lastS) > 0.001) { lastS = s; road.style.setProperty("--s", s.toFixed(4)); }
    }

    // Statement: words light up as you read down; only the words that
    // changed are touched.
    if (wordSpans.length) {
      var q = Math.min(1, Math.max(0, (y + vh * 0.8 - M.sTop) / (M.sH + vh * 0.35)));
      var lit = Math.round(q * wordSpans.length);
      if (lit !== lastLit) {
        var from = Math.min(lit, lastLit < 0 ? 0 : lastLit), to = Math.max(lit, lastLit < 0 ? wordSpans.length : lastLit);
        for (var i = from; i < to; i++) wordSpans[i].classList.toggle("on", i < lit);
        lastLit = lit;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Sections off screen stop their CSS animations.
  var rest = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle("off", !en.isIntersecting); });
  }, { rootMargin: "100px 0px" });
  document.querySelectorAll(".hero,.gallery,.features,.how,.cta").forEach(function (el) { rest.observe(el); });

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
