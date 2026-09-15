/* ============================================================
   ISA CUHK main.js  (shared across all pages, page-aware)
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- Navbar ---------------- */
  const navbar = $('#navbar');
  if (navbar) {
    // Only pages with a dark hero start transparent. Inner pages ship with
    // .scrolled already set and must keep it, or their white links land on a
    // light page head and vanish.
    const hasHero = !!$('.hero');
    if (hasHero) {
      const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }
  const toggle = $('#navToggle'), links = $('#navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', links).forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('open'); toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------------- Scroll progress ---------------- */
  const bar = $('#scrollProgress');
  if (bar) {
    const upd = () => {
      const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    upd(); window.addEventListener('scroll', upd, { passive: true });
  }

  /* ---------------- Cursor glow ---------------- */
  const glow = $('#cursorGlow');
  if (glow && !reduce && window.matchMedia('(pointer:fine)').matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    document.body.classList.add('cursor-on');
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; });
    (function loop() {
      cx += (gx - cx) * 0.15; cy += (gy - cy) * 0.15;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- 3D tilt cards ---------------- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    $$('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- Word rotator ---------------- */
  const rot = $('#rotator');
  if (rot && !reduce) {
    const words = ['community', 'family', 'home'];
    let i = 0;
    setInterval(() => { i = (i + 1) % words.length; rot.innerHTML = '<em class="rotator-word hero-accent">' + words[i] + '</em>'; }, 2200);
  }

  /* ---------------- Marquee duplicate ---------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------- Reveal on scroll ----------------
     scanReveals() is re-callable: sections rendered later from data
     (team, past cabinets, gallery) register themselves by calling it. */
  const REVEAL_SEL = '.section-title, .section-lead, .about-text, .about-stats, .card, .do-card, ' +
    '.event-card, .event-tile, .team-photo, .team-dept, .team-dept-photo, .team-member, ' +
    '.pc-cabinet, .pc-group, .gform-wrap, .pay-card, .join-form, .reveal-me';
  let revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: '0px 0px 15% 0px' });
  }
  const scanReveals = (root) => {
    const els = $$(REVEAL_SEL, root || document);
    els.forEach((el) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';
      el.classList.add('reveal');
      if (revealIO) revealIO.observe(el); else el.classList.add('in');
    });
  };
  window.ISA_scanReveals = scanReveals;
  scanReveals();
  // Nothing should ever stay invisible because an observer did not fire.
  window.addEventListener('load', () => {
    setTimeout(() => {
      $$('.reveal:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.5) el.classList.add('in');
      });
    }, 400);
  });

  /* ---------------- Count-up ---------------- */
  const counters = $$('.stat-num[data-count]');
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10), suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target + suffix; return; }
    const dur = 1400, start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  };
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: 0.5 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCount);

  /* ---------------- Footer year ---------------- */
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     Reusable lightbox
     ============================================================ */
  const Lightbox = (function () {
    const lb = $('#lightbox');
    if (!lb) return null;
    const img = $('#lbImg'), cat = $('#lbCat'), date = $('#lbDate'), text = $('#lbText');
    let items = [], idx = 0;
    function fill() {
      const d = items[idx]; if (!d) return;
      img.src = d.src; img.alt = d.title || 'ISA CUHK';
      if (cat) cat.textContent = d.cat || '';
      if (date) date.textContent = d.date || '';
      if (text) text.textContent = d.caption || d.title || '';
    }
    function open(list, i) {
      items = list; idx = i; fill();
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    function step(d) { idx = (idx + d + items.length) % items.length; fill(); }
    const c = $('#lbClose'), p = $('#lbPrev'), n = $('#lbNext');
    if (c) c.addEventListener('click', close);
    if (p) p.addEventListener('click', () => step(-1));
    if (n) n.addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    window.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
    return { open };
  })();

  /* ============================================================
     Gallery page
     ============================================================ */
  const grid = $('#galleryGrid');
  const galleryData = [].concat(window.ISA_GALLERY_EXTRA || [], window.ISA_GALLERY || []);
  // round-robin interleave by category so the "All" view mixes Events / Cabinet / Campus Life
  const interleave = (items) => {
    const byCat = {};
    items.forEach((d) => { (byCat[d.cat] = byCat[d.cat] || []).push(d); });
    const cats = Object.keys(byCat);
    const out = []; let i = 0, added = true;
    while (added) {
      added = false;
      for (const c of cats) { if (byCat[c][i]) { out.push(byCat[c][i]); added = true; } }
      i++;
    }
    return out;
  };
  if (grid && galleryData.length) {
    const data = interleave(galleryData);
    const PAGE = parseInt(grid.dataset.page || '18', 10);
    let filter = 'All', shown = PAGE, current = [];

    const counts = {};
    data.forEach((d) => { counts[d.cat] = (counts[d.cat] || 0) + 1; });
    const cats = ['All', ...Object.keys(counts).sort((a, b) => counts[b] - counts[a])];
    const filterBar = $('#filterBar');
    if (filterBar) cats.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
      btn.type = 'button'; btn.setAttribute('role', 'tab');
      btn.innerHTML = cat + '<span class="n">' + (cat === 'All' ? data.length : counts[cat]) + '</span>';
      btn.addEventListener('click', () => {
        filter = cat; shown = PAGE;
        $$('.filter-btn', filterBar).forEach((b) => b.classList.remove('active'));
        btn.classList.add('active'); render();
      });
      filterBar.appendChild(btn);
    });

    const multiSvg = '<span class="g-badge-multi"><svg viewBox="0 0 24 24" stroke-width="2"><rect x="8" y="3" width="13" height="13" rx="2"/><path d="M3 8v11a2 2 0 0 0 2 2h11"/></svg></span>';
    const itemIO = ('IntersectionObserver' in window)
      ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); itemIO.unobserve(e.target); } }), { threshold: 0.05 })
      : null;
    const loadMore = $('#loadMore');

    function render() {
      current = data.filter((d) => filter === 'All' || d.cat === filter);
      const slice = current.slice(0, shown);
      grid.innerHTML = '';
      slice.forEach((d, i) => {
        const fig = document.createElement('figure');
        fig.className = 'g-item'; fig.tabIndex = 0;
        fig.style.transitionDelay = (i % PAGE) * 30 + 'ms';
        fig.innerHTML = '<img src="' + d.src + '" alt="' + esc(d.title) + '" loading="lazy" />' +
          (d.slides > 1 ? multiSvg : '') +
          '<div class="g-overlay"><span class="g-cat">' + esc(d.cat) + '</span><span class="g-title">' + esc(d.title) + '</span></div>';
        const openIt = () => Lightbox && Lightbox.open(current, i);
        fig.addEventListener('click', openIt);
        fig.addEventListener('keydown', (e) => { if (e.key === 'Enter') openIt(); });
        grid.appendChild(fig);
        if (itemIO) itemIO.observe(fig); else fig.classList.add('in');
      });
      const counter = $('#galleryCount');
      if (counter) counter.textContent = current.length + ' photo' + (current.length === 1 ? '' : 's');
      if (loadMore) loadMore.hidden = shown >= current.length;
    }
    if (loadMore) loadMore.addEventListener('click', () => { shown += PAGE; render(); });
    render();
  } else if (grid) {
    grid.innerHTML = '<p style="color:var(--body)">No gallery data found. Run scripts/extract-instagram.ps1 to generate it.</p>';
    const lm = $('#loadMore'); if (lm) lm.hidden = true;
  }

  /* ============================================================
     Events page
     ============================================================ */
  const evGrid = $('#eventsGrid');
  if (evGrid && Array.isArray(window.ISA_EVENTS) && window.ISA_EVENTS.length) {
    const events = window.ISA_EVENTS;
    // cards
    events.forEach((ev) => {
      const card = document.createElement('article');
      card.className = 'event-card ev-clickable reveal-me';
      card.tabIndex = 0;
      card.innerHTML =
        '<div class="event-media"><img src="' + ev.cover + '" alt="' + esc(ev.name) + '" loading="lazy" />' +
        '<span class="ev-count">' + ev.images.length + ' photos</span></div>' +
        '<div class="event-body"><h3>' + esc(ev.name) + '</h3>' +
        '<p>' + esc(ev.overview.length > 110 ? ev.overview.slice(0, 107) + '...' : ev.overview) + '</p>' +
        '<span class="ev-open">View event &rarr;</span></div>';
      const open = () => openEvent(ev);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      evGrid.appendChild(card);
      if (revealIO) { card.classList.add('reveal'); revealIO.observe(card); } else card.classList.add('in');
    });

    // detail drawer
    const drawer = $('#eventDetail');
    function lbItems(ev) {
      return ev.images.map((src) => ({ src, title: ev.name, caption: ev.overview, date: '', cat: 'Events' }));
    }
    function openEvent(ev) {
      if (!drawer) return;
      drawer.innerHTML =
        '<div class="ed-inner">' +
        '<button class="ed-close" id="edClose" aria-label="Close">&times;</button>' +
        '<p class="eyebrow">ISA Event</p>' +
        '<h2 class="section-title">' + esc(ev.name) + '</h2>' +
        '<p class="ed-overview">' + esc(ev.overview) + '</p>' +
        '<div class="ed-grid" id="edGrid"></div></div>';
      const eg = $('#edGrid', drawer);
      const items = lbItems(ev);
      ev.images.forEach((src, i) => {
        const f = document.createElement('figure');
        f.className = 'ed-photo'; f.tabIndex = 0;
        f.innerHTML = '<img src="' + src + '" alt="' + esc(ev.name) + ' photo ' + (i + 1) + '" loading="lazy" />';
        const op = () => Lightbox && Lightbox.open(items, i);
        f.addEventListener('click', op);
        f.addEventListener('keydown', (e) => { if (e.key === 'Enter') op(); });
        eg.appendChild(f);
      });
      drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('#edClose', drawer).addEventListener('click', closeEvent);
      drawer.scrollTop = 0;
    }
    function closeEvent() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    if (drawer) {
      drawer.addEventListener('click', (e) => { if (e.target === drawer) closeEvent(); });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeEvent(); });
    }
  }

  /* ============================================================
     Team page roster
     ============================================================ */
  const roster = $('#teamRoster');
  if (roster && window.ISA_TEAM && Array.isArray(window.ISA_TEAM.departments)) {
    const T = window.ISA_TEAM;
    const lbItems = [];
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    T.departments.forEach((d, di) => {
      // On the team page each department is its own deck panel.
      const inDeck = !!$('#deckStage');
      const block = document.createElement(inDeck ? 'section' : 'div');
      if (inDeck) {
        block.className = 'panel' + (di % 2 ? ' panel-alt' : '');
        block.setAttribute('data-panel', '');
      } else {
        block.className = 'team-dept';
      }
      let html = '<div class="team-dept-head"><span class="team-dept-num">' + pad(di + 1) + '</span><h3>' + esc(d.name) + '</h3></div>';
      // A one-person department (President, Vice President) uses the same
      // graphic for the department and the member, and that graphic already
      // carries their name and role. Show it once rather than twice.
      const solo = d.members.length === 1 && !!d.photo;

      if (d.photo) {
        const li = lbItems.length;
        const m0 = d.members[0];
        lbItems.push(solo
          ? { src: d.photo, title: m0.name, caption: m0.name + ', ' + m0.role, date: '2026-27', cat: 'Our Team' }
          : { src: d.photo, title: d.name + ' Team', caption: d.name + ', ISA 17th Cabinet', date: '2026-27', cat: 'Our Team' });
        const alt = solo
          ? esc(m0.name) + ', ' + esc(m0.role)
          : 'ISA ' + esc(d.name) + ' team';
        html += '<figure class="team-dept-photo' + (solo ? ' is-solo' : '') + '" data-lb="' + li + '" tabindex="0">' +
          '<img src="' + d.photo + '" alt="' + alt + '" loading="lazy" /></figure>';
      }

      if (!solo) {
        html += '<div class="team-members">';
        d.members.forEach((m) => {
          const li = lbItems.length;
          lbItems.push({ src: m.img, title: m.name, caption: m.name + ', ' + m.role, date: '2026-27', cat: 'Our Team' });
          html += '<figure class="team-member" data-lb="' + li + '" tabindex="0">' +
            '<div class="tm-img"><img src="' + m.img + '" alt="' + esc(m.name) + ', ' + esc(m.role) + '" loading="lazy" /></div>' +
            '<figcaption><strong>' + esc(m.name) + '</strong><span>' + esc(m.role) + '</span></figcaption></figure>';
        });
        html += '</div>';
      }
      block.innerHTML = inDeck
        ? '<div class="container"><div class="team-dept">' + html + '</div></div>'
        : html;
      roster.appendChild(block);
      if (!inDeck) {
        scanReveals(block);
        if (revealIO) { block.classList.add('reveal'); revealIO.observe(block); } else block.classList.add('in');
      }
    });
    // wire lightbox
    $$('[data-lb]', roster).forEach((el) => {
      const open = () => Lightbox && Lightbox.open(lbItems, parseInt(el.dataset.lb, 10));
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  }

  /* ============================================================
     Past Cabinets (tabs)
     ============================================================ */
  const pcTabs = $('#pcTabs'), pcContent = $('#pcContent');
  if (pcContent && Array.isArray(window.ISA_PAST_CABINETS) && window.ISA_PAST_CABINETS.length) {
    const cabs = window.ISA_PAST_CABINETS;
    const inDeck = !!$('#deckStage');
    const items = [];
    let panelIndex = 0;

    if (pcTabs) pcTabs.remove();   // year tabs replaced by scrolling

    // Cards are shown at the same size as the current cabinet, so a year is
    // split across as many panels as it needs rather than being shrunk.
    const PER_PANEL = 12;

    const card = (c, cab) => {
      const li = items.length;
      items.push({ src: c.src, title: c.name, caption: c.name + ' · ' + cab.title, date: cab.years, cat: 'Past Cabinet' });
      return '<figure class="team-member" data-lb="' + li + '" tabindex="0">' +
        '<div class="tm-img"><img src="' + c.src + '" alt="' + esc(c.name) + ', ' + esc(cab.title) + '" loading="lazy" /></div>' +
        '<figcaption><strong>' + esc(c.name) + '</strong><span>' + esc(cab.years) + '</span></figcaption></figure>';
    };

    const head = (cab, part, parts) => {
      let h = '<div class="team-dept-head"><span class="team-dept-num">' + esc(cab.years) + '</span><h3>' + esc(cab.title);
      if (parts > 1) h += ' <span class="pc-part">' + part + '/' + parts + '</span>';
      return h + '</h3></div>';
    };

    const addPanel = (innerHtml) => {
      const el = document.createElement(inDeck ? 'section' : 'div');
      if (inDeck) {
        el.className = 'panel' + (panelIndex % 2 ? '' : ' panel-alt');
        el.setAttribute('data-panel', '');
        el.innerHTML = '<div class="container"><div class="team-dept pc-cabinet">' + innerHtml + '</div></div>';
      } else {
        el.className = 'team-dept pc-cabinet';
        el.innerHTML = innerHtml;
      }
      pcContent.appendChild(el);
      panelIndex++;
      if (!inDeck) scanReveals(el);
    };

    cabs.forEach((cab) => {
      const chunks = [];
      for (let k = 0; k < cab.cards.length; k += PER_PANEL) chunks.push(cab.cards.slice(k, k + PER_PANEL));
      const parts = chunks.length + (cab.group ? 1 : 0);
      let part = 0;

      if (cab.group) {
        part++;
        const gi = items.length;
        items.push({ src: cab.group, title: cab.title, caption: cab.title + ' · ' + cab.years, date: '', cat: 'Past Cabinet' });
        addPanel(head(cab, part, parts) +
          '<figure class="team-dept-photo is-solo" data-lb="' + gi + '" tabindex="0">' +
          '<img src="' + cab.group + '" alt="' + esc(cab.title) + ' group photo" loading="lazy" /></figure>');
      }

      chunks.forEach((chunk) => {
        part++;
        addPanel(head(cab, part, parts) +
          '<div class="team-members">' + chunk.map((c) => card(c, cab)).join('') + '</div>');
      });
    });

    $$('[data-lb]', pcContent).forEach((el) => {
      const open = () => Lightbox && Lightbox.open(items, parseInt(el.dataset.lb, 10));
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });

    if (window.ISA_refreshDeck) window.ISA_refreshDeck();
  }

  /* ============================================================
     Home: gallery preview strip
     ============================================================ */
  const strip = $('#galleryPreview');
  const previewData = [].concat(window.ISA_GALLERY_EXTRA || [], window.ISA_GALLERY || []);
  if (strip && previewData.length) {
    const picks = previewData.slice(0, 14);

    const track = document.createElement('div');
    track.className = 'gp-track';

    const makeItem = (d, clone) => {
      const a = document.createElement('a');
      a.className = 'gp-item';
      a.href = 'gallery.html';
      if (clone) { a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; }
      a.innerHTML = '<img src="' + d.src + '" alt="' + (clone ? '' : esc(d.title)) + '" loading="lazy" />';
      return a;
    };

    picks.forEach((d) => track.appendChild(makeItem(d, false)));
    // A second pass of the same images lets the track loop with no seam:
    // the animation travels exactly one set width, then snaps back invisibly.
    picks.forEach((d) => track.appendChild(makeItem(d, true)));

    strip.appendChild(track);

    // Longer strips should not spin faster, so scale duration by item count.
    track.style.animationDuration = (picks.length * 4.5) + 's';
  }

  /* ============================================================
     Registration form (Formspree)
     ============================================================ */
  const form = $('#joinForm');
  if (form) {
    const status = $('#formStatus'), submitBtn = $('#submitBtn');
    const setStatus = (msg, type) => { status.textContent = msg; status.className = 'form-status' + (type ? ' ' + type : ''); };

    // populate nationality dropdown
    const NATIONALITIES = ['Afghan','Albanian','Algerian','American','Argentine','Australian','Austrian','Bangladeshi','Belgian','Bhutanese','Bolivian','Brazilian','British','Bruneian','Bulgarian','Cambodian','Cameroonian','Canadian','Chilean','Chinese (Mainland)','Colombian','Croatian','Czech','Danish','Dutch','Ecuadorian','Egyptian','Emirati','Estonian','Ethiopian','Filipino','Finnish','French','German','Ghanaian','Greek','Hong Konger','Hungarian','Icelandic','Indian','Indonesian','Iranian','Iraqi','Irish','Israeli','Italian','Japanese','Jordanian','Kazakh','Kenyan','Korean','Kuwaiti','Lao','Latvian','Lebanese','Lithuanian','Macanese','Malaysian','Maldivian','Mexican','Mongolian','Moroccan','Burmese (Myanmar)','Nepali','New Zealander','Nigerian','Norwegian','Omani','Pakistani','Palestinian','Peruvian','Polish','Portuguese','Qatari','Romanian','Russian','Saudi','Singaporean','Slovak','Slovenian','South African','Spanish','Sri Lankan','Swedish','Swiss','Taiwanese','Thai','Tunisian','Turkish','Ukrainian','Uzbek','Venezuelan','Vietnamese','Yemeni','Zimbabwean','Other'];
    const natSel = $('#nationality');
    if (natSel) NATIONALITIES.forEach((n) => { const o = document.createElement('option'); o.textContent = n; natSel.appendChild(o); });

    const CUHK_EMAIL = /^[^@\s]+@link\.cuhk\.edu\.hk$/i;
    const validate = () => {
      let ok = true;
      $$('[required]', form).forEach((el) => {
        let bad = !el.value.trim();
        if (!bad && el.type === 'email') bad = !CUHK_EMAIL.test(el.value.trim());
        el.classList.toggle('invalid', bad); if (bad) ok = false;
      });
      return ok;
    };
    $$('input, select, textarea', form).forEach((el) => el.addEventListener('input', () => el.classList.remove('invalid')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) {
        const em = $('#email');
        if (em && em.value.trim() && !CUHK_EMAIL.test(em.value.trim())) {
          setStatus('Please use your CUHK email ending in @link.cuhk.edu.hk.', 'error');
        } else {
          setStatus('Please fill in the required fields correctly.', 'error');
        }
        return;
      }
      if (form.action.includes('YOUR_FORM_ID')) { setStatus('Form endpoint not configured yet. Add your Formspree ID in the HTML.', 'error'); return; }
      submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; setStatus('', '');
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          form.reset(); setStatus('Thank you! Your registration has been received. Welcome to ISA.', 'success');
          submitBtn.textContent = 'Submitted';
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.errors ? data.errors.map((x) => x.message).join(', ') : 'Something went wrong.';
          setStatus('Sorry, ' + msg + ' Please try again.', 'error');
          submitBtn.disabled = false; submitBtn.textContent = 'Submit Registration';
        }
      } catch (err) {
        setStatus('Network error. Please check your connection and try again.', 'error');
        submitBtn.disabled = false; submitBtn.textContent = 'Submit Registration';
      }
    });
  }

  /* ============================================================
     Scroll engine

     The deck pins one stage to the viewport and cross-fades panels
     as scroll advances, so the reader stays put while the content
     moves through. Falls back to normal document flow on small or
     short screens and for reduced-motion users.
     ============================================================ */
  (function scrollEngine() {
    const hero = $('.hero');
    const heroBg = $('.hero-bg');
    const heroContent = $('.hero-content');
    const heroScroll = $('.hero-scroll');

    const deck = $('#deck');
    const track = $('#deckTrack');
    const stage = $('#deckStage');
    const dotsWrap = $('#deckDots');
    let panels = deck ? $$('[data-panel]', deck) : [];

    if (!hero && !deck) return;

    const DWELL = 0.95;           // viewport heights of scroll per panel
    const HOLD = 0.2;             // |distance| held at full opacity
    const FADE = 0.45;            // distance over which a panel fades out
    const SHIFT = 46;             // px a panel travels while passing

    const deckOn = () =>
      !reduce && !!deck && panels.length > 1 &&
      window.innerWidth > 900 && window.innerHeight >= 560;

    let dots = [];
    const buildDots = () => {
      if (!dotsWrap) return;
      if (dotsWrap.childElementCount === panels.length) { dots = $$('.deck-dot', dotsWrap); return; }
      dotsWrap.innerHTML = '';
      panels.forEach(() => {
        const d = document.createElement('span');
        d.className = 'deck-dot';
        dotsWrap.appendChild(d);
      });
      dots = $$('.deck-dot', dotsWrap);
    };

    let c = null;
    const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

    const measure = () => {
      c = { vh: window.innerHeight, vw: window.innerWidth };
      if (hero) c.heroH = hero.offsetHeight || c.vh;

      // Panels can be rendered from data after load, so re-query each pass.
      panels = deck ? $$('[data-panel]', deck) : [];
      buildDots();

      const on = deckOn();
      if (deck) deck.classList.toggle('deck-off', !on);

      if (deck && track && on) {
        // One viewport to arrive, DWELL per remaining panel to run through.
        track.style.height = (c.vh * (1 + DWELL * (panels.length - 1)) + c.vh * 0.35) + 'px';
        c.deckTop = deck.getBoundingClientRect().top + window.scrollY;
        c.deckRange = Math.max(1, track.offsetHeight - c.vh);
        c.on = true;

        // Shrink any panel whose content is taller than the stage, so
        // nothing is ever clipped by the stage overflow.
        const avail = c.vh - 140;
        panels.forEach((el) => {
          const box = el.firstElementChild;
          if (!box) return;
          box.style.setProperty('--fit', '1');
          const h = box.scrollHeight;
          const fit = h > avail ? Math.max(0.55, avail / h) : 1;
          box.style.setProperty('--fit', fit.toFixed(3));
        });
      } else if (track) {
        track.style.height = '';
        panels.forEach((el) => {
          el.style.opacity = '';
          el.style.transform = '';
          el.classList.remove('on');
        });
        if (dotsWrap) dotsWrap.classList.remove('show');
        c.on = false;
      }
    };

    let lastActive = -1;

    const frame = () => {
      if (!c) return;
      const y = window.scrollY;

      /* Hero parallax */
      if (hero) {
        const p = clamp01(y / c.heroH);
        if (heroBg) heroBg.style.setProperty('--p', p.toFixed(4));
        if (heroContent) heroContent.style.setProperty('--p', p.toFixed(4));
        if (heroScroll) heroScroll.style.setProperty('--p', p.toFixed(4));
      }

      /* Deck */
      if (c.on && deck) {
        const prog = clamp01((y - c.deckTop) / c.deckRange);
        const pos = prog * (panels.length - 1);
        const inDeck = y > c.deckTop - c.vh * 0.5 && y < c.deckTop + c.deckRange + c.vh * 0.5;

        let active = Math.round(pos);
        if (active < 0) active = 0;
        if (active > panels.length - 1) active = panels.length - 1;

        for (let k = 0; k < panels.length; k++) {
          const el = panels[k];
          const d = pos - k;
          const ad = Math.abs(d);
          // Hold at full strength near the centre, then fade.
          const a = 1 - clamp01((ad - HOLD) / FADE);
          el.style.opacity = a.toFixed(3);
          el.style.transform = 'translate3d(0,' + (-d * SHIFT).toFixed(1) + 'px,0)';
          el.style.visibility = a <= 0.002 ? 'hidden' : 'visible';
          el.classList.toggle('on', k === active);
        }

        if (active !== lastActive) {
          for (let k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === active);
          if (dotsWrap) {
            dotsWrap.classList.toggle('on-dark', panels[active].classList.contains('panel-join'));
          }
          lastActive = active;
        }
        if (dotsWrap) dotsWrap.classList.toggle('show', inDeck);
      }
    };

    /* Anchor links must target a scroll position, not an absolute panel */
    const scrollToPanel = (idx) => {
      if (!c || !c.on) return false;
      const target = c.deckTop + (idx / (panels.length - 1)) * c.deckRange;
      window.scrollTo({ top: Math.round(target), behavior: reduce ? 'auto' : 'smooth' });
      return true;
    };

    document.addEventListener('click', (e) => {
      const a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const idx = panels.findIndex((el) => el.id === id);
      if (idx === -1 || !c || !c.on) return;
      e.preventDefault();
      scrollToPanel(idx);
    });

    /* Land on the right panel when arriving with a hash */
    const settleHash = () => {
      if (!location.hash || !c || !c.on) return;
      const idx = panels.findIndex((el) => el.id === location.hash.slice(1));
      if (idx > -1) scrollToPanel(idx);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { frame(); ticking = false; });
    };

    let rt = null;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { lastActive = -1; measure(); frame(); }, 140);
    };

    window.ISA_refreshDeck = () => { lastActive = -1; measure(); frame(); };

    measure(); frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', () => { measure(); frame(); settleHash(); });
  })();

})();
