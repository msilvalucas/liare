(() => {
  const HERO_LENGTH = 200; // vh of scroll the hero occupies on desktop (150 | 200 | 250)
  const SHOW_DIMMER = true;
  const STRIPS = 14;
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
  const cL = $('curtain-l'), cR = $('curtain-r');

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
  let p = reduced ? 1 : 0;
  if (!reduced) ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom',
    onUpdate: self => { p = self.progress; }
  });

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

  gsap.fromTo('#foot-line', { opacity: .6 }, { opacity: 1, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });

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

  // ---------- Curtains (spring physics, per frame) ----------
  const mkStrips = host => Array.from({ length: STRIPS }, () => {
    const el = document.createElement('div');
    el.className = 'curtain__strip';
    host.prepend(el);
    return { el, pos: 0, vel: 0, ang: 0, av: 0, init: false };
  });
  const strips = { L: mkStrips(cL), R: mkStrips(cR) };

  let mx = innerWidth / 2, my = innerHeight / 2, hx = mx, hy = my, lastW = 0;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  gsap.ticker.add(() => {
    const vw = innerWidth;
    const a = ease(cl(p / .4)), b = ease(cl((p - .4) / .4)), c = ease(cl((p - .8) / .2));
    const t = performance.now(), N = STRIPS, W = vw * .505, base = W / N;

    const open = p > .86;
    nav.classList.toggle('is-open', open);
    dimmer.classList.toggle('is-open', open);

    if (lastW !== vw) { lastW = vw; [...strips.L, ...strips.R].forEach(o => o.el.style.width = (base * 1.35) + 'px'); }
    const spread = L(L(L(1, .55, a), .2, b), 0, c);
    const gust = reduced ? 0 : (1 - a * .7) * (1 - c);
    const exitX = c * (base * 1.5 + 80);
    const sc = L(.4, 1, spread);
    const edges = [0, 0];
    ['L', 'R'].forEach((side, si) => {
      const breath = reduced ? 10 : (14 + 10 * Math.sin(t / 1900 + si * 1.7) + 5 * Math.sin(t / 970 + si * .6)) * (1 - a);
      strips[side].forEach((o, i) => {
        const fr = i / (N - 1);
        const target = fr * (W - base * 1.35 * sc) * spread - exitX - Math.pow(fr, 2.2) * breath;
        if (!o.init || reduced) { o.pos = target; o.vel = 0; o.init = true; }
        else {
          const k = .025 + .07 * fr, d = .86 - .08 * fr;
          o.vel = (o.vel + (target - o.pos) * k) * d; o.pos += o.vel;
        }
        const wind = gust * (Math.sin(t / 1600 + i * .5 + si * 2.1) * .45 + Math.sin(t / 2700 + i * .23 + si) * .35) * (.4 + .6 * fr);
        const at = Math.max(-4.5, Math.min(4.5, -o.vel * .3)) + wind;
        o.av = (o.av + (at - o.ang) * .06) * .88; o.ang += o.av;
        const x = si ? -o.pos : o.pos, rot = si ? -o.ang : o.ang;
        o.el.style.transform = `translateX(${x}px) rotate(${rot}deg) scaleX(${sc})`;
        if (i === N - 1) edges[si] = o.pos + base * 1.35 * sc;
      });
    });
    const l = Math.max(0, edges[0] / vw * 100), rr = Math.min(100, 100 - edges[1] / vw * 100), bot = 58;
    cL.style.opacity = cR.style.opacity = c > .97 ? 0 : L(.92, 1, a);
    overlay.style.opacity = L(.3, 0, b);

    // Cursor halo that thins the curtains before the scroll starts
    const halo = (!mobile && !reduced) ? 1 - cl(p / .3) : 0;
    hx += (mx - hx) * .08; hy += (my - hy) * .08;
    if (halo > 0) {
      const mk = x => `radial-gradient(circle 140px at ${x}px ${hy}px, rgba(0,0,0,${1 - .5 * halo}) 0%, rgba(0,0,0,${1 - .22 * halo}) 55%, #000 100%)`;
      cL.style.webkitMaskImage = cL.style.maskImage = mk(hx);
      cR.style.webkitMaskImage = cR.style.maskImage = mk(hx - (vw - W));
    } else cL.style.webkitMaskImage = cL.style.maskImage = cR.style.webkitMaskImage = cR.style.maskImage = 'none';
    glow.style.opacity = halo; glow.style.transform = `translate(${hx}px,${hy}px)`;

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
