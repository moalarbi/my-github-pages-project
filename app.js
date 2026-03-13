let activeFilter = 'all';
let searchQuery = '';

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildFilters();
  render();
  document.getElementById('total-count').textContent = PROMPTS.length;
  document.getElementById('cat-count').textContent = getCategories().length;
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function getCategories() {
  return [...new Set(PROMPTS.map(p => p.cat))];
}

function getFiltered() {
  return PROMPTS.filter(p => {
    const matchCat = activeFilter === 'all' || p.cat === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q));
    return matchCat && matchSearch;
  });
}

// ─── Build UI ───────────────────────────────────────────────────────────────
function buildFilters() {
  const wrap = document.getElementById('filterBtns');
  // Clear existing buttons except 'All'
  const allBtn = wrap.querySelector('[data-cat="all"]');
  wrap.innerHTML = '';
  wrap.appendChild(allBtn);

  getCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = () => setFilter(cat, btn);
    wrap.appendChild(btn);
  });
}

function setFilter(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function render() {
  const list = getFiltered();
  const lib = document.getElementById('library');
  if (list.length === 0) {
    lib.innerHTML = `<div class="empty-state">
      <span>⬡</span>
      <p>لا يوجد نتائج مطابقة</p>
    </div>`;
    return;
  }
  // Group by category
  const groups = {};
  list.forEach(p => {
    if (!groups[p.cat]) groups[p.cat] = [];
    groups[p.cat].push(p);
  });
  lib.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <section class="cat-section">
      <h2 class="cat-title">${cat} <small>${items.length} سكربت</small></h2>
      <div class="cards-grid">
        ${items.map(cardHTML).join('')}
      </div>
    </section>
  `).join('');
}

function cardHTML(p) {
  return `
    <div class="card" id="card-${p.id}">
      <div class="card-header" onclick="toggleCard(${p.id})">
        <div class="card-meta">
          <span class="card-cat">${p.cat}</span>
          <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <div class="card-body" id="body-${p.id}">
        <pre class="prompt-text">${escapeHTML(p.prompt)}</pre>
        <div class="card-actions">
          <button class="btn-copy" onclick="copyPrompt(${p.id}, this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            نسخ البرومبت
          </button>
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Actions ────────────────────────────────────────────────────────────────
function toggleCard(id) {
  const body = document.getElementById(`body-${id}`);
  const card = document.getElementById(`card-${id}`);
  const isOpen = body.classList.contains('open');
  // close all
  document.querySelectorAll('.card-body.open').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
  if (!isOpen) {
    body.classList.add('open');
    card.classList.add('expanded');
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }
}

function copyPrompt(id, btn) {
  const prompt = PROMPTS.find(p => p.id === id);
  navigator.clipboard.writeText(prompt.prompt).then(() => {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> تم النسخ ✓`;
    btn.classList.add('copied');
    showToast();
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> نسخ البرومبت`;
      btn.classList.remove('copied');
    }, 2500);
  });
}

function exportAll() {
  const text = PROMPTS.map(p =>
    `═══════════════════════════════════════\n${p.title}\n[${p.cat}]\n═══════════════════════════════════════\n\n${p.prompt}\n\n`
  ).join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompt-library.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ─── Search ─────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function() {
  searchQuery = this.value;
  render();
});
