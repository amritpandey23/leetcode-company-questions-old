/**
 * Build script: reads All.csv (or "5. All.csv") from each company directory
 * and generates index.html with embedded data.
 * Run: node build-dashboard.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function parseCSV(text) {
  const rows = [];
  let i = 0;
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  for (let j = 1; j < lines.length; j++) {
    rows.push(parseCSVLine(lines[j]));
  }
  return { headers, rows };

  function parseCSVLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let k = 0; k < line.length; k++) {
      const c = line[k];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (inQuotes) {
        cur += c;
      } else if (c === ',') {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  }
}

function objectRow(headers, values) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = values[i] != null ? values[i] : ''; });
  return obj;
}

function getAllCsvPath(dirPath) {
  const allCsv = path.join(dirPath, 'All.csv');
  const fiveAll = path.join(dirPath, '5. All.csv');
  if (fs.existsSync(allCsv)) return allCsv;
  if (fs.existsSync(fiveAll)) return fiveAll;
  return null;
}

function getCompanyData() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  const companies = {};
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const name = e.name;
    if (name.startsWith('.') || name === 'node_modules') continue;
    const csvPath = getAllCsvPath(path.join(ROOT, name));
    if (!csvPath) continue;
    try {
      const text = fs.readFileSync(csvPath, 'utf8');
      const { headers, rows } = parseCSV(text);
      const data = rows.map(row => objectRow(headers, row));
      companies[name] = { headers, data };
    } catch (err) {
      console.warn('Skip ' + name + ': ' + err.message);
    }
  }
  return companies;
}

const companies = getCompanyData();
const companyNames = Object.keys(companies).sort();

console.log('Found', companyNames.length, 'companies with All.csv');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LeetCode Company-Wise Problems</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root, body.theme-dark {
      --bg: #0d0f14;
      --surface: #151922;
      --surface-hover: #1c202a;
      --border: #2a3142;
      --text: #e6e9f0;
      --text-muted: #8b92a8;
      --accent: #7c9cf9;
      --accent-dim: #5a7ae0;
      --easy: #6bcf7f;
      --medium: #e6b84a;
      --hard: #e06c75;
      --radius: 10px;
      --shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    body.theme-light {
      --bg: #f2f4f8;
      --surface: #ffffff;
      --surface-hover: #e8ecf4;
      --border: #d0d7e3;
      --text: #1a1d26;
      --text-muted: #5c6378;
      --accent: #4f6af6;
      --accent-dim: #3d52c7;
      --easy: #2d8f4e;
      --medium: #b8860b;
      --hard: #c5303a;
      --shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.5;
    }
    .layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 280px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 1.25rem 0;
      overflow-y: auto;
      max-height: 100vh;
      transition: transform 0.2s ease, margin-left 0.2s ease;
    }
    .sidebar h2 {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 0 1.25rem 0.75rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0.75rem;
    }
    .search-wrap {
      padding: 0 1rem 0.75rem;
    }
    .search {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-family: inherit;
      font-size: 0.9rem;
    }
    .search::placeholder { color: var(--text-muted); }
    .search:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(124,156,249,0.2);
    }
    .company-btn {
      display: block;
      width: 100%;
      padding: 0.55rem 1.25rem;
      border: none;
      background: transparent;
      color: var(--text);
      font-family: inherit;
      font-size: 0.9rem;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .company-btn:hover {
      background: var(--surface-hover);
      color: var(--accent);
    }
    .company-btn.active {
      background: rgba(124,156,249,0.15);
      color: var(--accent);
      font-weight: 500;
    }
    .main {
      flex: 1;
      padding: 1.5rem 2rem;
      overflow-y: auto;
    }
    .main h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
    }
    .main .sub {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      text-align: left;
      padding: 0.85rem 1rem;
      background: var(--surface-hover);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border);
    }
    .data-table td {
      padding: 0.7rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: var(--surface-hover); }
    .data-table .diff { font-weight: 500; }
    .data-table .diff.easy { color: var(--easy); }
    .data-table .diff.medium { color: var(--medium); }
    .data-table .diff.hard { color: var(--hard); }
    .data-table .title { font-weight: 500; color: var(--text); }
    .data-table a { color: var(--accent); text-decoration: none; }
    .data-table a:hover { text-decoration: underline; }
    .data-table .topics { color: var(--text-muted); font-size: 0.8rem; max-width: 220px; }
    .data-table .freq, .data-table .accept { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-muted); }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
    }
    .empty-state p { margin-bottom: 0.5rem; }
    .header-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem; }
    .header-left { display: inline-flex; align-items: center; gap: 0.75rem; }
    .sidebar-toggle {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      padding: 0;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }
    .sidebar-toggle:hover {
      background: var(--surface-hover);
      border-color: var(--accent);
      transform: translateX(1px);
    }
    .sidebar-toggle span {
      font-size: 1.1rem;
      line-height: 1;
    }
    .theme-toggle {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font-family: inherit; font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .theme-toggle:hover { background: var(--surface-hover); border-color: var(--accent); }
    .theme-toggle svg { width: 1.1em; height: 1.1em; }
    .filters {
      display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;
      padding: 0.85rem 0; margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .filters label { font-size: 0.8rem; color: var(--text-muted); margin-right: 0.25rem; }
    .filter-diff { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .filter-diff span { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font-size: 0.85rem; }
    .filter-diff input { cursor: pointer; accent-color: var(--accent); }
    .filter-freq { display: flex; align-items: center; gap: 0.5rem; }
    .filter-freq input {
      width: 4.5rem; padding: 0.4rem 0.5rem;
      border: 1px solid var(--border); border-radius: 6px;
      background: var(--surface); color: var(--text);
      font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;
    }
    .filter-freq input:focus { outline: none; border-color: var(--accent); }
    .filter-accept { display: flex; align-items: center; gap: 0.5rem; }
    .filter-accept input {
      width: 4rem; padding: 0.4rem 0.5rem;
      border: 1px solid var(--border); border-radius: 6px;
      background: var(--surface); color: var(--text);
      font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;
    }
    .filter-accept input:focus { outline: none; border-color: var(--accent); }
    .col-done { width: 2.5rem; text-align: center; vertical-align: middle; }
    .col-done input { cursor: pointer; accent-color: var(--accent); }
    .data-table tr.row-done .title { text-decoration: line-through; opacity: 0.7; }
    body.sidebar-collapsed .sidebar {
      margin-left: -280px;
      border-right: none;
    }
    @media (max-width: 900px) {
      .layout { flex-direction: column; }
      .sidebar { width: 100%; max-height: 240px; border-right: none; border-bottom: 1px solid var(--border); }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <h2>Companies</h2>
      <div class="search-wrap">
        <input type="text" class="search" id="search" placeholder="Search company..." autocomplete="off">
      </div>
      <div id="company-list"></div>
    </aside>
    <main class="main">
      <div class="header-row">
        <div class="header-left">
          <button type="button" class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar" aria-expanded="true">
            <span>&#9776;</span>
          </button>
          <h1 id="company-title">Select a company</h1>
        </div>
        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
          <svg id="theme-icon-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 6 6c0 2.4-.9 4.6-2.4 6.2A9 9 0 0 1 12 21a9 9 0 0 1-5.6-2.1C4.9 13.6 4 11.4 4 9a6 6 0 0 0 6-6z"/></svg>
          <svg id="theme-icon-light" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          <span id="theme-label">Light</span>
        </button>
      </div>
      <p class="sub" id="company-sub"></p>
      <div class="filters" id="filters-bar" style="display:none">
        <div class="filter-diff">
          <label>Difficulty:</label>
          <span><input type="checkbox" id="filter-easy" checked> <label for="filter-easy">Easy</label></span>
          <span><input type="checkbox" id="filter-medium" checked> <label for="filter-medium">Medium</label></span>
          <span><input type="checkbox" id="filter-hard" checked> <label for="filter-hard">Hard</label></span>
        </div>
        <div class="filter-freq">
          <label for="filter-freq-min">Min frequency:</label>
          <input type="number" id="filter-freq-min" min="0" max="100" step="0.1" placeholder="0">
          <label for="filter-freq-max">Max:</label>
          <input type="number" id="filter-freq-max" min="0" max="100" step="0.1" placeholder="100">
        </div>
        <div class="filter-accept">
          <label for="filter-accept-min">Acceptance %:</label>
          <input type="number" id="filter-accept-min" min="0" max="100" step="0.1" placeholder="0">
          <span>–</span>
          <input type="number" id="filter-accept-max" min="0" max="100" step="0.1" placeholder="100">
        </div>
      </div>
      <div class="table-wrap">
        <div id="table-container"></div>
      </div>
    </main>
  </div>
  <script>
    const COMPANY_DATA = ${JSON.stringify(companies)};
    const COMPANY_NAMES = ${JSON.stringify(companyNames)};

    const ALL_LABEL = 'All Problems';

    function buildAllProblems() {
      if (!COMPANY_NAMES.length) return;
      const first = COMPANY_DATA[COMPANY_NAMES[0]];
      if (!first) return;
      const baseHeaders = first.headers || [];
      const linkIdx = baseHeaders.indexOf('Link');
      if (linkIdx === -1) return;
      const agg = new Map();
      COMPANY_NAMES.forEach((company) => {
        const info = COMPANY_DATA[company];
        if (!info || !info.data) return;
        const headers = info.headers;
        const lIdx = headers.indexOf('Link');
        info.data.forEach(row => {
          const link = row.Link != null ? row.Link : (lIdx >= 0 ? row[headers[lIdx]] : null);
          if (!link) return;
          let rec = agg.get(link);
          if (!rec) {
            rec = { ...row, Companies: [company] };
            agg.set(link, rec);
          } else {
            if (!rec.Companies.includes(company)) rec.Companies.push(company);
          }
        });
      });
      const allHeaders = baseHeaders.includes('Companies') ? baseHeaders.slice() : [...baseHeaders, 'Companies'];
      const allData = Array.from(agg.values()).map(r => ({
        ...r,
        Companies: Array.isArray(r.Companies) ? r.Companies.slice().sort().join(', ') : (r.Companies || '')
      }));
      COMPANY_DATA[ALL_LABEL] = { headers: allHeaders, data: allData };
      if (!COMPANY_NAMES.includes(ALL_LABEL)) {
        COMPANY_NAMES.splice(0, 0, ALL_LABEL);
      }
    }

    const searchEl = document.getElementById('search');
    const listEl = document.getElementById('company-list');
    const titleEl = document.getElementById('company-title');
    const subEl = document.getElementById('company-sub');
    const tableContainer = document.getElementById('table-container');
    const filtersBar = document.getElementById('filters-bar');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeLabel = document.getElementById('theme-label');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    let currentCompany = null;
    let currentData = null;
    let currentHeaders = null;

    function initTheme() {
      const saved = localStorage.getItem('dashboard-theme') || 'dark';
      document.body.classList.toggle('theme-light', saved === 'light');
      document.body.classList.toggle('theme-dark', saved === 'dark');
      themeIconDark.style.display = saved === 'dark' ? 'block' : 'none';
      themeIconLight.style.display = saved === 'light' ? 'block' : 'none';
      themeLabel.textContent = saved === 'dark' ? 'Light' : 'Dark';
    }

    function updateSidebarToggleAria() {
      if (!sidebarToggle) return;
      const collapsed = document.body.classList.contains('sidebar-collapsed');
      sidebarToggle.setAttribute('aria-expanded', (!collapsed).toString());
    }

    function initSidebar() {
      const saved = localStorage.getItem('dashboard-sidebar') || 'expanded';
      if (saved === 'collapsed') {
        document.body.classList.add('sidebar-collapsed');
      }
      updateSidebarToggleAria();
    }
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.contains('theme-light');
      const next = isLight ? 'dark' : 'light';
      document.body.classList.toggle('theme-light', next === 'light');
      document.body.classList.toggle('theme-dark', next === 'dark');
      themeIconDark.style.display = next === 'dark' ? 'block' : 'none';
      themeIconLight.style.display = next === 'light' ? 'block' : 'none';
      themeLabel.textContent = next === 'dark' ? 'Light' : 'Dark';
      localStorage.setItem('dashboard-theme', next);
    });
    initTheme();

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('dashboard-sidebar', collapsed ? 'collapsed' : 'expanded');
        updateSidebarToggleAria();
      });
    }
    initSidebar();

    // Build aggregated "All Problems" view once on load
    buildAllProblems();

    const COMPLETED_KEY = 'dashboard-completed';
    function getCompletedSet() {
      try {
        const raw = localStorage.getItem(COMPLETED_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
      } catch (e) { return new Set(); }
    }
    function setCompleted(link, done) {
      const set = getCompletedSet();
      if (done) set.add(link); else set.delete(link);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
    }

    function getFilterState() {
      const easy = document.getElementById('filter-easy').checked;
      const medium = document.getElementById('filter-medium').checked;
      const hard = document.getElementById('filter-hard').checked;
      const freqMin = document.getElementById('filter-freq-min').value.trim();
      const freqMax = document.getElementById('filter-freq-max').value.trim();
      const acceptMin = document.getElementById('filter-accept-min').value.trim();
      const acceptMax = document.getElementById('filter-accept-max').value.trim();
      return {
        difficulties: { easy: easy, medium: medium, hard: hard },
        freqMin: freqMin === '' ? null : parseFloat(freqMin),
        freqMax: freqMax === '' ? null : parseFloat(freqMax),
        acceptMin: acceptMin === '' ? null : parseFloat(acceptMin),
        acceptMax: acceptMax === '' ? null : parseFloat(acceptMax)
      };
    }

    function applyFilters(data, headers) {
      const state = getFilterState();
      const diffIdx = headers.indexOf('Difficulty');
      const freqIdx = headers.indexOf('Frequency');
      const acceptIdx = headers.indexOf('Acceptance Rate');
      return data.filter(row => {
        const diff = (row.Difficulty || row[headers[diffIdx]] || '').toLowerCase();
        if (!state.difficulties.easy && diff === 'easy') return false;
        if (!state.difficulties.medium && diff === 'medium') return false;
        if (!state.difficulties.hard && diff === 'hard') return false;
        const freqVal = row.Frequency != null ? row.Frequency : (freqIdx >= 0 ? row[headers[freqIdx]] : null);
        const freq = parseFloat(freqVal);
        if (!isNaN(freq)) {
          if (state.freqMin != null && freq < state.freqMin) return false;
          if (state.freqMax != null && freq > state.freqMax) return false;
        }
        const acceptVal = row['Acceptance Rate'] != null ? row['Acceptance Rate'] : (acceptIdx >= 0 ? row[headers[acceptIdx]] : null);
        const acceptPct = parseFloat(acceptVal) * 100;
        if (!isNaN(acceptPct)) {
          if (state.acceptMin != null && acceptPct < state.acceptMin) return false;
          if (state.acceptMax != null && acceptPct > state.acceptMax) return false;
        }
        return true;
      });
    }

    function renderCompanyList(filter) {
      const names = filter
        ? COMPANY_NAMES.filter(n => n.toLowerCase().includes(filter.toLowerCase()))
        : COMPANY_NAMES;
      listEl.innerHTML = names.map((name) => {
        const idx = COMPANY_NAMES.indexOf(name);
        return '<button type="button" class="company-btn" data-idx="' + idx + '">' + escapeHtml(name) + '</button>';
      }).join('');
      listEl.querySelectorAll('.company-btn').forEach(btn => {
        const name = COMPANY_NAMES[parseInt(btn.dataset.idx, 10)];
        btn.addEventListener('click', () => selectCompany(name));
        if (currentCompany === name) btn.classList.add('active');
      });
    }

    function escapeHtml(s) {
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    function selectCompany(name) {
      const idx = COMPANY_NAMES.indexOf(name);
      if (idx < 0) return;
      currentCompany = name;
      listEl.querySelectorAll('.company-btn').forEach(b => b.classList.remove('active'));
      const btn = listEl.querySelector('.company-btn[data-idx="' + idx + '"]');
      if (btn) btn.classList.add('active');
      const info = COMPANY_DATA[name];
      if (!info) return;
      currentHeaders = info.headers;
      currentData = info.data;
      titleEl.textContent = name;
      filtersBar.style.display = 'flex';
      renderTableWithFilters();
    }

    function renderTableWithFilters() {
      if (!currentData || !currentHeaders) return;
      const filtered = applyFilters(currentData, currentHeaders);
      const total = currentData.length;
      if (filtered.length === total) {
        subEl.textContent = total + ' problems (All time)';
      } else {
        subEl.textContent = filtered.length + ' of ' + total + ' problems';
      }
      renderTable(currentHeaders, filtered);
    }

    function formatAcceptanceRate(val) {
      if (val === '' || val == null) return '—';
      const n = parseFloat(val);
      if (isNaN(n)) return val;
      return (n * 100).toFixed(1) + '%';
    }

    function renderTable(headers, data) {
      if (!data.length) {
        tableContainer.innerHTML = '<div class="empty-state"><p>No problems in this list.</p></div>';
        return;
      }
      const completed = getCompletedSet();
      const diffIdx = headers.indexOf('Difficulty');
      const titleIdx = headers.indexOf('Title');
      const freqIdx = headers.indexOf('Frequency');
      const acceptIdx = headers.indexOf('Acceptance Rate');
      const linkIdx = headers.indexOf('Link');
      const topicsIdx = headers.indexOf('Topics');
      let html = '<table class="data-table"><thead><tr><th class="col-done">Done</th>';
      headers.forEach(h => { html += '<th>' + escapeHtml(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      data.forEach(row => {
        const cells = headers.map((h, i) => row[h] ?? '');
        const link = linkIdx >= 0 ? (cells[linkIdx] || '') : '';
        const isDone = link && completed.has(link);
        html += '<tr class="' + (isDone ? 'row-done ' : '') + '" data-link="' + escapeHtml(link) + '">';
        html += '<td class="col-done"><input type="checkbox" class="done-cb" ' + (isDone ? 'checked' : '') + ' data-link="' + escapeHtml(link) + '" aria-label="Mark complete"></td>';
        headers.forEach((h, i) => {
          let cell = cells[i];
          if (h === 'Difficulty') {
            const c = (cell + '').toLowerCase();
            cell = '<span class="diff ' + (c === 'easy' ? 'easy' : c === 'medium' ? 'medium' : 'hard') + '">' + escapeHtml(cell) + '</span>';
          } else if (h === 'Title' && linkIdx >= 0 && cells[linkIdx]) {
            cell = '<a href="' + escapeHtml(cells[linkIdx]) + '" target="_blank" rel="noopener" class="title">' + escapeHtml(cell) + '</a>';
          } else if (h === 'Acceptance Rate') {
            cell = '<span class="accept">' + escapeHtml(formatAcceptanceRate(cell)) + '</span>';
          } else if (h === 'Frequency') {
            cell = '<span class="freq">' + escapeHtml(cell) + '</span>';
          } else if (h === 'Topics') {
            cell = '<span class="topics">' + escapeHtml(cell) + '</span>';
          } else if (h === 'Link') {
            cell = cell ? '<a href="' + escapeHtml(cell) + '" target="_blank" rel="noopener">Open</a>' : '—';
          } else {
            cell = escapeHtml(cell);
          }
          html += '<td>' + cell + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      tableContainer.innerHTML = html;
      tableContainer.querySelectorAll('.done-cb').forEach(cb => {
        cb.addEventListener('change', function() {
          const link = this.dataset.link;
          if (!link) return;
          setCompleted(link, this.checked);
          const row = this.closest('tr');
          if (row) row.classList.toggle('row-done', this.checked);
        });
      });
    }

    function bindFilters() {
      ['filter-easy', 'filter-medium', 'filter-hard', 'filter-freq-min', 'filter-freq-max', 'filter-accept-min', 'filter-accept-max'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderTableWithFilters);
        if (el && (id.startsWith('filter-freq') || id.startsWith('filter-accept'))) el.addEventListener('input', renderTableWithFilters);
      });
    }
    bindFilters();

    searchEl.addEventListener('input', () => renderCompanyList(searchEl.value.trim()));
    renderCompanyList();
    if (COMPANY_NAMES.length) selectCompany(COMPANY_NAMES[0]);
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('Written index.html');
