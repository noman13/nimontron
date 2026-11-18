/*
 * Builds the invitation from config.js and wires up the interactions.
 * You shouldn't need to edit this file to change names, dates or venues.
 */
(function () {
  'use strict';

  const C = window.WEDDING;
  const A = window.Art;
  const esc = A.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = Object.assign({ saveTheDate: true, dressCode: true, program: true, contacts: true }, C.show || {});

  A.ensureDefs();

  // ───────── data helpers ─────────
  const bride = C.couple.bride;
  const groom = C.couple.groom;
  const [first, second] = C.couple.first === 'groom' ? [groom, bride] : [bride, groom];
  const events = (C.events || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  const evById = Object.fromEntries(events.map((e) => [e.id, e]));
  const venById = Object.fromEntries((C.venues || []).map((v) => [v.id, v]));
  const tz = C.timeZone || undefined;
  const coupleNames = `${first.short} & ${second.short}`;

  function parts(date) {
    const p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
    return p;
  }
  function timeStr(date, short) {
    const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(date);
    return short ? s.replace(':00', '') : s;
  }
  const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const longDate = (d) => { const p = parts(d); return `${p.weekday}, ${p.day} ${p.month} ${p.year}`; };
  const evRange = (ev) => { const s = new Date(ev.start); return [s, new Date(s.getTime() + (ev.durationHours || 4) * 3600e3)]; };
  const evLabel = (ev) => ev.short || ev.name;
  const digits = (n) => String(n || '').replace(/\D/g, '');

  function cleanGuest(v) {
    if (!v) return '';
    return v.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  const guest = cleanGuest(new URLSearchParams(location.search).get('to'));

  const HEART = 'M24 42C14 34 5 27.5 5 17.5 5 10.5 10 5.5 16.2 5.5c3.6 0 6.3 1.8 7.8 4.6 1.5-2.8 4.2-4.6 7.8-4.6C38 5.5 43 10.5 43 17.5 43 27.5 34 34 24 42z';
  const svgIcon = (body, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ''}>${body}</svg>`;
  const UI = {
    clock: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: svgIcon('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    cal: svgIcon('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    phone: svgIcon('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    wa: svgIcon('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2z"/><path d="M9.2 8.6c-.6.4-.9 1-.8 1.8.4 2.4 2.6 4.6 5 5 .8.1 1.4-.2 1.8-.8l-1.6-1.2-1 .8a5 5 0 0 1-3-3l.8-1z"/>'),
    map: svgIcon('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    route: svgIcon('<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>'),
    ext: svgIcon('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    heart: '<svg class="mark" viewBox="0 0 48 46" aria-hidden="true"><path d="' + HEART + '"/></svg>',
  };
  const DIVIDER = A.divider();

  // ───────── links: calendar and maps ─────────
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const calTitle = (ev) => `${ev.name} · ${coupleNames}`;
  const venueLine = (v) => [v.name, v.address].filter(Boolean).join(', ');
  const mapQuery = (v) => v.mapQuery || venueLine(v);
  const directionsUrl = (v) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(v))}`;
  const embedUrl = (v) => `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery(v))}&z=16&output=embed`;

  function googleCal(ev) {
    const [s, e] = evRange(ev);
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: calTitle(ev),
      dates: `${stamp(s)}/${stamp(e)}`,
      location: venueLine(venById[ev.venue] || {}),
      details: `We can't wait to celebrate with you! ${location.origin}${location.pathname}`,
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  }

  function downloadIcs(ev) {
    const [s, e] = evRange(ev);
    const x = (t) => String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ev.id}-${stamp(s)}@wedding-invitation`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(s)}`,
      `DTEND:${stamp(e)}`,
      `SUMMARY:${x(calTitle(ev))}`,
      `LOCATION:${x(venueLine(venById[ev.venue] || {}))}`,
      `DESCRIPTION:${x("We can't wait to celebrate with you!")}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${x(ev.name + ' is tomorrow')}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); return; }
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${ev.id}.ics` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ───────── sections ─────────
  const head = (eyebrow, title) => `<p class="eyebrow">${esc(eyebrow)}</p><h2 class="title">${esc(title)}</h2>`;

  function renderEnvelope() {
    $('#envelope').innerHTML = `
      <div class="env" role="button" tabindex="0" aria-label="Open the invitation from ${esc(coupleNames)}">
        <svg class="env-folds" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100L50 54L100 100" fill="none" stroke="#CBD3BA" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
        ${A.corner(13, 'env-corner bl')}${A.corner(17, 'env-corner br')}
        <div class="env-flap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H100V3L50 100L0 3Z" fill="#FBFAF5" stroke="#CBD3BA" stroke-width="1" vector-effect="non-scaling-stroke"/></svg></div>
        <div class="env-top">
          <p class="env-dear">${guest ? `Dear ${esc(guest)}` : 'You are invited'}</p>
          <p class="env-sub">${guest ? 'you are invited to the wedding of' : 'to the wedding of'}</p>
        </div>
        <div class="env-seal">${A.seal(C.couple.monogram || `${first.short[0]} & ${second.short[0]}`)}</div>
        <div class="env-bottom">
          <p class="env-names">${esc(coupleNames)}</p>
          <p class="env-tap">Tap to open</p>
        </div>
      </div>`;
  }

  function renderHero() {
    const b = C.blessing;
    const fam = (p) => `<div><p class="who">${esc(p.full)}</p><p class="rel">${esc(p.relation)}</p><p class="par">${esc(p.parents)}</p></div>`;
    return `<section class="hero" id="top">
      ${A.corner(3, 'l')}${A.corner(9, 'r')}
      ${b ? `<p class="blessing-ar" lang="ar" dir="rtl">${esc(b.arabic)}</p><p class="blessing-en">${esc(b.translation)}</p>` : ''}
      <p class="together">${esc(C.invitation.before)}</p>
      <h1 class="names" tabindex="-1">${esc(first.short)}<span class="amp">&amp;</span>${esc(second.short)}</h1>
      <p class="together">${esc(C.invitation.after)}</p>
      <div class="scene-wrap">${A.archScene()}</div>
      <div class="families reveal">${fam(first)}${fam(second)}</div>
    </section>`;
  }

  function renderWelcome() {
    return `<section class="welcome reveal"><h2 class="title">${esc(C.welcome.title)}</h2><p class="lead">${esc(C.welcome.text)}</p></section>`;
  }

  function renderSaveDate() {
    const ev = evById[C.saveTheDate] || events[0];
    if (!show.saveTheDate || !ev) return '';
    const d = new Date(ev.start), p = parts(d);
    return `<section class="save reveal" id="save-the-date">
      ${head('Save the date', 'A little surprise')}
      <div class="scratch" data-scratch>
        ${A.archFrame()}
        <div class="scratch-card">
          <div class="date-block">
            <p class="db-month">${esc(p.month)}</p>
            <div class="db-row"><span class="db-side">${esc(p.weekday)}</span><span class="db-day">${esc(p.day)}</span><span class="db-side">At ${esc(timeStr(d, true))}</span></div>
            <p class="db-year">${esc(p.year)}</p>
            <p class="db-event">${esc(ev.name)}</p>
          </div>
          <canvas aria-hidden="true"></canvas>
        </div>
      </div>
      <p class="scratch-hint">Scratch the card with your finger</p>
      <button type="button" class="link-btn" data-reveal-now>or tap here to reveal</button>
    </section>`;
  }

  function renderEvents() {
    const cards = events.map((ev) => {
      const d = new Date(ev.start), v = venById[ev.venue] || {};
      const past = evRange(ev)[1].getTime() < Date.now();
      const cal = past ? '' : `<details class="cal"><summary class="btn">${UI.cal}Add to calendar</summary>
            <div class="cal-menu">
              <button type="button" data-ics="${esc(ev.id)}">${UI.cal}Apple / Outlook</button>
              <a href="${esc(googleCal(ev))}" target="_blank" rel="noopener">${UI.cal}Google Calendar</a>
            </div>
          </details>`;
      return `<article class="card ev-card">${A.sprig()}
        <h3 class="ev-name">${esc(ev.name)}</h3>
        <p class="ev-date">${esc(longDate(d))}</p>
        <p class="meta">${UI.clock}<span>${esc(timeStr(d))} onwards</span></p>
        <div class="venue">
          <p class="venue-name">${UI.pin}<span>${esc(v.name || '')}</span></p>
          ${v.address ? `<p class="venue-addr">${esc(v.address)}</p>` : ''}
          ${v.phone ? `<p class="venue-phone"><a href="tel:+${digits(v.phone)}">${UI.phone}<span>${esc(v.phone)}</span></a></p>` : ''}
        </div>
        <div class="ev-actions">
          ${cal}
          <button type="button" class="btn btn-ghost" data-map="${esc(v.id)}" aria-expanded="false">${UI.map}<span>Show map</span></button>
          <a class="btn btn-ghost" href="${esc(directionsUrl(v))}" target="_blank" rel="noopener">${UI.route}<span>Directions</span></a>
        </div>
        <div class="map" hidden></div>
      </article>`;
    }).join('');
    return `<section class="events reveal" id="events">${head('Join us for', 'The Celebrations')}<div class="cards">${cards}</div></section>`;
  }

  const ANY_COLOUR = 'conic-gradient(#E9B7B1, #F2C9A5, #EEDC6B, #A9C79A, #9DB4C8, #B7A6D3, #E9B7B1)';
  function swatch(g) {
    if (g.colors === 'any') return ANY_COLOUR;
    const c = Array.isArray(g.colors) ? g.colors : [g.colors || '#E9E1CC'];
    if (c.length === 1) return c[0];
    if (c.length === 2) return `linear-gradient(90deg, ${c[0]} 50%, ${c[1]} 50%)`;
    const step = 100 / c.length;
    return `conic-gradient(${c.map((x, i) => `${x} ${f2(i * step)}% ${f2((i + 1) * step)}%`).join(', ')})`;
  }
  const f2 = (n) => Math.round(n * 10) / 10;

  function renderDress() {
    const list = events.filter((e) => e.dressCode && e.dressCode.length);
    if (!show.dressCode || !list.length) return '';
    const blocks = list.map((ev) => `<div class="dress">
      <p class="eyebrow">${esc(evLabel(ev))} · Dress code</p>
      <div class="dress-groups${ev.dressCode.length >= 3 ? ' three' : ''}">${ev.dressCode.map((g) => {
        const cols = Array.isArray(g.colors) ? g.colors : [];
        const c1 = g.show || cols[0] || '#E9E1CC';
        const c2 = g.figure !== 'suit' ? cols[1] : undefined;
        return `<div class="dg">${A.guest(g.figure, c1, c2)}
          <span class="chip"><span class="sw" style="background:${esc(swatch(g))}"></span>${g.except ? `<span class="sw no" style="--x:${esc(g.except)}" aria-hidden="true"></span>` : ''}
            <span><small>${esc(g.label)}</small><b>${esc(g.name)}</b></span></span></div>`;
      }).join('')}</div>
    </div>`).join('');
    return `<section class="dresscode reveal" id="dress-code">${head('What to wear', 'Dress Code')}${blocks}</section>`;
  }

  function programDays() {
    const list = events.filter((e) => e.program && e.program.length);
    if (!list.length) return [];
    const keys = new Set(list.map((e) => dayKey(new Date(e.start))));
    const firstT = new Date(list[0].start).getTime(), lastT = new Date(list[list.length - 1].start).getTime();
    const span = Math.round((lastT - firstT) / 864e5);
    const dates = [];
    if (span <= 10) for (let i = 0; i <= span; i++) dates.push(new Date(firstT + i * 864e5));
    else list.forEach((e) => dates.push(new Date(e.start)));
    const seen = new Set();
    return dates.filter((d) => { const k = dayKey(d); if (seen.has(k)) return false; seen.add(k); return true; })
      .map((d) => ({ key: dayKey(d), date: d, has: keys.has(dayKey(d)) }));
  }

  function renderProgram() {
    const days = programDays();
    if (!show.program || !days.length) return '';
    const pf = parts(days[0].date), pl = parts(days[days.length - 1].date);
    const month = pf.month === pl.month && pf.year === pl.year ? `${pf.month} ${pf.year}`
      : pf.year === pl.year ? `${pf.month} – ${pl.month} ${pl.year}` : `${pf.month} ${pf.year} – ${pl.month} ${pl.year}`;
    const btns = days.map((d) => {
      const p = parts(d.date);
      return d.has
        ? `<button type="button" class="day has" data-day="${d.key}" aria-pressed="false" aria-label="${esc(`${p.weekday} ${p.day} ${p.month}`)}"><svg viewBox="0 0 48 46" aria-hidden="true"><path d="${HEART}"/></svg><span>${esc(p.day)}</span></button>`
        : `<span class="day plain" aria-hidden="true"><span>${esc(p.day)}</span></span>`;
    }).join('');
    return `<section class="program reveal" id="program">${head('The plan', 'Programme')}
      <p class="month-label">${esc(month)}</p>
      <div class="days" role="group" aria-label="Choose a day">${btns}</div>
      ${C.programHint ? `<p class="hint">${esc(C.programHint)}</p>` : ''}
      <p class="eyebrow day-label" aria-live="polite"></p>
      <ol class="timeline"></ol>
    </section>`;
  }

  function showDay(key) {
    const sec = $('#program');
    if (!sec) return;
    $$('.day.has', sec).forEach((b) => { const on = b.dataset.day === key; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    const evs = events.filter((e) => e.program && e.program.length && dayKey(new Date(e.start)) === key);
    $('.day-label', sec).textContent = evs.map((e) => { const p = parts(new Date(e.start)); return `${e.name} · ${p.weekday} ${p.day} ${p.month}`; }).join('  ·  ');
    let i = 0;
    const tl = $('.timeline', sec);
    tl.innerHTML = evs.flatMap((e) => e.program).map((item) => `<li class="tl-row ${i++ % 2 ? 'r' : 'l'}">
      <div class="txt"><time>${esc(item.time)}</time><span class="t">${esc(item.title)}</span></div>
      ${UI.heart}
      <div class="ic-cell">${A.icon(item.icon)}</div>
    </li>`).join('');
    tl.classList.remove('swap');
    void tl.offsetWidth;
    tl.classList.add('swap');
  }

  function renderCountdown() {
    const ids = (C.countdown || []).filter((id) => evById[id]);
    if (!ids.length) return '';
    const blocks = ids.map((id) => `<div class="cd" data-cd="${esc(id)}">
      <div class="cd-grid">${['Days', 'Hours', 'Minutes', 'Seconds'].map((l) => `<div class="cd-cell"><div class="cd-num">00</div><div class="cd-lbl">${l}</div></div>`).join('')}</div>
      <p class="cd-until">until the ${esc(evLabel(evById[id]))}</p>
    </div>`).join('');
    return `<section class="countdown reveal" id="countdown">${A.lightsBanner()}${head('Countdown', 'Not long now!')}<div class="countdowns">${blocks}</div></section>`;
  }

  function tickCountdowns() {
    const now = Date.now();
    $$('[data-cd]').forEach((el) => {
      const ev = evById[el.dataset.cd];
      const [s, e] = evRange(ev);
      if (now >= s.getTime()) {
        if (!el.dataset.done) {
          el.dataset.done = '1';
          el.innerHTML = `<p class="cd-done">${now < e.getTime() ? `The ${esc(evLabel(ev))} is happening right now!` : `Thank you for celebrating the ${esc(evLabel(ev))} with us`}</p>`;
        }
        return;
      }
      let t = Math.floor((s.getTime() - now) / 1000);
      const v = [Math.floor(t / 86400), Math.floor((t %= 86400) / 3600), Math.floor((t %= 3600) / 60), t % 60];
      $$('.cd-num', el).forEach((n, i) => { const txt = String(v[i]).padStart(2, '0'); if (n.textContent !== txt) n.textContent = txt; });
    });
  }

  function renderContacts() {
    const list = C.contacts || [];
    if (!show.contacts || !list.length) return '';
    return `<section class="contacts reveal" id="contact">${head('Have a question?', 'Get in touch')}
      ${list.map((c) => `<div class="contact">
        <p class="contact-name"><small>${esc(c.label)}</small>${esc(c.name || '')}</p>
        <div class="actions">
          <a class="btn" href="tel:+${digits(c.phone)}">${UI.phone}${esc(c.display || c.phone)}</a>
          ${c.whatsapp ? `<a class="btn btn-wa" href="https://wa.me/${digits(c.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp, ${esc(c.label)}">${UI.wa}WhatsApp</a>` : ''}
        </div></div>`).join('')}
    </section>`;
  }

  function renderClosing() {
    const c = C.closing || {};
    return `<section class="closing reveal">
      ${A.closingScene()}
      <p class="names">${esc(first.short)}<span class="amp">&amp;</span>${esc(second.short)}</p>
      <p class="lead"><em>${esc(c.title || '')}</em></p>
      ${c.text ? `<p class="note">${esc(c.text)}</p>` : ''}
      ${c.signoff ? `<p class="signoff">${esc(c.signoff)}</p>` : ''}
    </section>
    <footer class="foot">Made with <span class="heart" role="img" aria-label="love">❤️</span>${guest ? ` for ${esc(guest)}` : ''}</footer>`;
  }

  // ───────── confetti & hearts ─────────
  const Confetti = (() => {
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    let W = 0, H = 0, list = [], raf = 0;
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);
    const COLS = ['#8C9B6E', '#B7C59C', '#E9B7B1', '#F2C9A5', '#E8C16A', '#DDB15C', '#F6DCD7', '#C98B84'];
    const SHAPES = ['leaf', 'petal', 'dot', 'heart', 'strip', 'petal'];
    function add(p) { list.push(p); if (!raf) raf = requestAnimationFrame(step); }
    function burst(x, y, o) {
      o = o || {};
      if (reduceMotion) return;
      const n = o.count || 100;
      for (let i = 0; i < n; i++) {
        const a = (o.angle == null ? -Math.PI / 2 : o.angle) + (Math.random() - 0.5) * (o.spread == null ? Math.PI * 1.5 : o.spread);
        const v = (o.power || 12) * (0.4 + Math.random() * 0.8);
        add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.2 + Math.random() * 0.12, drag: 0.982,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 5 + Math.random() * 6,
          c: COLS[(Math.random() * COLS.length) | 0], shape: SHAPES[(Math.random() * SHAPES.length) | 0],
          life: 0, max: 220 + Math.random() * 90, wob: Math.random() * 6.28 });
      }
    }
    function hearts(x, y, n) {
      if (reduceMotion) return;
      for (let i = 0; i < (n || 7); i++) {
        add({ x: x + (Math.random() - 0.5) * 36, y, vx: (Math.random() - 0.5) * 1.4, vy: -1.4 - Math.random() * 2.2, g: -0.012, drag: 0.99,
          rot: (Math.random() - 0.5) * 0.4, vr: 0, s: 8 + Math.random() * 8, c: ['#E9B7B1', '#D98C86', '#F2C9A5'][i % 3],
          shape: 'heart', life: 0, max: 90 + Math.random() * 40, wob: Math.random() * 6 });
      }
    }
    function draw(p) {
      const s = p.s;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, (p.max - p.life) / 40));
      ctx.fillStyle = p.c;
      ctx.beginPath();
      if (p.shape === 'leaf') ctx.ellipse(0, 0, s * 1.1, s * 0.45, 0, 0, 6.283);
      else if (p.shape === 'petal') { ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.9, 0, 0, s); ctx.quadraticCurveTo(-s * 0.9, 0, 0, -s); }
      else if (p.shape === 'dot') ctx.arc(0, 0, s * 0.42, 0, 6.283);
      else if (p.shape === 'strip') { ctx.scale(1, Math.cos(p.wob)); ctx.rect(-s * 0.22, -s * 0.75, s * 0.44, s * 1.5); }
      else { ctx.moveTo(0, s * 0.4); ctx.bezierCurveTo(-s * 1.1, -s * 0.25, -s * 0.5, -s * 1.05, 0, -s * 0.42); ctx.bezierCurveTo(s * 0.5, -s * 1.05, s * 1.1, -s * 0.25, 0, s * 0.4); }
      ctx.fill();
      ctx.restore();
    }
    function step() {
      ctx.clearRect(0, 0, W, H);
      list = list.filter((p) => p.life < p.max && p.y < H + 40 && p.y > -240);
      for (const p of list) {
        p.life++;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.g;
        p.wob += 0.1;
        p.x += p.vx + Math.sin(p.wob) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        draw(p);
      }
      raf = list.length ? requestAnimationFrame(step) : 0;
    }
    return { burst, hearts };
  })();

  // ───────── behaviours ─────────
  function applyBackground() {
    const root = document.documentElement.style;
    root.setProperty('--botanical', A.botanicalTile());
    root.setProperty('--vine-l', A.edgeVineTile(5, false));
    root.setProperty('--vine-r', A.edgeVineTile(9, true));
  }

  function startPetals() {
    if (reduceMotion) return;
    // p = petal, l = leaf, b = little blossom
    const kinds = [['p', '#F2C4BD'], ['p', '#F6DCD7'], ['l', '#B9C6A0'], ['p', '#F3D9A0'], ['b', '#FFFFFF'], ['p', '#E9B7B1'], ['l', '#CBD3BA'], ['b', '#F6DCD7'], ['p', '#F7CFC0']];
    const n = window.innerWidth > 700 ? 38 : 30;
    let html = '';
    for (let i = 0; i < n; i++) {
      const [k, col] = kinds[i % kinds.length];
      html += `<i class="${k}" style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${(7 + Math.random() * 9).toFixed(1)}px;` +
        `--t:${(7 + Math.random() * 6).toFixed(1)}s;--d:${(-Math.random() * 13).toFixed(1)}s;--dx:${Math.round(Math.random() * 160 - 80)}px;--col:${col}"></i>`;
    }
    $('.petals').innerHTML = html;
  }

  // ───────── background music ─────────
  // Plays from `start`, then loops between `loopStart` and `loopEnd` without a gap
  // (Web Audio loops on the exact sample). Browsers only allow sound after a tap,
  // so it starts on the envelope tap, or on the first tap anywhere if there's no envelope.
  const Music = (() => {
    const cfg = C.music || {};
    const btn = $('#music');
    const AC = window.AudioContext || window.webkitAudioContext;
    const vol = cfg.volume == null ? 0.6 : cfg.volume;
    let ctx = null, gain = null, source = null, bytes = null, buffer = null, el = null;
    let started = false, userPaused = false;

    const setUi = (on) => {
      btn.classList.toggle('playing', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    };

    function prefetch() {
      if (!bytes && AC) bytes = fetch(cfg.src).then((r) => { if (!r.ok) throw new Error('music ' + r.status); return r.arrayBuffer(); });
    }

    function startWebAudio() {
      // Create and resume the audio context synchronously, inside the tap.
      ctx = new AC();
      gain = ctx.createGain();
      gain.gain.value = vol;
      gain.connect(ctx.destination);
      ctx.resume().catch(() => {});
      prefetch();
      bytes
        .then((data) => new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)))
        .then((b) => {
          buffer = b;
          source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const end = Math.min(cfg.loopEnd || buffer.duration, buffer.duration);
          source.loopEnd = end;
          source.loopStart = Math.max(0, Math.min(cfg.loopStart || 0, end - 1));
          source.connect(gain);
          source.start(0, cfg.start || 0);
          if (userPaused) ctx.suspend(); else setUi(true);
        })
        .catch((err) => {
          console.warn('Music: switching to basic playback', err);
          if (source) return; // already playing: never start a second copy
          ctx = null;
          startElement();
        });
    }

    // Fallback for browsers without Web Audio: a plain audio element, looped by hand.
    function startElement() {
      el = new Audio(cfg.src);
      el.volume = vol;
      el.currentTime = cfg.start || 0;
      el.addEventListener('timeupdate', () => {
        if (cfg.loopEnd && el.currentTime >= cfg.loopEnd) el.currentTime = cfg.loopStart || 0;
      });
      el.addEventListener('ended', () => { el.currentTime = cfg.loopStart || 0; el.play().catch(() => {}); });
      el.addEventListener('play', () => setUi(true));
      el.addEventListener('pause', () => setUi(false));
      el.play().catch(() => {});
    }

    function start() {
      if (started || !cfg.src) return;
      started = true;
      if (AC) startWebAudio(); else startElement();
    }

    function toggle() {
      if (!started) { userPaused = false; start(); return; }
      if (el) { if (el.paused) el.play().catch(() => {}); else el.pause(); return; }
      if (!ctx) return;
      if (ctx.state === 'running' && !userPaused) { userPaused = true; ctx.suspend(); setUi(false); }
      else { userPaused = false; ctx.resume().catch(() => {}); if (source) setUi(true); }
    }

    function init() {
      if (!cfg.src) return;
      btn.hidden = false;
      btn.addEventListener('click', toggle);
      // Download in the background once the page has loaded, so the first tap starts quickly.
      if (document.readyState === 'complete') prefetch(); else window.addEventListener('load', prefetch);
      // No envelope (e.g. ?open=1): start on the first tap or key press anywhere. A full tap
      // (click) is what phones accept as permission for sound. If the browser kept the audio
      // asleep, the next tap wakes it, unless the guest paused it with the button.
      const onTap = (e) => {
        if (e.target.closest && e.target.closest('#music')) return;
        if (!started) start();
        else if (ctx && ctx.state !== 'running' && !userPaused) ctx.resume().catch(() => {});
      };
      document.addEventListener('click', onTap, true);
      document.addEventListener('keydown', onTap, true);
      // Phones can interrupt audio in the background; pick it up again on return unless the guest paused it.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && ctx && !userPaused && ctx.state !== 'running') ctx.resume().catch(() => {});
      });
    }

    return { init, start };
  })();

  function openEnvelope(byGuest) {
    const wrap = $('#envelope'), env = $('.env', wrap);
    if (!env || env.classList.contains('opening')) return;
    env.classList.add('opening');
    if (byGuest) Music.start(); // only a real tap or key press may start sound
    const wait = reduceMotion ? 60 : 1050;
    setTimeout(() => {
      wrap.classList.add('gone');
      document.body.classList.remove('locked');
      window.scrollTo(0, 0);
      startPetals();
      Confetti.burst(window.innerWidth / 2, window.innerHeight * 0.42, { count: 150, spread: Math.PI * 1.9, power: 13 });
      const h1 = $('#invite h1');
      if (h1) h1.focus({ preventScroll: true });
    }, wait);
    setTimeout(() => wrap.remove(), wait + 1200);
  }

  function initEnvelope() {
    const env = $('#envelope .env');
    env.addEventListener('click', openEnvelope);
    env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(true); } });
    env.focus({ preventScroll: true });
  }

  function initScratch() {
    const wrap = $('[data-scratch]');
    if (!wrap) return;
    const cv = $('canvas', wrap), ctx = cv.getContext('2d', { willReadFrequently: true });
    let revealed = false, drawing = false, last = null, moves = 0, paintedW = 0;

    function paint() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      paintedW = r.width;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, h = r.height;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#A3B387');
      g.addColorStop(0.55, '#86966A');
      g.addColorStop(1, '#6C7D53');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 280; i++) {
        ctx.fillStyle = i % 3 ? 'rgba(255,248,230,.16)' : 'rgba(240,205,120,.6)';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6 + 0.3, 0, 6.283);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, L = 12 + Math.random() * 10;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L / 2, -L / 3, L, 0); ctx.quadraticCurveTo(L / 2, L / 3, 0, 0); ctx.stroke();
        ctx.restore();
      }
      // a soft darker pool behind the words so they read clearly
      const pool = ctx.createRadialGradient(w / 2, h * 0.58, 8, w / 2, h * 0.58, w * 0.58);
      pool.addColorStop(0, 'rgba(40,54,32,.42)');
      pool.addColorStop(1, 'rgba(40,54,32,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(25,35,18,.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#FFFDF5';
      ctx.lineJoin = 'round';
      // heart
      const hx = w / 2, hy = h * 0.33, s = 16;
      ctx.beginPath(); ctx.moveTo(hx, hy + s * 0.4);
      ctx.bezierCurveTo(hx - s * 1.1, hy - s * 0.25, hx - s * 0.5, hy - s * 1.05, hx, hy - s * 0.42);
      ctx.bezierCurveTo(hx + s * 0.5, hy - s * 1.05, hx + s * 1.1, hy - s * 0.25, hx, hy + s * 0.4);
      ctx.fill();
      // "Scratch me", as large as fits, thickened with a stroke
      let size = 64;
      do { ctx.font = `${size}px "Great Vibes", cursive`; size -= 2; } while (ctx.measureText('Scratch me').width > w * 0.86 && size > 30);
      ctx.lineWidth = 1.8;
      ctx.strokeText('Scratch me', w / 2, h * 0.56);
      ctx.fillText('Scratch me', w / 2, h * 0.56);
      ctx.font = '600 13.5px "Josefin Sans", sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      ctx.fillText('TO REVEAL THE DATE', w / 2, h * 0.73);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function line(a, b) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
      ctx.globalAlpha = 1;
      ctx.lineWidth = 44;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    function check() {
      const w = cv.width, h = cv.height;
      if (!w || !h) return;
      const data = ctx.getImageData(0, 0, w, h).data;
      const st = Math.max(4, Math.floor(w / 50));
      let clear = 0, total = 0;
      for (let y = 0; y < h; y += st) for (let x = 0; x < w; x += st) { total++; if (data[(y * w + x) * 4 + 3] < 128) clear++; }
      if (clear / total > 0.42) reveal();
    }
    function reveal() {
      if (revealed) return;
      revealed = true;
      wrap.classList.add('revealed');
      const r = wrap.getBoundingClientRect();
      Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 120, spread: Math.PI * 2, power: 9 });
    }
    cv.addEventListener('pointerdown', (e) => {
      if (revealed) return;
      drawing = true;
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      last = pos(e);
      line(last, { x: last.x + 0.1, y: last.y + 0.1 });
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      line(last, p);
      last = p;
      if (++moves % 12 === 0) check();
    });
    const stop = () => { if (drawing) { drawing = false; check(); } };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    $('[data-reveal-now]').addEventListener('click', reveal);
    window.addEventListener('resize', () => { if (!revealed && Math.abs(cv.getBoundingClientRect().width - paintedW) > 2) paint(); });
    const fontReady = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('60px "Great Vibes"'), document.fonts.load('600 13px "Josefin Sans"')]).catch(() => {})
      : Promise.resolve();
    paint();
    fontReady.then(paint);
  }

  function initReveals() {
    const els = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach((el) => io.observe(el));
  }

  function initClicks() {
    const main = $('#invite');
    main.addEventListener('click', (e) => {
      const ics = e.target.closest('[data-ics]');
      if (ics) { downloadIcs(evById[ics.dataset.ics]); ics.closest('details').open = false; return; }

      const mapBtn = e.target.closest('[data-map]');
      if (mapBtn) {
        const box = $('.map', mapBtn.closest('.card'));
        const open = box.hidden;
        if (open && !box.firstChild) {
          const v = venById[mapBtn.dataset.map];
          box.innerHTML = `<iframe src="${esc(embedUrl(v))}" title="Map of ${esc(v.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>` +
            (v.mapsUrl ? `<a class="map-link" href="${esc(v.mapsUrl)}" target="_blank" rel="noopener">${UI.ext}Open in Google Maps</a>` : '');
        }
        box.hidden = !open;
        mapBtn.setAttribute('aria-expanded', String(open));
        $('span', mapBtn).textContent = open ? 'Hide map' : 'Show map';
        return;
      }

      const day = e.target.closest('.day.has');
      if (day) { showDay(day.dataset.day); return; }

      const couple = e.target.closest('.tap-couple');
      if (couple) Confetti.hearts(e.clientX, e.clientY, 8);
    });
    // only one calendar menu open at a time; close on outside click
    document.addEventListener('toggle', (e) => {
      if (e.target.matches && e.target.matches('details.cal') && e.target.open) {
        $$('details.cal[open]').forEach((d) => { if (d !== e.target) d.open = false; });
      }
    }, true);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('details.cal')) $$('details.cal[open]').forEach((d) => { d.open = false; });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') $$('details.cal[open]').forEach((d) => { d.open = false; });
    });
  }

  // ───────── go ─────────
  function render() {
    document.title = `${coupleNames} · Wedding Invitation`;
    const sections = [renderHero(), renderWelcome(), renderSaveDate(), renderEvents(), renderDress(), renderProgram(), renderCountdown(), renderContacts()].filter(Boolean);
    $('#invite').innerHTML = sections.join(`<div class="sep" aria-hidden="true">${DIVIDER}</div>`) + renderClosing();
    document.body.insertAdjacentHTML('beforeend', A.corner(23, 'side-decor sd-tl') + A.corner(29, 'side-decor sd-br') + A.corner(31, 'side-decor sd-tr') + A.corner(37, 'side-decor sd-bl'));
  }

  applyBackground();
  render();
  renderEnvelope();
  initEnvelope();
  initClicks();
  initScratch();
  initReveals();
  Music.init();

  const days = programDays().filter((d) => d.has);
  if (days.length) {
    const now = Date.now();
    const next = events.find((e) => e.program && e.program.length && evRange(e)[1].getTime() > now);
    showDay(next ? dayKey(new Date(next.start)) : days[0].key);
  }
  tickCountdowns();
  setInterval(tickCountdowns, 1000);

  // ?open=1 skips the envelope (handy while editing)
  if (new URLSearchParams(location.search).has('open')) openEnvelope();
})();
