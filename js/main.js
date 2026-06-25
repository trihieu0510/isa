/* ============================================================
   ISA CUHK — main.js  (shared across all pages, page-aware)
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
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
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
    const words = ['community', 'family', 'home', 'adventure', 'story'];
    let i = 0;
    setInterval(() => { i = (i + 1) % words.length; rot.innerHTML = '<span class="rotator-word">' + words[i] + '</span>'; }, 2200);
  }

  /* ---------------- Marquee duplicate ---------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------- Reveal on scroll ---------------- */
  const revealTargets = $$('.section-title, .section-lead, .about-text, .about-stats, .card, .do-card, .event-card, .event-tile, .team-photo, .join-form, .reveal-me');
  revealTargets.forEach((el) => el.classList.add('reveal'));
  let revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = (i % 4) * 60 + 'ms';
          entry.target.classList.add('in'); revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => revealIO.observe(el));
  } else { revealTargets.forEach((el) => el.classList.add('in')); }

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
      const block = document.createElement('div');
      block.className = 'team-dept reveal-me';
      let html = '<div class="team-dept-head"><span class="team-dept-num">' + pad(di + 1) + '</span><h3>' + esc(d.name) + '</h3></div>';
      if (d.photo) {
        const li = lbItems.length;
        lbItems.push({ src: d.photo, title: d.name + ' Team', caption: d.name + ' — ISA 17th Cabinet', date: '2026-27', cat: 'Our Team' });
        html += '<figure class="team-dept-photo" data-lb="' + li + '" tabindex="0"><img src="' + d.photo + '" alt="ISA ' + esc(d.name) + ' team" loading="lazy" /></figure>';
      }
      html += '<div class="team-members">';
      d.members.forEach((m) => {
        const li = lbItems.length;
        lbItems.push({ src: m.img, title: m.name, caption: m.name + ' — ' + m.role, date: '2026-27', cat: 'Our Team' });
        html += '<figure class="team-member" data-lb="' + li + '" tabindex="0">' +
          '<div class="tm-img"><img src="' + m.img + '" alt="' + esc(m.name) + ', ' + esc(m.role) + '" loading="lazy" /></div>' +
          '<figcaption><strong>' + esc(m.name) + '</strong><span>' + esc(m.role) + '</span></figcaption></figure>';
      });
      html += '</div>';
      block.innerHTML = html;
      roster.appendChild(block);
      if (revealIO) { block.classList.add('reveal'); revealIO.observe(block); } else block.classList.add('in');
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
  if (pcTabs && pcContent && Array.isArray(window.ISA_PAST_CABINETS) && window.ISA_PAST_CABINETS.length) {
    const cabs = window.ISA_PAST_CABINETS;
    function renderCab(cab) {
      const items = [];
      let html = '';
      if (cab.group) {
        items.push({ src: cab.group, title: cab.title, caption: cab.title + ' · ' + cab.years, date: '', cat: 'Past Cabinet' });
        html += '<figure class="pc-group" data-lb="0" tabindex="0"><img src="' + cab.group + '" alt="' + esc(cab.title) + ' group photo" loading="lazy" /></figure>';
      }
      html += '<div class="pc-grid">';
      cab.cards.forEach((c) => {
        const li = items.length;
        items.push({ src: c.src, title: c.name, caption: c.name + ' · ' + cab.title, date: '', cat: 'Past Cabinet' });
        html += '<figure class="pc-card" data-lb="' + li + '" tabindex="0"><img src="' + c.src + '" alt="' + esc(c.name) + '" loading="lazy" /></figure>';
      });
      html += '</div>';
      pcContent.innerHTML = html;
      $$('[data-lb]', pcContent).forEach((el) => {
        const open = () => Lightbox && Lightbox.open(items, parseInt(el.dataset.lb, 10));
        el.addEventListener('click', open);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      });
    }
    cabs.forEach((cab, i) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.innerHTML = cab.title + '<span class="n">' + cab.years + '</span>';
      btn.addEventListener('click', () => {
        pcTabs.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active'); renderCab(cab);
      });
      pcTabs.appendChild(btn);
    });
    renderCab(cabs[0]);
  }

  /* ============================================================
     Home: gallery preview strip
     ============================================================ */
  const strip = $('#galleryPreview');
  const previewData = [].concat(window.ISA_GALLERY_EXTRA || [], window.ISA_GALLERY || []);
  if (strip && previewData.length) {
    const picks = previewData.slice(0, 10);
    picks.forEach((d) => {
      const a = document.createElement('a');
      a.className = 'gp-item'; a.href = 'gallery.html';
      a.innerHTML = '<img src="' + d.src + '" alt="' + esc(d.title) + '" loading="lazy" />';
      strip.appendChild(a);
    });
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
      if (form.action.includes('YOUR_FORM_ID')) { setStatus('Form endpoint not configured yet — add your Formspree ID in the HTML.', 'error'); return; }
      submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; setStatus('', '');
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          form.reset(); setStatus('Thank you! Your registration has been received. Welcome to ISA.', 'success');
          submitBtn.textContent = 'Submitted';
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.errors ? data.errors.map((x) => x.message).join(', ') : 'Something went wrong.';
          setStatus('Sorry — ' + msg + ' Please try again.', 'error');
          submitBtn.disabled = false; submitBtn.textContent = 'Submit Registration';
        }
      } catch (err) {
        setStatus('Network error — please check your connection and try again.', 'error');
        submitBtn.disabled = false; submitBtn.textContent = 'Submit Registration';
      }
    });
  }
})();
