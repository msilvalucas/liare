(() => {
  const HERO_LENGTH = 200; // vh of scroll the hero occupies on desktop (150 | 200 | 250)
  const SHOW_DIMMER = true;
  const FOLDS = 11; // pleats per curtain panel
  const SECTIONS = ['sobre', 'projetos', 'servicos', 'processo', 'contato'];

  gsap.registerPlugin(ScrollTrigger);

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const cl = v => Math.max(0, Math.min(1, v));
  const L = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMq = matchMedia('(max-width: 767px), (pointer: coarse)');
  let mobile = mobileMq.matches;

  const hero = $('hero'), nav = $('nav'), dimmer = $('dimmer'), toggle = $('nav-toggle');
  const photo = $('hero-photo'), cold = $('hero-cold'), warm = $('hero-warm'), overlay = $('hero-overlay');
  const glow = $('hero-glow'), beam = $('hero-beam'), name = $('hero-name'), sub = $('hero-sub'), hint = $('hero-hint');
  const cv = $('curtain'), ctx = cv.getContext('2d');

  // ---------- Modes, menu, navigation ----------
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('[data-menu-label]').textContent = open ? 'Fechar' : 'Menu';
  }
  function applyModes() {
    root.classList.toggle('is-mobile', mobile);
    root.classList.toggle('is-reduced', reduced);
    // mobile/reduced override the desktop hero length via the class rules
    if (mobile || reduced) root.style.removeProperty('--hero-h');
    else root.style.setProperty('--hero-h', HERO_LENGTH + 'vh');
    if (!mobile) setMenu(false);
  }
  applyModes();
  mobileMq.addEventListener('change', e => { mobile = e.matches; applyModes(); ScrollTrigger.refresh(); });
  toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  if (!SHOW_DIMMER) dimmer.style.display = 'none';

  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    setMenu(false);
    const y = $(el.dataset.go).getBoundingClientRect().top + scrollY - 60;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }));

  // ---------- Hero scroll progress ----------
  // Scrubbed with a little lag so the cloth is pulled, not teleported
  const st = { p: reduced ? 1 : 0, intro: reduced ? 0 : 1 };
  if (!reduced) {
    gsap.to(st, { p: 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .8 } });
    // Arrival gust: the panels settle after the page opens
    gsap.to(st, { intro: 0, duration: 3.2, ease: 'power2.out', delay: .2 });
  }

  // ---------- Dimmer: page progress + current section ----------
  const pct = $('dimmer-pct');
  gsap.to('#dimmer-fill', {
    scaleY: 1, ease: 'none',
    scrollTrigger: {
      start: 0, end: 'max', scrub: true,
      onUpdate: self => { pct.textContent = `Luz ${Math.round(self.progress * 100)}%`; }
    }
  });
  const labels = SECTIONS.map(id => document.querySelector(`[data-label="${id}"]`));
  const setCurrent = cur => labels.forEach((lb, i) => lb.classList.toggle('is-current', i === cur));
  SECTIONS.forEach((id, i) => ScrollTrigger.create({
    trigger: '#' + id, start: 'top 50%',
    onEnter: () => setCurrent(i), onLeaveBack: () => setCurrent(i - 1)
  }));

  // ---------- Photos light up as they enter ----------
  gsap.utils.toArray('[data-lit]').forEach(el => {
    const from = reduced ? { opacity: 0 } : { filter: 'brightness(.35) saturate(.6)' };
    const to = reduced
      ? { opacity: 1, duration: .8, ease: 'power1.out' }
      : { filter: 'brightness(1) saturate(1)', duration: 1.2, ease: 'power1.out' };
    gsap.set(el, from);
    ScrollTrigger.create({ trigger: el, start: 'top 62%', once: true, onEnter: () => gsap.to(el, to) });
  });

  // ---------- Numerals flicker on like a lamp ----------
  const OFF = '0 0 0px rgba(184,154,106,0)';
  gsap.utils.toArray('[data-num]').forEach(el => {
    gsap.set(el, { opacity: .15, textShadow: OFF });
    ScrollTrigger.create({
      trigger: el, start: 'top 70%', once: true,
      onEnter: () => {
        if (reduced) return gsap.set(el, { opacity: 1 });
        gsap.timeline({ defaults: { ease: 'power1.out' } })
          .to(el, { opacity: 1, textShadow: '0 0 18px rgba(184,154,106,.9)', duration: .165 })
          .to(el, { opacity: .35, duration: .11 })
          .to(el, { opacity: 1, textShadow: '0 0 14px rgba(184,154,106,.7)', duration: .165 })
          .to(el, { opacity: .75, duration: .165 })
          .to(el, { opacity: 1, textShadow: OFF, duration: .495 });
      }
    });
  });

  // ---------- Contato: lights go down ----------
  if (!reduced) gsap.timeline({ scrollTrigger: { trigger: '#contato', start: 'top bottom', end: 'top 15%', scrub: true } })
    .fromTo('#contato-dark', { opacity: 0 }, { opacity: 1, duration: 1, ease: 'none' }, 0)
    .fromTo('#contato-inner', { opacity: 0 }, { opacity: 1, duration: .55, ease: 'none' }, .45);

  // ---------- WhatsApp: two staggered rings pulsing out of the button ----------
  if (!reduced) {
    gsap.fromTo('.whats__pulse', { scale: 1, opacity: .55 }, {
      scale: 1.5, opacity: 0, duration: 1.8, ease: 'power2.out', stagger: { each: .9, repeat: -1 }
    });
    gsap.to('.whats', { scale: 1.06, duration: .9, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }

  // ---------- Hero carousel ----------
  const slides = gsap.utils.toArray('.hero__slide');
  let cur = 0;
  if (!reduced) slides.forEach((el, i) => gsap.fromTo(el,
    { scale: 1.02, xPercent: 0 },
    { scale: 1.12, xPercent: i % 2 ? -2.5 : 2.5, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
  setInterval(() => {
    if (slides.length < 2) return;
    slides[cur].classList.remove('is-current');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('is-current');
  }, 5000);

  // ---------- Curtains: pleated cloth on canvas ----------
  // Each panel hangs from a rail as a row of pleats (ridge, valley, ridge…).
  // The rail end of every pleat is spring-driven; the hem trails behind on a
  // looser spring, so the fabric bends when pulled and keeps swaying after.
  const NODES = FOLDS * 2 + 1, FULLNESS = 1.3;
  const mkPanel = () => Array.from({ length: NODES }, () => ({ top: 0, tv: 0, bot: 0, bv: 0, init: false }));
  const panels = [mkPanel(), mkPanel()];
  // Real pleats are never identical: a little variation in depth and spacing
  const VAR = Array.from({ length: NODES }, () => .82 + Math.random() * .3);
  const JIT = Array.from({ length: NODES }, (_, i) => i && i < NODES - 1 ? (Math.random() - .5) * .45 : 0);
  // [position from ridge (0) to valley (1), diffuse 0..1, sheen]
  const PROFILE = [[0, .96, .4], [.12, 1, 1], [.28, .9, .25], [.5, .62, 0], [.72, .3, 0], [.9, .08, 0], [1, 0, 0]];
  let cw = 0, ch = 0, dpr = 1, finish = null;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cw = cv.clientWidth; ch = cv.clientHeight;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    finish = makeFinish();
  }
  // Weave + light falloff, baked once per size and laid over the cloth each frame
  function makeFinish() {
    const g = document.createElement('canvas'); g.width = g.height = 192;
    const x = g.getContext('2d');
    for (let i = 0; i < 192; i++) {
      x.fillStyle = Math.random() < .5 ? `rgba(255,236,210,${Math.random() * .05})` : `rgba(0,0,0,${Math.random() * .22})`;
      x.fillRect(i, 0, 1, 192);
    }
    for (let j = 0; j < 192; j += 2) { x.fillStyle = `rgba(0,0,0,${Math.random() * .07})`; x.fillRect(0, j, 192, 1); }
    const f = document.createElement('canvas'); f.width = cv.width; f.height = cv.height;
    const fx = f.getContext('2d');
    fx.scale(dpr, dpr);
    fx.fillStyle = fx.createPattern(g, 'repeat'); fx.fillRect(0, 0, cw, ch);
    const v = fx.createLinearGradient(0, 0, 0, ch);
    v.addColorStop(0, 'rgba(0,0,0,.6)'); v.addColorStop(.05, 'rgba(0,0,0,.25)'); v.addColorStop(.22, 'rgba(0,0,0,0)');
    v.addColorStop(.72, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    fx.fillStyle = v; fx.fillRect(0, 0, cw, ch);
    const hz = fx.createLinearGradient(0, 0, cw, 0);
    hz.addColorStop(0, 'rgba(0,0,0,.4)'); hz.addColorStop(.3, 'rgba(0,0,0,.08)'); hz.addColorStop(.5, 'rgba(0,0,0,0)');
    hz.addColorStop(.7, 'rgba(0,0,0,.08)'); hz.addColorStop(1, 'rgba(0,0,0,.4)');
    fx.fillStyle = hz; fx.fillRect(0, 0, cw, ch);
    return f;
  }
  resize(); cv.classList.add('is-live');
  addEventListener('resize', resize);

  let mx = innerWidth / 2, my = innerHeight / 2, mvx = 0;
  const halo = { x: mx, y: my };
  const haloX = gsap.quickTo(halo, 'x', { duration: .7, ease: 'power3' });
  const haloY = gsap.quickTo(halo, 'y', { duration: .7, ease: 'power3' });
  addEventListener('mousemove', e => { mvx = e.clientX - mx; mx = e.clientX; my = e.clientY; haloX(mx); haloY(my); });

  const shape = f => Math.pow(f, 1.5); // how the hem offset spreads up the drop
  const xAt = (n, f) => n.top + (n.bot - n.top) * shape(f);
  const tone = (v, warm) => `rgb(${Math.round(v * 200 + warm * 120)},${Math.round(v * 154 + warm * 78)},${Math.round(v * 121 + warm * 30)})`;
  let cleared = false, lastEdges = [0, 0];

  function drawPanel(nodes, si, cloth, b) {
    const Y0 = -ch * .03, Y1 = ch * 1.03, STEPS = 14, H = Y1 - Y0;
    const last = nodes[NODES - 1];
    const seg = cloth / (NODES - 1);
    ctx.save();
    if (si) { ctx.translate(cw, 0); ctx.scale(-1, 1); }

    // Silhouette with a soft cast shadow into the room
    ctx.beginPath(); ctx.moveTo(-60, Y0);
    for (let k = 0; k <= STEPS; k++) { const f = k / STEPS; ctx.lineTo(xAt(last, f) + 1, Y0 + H * f); }
    ctx.lineTo(-60, Y1); ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 46 * dpr; ctx.shadowOffsetX = (si ? -1 : 1) * 16 * dpr;
    ctx.fillStyle = '#080605'; ctx.fill();
    ctx.shadowColor = 'transparent';

    // Pleats: each face runs from a ridge (toward the viewer) down into a
    // valley. Brightness follows a rounded profile with a satin sheen just
    // off the crest, so folds read as volume instead of stripes.
    for (let i = 0; i < NODES - 1; i++) {
      const A = nodes[i], B = nodes[i + 1];
      const fr = (i + .5) / (NODES - 1);
      const ax = xAt(A, .5), bx = xAt(B, .5);
      const depth = cl(Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(bx - ax) / seg, 2))) * VAR[i]);
      const fromRidge = i % 2 === 0;
      // key light from the upper left of the room; faces turned to it are brighter
      const key = fromRidge === !si ? 1.08 : .9;
      const ridge = L(.2, .25, depth) * key, valley = L(.13, .055, depth);
      // the face turned toward the opening catches the warm room light
      const lit = b * (fromRidge ? 1 : .3) * Math.pow(fr, 2.2) * .5;
      const g = ctx.createLinearGradient(ax, 0, bx, 0);
      PROFILE.forEach(([u, k, sh]) => {
        const v = valley + (ridge - valley) * k + sh * L(.012, .035, depth);
        g.addColorStop(fromRidge ? u : 1 - u, tone(v, lit * L(1, .25, u)));
      });
      ctx.beginPath();
      for (let k = 0; k <= STEPS; k++) { const f = k / STEPS; ctx.lineTo(xAt(A, f) - .5, Y0 + H * f); }
      for (let k = STEPS; k >= 0; k--) { const f = k / STEPS; ctx.lineTo(xAt(B, f) + .5, Y0 + H * f); }
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    }

    // Light bleeding through the thin leading edge
    if (b > 0) {
      const ex = xAt(last, .55);
      const g = ctx.createLinearGradient(ex - 70, 0, ex, 0);
      g.addColorStop(0, 'rgba(242,200,150,0)'); g.addColorStop(1, `rgba(242,200,150,${.22 * b})`);
      ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = g; ctx.fillRect(ex - 70, Y0, 70, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    return xAt(last, .6);
  }

  gsap.ticker.add(() => {
    const p = st.p;
    const a = ease(cl(p / .4)), b = ease(cl((p - .4) / .4)), c = ease(cl((p - .8) / .2));
    const t = performance.now();

    const open = p > .86;
    nav.classList.toggle('is-open', open);
    dimmer.classList.toggle('is-open', open);

    const haloAmt = (!mobile && !reduced) ? 1 - cl(p / .3) : 0;
    const visible = c < .995 && !reduced;
    if (visible) {
      cleared = false;
      const W = cw * .505;
      const width = W * L(L(L(1, .55, a), .24, b), .13, c);
      const exitX = c * (W * .13 * 1.6 + 90);
      const gust = ((1 - a * .7) * (1 - c)) * (1 + st.intro * 2.2);
      const flare = (1 - L(L(1, .55, a), .24, b)) * W * .07;
      mvx *= .85;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      panels.forEach((nodes, si) => {
        const mLocal = si ? cw - mx : mx, vLocal = si ? -mvx : mvx;
        const breath = (10 + 7 * Math.sin(t / 1900 + si * 1.7) + 4 * Math.sin(t / 970 + si * .6)) * (1 - a);
        nodes.forEach((n, i) => {
          const fr = i / (NODES - 1);
          const target = (fr + JIT[i] / (NODES - 1)) * width - exitX - Math.pow(fr, 2.2) * breath;
          if (!n.init) { n.top = n.bot = target; n.init = true; }
          // rail carriers: stiff near the wall, laggier toward the pulled edge
          n.tv = (n.tv + (target - n.top) * (.05 + .1 * fr)) * (.8 - .06 * fr); n.top += n.tv;
          // hem: follows the rail loosely, flares when gathered, breathes in the draught
          const wind = gust * (Math.sin(t / 1600 + i * .35 + si * 2.1) * 8 + Math.sin(t / 2700 + i * .17 + si) * 6 + Math.sin(t / 700 + i * .9) * 1.5) * (.25 + .75 * fr);
          const hemTarget = n.top + fr * flare + wind;
          n.bv = (n.bv + (hemTarget - n.bot) * .028) * .93;
          // the cursor brushes the fabric it passes over
          if (haloAmt > 0) {
            const fy = cl(my / ch), d = Math.abs(xAt(n, fy) - mLocal);
            if (d < 150) n.bv += vLocal * (1 - d / 150) * .035 * haloAmt * (.3 + fy);
          }
          n.bot += n.bv;
        });
        lastEdges[si] = drawPanel(nodes, si, W * FULLNESS, b);
      });

      // Weave and light falloff, only where there is cloth
      ctx.globalCompositeOperation = 'source-atop';
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(finish, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      cv.style.opacity = L(.94, 1, a);
    } else if (!cleared) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      cleared = true; lastEdges = [0, 0];
    }

    // Cursor halo: the curtain thins where the cursor is, like a lamp behind it
    if (haloAmt > 0) {
      const m = `radial-gradient(circle 150px at ${halo.x}px ${halo.y}px, rgba(0,0,0,${1 - .5 * haloAmt}) 0%, rgba(0,0,0,${1 - .2 * haloAmt}) 55%, #000 100%)`;
      cv.style.webkitMaskImage = cv.style.maskImage = m;
    } else cv.style.webkitMaskImage = cv.style.maskImage = 'none';
    glow.style.opacity = haloAmt; glow.style.transform = `translate(${halo.x}px,${halo.y}px)`;

    const l = Math.max(0, lastEdges[0] / cw * 100), rr = Math.min(100, 100 - lastEdges[1] / cw * 100), bot = 58;
    overlay.style.opacity = L(.3, 0, b);
    photo.style.filter = `brightness(${L(.5, 1, b)}) saturate(${L(.5, 1, b)})`;
    photo.style.transform = `scale(${L(1.08, 1, p)})`;
    cold.style.opacity = .55 * (1 - b);
    warm.style.opacity = .35 * b * (1 - c * .6);
    beam.style.opacity = b * (1 - c);
    beam.style.clipPath = `polygon(${l}% ${bot}%,${rr}% ${bot}%,${rr + 22}% 100%,${l - 22}% 100%)`;
    name.style.color = `rgba(${L(184, 242, b)},${L(154, 236, b)},${L(106, 228, b)},${L(.35, 1, b)})`;
    name.style.letterSpacing = `${L(.06, .14, b)}em`;
    sub.style.opacity = cl((b - .5) * 2);
    hint.style.opacity = reduced ? 0 : 1 - cl(p * 12);
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
