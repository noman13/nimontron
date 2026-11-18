/*
 * Artwork for the invitation. Every illustration is drawn here as SVG,
 * so the site needs no image files. Colours come from styles.css.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const f = (n) => Math.round(n * 10) / 10;
  const RAD = Math.PI / 180;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Deterministic random numbers so the art looks the same on every visit.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- shared <defs> (gradients, patterns, filters) ----------
  function ensureDefs() {
    if (document.getElementById('art-defs')) return;
    const holder = document.createElement('div');
    holder.innerHTML =
      '<svg id="art-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden">' +
      '<defs>' +
      '<radialGradient id="archFill" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#EDF0E2"/><stop offset=".75" stop-color="#F0F2E7"/><stop offset="1" stop-color="#F6F4EC" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ovalFill" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#EEF1E3"/><stop offset=".8" stop-color="#F1F3E9"/><stop offset="1" stop-color="#F6F4EC" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sealGrad" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#A9B98C"/><stop offset=".55" stop-color="#7F9062"/><stop offset="1" stop-color="#5A6941"/></radialGradient>' +
      '<pattern id="dotsGold" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.25" fill="#EBCB82"/><circle cx="9" cy="9" r=".9" fill="#FFF8EC" opacity=".75"/></pattern>' +
      '<linearGradient id="hairFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F1C19"/><stop offset=".35" stop-color="#1F1C19" stop-opacity=".85"/><stop offset="1" stop-color="#1F1C19" stop-opacity=".12"/></linearGradient>' +
      '<filter id="glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="3.2"/></filter>' +
      '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>' +
      '</defs></svg>';
    document.body.prepend(holder.firstChild);
  }

  // ---------- path measuring (uses the browser's SVG engine) ----------
  let host;
  function measure(d) {
    if (!host) {
      host = document.createElementNS(NS, 'svg');
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
      document.body.appendChild(host);
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    host.appendChild(p);
    const len = p.getTotalLength();
    return {
      len,
      at(t) {
        const l = Math.max(0, Math.min(len, t * len));
        const a = p.getPointAtLength(l);
        const b = p.getPointAtLength(Math.min(len, l + 0.6));
        const c = p.getPointAtLength(Math.max(0, l - 0.6));
        return { x: a.x, y: a.y, a: Math.atan2(b.y - c.y, b.x - c.x) / RAD };
      },
      done() { p.remove(); },
    };
  }

  // ---------- botanical line art ----------
  function leaf(x, y, ang, s, cls) {
    const L = 18 * s, W = 5.6 * s;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
      `<path class="${cls} lf" d="M0 0C${f(L * 0.25)} ${f(-W * 1.1)} ${f(L * 0.7)} ${f(-W)} ${f(L)} 0C${f(L * 0.72)} ${f(W * 0.8)} ${f(L * 0.25)} ${f(W * 0.95)} 0 0Z"/>` +
      `<path class="${cls}" d="M${f(L * 0.08)} 0Q${f(L * 0.5)} ${f(-W * 0.18)} ${f(L * 0.84)} 0"/></g>`;
  }

  function pointedPetal(r) {
    return `M0 0C${f(r * 0.25)} ${f(-r * 0.24)} ${f(r * 0.72)} ${f(-r * 0.2)} ${f(r)} 0C${f(r * 0.72)} ${f(r * 0.2)} ${f(r * 0.25)} ${f(r * 0.24)} 0 0Z`;
  }
  function roundPetal(r) {
    return `M0 0C${f(r * 0.05)} ${f(-r * 0.62)} ${f(r * 0.98)} ${f(-r * 0.62)} ${f(r)} 0C${f(r * 0.98)} ${f(r * 0.62)} ${f(r * 0.05)} ${f(r * 0.62)} 0 0Z`;
  }

  function flower(type, x, y, r, rot, tint, cls) {
    cls = cls || 'ln';
    const faint = cls === 'ln-f';
    const fill = faint ? '' : ` fp${tint ? ' ' + tint : ''}`;
    const dot = faint ? 'fc-f' : 'fc';
    rot = rot || 0;
    let g = '';
    if (type === 'star') {
      for (let i = 0; i < 6; i++) g += `<path class="${cls}${fill}" transform="rotate(${f(rot + i * 60)})" d="${pointedPetal(r)}"/>`;
      for (let i = 0; i < 5; i++) {
        const a = (rot + 30 + i * 72) * RAD, sx = Math.cos(a) * r * 0.45, sy = Math.sin(a) * r * 0.45;
        g += `<path class="${cls}" d="M0 0L${f(sx)} ${f(sy)}"/><circle class="${dot}" cx="${f(sx)}" cy="${f(sy)}" r="${f(r * 0.045 + 0.6)}"/>`;
      }
      g += `<circle class="${dot}" r="${f(r * 0.13)}"/>`;
    } else if (type === 'blossom') {
      for (let i = 0; i < 5; i++) g += `<path class="${cls}${fill}" transform="rotate(${f(rot + i * 72)})" d="${roundPetal(r)}"/>`;
      g += `<circle class="${dot}" r="${f(r * 0.2)}"/>`;
    } else if (type === 'rose') {
      for (let i = 0; i < 6; i++) {
        const a1 = (rot + i * 60) * RAD, a2 = a1 + 78 * RAD, am = (a1 + a2) / 2;
        g += `<path class="${cls}${fill}" d="M0 0L${f(Math.cos(a1) * r * 0.72)} ${f(Math.sin(a1) * r * 0.72)}Q${f(Math.cos(am) * r * 1.22)} ${f(Math.sin(am) * r * 1.22)} ${f(Math.cos(a2) * r * 0.72)} ${f(Math.sin(a2) * r * 0.72)}Z"/>`;
      }
      let d = '';
      for (let t = 0; t <= 1.0001; t += 0.035) {
        const a = rot * RAD + t * 4.4 * Math.PI, rr = r * 0.05 + r * 0.6 * t;
        d += (d ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr);
      }
      g += `<path class="${cls}" d="${d}"/>`;
    } else if (type === 'bud') {
      g += `<g transform="rotate(${f(rot)})"><path class="${cls}${fill}" d="M0 0C${f(r * 0.5)} ${f(-r * 0.35)} ${f(r * 0.5)} ${f(-r * 0.9)} 0 ${f(-r * 1.25)}C${f(-r * 0.5)} ${f(-r * 0.9)} ${f(-r * 0.5)} ${f(-r * 0.35)} 0 0Z"/>` +
        `<path class="${cls}" d="M0 0Q${f(r * 0.45)} ${f(-r * 0.3)} ${f(r * 0.55)} ${f(-r * 0.65)}M0 0Q${f(-r * 0.45)} ${f(-r * 0.3)} ${f(-r * 0.55)} ${f(-r * 0.65)}"/></g>`;
    }
    return `<g transform="translate(${f(x)} ${f(y)})">${g}</g>`;
  }

  // Leaves (and optional berries / flowers) growing along any path.
  function vine(d, o) {
    o = o || {};
    const r = rng(o.seed || 1), m = measure(d), cls = o.cls || 'ln';
    const berryCls = cls === 'ln-f' ? 'fb-f' : (o.berryCls || 'fb');
    let s = o.noStem ? '' : `<path class="${cls}" d="${d}"/>`;
    const n = Math.max(2, Math.floor(m.len / (o.step || 13)));
    const from = o.from == null ? 0.04 : o.from, to = o.to == null ? 0.98 : o.to;
    for (let i = 0; i < n; i++) {
      const t = from + ((to - from) * (i + r() * 0.5)) / n;
      const p = m.at(t), side = i % 2 ? 1 : -1;
      const sz = (o.size || 1) * (0.55 + r() * 0.6) * (o.taper ? 1 - t * 0.55 : 1);
      s += leaf(p.x, p.y, p.a + side * (28 + r() * 38), sz, cls);
      if (o.berries && r() < o.berries) {
        const a = (p.a - side * 65) * RAD, len = 7 + r() * 9;
        const bx = p.x + Math.cos(a) * len, by = p.y + Math.sin(a) * len;
        s += `<path class="${cls}" d="M${f(p.x)} ${f(p.y)}L${f(bx)} ${f(by)}"/><circle class="${berryCls}" cx="${f(bx)}" cy="${f(by)}" r="${f(1.8 + r() * 2.2)}"/>`;
      }
    }
    (o.flowers || []).forEach((fl) => {
      const p = m.at(fl.t);
      s += flower(fl.type, p.x + (fl.dx || 0), p.y + (fl.dy || 0), fl.r, fl.rot == null ? r() * 60 : fl.rot, fl.tint, cls);
    });
    m.done();
    return s;
  }

  // A small bush of flowers and leaves rooted at (x, y), growing upwards.
  function bush(x, y, s, seed, mirror) {
    const k = mirror ? -1 : 1;
    const P = (dx, dy) => `${f(x + dx * s * k)} ${f(y + dy * s)}`;
    let g = '';
    g += vine(`M${P(0, 0)}C${P(-6, -30)} ${P(-24, -52)} ${P(-48, -66)}`, { seed: seed, size: s * 0.95, step: 10, berries: 0.3, taper: true });
    g += vine(`M${P(4, 0)}C${P(10, -34)} ${P(8, -64)} ${P(20, -96)}`, { seed: seed + 1, size: s, step: 10, berries: 0.25, taper: true });
    g += vine(`M${P(8, 0)}C${P(26, -18)} ${P(44, -26)} ${P(66, -30)}`, { seed: seed + 2, size: s * 0.9, step: 10, berries: 0.3, taper: true });
    g += flower('star', x + 20 * s * k, y - 98 * s, 15 * s, 12, '', 'ln');
    g += flower('rose', x - 46 * s * k, y - 66 * s, 15 * s, 30, 't-blush', 'ln');
    g += flower('blossom', x + 64 * s * k, y - 32 * s, 9 * s, 10, 't-gold', 'ln');
    g += flower('bud', x - 6 * s * k, y - 40 * s, 8 * s, -20 * k, 't-blush', 'ln');
    g += flower('blossom', x + 14 * s * k, y - 48 * s, 8 * s, 0, '', 'ln');
    return g;
  }

  // Corner decoration, drawn for the top-left corner of a 260 × 260 box.
  function corner(seed, extraClass) {
    seed = seed || 3;
    let faint = '';
    faint += vine('M-6 64C60 60 126 92 210 70', { seed: seed + 5, cls: 'ln-f', size: 1.5, step: 15 });
    faint += vine('M64 -6C62 70 92 130 70 214', { seed: seed + 6, cls: 'ln-f', size: 1.5, step: 15 });
    faint += flower('rose', 96, 88, 32, 10, '', 'ln-f') + flower('star', 160, 58, 24, 5, '', 'ln-f') + flower('star', 54, 160, 20, 30, '', 'ln-f');
    let main = '';
    main += vine('M-6 24C50 20 100 40 150 30S228 6 262 16', { seed: seed, size: 1.05, berries: 0.25, flowers: [{ t: 0.62, type: 'blossom', r: 10 }, { t: 0.9, type: 'bud', r: 9, rot: 70 }] });
    main += vine('M22 -6C18 50 40 100 30 150S8 222 16 262', { seed: seed + 1, size: 1.05, berries: 0.25, flowers: [{ t: 0.6, type: 'blossom', r: 9, tint: 't-blush' }, { t: 0.9, type: 'bud', r: 9, rot: 160 }] });
    main += vine('M0 0C40 40 74 64 122 104', { seed: seed + 2, size: 1.15, berries: 0.45 });
    main += flower('rose', 44, 42, 26, 10, 't-blush', 'ln');
    main += flower('star', 104, 34, 19, 15, '', 'ln');
    main += flower('star', 32, 104, 17, 40, 't-gold', 'ln');
    main += flower('blossom', 122, 106, 9, 0, 't-blush', 'ln');
    return `<svg class="corner${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 260 260" aria-hidden="true" focusable="false">${faint}${main}</svg>`;
  }

  function divider() {
    let g = '';
    g += vine('M130 26C100 30 64 14 8 24', { seed: 31, size: 0.85, step: 7, berries: 0.3, flowers: [{ t: 0.55, type: 'blossom', r: 7, tint: 't-gold' }, { t: 0.92, type: 'bud', r: 6, rot: -100 }] });
    g += vine('M130 26C160 30 196 14 252 24', { seed: 32, size: 0.85, step: 7, berries: 0.3, flowers: [{ t: 0.55, type: 'blossom', r: 7 }, { t: 0.92, type: 'bud', r: 6, rot: 100 }] });
    g += flower('star', 110, 24, 9, 10, '', 'ln') + flower('star', 150, 24, 9, 40, '', 'ln');
    g += flower('rose', 130, 25, 12, 0, 't-blush', 'ln');
    return `<svg class="divider" viewBox="0 0 260 50" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  // ---------- background tiles (data URIs, so they cost nothing to scroll) ----------
  const TILE_STYLE = '.ln{fill:none;stroke:#7D8F62;stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round}' +
    '.ln-f{fill:none;stroke:#D0D8C0;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}' +
    '.fp{fill:#F6F4EC}.t-blush{fill:#F6DCD7}.t-gold{fill:#F7E8C4}.fc{fill:#5E6B3D}.fb{fill:#9AA97E}.fc-f,.fb-f{fill:#D3DAC4}';
  function dataUri(w, h, body) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>${TILE_STYLE}</style>${body}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // Faint sprigs scattered over the whole page.
  function botanicalTile() {
    const S = 240;
    const sprigs = [[34, 40, 30], [150, 26, 160], [206, 120, 250], [96, 132, 70], [26, 196, 320], [168, 196, 200]];
    let g = '';
    sprigs.forEach(([x, y, ang], i) => {
      const a = ang * RAD, L = 44;
      const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
      const cx = (x + x2) / 2 - Math.sin(a) * 9, cy = (y + y2) / 2 + Math.cos(a) * 9;
      g += vine(`M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`, { seed: 100 + i, cls: 'ln-f', size: 0.72, step: 8, berries: 0.3 });
      if (i % 2 === 0) g += flower(i % 4 ? 'blossom' : 'star', x2, y2, i % 4 ? 5 : 7, i * 20, '', 'ln-f');
    });
    return dataUri(S, S, g);
  }

  // A climbing vine for the page edges, repeated down the page.
  function edgeVineTile(seed, mirror) {
    const W = 46, H = 600, X0 = 14, AMP = 4;
    const X = (y) => { const x = X0 + AMP * Math.sin((2 * Math.PI * y) / H); return mirror ? W - x : x; };
    let d = '';
    for (let y = 0; y <= H; y += 10) d += (d ? 'L' : 'M') + f(X(y)) + ' ' + y;
    let g = vine(d, { seed, size: 0.8, step: 12, berries: 0.25, from: 0.04, to: 0.96 });
    g += flower('rose', X(H * 0.22), H * 0.22, 11, seed * 7, 't-blush', 'ln');
    g += flower('blossom', X(H * 0.5) + (mirror ? -6 : 6), H * 0.5, 7, seed, 't-gold', 'ln');
    g += flower('star', X(H * 0.76), H * 0.76, 10, seed * 3, '', 'ln');
    return dataUri(W, H, g);
  }

  // ---------- the couple ----------
  function shoe(x, y) {
    return `<path class="gold" d="M${x} ${y}h22c6 0 11 2 13 5c0 4-6 6-13 6h-20c-4 0-5-8-2-11z"/>` +
      `<path class="gold-st w2" d="M${x + 33} ${y + 4}c5-3 7-7 5-10"/>`;
  }

  function groom(pose) {
    const up = pose === 'twirl';
    let s = '';
    // turban tail (shamla) falling down the back
    s += '<path class="g-turban2" d="M80 56C72 66 68 86 69.5 110C70 118 72 124 75 128L82 125C78 112 78 92 84 66Z"/><path class="gold-st w2" d="M74.5 127.5L82.5 124.5"/>';
    s += '<path class="g-legs" d="M68 350C68 385 69 418 71 444M112 350C113 385 115 418 117 444"/>';
    s += '<path class="g-legs2" d="M63 428q7 3 15 0M63 435q7 3 15 0M109 428q7 3 15 0M109 435q7 3 15 0"/>';
    s += shoe(60, 446) + shoe(106, 446);
    // far arm
    s += '<path class="g-arm-o" d="M54 146C43 190 42 250 57 292"/>';
    s += '<path class="g-arm" d="M54 146C43 190 42 250 57 292"/>';
    s += '<path class="g-arm2" d="M50 160C43 196 43 246 54 282"/>';
    s += '<ellipse class="skin" cx="60" cy="301" rx="7" ry="9" transform="rotate(-15 60 301)"/>';
    s += '<path class="gold-st w2" d="M49 291L65 286"/>';
    // sherwani
    s += '<path class="g-coat" d="M86 118L114 118C132 122 142 130 144 146L146 250C148 290 151 330 154 360L38 360C41 330 44 290 46 250L48 146C50 130 62 122 86 118Z"/>';
    s += '<path class="g-coat2" d="M48 146L46 250C44 290 41 330 38 360L54 360C55 320 57 260 60 150Z"/>';
    s += '<path class="gold-st w2" d="M40 352C78 357 116 357 152 352"/>';
    s += '<path class="g-coat2-st" d="M101 127V357"/>';
    for (let y = 138; y <= 218; y += 16) s += `<circle class="gold" cx="104.5" cy="${y}" r="2.5"/>`;
    s += '<path class="acc" d="M115 150h14l-3 7h-8z"/><path class="g-coat2-st" d="M113 157h18"/>';
    // stole
    s += '<path class="g-stole" d="M60 124C54 140 52 152 53 172L55 300L73 298L71 172C71 152 72 138 77 127Z"/>';
    s += '<path class="g-stole" d="M124 126C129 138 131 152 131 172L132 300L148 298L147 172C147 152 144 136 139 128Z"/>';
    s += '<path class="dot-edge" d="M70 176L71.5 293M134 176L135 293"/>';
    s += '<path class="g-stole" d="M74 128C86 116 118 116 140 128L136 134C118 124 88 124 78 134Z"/>';
    s += '<path class="tassel" d="M58 303v8M64 303v9M70 303v8M136 303v8M141 303v9M146 303v8"/>';
    // neck, collar, head
    s += '<path class="skin2" d="M95 100H107L108.5 120H93.5Z"/>';
    s += '<path class="g-coat2" d="M84 113H113L115 127H82Z"/><path class="gold-st w15" d="M84 114H113"/>';
    // face in profile (facing the bride): slim, with a sharp jaw angle, defined chin and smaller nose
    s += '<path class="skin" d="M114 58C116.5 63 117.5 69 117.5 74L121.5 83.5L117.5 86.5C118 89.5 118.3 92 117.4 94.5C117 97.5 117.3 100.5 116.6 103.5C116 107 114 110 110.5 111C108 111.6 104 111 101 109.5L89.5 102.5C86.5 98.5 84.5 93 83.8 86C83.2 78 83.4 66 84.5 58Z"/>';
    // hair, from his photo: short faded sides (dark under the turban, lighter towards the ear and neck)
    s += '<path class="hair-fade" d="M84.6 63C83.8 72 84 81 85.4 87.5C86.2 90 87 92 88 93C87.8 88 87.6 84 87.8 80C88.2 76.5 89.6 75 91.5 75C93.4 75 94 77 94 79L97 79C96.8 73 97.3 67.5 98.6 63.5Z"/>';
    s += '<path class="hair" d="M84.6 63C84.2 66.5 84.3 69.5 84.6 72C89 70.6 93.5 69.9 98 70C97.9 67.8 98.2 65.6 98.6 63.5Z"/>';
    s += '<path class="hair" d="M94 64.5L97.8 64.2C97.3 70 97.2 76 97.4 84L94.4 84.5C93.8 77 93.6 70 94 64.5Z"/>';
    // beard, from his photo: short and full, joined to the sideburns, trim along the jaw, fuller at the chin, thin moustache
    s += '<path class="hair" d="M94.4 84L97.4 83.8C99.5 88.5 103 92.2 107.5 94.4C109 95.1 110.3 95.2 111.2 94.9C112.6 92.4 114.8 90.2 117.6 89.3L118.3 90.6C118.2 91.6 117.9 92.4 117.5 93C117.3 95.5 117.1 99 116.8 102.5C116.5 106 116 109.5 113.6 111.8C110.5 113.6 105 112.6 100.5 110.6L89.6 103.6C88.4 100.6 88.6 97 89.6 94.2C91 91.5 92.8 88.5 94.4 84Z"/>';
    s += '<path class="skin2" d="M117.8 92.5C116 93.5 113.5 93.9 111.4 93.6L111.6 95C114 95.4 116.3 95 117.6 94.1Z"/>';
    s += '<ellipse class="skin2" cx="89.5" cy="81.5" rx="3.1" ry="5.1"/>';
    // safa (turban): low and rounded, sloping slightly forward, diagonal wraps, gold edge, kalgi
    s += '<path class="g-turban" d="M118 64C122 58 123.5 50 122 43C120 34 112 27 100 26C88 25 77 31 74 41C72 49 73 58 78 66C80 69 82 70 84 69C95 64 107 62 118 64Z"/>';
    s += '<path class="g-turban2-st" d="M80 63C92 58 105 52 120 45M75 52C87 47 100 40 114 32M80 36C87 32 95 28 103 26.5"/>';
    s += '<path class="gold-st w15" d="M84 68.5C95 63.5 107 61.5 118 63.5"/>';
    s += '<path class="plume" d="M118 46C120 37 125 31 131 27C127.5 34 125 40 121 47Z"/><circle class="gold" cx="119.5" cy="49" r="4"/><circle class="acc" cx="119.5" cy="49" r="1.6"/>';
    // near arm
    if (up) {
      s += '<path class="g-arm-o" d="M138 146C152 132 160 118 164 100C167 88 169 78 170 70"/>';
      s += '<path class="g-arm" d="M138 146C152 132 160 118 164 100"/>';
      s += '<path class="g-arm" d="M164 100C167 88 169 78 170 70"/>';
      s += '<ellipse class="skin" cx="171" cy="61" rx="6.5" ry="7.5"/>';
      s += '<path class="gold-st w2" d="M162 72L178 74"/>';
    } else {
      s += '<path class="g-arm-o" d="M138 146C148 176 152 206 150 230C140 243 124 248 110 249"/>';
      s += '<path class="g-arm" d="M138 146C148 176 152 206 150 230"/>';
      s += '<path class="g-arm" d="M150 230C140 243 124 248 110 249"/>';
      s += '<path class="g-arm2" d="M146 238C138 244 126 247 114 247.5"/>';
      s += '<ellipse class="skin" cx="104" cy="250" rx="7.5" ry="6.5"/>';
      s += '<path class="gold-st w2" d="M113.5 241L115 257"/>';
    }
    return s;
  }

  const SKIRT_WALK = 'M180 218H226C236 280 260 360 286 452C288 458 284 462 278 462H134C128 462 124 458 126 452C146 370 168 290 180 218Z';
  const SKIRT_TWIRL = 'M180 218H226C246 280 280 350 318 420C322 428 316 434 308 432C298 446 282 440 272 450C258 444 242 456 228 448C212 458 196 450 184 456C170 448 152 454 142 442C128 446 114 438 108 426C100 430 94 422 98 414C130 350 166 280 180 218Z';

  function bride(pose) {
    const tw = pose === 'twirl', solo = pose === 'solo';
    let s = '';
    // dupatta flowing down the back
    if (tw) {
      s += '<g class="flutter"><path class="b-dupatta" d="M214 96C240 110 254 150 270 190C292 240 312 290 320 330C322 340 316 344 308 340C292 320 274 280 258 240C242 200 222 150 206 110Z"/>' +
        '<path class="dot-edge" d="M216 98C241 112 255 152 271 192C293 242 313 292 319 332"/></g>';
    } else {
      s += '<g class="flutter"><path class="b-dupatta" d="M214 96C236 110 240 160 248 210C262 290 286 370 304 452C305 458 300 462 294 462H250C252 380 240 300 228 230C222 190 214 140 206 110Z"/>' +
        '<path class="dot-edge" d="M216 99C237 113 241 160 249 210C263 290 287 370 303 452"/></g>';
    }
    // lehenga: gold underlay peeks out as the hem border
    const sk = tw ? SKIRT_TWIRL : SKIRT_WALK;
    s += `<path class="gold" d="${sk}"/>`;
    s += `<g transform="translate(0 -8)"><path class="b-skirt" d="${sk}"/><path class="dots" d="${sk}"/></g>`;
    s += tw
      ? '<path class="b-skirt2-st" d="M196 222C186 300 160 370 128 428M210 222C214 300 230 380 250 440M220 222C240 290 268 356 298 414M188 222C172 290 140 360 112 414"/>'
      : '<path class="b-skirt2-st" d="M196 222C190 300 176 380 160 444M210 222C214 300 226 380 243 444M219 222C233 300 251 380 268 442M188 222C178 300 160 380 143 442"/>';
    // far arm: full sleeve to the wrist, bangles over the cuff
    const sleeve = (d) => `<path class="b-sleeve-o" d="${d}"/><path class="b-sleeve" d="${d}"/>`;
    if (tw) {
      s += sleeve('M226 160C236 166 244 172 250 180C260 190 268 196 277 198') +
        '<path class="bangles" d="M267 194.6C270 196 273 197 276 197.6"/><ellipse class="skin" cx="285" cy="198" rx="7.5" ry="6"/>';
    } else {
      s += sleeve('M226 160C232 172 234 182 234 192C236 210 236 226 232.5 239') +
        '<path class="bangles" d="M235.2 226C234.9 230 234.2 234 233.2 238"/><ellipse class="skin" cx="231" cy="247" rx="6" ry="8"/>';
    }
    // blouse and belt (the hijab covers the neck and shoulders)
    s += '<path class="b-blouse" d="M186 150H216C228 154 232 162 232 174L226 222H178L172 174C172 162 176 154 186 150Z"/>';
    s += '<path class="gold" d="M179 214H227L228 223H178Z"/><path class="acc" d="M199 214h8l-4 9z"/>';
    // near arm (drawn before the hijab so the hijab drapes over the shoulder)
    if (tw) {
      s += sleeve('M183 160C178 150 172 140 168 128C165 110 166 90 168.6 74') +
        '<path class="bangles" d="M166.7 86C167 82 167.5 78 168.3 75"/><ellipse class="skin" cx="170" cy="65" rx="6" ry="7.5"/>';
    } else if (solo) {
      s += sleeve('M183 160C177 172 174 182 172 194C170 212 171 226 174.5 237') +
        '<path class="bangles" d="M171.4 225C171.8 229 172.6 233 173.8 236.5"/><ellipse class="skin" cx="176" cy="246" rx="6" ry="8"/>';
    } else {
      s += sleeve('M183 160C177 172 174 182 172 194C168 214 158 229 148 234.5') +
        '<path class="bangles" d="M159 228.5C156 231 153 232.8 149.5 234"/><ellipse class="skin" cx="140" cy="238" rx="8" ry="6" transform="rotate(-20 140 238)"/>';
    }
    // face in side profile (facing the groom): visible nose and lips, small delicate chin, sharp jaw
    s += '<path class="skin" d="M217 104C217 90 210 82 200 82C190 82 183 89 182 98L181.6 105.5L177.6 115.4L181 118.3C181.3 120.2 181.6 122 181 124C180.6 126 181 128.2 181.5 130.5C182 133.4 182.6 135.2 183.6 136.8C184.4 138.4 185.4 139.6 186.8 140.6C192 144 204 137 209 131C214 125 217 120 217 116Z"/>';
    // hijab: wraps the head, frames the face along a straight jawline, falls over the shoulders and chest
    s += '<path class="b-hijab" d="M182 98C182 83 194 72 207 72C224 72 236 86 236 104C236 120 232 134 236 148C244 160 246 176 240 190C226 198 206 198 190 194C180 192 172 186 170 178C169 168 174 159 180 151C182 148 184 145 186 142.6C186.6 141.8 187.2 141.2 187.8 140.9L205.5 129.8C206.6 128 207.2 124 207.2 118C207.2 110 206.8 104 205 100.4C202.6 96.8 197 95.8 191 96C187.4 96.1 184.4 96.8 182 98Z"/>';
    s += '<path class="b-hijab2" d="M236 112C232 126 226 138 215 147M217 154C223 166 225 179 221 192M195 170C203 178 214 183 229 185"/>';
    s += '<path class="dot-edge" d="M182 98C184.4 96.8 187.4 96.1 191 96C197 95.8 202.6 96.8 205 100.4C206.8 104 207.2 110 207.2 118C207.2 124 206.6 128 205.5 129.8L187.8 140.9C187.2 141.2 186.6 141.8 186 142.6C184 145 182 148 180 151"/>';
    s += '<circle class="gold" cx="214.5" cy="147.5" r="3.4"/><circle class="acc" cx="214.5" cy="147.5" r="1.4"/>';
    return s;
  }

  function couple(pose) {
    return `<g class="groom">${groom(pose)}</g><g class="bride">${bride(pose)}</g>`;
  }

  // ---------- guest figures for the dress code (everyday outfits, not bridal) ----------
  // --c1 is the main outfit colour, --c2 the second colour (pyjama or dupatta).
  function guestArms(sleeveEnd) {
    let s = '';
    const L = `M33 72C27 ${sleeveEnd ? 96 : 100} 25 ${sleeveEnd ? 108 : 130} ${sleeveEnd ? 26 : 27} ${sleeveEnd ? 116 : 156}`;
    const R = `M87 72C93 ${sleeveEnd ? 96 : 100} 95 ${sleeveEnd ? 108 : 130} ${sleeveEnd ? 94 : 93} ${sleeveEnd ? 116 : 156}`;
    s += `<path class="gf-arm-o" d="${L}"/><path class="gf-arm-o" d="${R}"/><path class="gf-arm" d="${L}"/><path class="gf-arm" d="${R}"/>`;
    if (sleeveEnd) {
      s += '<path class="skin-st thin" d="M26 116C26 132 28 146 31 158"/><path class="skin-st thin" d="M94 116C94 132 92 146 89 158"/>';
      s += '<path class="gold-st w2" d="M26.5 148h8M85.5 148h8"/>';
      s += '<ellipse class="skin" cx="32" cy="164" rx="5" ry="6.5"/><ellipse class="skin" cx="88" cy="164" rx="5" ry="6.5"/>';
    } else {
      s += '<ellipse class="skin" cx="28" cy="164" rx="5.5" ry="7"/><ellipse class="skin" cx="92" cy="164" rx="5.5" ry="7"/>';
    }
    return s;
  }
  function guestHeadMan() {
    return '<path class="skin2" d="M54 50H66L67 62H53Z"/>' +
      '<ellipse class="skin" cx="60" cy="36" rx="14.5" ry="17.5"/>' +
      '<ellipse class="skin2" cx="45.6" cy="38" rx="2.6" ry="4"/><ellipse class="skin2" cx="74.4" cy="38" rx="2.6" ry="4"/>' +
      '<path class="hair" d="M45.2 34C44.4 21 52 15 60 15C69 15 76 21 74.8 34C73 28 70 25.5 66 24.5C60 23.3 52 25 48 28.4C46.5 30 45.6 31.8 45.2 34Z"/>';
  }
  function guestMan() {
    let s = '';
    s += '<path class="gpj-o" d="M50 196V282M70 196V282"/><path class="gpj" d="M50 196V282M70 196V282"/>';
    s += '<path class="shoe" d="M42 283h13c3 0 5 3 4 6H41c-1-3-1-6 1-6zM65 283h13c2 0 2 3 1 6H61c-1-3 1-6 4-6z"/>';
    s += '<path class="gf" d="M45 58H75C87 61 93 68 94 80L95 140C96 165 97 185 98 202H22C23 185 24 165 25 140L26 80C27 68 33 61 45 58Z"/>';
    s += '<path class="gf-line" d="M60 64V118M24 194H96"/>';
    s += '<circle class="gf-d" cx="62.5" cy="74" r="1.6"/><circle class="gf-d" cx="62.5" cy="86" r="1.6"/><circle class="gf-d" cx="62.5" cy="98" r="1.6"/>';
    s += guestArms(false);
    s += guestHeadMan();
    s += '<path class="gf-d" d="M52 54H68L69 63H51Z"/>';
    return s;
  }
  function guestSuit() {
    let s = '';
    s += '<path class="gf-leg-o" d="M50 160V282M70 160V282"/><path class="gf-leg" d="M50 160V282M70 160V282"/>';
    s += '<path class="shoe dark" d="M42 283h13c3 0 5 3 4 6H41c-1-3-1-6 1-6zM65 283h13c2 0 2 3 1 6H61c-1-3 1-6 4-6z"/>';
    s += '<path class="gf" d="M45 58H75C87 61 93 68 94 80L95 166H25L26 80C27 68 33 61 45 58Z"/>';
    s += guestArms(false);
    s += guestHeadMan();
    s += '<path class="shirt" d="M51 57L60 98L69 57Z"/><path class="tie" d="M58 61H62L63.5 87L60 93L56.5 87Z"/>';
    s += '<path class="gf-line lapel" d="M51 57L57 100L60 97M69 57L63 100L60 97M60 100V166M29 134H44M76 134H91M73 82H84"/>';
    s += '<circle class="gf-d" cx="60" cy="114" r="2"/><circle class="gf-d" cx="60" cy="130" r="2"/><path class="acc" d="M75 79h7l-1.5 3h-4z"/>';
    return s;
  }
  function guestWoman() {
    let s = '';
    s += '<path class="hair" d="M45 40C44 23 52 18 60 18C68 18 76 23 75 40C77 56 77 72 74 88H46C43 72 43 56 45 40Z"/>';
    s += '<path class="gd" d="M70 62C84 66 96 92 102 132C106 162 108 192 108 218L99 220C98 190 95 158 90 128C86 100 80 80 70 68Z"/>';
    s += '<path class="gold" d="M46 283h10c2 0 3 4 0 5H44c-1-3 0-5 2-5zM64 283h10c2 0 2 5 0 5H62c-1-3 0-5 2-5z"/>';
    s += '<path class="gf" d="M47 60H73C83 63 88 70 88 80L84 112C92 160 100 230 104 278C104 282 101 285 97 285H23C19 285 16 282 16 278C20 230 28 160 36 112L32 80C32 70 37 63 47 60Z"/>';
    s += '<path class="gf-line" d="M36 112C50 116 70 116 84 112M18 272C46 277 74 277 102 272"/><path class="gf-line faint" d="M50 118C46 170 40 230 36 280M70 118C74 170 80 230 84 280M60 118V282"/>';
    s += '<path class="gd" d="M72 61C80 68 82 82 76 96C70 110 56 124 38 134L33 125C50 116 62 104 66 92C70 80 68 70 66 63Z"/>';
    s += guestArms(true);
    s += '<path class="skin2" d="M54 52H66L67 62H53Z"/><path class="skin" d="M52 60C55 68 65 68 68 60Z"/>';
    s += '<ellipse class="skin" cx="60" cy="38" rx="14" ry="17"/>';
    s += '<path class="hair" d="M45.8 36C46.2 24.5 53 20 60 20C67 20 73.8 24.5 74.2 36C71 29.5 66 27.2 60 27.6C54 27.2 49 29.5 45.8 36Z"/>';
    s += '<circle class="gold" cx="46.4" cy="45" r="1.8"/><circle class="gold" cx="73.6" cy="45" r="1.8"/>';
    return s;
  }
  function guest(kind, c1, c2) {
    const vars = `--c1:${esc(c1 || '#E9E1CC')}${c2 ? `;--c2:${esc(c2)}` : ''}`;
    const body = kind === 'woman' ? guestWoman() : kind === 'suit' ? guestSuit() : guestMan();
    return `<svg class="fig" viewBox="10 8 100 288" style="${vars}" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  // ---------- decorative strings ----------
  function quad(p0, p1, p2, t) {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  }
  function fairyLights(p0, p1, p2, n, delay) {
    let s = `<path class="wire" d="M${p0[0]} ${p0[1]}Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}"/>`;
    const colors = ['#F6D98A', '#F4C4BC', '#FFF3D6', '#E8C16A'];
    for (let i = 1; i < n; i++) {
      const [x, y] = quad(p0, p1, p2, i / n);
      const c = colors[i % colors.length];
      s += `<g class="bulb" style="--d:${f(((i * 0.37 + delay) % 2.4))}s"><circle cx="${f(x)}" cy="${f(y + 4)}" r="6" fill="${c}" opacity=".55" filter="url(#glow)"/>` +
        `<path class="wire" d="M${f(x)} ${f(y)}V${f(y + 2)}"/><circle cx="${f(x)}" cy="${f(y + 4.2)}" r="2.7" fill="${c}"/></g>`;
    }
    return s;
  }

  function garland(x, y, len, delay) {
    let s = `<g class="swing" style="--d:${delay}s"><path class="wire" d="M${x} ${y}V${y + len}"/>`;
    s += leaf(x, y + 4, 140, 0.55, 'ln') + leaf(x, y + 4, 40, 0.55, 'ln');
    const cols = ['bead-gold', 'bead-blush', 'bead-gold', 'bead-sage'];
    let i = 0;
    for (let yy = y + 12; yy < y + len - 4; yy += 8.5, i++) s += `<circle class="${cols[i % cols.length]}" cx="${x}" cy="${f(yy)}" r="${i % 2 ? 3.1 : 3.9}"/>`;
    s += `<path class="tassel-fill" d="M${x - 4} ${y + len}h8l3 13h-14z"/><circle class="bead-gold" cx="${x}" cy="${y + len - 1}" r="3"/></g>`;
    return s;
  }

  // ---------- scenes ----------
  function archScene(label) {
    let s = `<svg class="scene" viewBox="0 0 400 600" role="img" aria-label="${esc(label || 'The bride and groom walking arm in arm under a floral arch')}">`;
    s += '<path d="M62 600V232A138 138 0 0 1 338 232V600Z" fill="url(#archFill)"/>';
    s += '<g>' + vine('M36 600V230A164 164 0 0 1 200 66', { seed: 21, cls: 'ln-f', size: 1.35, step: 16 }) +
      vine('M364 600V230A164 164 0 0 0 200 66', { seed: 22, cls: 'ln-f', size: 1.35, step: 16 }) + '</g>';
    s += '<path class="ln" d="M50 600V232A150 150 0 0 1 350 232V600"/><path class="ln" d="M62 600V232A138 138 0 0 1 338 232V600"/>';
    s += vine('M50 590V232A150 150 0 0 1 200 82', { seed: 11, step: 12, berries: 0.18, noStem: true });
    s += vine('M350 590V232A150 150 0 0 0 200 82', { seed: 12, step: 12, berries: 0.18, noStem: true });
    // flower clusters on the arch
    s += flower('star', 166, 90, 14, 20, '', 'ln') + flower('star', 234, 90, 14, 40, 't-gold', 'ln');
    s += flower('rose', 200, 80, 21, 0, 't-blush', 'ln');
    s += flower('blossom', 92, 128, 11, 0, 't-blush', 'ln') + flower('bud', 76, 150, 9, -60, '', 'ln');
    s += flower('blossom', 308, 128, 11, 20, 't-blush', 'ln') + flower('bud', 324, 150, 9, 60, '', 'ln');
    s += flower('rose', 50, 330, 13, 10, '', 'ln') + flower('rose', 350, 330, 13, 40, '', 'ln');
    // lights and garlands
    s += fairyLights([106, 118], [200, 168], [294, 118], 9, 0.3);
    s += fairyLights([80, 150], [200, 215], [320, 150], 12, 1.1);
    s += garland(96, 141, 100, 0) + garland(304, 141, 100, -1.5);
    // the couple
    s += '<ellipse class="shadow" cx="200" cy="578" rx="118" ry="7"/>';
    s += `<g transform="translate(60.6 198) scale(.82)"><g class="sway tap-couple">${couple('walk')}</g></g>`;
    // flowers at their feet
    s += bush(70, 600, 0.95, 41, false) + bush(330, 600, 0.95, 51, true);
    s += '</svg>';
    return s;
  }

  function closingScene(label) {
    let s = `<svg class="scene" viewBox="0 0 400 520" role="img" aria-label="${esc(label || 'The bride and groom dancing inside a floral wreath')}">`;
    s += '<ellipse cx="200" cy="262" rx="150" ry="214" fill="url(#ovalFill)"/>';
    s += vine('M200 492A166 236 0 0 1 200 20', { seed: 61, cls: 'ln-f', size: 1.3, step: 16, from: 0.05, to: 0.9 });
    s += vine('M200 492A166 236 0 0 0 200 20', { seed: 62, cls: 'ln-f', size: 1.3, step: 16, from: 0.05, to: 0.9 });
    s += vine('M200 484A158 224 0 0 1 200 36', { seed: 63, step: 11, berries: 0.2, from: 0.03, to: 0.86, taper: true,
      flowers: [{ t: 0.22, type: 'star', r: 14, tint: 't-gold' }, { t: 0.5, type: 'rose', r: 14, tint: 't-blush' }, { t: 0.78, type: 'blossom', r: 9 }] });
    s += vine('M200 484A158 224 0 0 0 200 36', { seed: 64, step: 11, berries: 0.2, from: 0.03, to: 0.86, taper: true,
      flowers: [{ t: 0.22, type: 'rose', r: 14, tint: 't-blush' }, { t: 0.5, type: 'star', r: 14 }, { t: 0.78, type: 'blossom', r: 9, tint: 't-blush' }] });
    s += flower('rose', 200, 486, 20, 0, 't-blush', 'ln') + flower('star', 172, 480, 13, 10, '', 'ln') + flower('star', 228, 480, 13, 30, 't-gold', 'ln');
    s += '<ellipse class="shadow" cx="200" cy="442" rx="96" ry="6"/>';
    s += `<g transform="translate(84 128) scale(.68)"><g class="sway-fast tap-couple">${couple('twirl')}</g></g>`;
    const hearts = [[120, 170, 0], [286, 150, 1.2], [150, 110, 2.1], [262, 220, 0.6], [104, 250, 1.7], [300, 290, 2.6]];
    hearts.forEach(([x, y, d]) => {
      s += `<path class="float-heart" style="--d:${d}s" d="M${x} ${y + 3}c-3-4-9-4-9 1.5c0 4 5 7 9 10.5c4-3.5 9-6.5 9-10.5c0-5.5-6-5.5-9-1.5z"/>`;
    });
    s += '</svg>';
    return s;
  }

  // ---------- wax seal ----------
  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + 'Z';
  }
  function seal(text) {
    const r = rng(77), pts = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rad = 66 + (r() - 0.5) * 5 + (i % 7 === 0 ? 3 + r() * 4 : 0);
      pts.push([80 + Math.cos(a) * rad, 80 + Math.sin(a) * rad]);
    }
    const blob = smoothClosed(pts);
    const ring = vine('M80 132A52 52 0 1 1 80 28A52 52 0 1 1 80 132', { seed: 5, cls: 'seal-ln', size: 0.62, step: 9, noStem: true });
    return `<svg class="seal" viewBox="0 0 160 160" aria-hidden="true" focusable="false">` +
      `<path d="${blob}" fill="rgba(60,70,40,.25)" transform="translate(2 4)" filter="url(#soft)"/>` +
      `<path d="${blob}" fill="url(#sealGrad)"/>` +
      `<circle cx="80" cy="80" r="46" class="seal-ring"/><circle cx="80" cy="80" r="43" class="seal-ring2"/>${ring}` +
      `<text x="80" y="92" text-anchor="middle" class="seal-mono">${esc(text)}</text></svg>`;
  }

  // ---------- line icons for the programme ----------
  function flowerIcon() {
    let s = '';
    for (let i = 0; i < 6; i++) s += `<path class="ic-acc" transform="rotate(${i * 60} 32 32)" d="M32 32C27 24 27 14 32 10C37 14 37 24 32 32Z"/>`;
    return s + '<circle class="ic-fill" cx="32" cy="32" r="4"/>';
  }
  const ICONS = {
    drinks: '<g transform="rotate(14 21 36)"><path class="ic-acc" d="M15.4 26H26.6L26 33C25 37.5 22.5 40 21 40S17 37.5 16 33Z"/><path d="M14 17H28L26 33C25 37.5 22.5 40 21 40S17 37.5 16 33Z"/><path d="M21 40V52M15 52H27"/></g>' +
      '<g transform="rotate(-14 43 36)"><path class="ic-acc" d="M37.4 26H48.6L48 33C47 37.5 44.5 40 43 40S39 37.5 38 33Z"/><path d="M36 17H50L48 33C47 37.5 44.5 40 43 40S39 37.5 38 33Z"/><path d="M43 40V52M37 52H49"/></g>' +
      '<path d="M32 4V9M26 6L28.5 10M38 6L35.5 10"/>',
    henna: '<path class="ic-acc2" d="M14 52L20 38L40 16C43 13 48 13 50 16C53 19 52 23 49 26L28 46Z"/><path d="M36 20L46 30M14 52L10 56"/>' +
      '<path d="M36 50C40 44 48 45 47 51C46 55 40 55 41 51"/><path class="ic-acc" d="M54 40C58 36 60 31 60 27C56 29 53 34 54 40Z"/>',
    dhol: '<path class="ic-acc" d="M16 18C26 14 38 14 48 18V46C38 50 26 50 16 46Z"/><ellipse class="ic-paper" cx="16" cy="32" rx="6" ry="14"/><ellipse cx="48" cy="32" rx="6" ry="14"/>' +
      '<path d="M19 19L25 47L31 17L37 47L43 17L46 46"/><path d="M36 10L54 4M42 12L58 9"/>',
    music: '<path d="M24 46V16L48 10V40M24 22L48 16"/><ellipse class="ic-fill" cx="19" cy="46" rx="6" ry="4.5" transform="rotate(-20 19 46)"/>' +
      '<ellipse class="ic-fill" cx="43" cy="40" rx="6" ry="4.5" transform="rotate(-20 43 40)"/><path d="M8 14l3 4M6 24h5M54 26l4-3M55 34h5"/>',
    dinner: '<circle class="ic-acc" cx="32" cy="34" r="15"/><circle cx="32" cy="34" r="10"/><path d="M8 14V24C8 27 10 28 11 28M14 14V24C14 27 12 28 11 28M11 14V54M54 14C49 18 49 28 52 32V54"/>',
    arch: '<path d="M14 58V30C14 17 22 8 32 8S50 17 50 30V58M20 58V31C20 21 25 14 32 14S44 21 44 31V58"/>' +
      '<circle class="ic-acc" cx="14" cy="30" r="3.4"/><circle class="ic-acc" cx="19" cy="16" r="3.4"/><circle class="ic-acc" cx="32" cy="8" r="3.8"/><circle class="ic-acc" cx="45" cy="16" r="3.4"/><circle class="ic-acc" cx="50" cy="30" r="3.4"/><circle class="ic-acc" cx="14" cy="45" r="3"/><circle class="ic-acc" cx="50" cy="45" r="3"/>',
    car: '<path class="ic-acc2" d="M6 42V33C6 31 8 29 10 29H18L25 21C26 20 27 19 29 19H41C43 19 44 20 45 21L51 29H55C57 29 58 31 58 33V42Z"/><path d="M24 29L28 23H36V29ZM39 29V23H43L47 29Z"/>' +
      '<circle class="ic-paper" cx="17" cy="43" r="6"/><circle class="ic-paper" cx="47" cy="43" r="6"/><circle cx="17" cy="43" r="2"/><circle cx="47" cy="43" r="2"/><circle class="ic-acc" cx="10" cy="25" r="3.5"/><path d="M10 29V34"/>',
    rings: '<circle cx="25" cy="39" r="12"/><circle cx="39" cy="39" r="12"/><path class="ic-acc3" d="M21 25L25 19L29 25L25 29Z"/><path d="M44 12l2 4M51 19l-4 2M37 9v4"/>',
    camera: '<rect class="ic-acc2" x="8" y="22" width="48" height="30" rx="5"/><path d="M22 22L25 15H39L42 22"/><circle class="ic-paper" cx="32" cy="37" r="10"/><circle cx="32" cy="37" r="5"/><circle class="ic-fill" cx="48" cy="28" r="1.8"/>',
    cake: '<rect class="ic-acc" x="14" y="40" width="36" height="14" rx="2"/><rect class="ic-acc2" x="19" y="28" width="26" height="12" rx="2"/><rect class="ic-acc" x="24" y="18" width="16" height="10" rx="2"/>' +
      '<path d="M10 54H54M32 18V14"/><path class="ic-fill" d="M32 14C30 11 26.5 11.5 27 8.8S31 6.2 32 8.4C33 6.2 37.5 6.2 37 8.8S34 11 32 14Z"/>',
    sparkle: '<path class="ic-acc3" d="M32 8C33 22 36 27 48 28C36 29 33 34 32 48C31 34 28 29 16 28C28 27 31 22 32 8Z"/>' +
      '<path d="M50 40C50.5 46 52 47.5 57 48C52 48.5 50.5 50 50 56C49.5 50 48 48.5 43 48C48 47.5 49.5 46 50 40Z"/><path d="M14 42C14.4 46 15.4 47 19 47.4C15.4 47.8 14.4 48.8 14 52.8C13.6 48.8 12.6 47.8 9 47.4C12.6 47 13.6 46 14 42Z"/>',
    gift: '<rect class="ic-acc" x="12" y="28" width="40" height="26" rx="2"/><rect class="ic-acc2" x="9" y="20" width="46" height="9" rx="2"/><path d="M32 20V54M32 20C26 10 16 12 20 18C22 21 28 20 32 20C36 20 42 21 44 18C48 12 38 10 32 20Z"/>',
    heart: '<path class="ic-acc" d="M32 52C20 42 10 34 10 24C10 17 15 12 21 12C26 12 30 15 32 19C34 15 38 12 43 12C49 12 54 17 54 24C54 34 44 42 32 52Z"/>',
    mosque: '<path class="ic-acc2" d="M17 55V36H47V55Z"/><path class="ic-acc" d="M19 36C19 26 25 20 32 17C39 20 45 26 45 36Z"/>' +
      '<path d="M32 17V11M10 55V27M54 55V27M7 27H13L10 20ZM51 27H57L54 20ZM28 55V47C28 44 30 42 32 42S36 44 36 47V55M4 55H60"/>' +
      '<path class="ic-fill" d="M33.5 6.5A3 3 0 1 0 33.5 11.5A2.4 2.4 0 1 1 33.5 6.5Z"/>',
    crescent: '<path class="ic-acc3" d="M40 10A22 22 0 1 0 52 46A17 17 0 1 1 40 10Z"/>' +
      '<path d="M46 20l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z"/><path d="M10 56h44M16 60h32"/>',
    qawwali: '<path class="ic-acc2" d="M14 22H50L54 30H10Z"/><path d="M16 22L19 30L22 22L25 30L28 22L31 30L34 22L37 30L40 22L43 30L46 22L49 30"/>' +
      '<rect class="ic-acc" x="8" y="30" width="48" height="20" rx="2"/><path d="M8 38H56M14 38V44M20 38V44M26 38V44M32 38V44M38 38V44M44 38V44M50 38V44"/>' +
      '<path d="M50 6V16M50 6L57 4V14"/><ellipse class="ic-fill" cx="48" cy="16" rx="2.6" ry="2"/><ellipse class="ic-fill" cx="55" cy="14" rx="2.6" ry="2"/>',
    dj: '<path d="M14 40V32C14 20 22 12 32 12S50 20 50 32V40"/><rect class="ic-acc" x="9" y="36" width="11" height="17" rx="4"/><rect class="ic-acc" x="44" y="36" width="11" height="17" rx="4"/>' +
      '<path d="M4 39C2 43 2 47 4 51M60 39C62 43 62 47 60 51M26 30l2-4M32 28v-5M38 30l-2-4"/>',
  };
  ICONS.flower = flowerIcon();
  function icon(name) {
    return `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.heart}</svg>`;
  }

  function lightsBanner() {
    return '<svg class="lights-banner" viewBox="0 0 400 80" aria-hidden="true" focusable="false">' +
      fairyLights([4, 8], [200, 92], [396, 8], 16, 0.2) + fairyLights([40, 2], [200, 52], [360, 2], 12, 1.3) + '</svg>';
  }

  function sprig() {
    let g = vine('M32 14C24 12 14 6 4 8', { seed: 81, size: 0.55, step: 7 }) + vine('M32 14C40 12 50 6 60 8', { seed: 82, size: 0.55, step: 7 });
    g += flower('blossom', 32, 14, 6, 0, 't-blush', 'ln');
    return `<svg class="sprig" viewBox="0 0 64 24" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  // Arch-shaped wreath drawn around the scratch card (box 346 × 348).
  function archFrame() {
    let g = '';
    g += vine('M24 346V172A149 149 0 0 1 173 23', { seed: 91, step: 11, berries: 0.2, noStem: true, size: 0.9 });
    g += vine('M322 346V172A149 149 0 0 0 173 23', { seed: 92, step: 11, berries: 0.2, noStem: true, size: 0.9 });
    g += flower('rose', 173, 22, 16, 0, 't-blush', 'ln') + flower('star', 148, 28, 11, 10, '', 'ln') + flower('star', 198, 28, 11, 40, 't-gold', 'ln');
    g += flower('blossom', 60, 80, 9, 0, 't-blush', 'ln') + flower('blossom', 286, 80, 9, 30, '', 'ln');
    g += flower('rose', 22, 330, 13, 20, '', 'ln') + flower('rose', 324, 330, 13, 50, 't-blush', 'ln');
    return `<svg class="scratch-frame" viewBox="0 0 346 348" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  window.Art = { ensureDefs, archScene, closingScene, couple, guest, corner, divider, seal, icon, vine, flower, lightsBanner, sprig, archFrame, botanicalTile, edgeVineTile, esc };
})();
