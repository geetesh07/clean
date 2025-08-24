/*
 * ERPNext / Frappe — Project Management UX Enhancements
 * Drag-drop into Website Script / desk assets pipeline.
 * - Theme toggle (localStorage + prefers-color-scheme)
 * - Sidebar persistence + responsive collapse
 * - Command Palette (Ctrl/Cmd K) with Frappe actions
 * - Quick Actions FAB
 * - List + Kanban augmentation (status, priority, progress)
 * - Sticky list filters; MutationObserver for dynamic content
 * Defensive checks for frappe availability.
 */

(function () {
  const $d = document;
  const $r = $d.documentElement;

  /* =========================
     THEME
     ========================= */
  function osPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(theme) {
    $r.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
  }
  function initTheme() {
    const saved = localStorage.getItem('theme');
    applyTheme(saved || (osPrefersDark() ? 'dark' : 'light'));

    // react to OS changes if user hasn't explicitly chosen
    if (window.matchMedia) {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', e => {
          const explicit = localStorage.getItem('theme');
          if (!explicit) applyTheme(e.matches ? 'dark' : 'light');
        });
      } catch {}
    }

    // attach to existing toggle button if present
    const btn = $d.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => applyTheme($r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  }

  /* =========================
     SIDEBAR
     ========================= */
  function setupSidebar() {
    const sidebar = $d.querySelector('.desk-sidebar');
    const content = $d.querySelector('.page-container') || $d.body;
    if (!sidebar || !content) return;

    function setCollapsed(collapsed) {
      sidebar.classList.toggle('collapsed', collapsed);
      if (window.innerWidth >= 768) content.style.marginLeft = collapsed ? '0' : '220px';
      try { localStorage.setItem('sidebarCollapsed', String(collapsed)); } catch {}
    }
    function toggleSidebar() { setCollapsed(!sidebar.classList.contains('collapsed')); }

    function handleResponsive() {
      if (window.innerWidth < 768) {
        sidebar.classList.add('mobile-collapsed');
        content.style.marginLeft = '0';
      } else {
        sidebar.classList.remove('mobile-collapsed');
        const stored = localStorage.getItem('sidebarCollapsed') === 'true';
        setCollapsed(stored);
      }
    }

    handleResponsive();
    window.addEventListener('resize', handleResponsive);
    $d.querySelectorAll('.sidebar-toggle').forEach(btn => btn.addEventListener('click', toggleSidebar));
  }

  /* =========================
     ACTIVE LINK HIGHLIGHT
     ========================= */
  function setActiveLinks() {
    $d.querySelectorAll('.desk-sidebar-item').forEach(item => {
      item.addEventListener('click', function () {
        $d.querySelectorAll('.desk-sidebar-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
      });
    });
  }

  /* =========================
     FORM POLISH
     ========================= */
  function enhanceForms() {
    $d.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('focus', () => input.parentElement?.classList.add('focused'));
      input.addEventListener('blur', () => input.parentElement?.classList.remove('focused'));
    });
  }

  /* =========================
     UTILITIES
     ========================= */
  const has = (obj, path) => path.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
  function openRoute(route) {
    if (window.frappe && has(window.frappe, 'set_route')) frappe.set_route(route);
    else location.href = Array.isArray(route) ? '/app/' + route.join('/') : '/app/' + route;
  }
  function newDoc(doctype) {
    if (window.frappe && has(window.frappe, 'new_doc')) frappe.new_doc(doctype);
    else openRoute([doctype.toLowerCase(), 'new']);
  }

  /* =========================
     COMMAND PALETTE
     ========================= */
  function injectCmdPalette() {
    if ($d.querySelector('.pm-cmdk-overlay')) return;

    const overlay = $d.createElement('div');
    overlay.className = 'pm-cmdk-overlay';
    overlay.innerHTML = `
      <div class="pm-cmdk" role="dialog" aria-modal="true" aria-label="Command Palette">
        <input class="pm-cmdk-input" placeholder="Type a command… (e.g., New Task)" />
        <div class="pm-cmdk-list" role="listbox"></div>
      </div>
    `;
    $d.body.appendChild(overlay);

    const input = overlay.querySelector('.pm-cmdk-input');
    const list = overlay.querySelector('.pm-cmdk-list');

    const actions = [
      { id: 'new-task', label: 'New Task', hint: 'Create Task', run: () => newDoc('Task') },
      { id: 'new-project', label: 'New Project', hint: 'Create Project', run: () => newDoc('Project') },
      { id: 'new-issue', label: 'New Issue', hint: 'Create Issue', run: () => newDoc('Issue') },
      { id: 'log-time', label: 'Log Time (Timesheet)', hint: 'New Timesheet', run: () => newDoc('Timesheet') },
      { id: 'goto-task-list', label: 'Go: Tasks List', hint: '/app/task', run: () => openRoute(['list', 'Task', 'List']) },
      { id: 'goto-task-kanban', label: 'Go: Tasks Kanban', hint: '/app/task/view/kanban', run: () => openRoute(['app', 'task', 'view', 'kanban']) },
      { id: 'goto-project', label: 'Go: Projects', hint: '/app/project', run: () => openRoute(['list', 'Project', 'List']) },
      { id: 'toggle-theme', label: 'Toggle Theme', hint: 'Light/Dark', run: () => {
          const t = $r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          $r.setAttribute('data-theme', t);
          try { localStorage.setItem('theme', t); } catch {}
        } },
      { id: 'search', label: 'Focus Global Search', hint: 'Top bar', run: () => {
          const el = $d.querySelector('.search-bar input, .awesomplete input');
          if (el) el.focus();
        } },
    ];

    function render(items) {
      list.innerHTML = '';
      items.forEach(a => {
        const it = $d.createElement('div');
        it.className = 'pm-cmdk-item';
        it.setAttribute('role','option');
        it.tabIndex = 0;
        it.innerHTML = `<span>${a.label}</span><span class="pm-kbd">${a.hint}</span>`;
        it.addEventListener('click', () => { close(); setTimeout(a.run, 0); });
        it.addEventListener('keydown', (e) => { if (e.key === 'Enter') { close(); setTimeout(a.run, 0); } });
        list.appendChild(it);
      });
    }

    function filter(q) {
      const t = q.trim().toLowerCase();
      if (!t) return actions;
      return actions
        .map(a => ({ a, score: (a.label + ' ' + a.hint).toLowerCase().includes(t) ? 1 : 0 }))
        .filter(x => x.score > 0)
        .map(x => x.a);
    }

    function open() {
      overlay.style.display = 'block';
      render(actions);
      input.value = '';
      setTimeout(() => input.focus(), 0);
      window.addEventListener('keydown', escClose, true);
    }
    function close() {
      overlay.style.display = 'none';
      window.removeEventListener('keydown', escClose, true);
    }
    function escClose(e) { if (e.key === 'Escape') close(); }

    input.addEventListener('input', () => render(filter(input.value)));

    window.addEventListener('keydown', (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
      if (e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); newDoc('Task'); }
    });

    // expose for debug if needed
    window.__pm_cmdk_open = open;
    window.__pm_cmdk_close = close;
  }

  /* =========================
     QUICK ACTIONS FAB
     ========================= */
  function injectFab() {
    if ($d.querySelector('.pm-fab')) return;
    const wrap = $d.createElement('div');
    wrap.className = 'pm-fab';
    wrap.innerHTML = `
      <button title="Quick Actions">+</button>
      <div class="pm-fab-menu">
        <div class="pm-fab-action" data-act="task">New Task</div>
        <div class="pm-fab-action" data-act="timesheet">Log Time</div>
        <div class="pm-fab-action" data-act="project">New Project</div>
      </div>
    `;
    $d.body.appendChild(wrap);
    const btn = wrap.querySelector('button');
    const menu = wrap.querySelector('.pm-fab-menu');

    btn.addEventListener('click', () => wrap.classList.toggle('open'));
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('.pm-fab-action'); if (!a) return;
      const act = a.getAttribute('data-act');
      if (act === 'task') newDoc('Task');
      if (act === 'timesheet') newDoc('Timesheet');
      if (act === 'project') newDoc('Project');
      wrap.classList.remove('open');
    });
  }

  /* =========================
     LIST + KANBAN AUGMENTATION
     ========================= */
  function makeChip(label) {
    const span = $d.createElement('span');
    span.className = 'pm-chip';
    span.dataset.status = label;
    span.textContent = label;
    return span;
  }
  function makePriority(pri) {
    const span = $d.createElement('span');
    span.className = 'pm-badge';
    span.dataset.priority = pri;
    span.textContent = pri;
    return span;
  }
  function makeProgress(pct) {
    const bar = $d.createElement('span');
    bar.className = 'pm-progress';
    const i = $d.createElement('i');
    bar.style.setProperty('--value', String(pct || 0));
    bar.appendChild(i);
    return bar;
  }

  // Augment list rows with status/priority/progress if fields exist
  function enhanceLists(root = $d) {
    root.querySelectorAll('.list-row-container .list-row').forEach(row => {
      if (row.dataset.pmEnhanced) return; row.dataset.pmEnhanced = '1';
      const metaWrap = $d.createElement('span');
      metaWrap.className = 'pm-row-meta';

      // Status
      const statusEl =
        row.querySelector('[data-fieldname="status"]') ||
        row.querySelector('.indicator') ||
        row.querySelector('[data-fieldname="workflow_state"]');
      const statusText = statusEl?.innerText?.trim();
      if (statusText) metaWrap.appendChild(makeChip(statusText));

      // Priority
      const priEl = row.querySelector('[data-fieldname="priority"]');
      const priText = priEl?.innerText?.trim();
      if (priText) metaWrap.appendChild(makePriority(priText));

      // Progress
      const progEl = row.querySelector('[data-fieldname="progress"]');
      const pct = progEl ? parseInt(progEl.innerText, 10) : undefined;
      if (!Number.isNaN(pct) && pct != null) metaWrap.appendChild(makeProgress(Math.max(0, Math.min(100, pct))));

      const title = row.querySelector('.list-subject, .list-row-col');
      if (title) title.appendChild(metaWrap);
    });
  }

  // Update Kanban column counts and decorate cards
  function enhanceKanban(root = $d) {
    root.querySelectorAll('.kanban .kanban-column').forEach(col => {
      const header = col.querySelector('.kanban-header');
      if (!header) return;
      const count = col.querySelectorAll('.kanban-card').length;
      let c = header.querySelector('.count');
      if (!c) { c = $d.createElement('span'); c.className = 'count'; header.appendChild(c); }
      c.textContent = String(count);
    });

    root.querySelectorAll('.kanban .kanban-card').forEach(card => {
      if (card.dataset.pmEnhanced) return; card.dataset.pmEnhanced = '1';
      const meta = $d.createElement('div');
      meta.className = 'pm-card-meta';

      // try to find priority/status/progress text fragments inside card
      const txt = card.innerText || '';
      if (/High|Medium|Low/.test(txt)) {
        const m = txt.match(/High|Medium|Low/);
        if (m) meta.appendChild(makePriority(m[0]));
      }
      if (/Backlog|To Do|Open|In Progress|In Review|Review|Blocked|Done|Completed|Closed/.test(txt)) {
        const m = txt.match(/Backlog|To Do|Open|In Progress|In Review|Review|Blocked|Done|Completed|Closed/);
        if (m) meta.appendChild(makeChip(m[0]));
      }
      const prog = txt.match(/(\d{1,3})%\s*(?:complete|progress)?/i);
      if (prog) meta.appendChild(makeProgress(Math.max(0, Math.min(100, parseInt(prog[1], 10)))));

      if (meta.children.length) card.appendChild(meta);
    });
  }

  // Observe dynamic Desk updates
  function observeDesk() {
    const obs = new MutationObserver(muts => {
      let touched = false;
      for (const m of muts) {
        if (m.addedNodes?.length) { touched = true; break; }
      }
      if (touched) {
        enhanceLists();
        enhanceKanban();
      }
    });
    obs.observe($d.body, { childList: true, subtree: true });
  }

  /* =========================
     STICKY FILTERS IN LIST VIEWS
     ========================= */
  function stickFilters() {
    const f = $d.querySelector('.list-filters, .standard-filter-section');
    if (!f) return;
    f.style.position = 'sticky';
    f.style.top = '60px';
    f.style.zIndex = '6';
    f.style.background = getComputedStyle($r).getPropertyValue('--pm-surface') || '#fff';
  }

  /* =========================
     PROJECT/ TASK FORM HEADER PROGRESS (best-effort)
     ========================= */
  function formHeaderProgress() {
    const wrap = $d.querySelector('.page-head .page-title .title-text');
    if (!wrap || wrap.querySelector('.pm-progress')) return;

    const progressField =
      $d.querySelector('[data-fieldname="percent_complete"] .control-value, [data-fieldname="progress"] .control-value');
    if (!progressField) return;

    const pct = parseInt(progressField.textContent || '0', 10);
    const bar = makeProgress(Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct)));
    bar.style.marginLeft = '12px';
    bar.style.width = '120px';
    wrap.appendChild(bar);
  }

  /* =========================
     INIT
     ========================= */
  function init() {
    initTheme();
    setupSidebar();
    setActiveLinks();
    enhanceForms();
    injectCmdPalette();
    injectFab();
    enhanceLists();
    enhanceKanban();
    stickFilters();
    formHeaderProgress();
    observeDesk();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* =========================
     OPTIONAL: LOGIN ANIMATION HOOK
     ========================= */
  function enhanceLoginPage() {
    if ($d.querySelector('[data-path="login"]')) {
      // reserved for future visual touches
    }
  }
  enhanceLoginPage();
})();
