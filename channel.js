// ============================================================
// CHANNEL PAGE — starstar-style mosaic grid layout
// ============================================================

const CHANNEL_API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '/arena/channels/' : 'https://api.are.na/v2/channels/';
const PER_PAGE = 100;

let currentSlug = '';
let currentPage = 1;
let totalBlocks = 0;

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || '';
}

// ---- Helpers ----

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---- Are.na description directive parser ----
// Add directives to a block's description on Are.na to control layout:
//   `layout: full`         → spans all 4 columns
//   `layout: full contain` → spans all 4 columns, image contained with padding
//   `layout: half`         → spans 2 columns
//   `layout: quarter`      → 1 column (default)
//   `permalink: false`     → clicking won't open lightbox

function parseDirectives(block) {
  // Strip markdown formatting (code fences, bold, italic, backticks)
  const desc = (block.description || '')
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');

  const directives = { layout: null, contain: false, permalink: true };
  if (!desc) return directives;

  // Match layout: full / half / long / tall / quarter / full contain
  const layoutMatch = desc.match(/layout:\s*([^\n\r]+)/i);
  if (layoutMatch) {
    const val = layoutMatch[1].trim().toLowerCase();
    if (val.includes('full'))    directives.layout = 'full';
    else if (val.includes('half'))    directives.layout = 'half';
    else if (val.includes('long'))    directives.layout = 'long';
    else if (val.includes('tall'))    directives.layout = 'tall';
    else if (val.includes('quarter')) directives.layout = 'quarter';
    if (val.includes('contain')) directives.contain = true;
  }

  // Also catch contain: true as its own directive on any line
  if (/contain:\s*true/i.test(desc)) directives.contain = true;

  // Match permalink: false
  const permalinkMatch = desc.match(/permalink:\s*(\w+)/i);
  if (permalinkMatch && permalinkMatch[1].toLowerCase() === 'false') {
    directives.permalink = false;
  }

  // Match thumbnail: true
  if (/thumbnail:\s*true/i.test(desc)) {
    directives.thumbnail = true;
  }

  return directives;
}

// ---- Block size logic ----

let blockCounter = 0;
let textBlockCount = 0; // alternates text between col 1-2 and col 2-3

function getSizeClass(block, directives) {
  // Explicit directive overrides everything
  if (directives.layout) return directives.layout;
  return 'quarter';
}

// ---- Block renderers ----

function renderImageBlock(block) {
  const img = block.image && block.image.display ? block.image.display.url : null;
  if (!img) return null;
  const large = block.image && block.image.original ? block.image.original.url : img;
  const title = block.title || block.generated_title || '';
  const dir = parseDirectives(block);
  const sizeClass = getSizeClass(block, dir);
  const containClass = dir.contain ? ' contain' : '';
  const date = block.created_at ? new Date(block.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const lightboxAttrs = dir.permalink
    ? `data-lightbox data-src="${escapeAttr(large)}" data-caption="${escapeAttr(title)}" data-date="${escapeAttr(date)}" tabindex="0" role="button" aria-label="View image${title ? ': ' + escapeAttr(title) : ''}"`
    : '';

  return `
    <div class="block-item block-image ${sizeClass}${containClass}" ${lightboxAttrs}>
      <img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" loading="lazy" />
      ${title ? `<span class="block-title">${escapeHtml(title)}</span>` : ''}
    </div>
  `;
}

function renderTextBlock(block) {
  const html = block.content_html || (block.content ? `<p>${block.content}</p>` : '');
  if (!html) return null;
  const title = block.title || '';
  const dir = parseDirectives(block);

  const sizeClass = dir.layout || 'quarter';
  const containClass = dir.contain ? ' contain' : '';

  return `
    <div class="block-item block-text ${sizeClass}${containClass}">
      <div class="block-text-inner">
        ${title ? `<p class="block-title">${escapeHtml(title)}</p>` : ''}
        <div class="block-text-content">${html}</div>
      </div>
    </div>
  `;
}

function renderLinkBlock(block) {
  const url = block.source && block.source.url ? block.source.url : '#';
  const title = block.title || block.generated_title || url;
  const thumb = block.image && block.image.display ? block.image.display.url : null;
  const dir = parseDirectives(block);
  const sizeClass = dir.layout || 'quarter';

  return `
    <div class="block-item block-link-card ${sizeClass}">
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="block-link-card-inner">
        ${thumb
          ? `<div class="block-link-thumb"><img src="${escapeAttr(thumb)}" alt="${escapeAttr(title)}" loading="lazy" /></div>`
          : `<div class="block-link-thumb block-link-thumb-empty"></div>`
        }
        <div class="block-link-label">${escapeHtml(title)}</div>
      </a>
    </div>
  `;
}

function renderChannelBlock(block) {
  const title = block.title || 'Channel';
  const url = `channel.html?slug=${encodeURIComponent(block.slug)}`;
  return `
    <a href="${url}" class="block-item block-channel quarter">
      <span class="block-channel-inner">${escapeHtml(title)}</span>
    </a>
  `;
}

function renderBlock(block) {
  switch (block.class) {
    case 'Image':      return renderImageBlock(block);
    case 'Text':       return renderTextBlock(block);
    case 'Link':       return renderLinkBlock(block);
    case 'Media':      return renderLinkBlock(block);
    case 'Attachment': return renderImageBlock(block);
    case 'Channel':    return renderChannelBlock(block);
    default:           return null;
  }
}

// ---- Render & fetch ----

function appendBlocks(blocks) {
  const grid = document.getElementById('blocks-grid');
  blocks.forEach(block => {
    const html = renderBlock(block);
    if (!html) return;
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    const el = div.firstChild;
    grid.appendChild(el);
  });
  attachLightboxListeners();
}

function updateLoadMore() {
  const loaded = document.querySelectorAll('#blocks-grid .block-item').length;
  const wrap = document.getElementById('load-more-wrap');
  const btn = document.getElementById('load-more-btn');
  if (!wrap || !btn) return;
  if (loaded < totalBlocks) {
    wrap.style.display = 'block';
    btn.textContent = `Load more (${totalBlocks - loaded} remaining)`;
  } else {
    wrap.style.display = 'none';
  }
}

async function loadMore() {
  const btn = document.getElementById('load-more-btn');
  if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }
  currentPage++;
  try {
    const data = await fetchBlocks(currentSlug, currentPage);
    appendBlocks(data.contents || []);
    updateLoadMore();
  } catch {
    if (btn) { btn.textContent = 'Error — try again'; btn.disabled = false; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function fetchBlocks(slug, page) {
  const res = await fetch(`${CHANNEL_API}${slug}/contents?per=${PER_PAGE}&page=${page}&sort=position&direction=desc`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchChannelInfo(slug) {
  const res = await fetch(`${CHANNEL_API}${slug}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function initChannel() {
  currentSlug = getSlugFromURL();
  if (!currentSlug) { window.location.href = 'index.html'; return; }
  blockCounter = 0;
  textBlockCount = 0;

  const titleEl = document.getElementById('channel-title');
  const grid = document.getElementById('blocks-grid');

  // Skeleton
  if (grid) {
    grid.innerHTML = Array.from({ length: 12 }, (_, i) => `
      <div class="block-item quarter skeleton-block" style="animation-delay:${i * 60}ms"></div>
    `).join('');
  }

  try {
    const [info, blocksData] = await Promise.all([
      fetchChannelInfo(currentSlug),
      fetchBlocks(currentSlug, 1)
    ]);

    const title = info.title || currentSlug;
    document.title = `${title} — Felix Bell`;
    if (titleEl) titleEl.textContent = title;
    totalBlocks = info.length || 0;

    if (grid) grid.innerHTML = '';
    appendBlocks(blocksData.contents || []);

    // Auto-load remaining pages silently
    let page = 2;
    while (page * PER_PAGE - PER_PAGE < totalBlocks) {
      const more = await fetchBlocks(currentSlug, page);
      appendBlocks(more.contents || []);
      page++;
    }

    document.getElementById('load-more-wrap').style.display = 'none';

  } catch (err) {
    if (titleEl) titleEl.textContent = 'Channel';
    if (grid) grid.innerHTML = `<p class="error-state" style="padding:2rem">Could not load channel.</p>`;
  }
}

// ---- Lightbox ----

let lightboxItems = [];   // [{src, caption, date}] — all lightbox-able images
let lightboxIndex = -1;   // which one is currently open

function buildLightboxItems() {
  lightboxItems = [];
  document.querySelectorAll('[data-lightbox]').forEach(el => {
    lightboxItems.push({
      src:     el.dataset.src     || '',
      caption: el.dataset.caption || '',
      date:    el.dataset.date    || '',
    });
  });
}

function showLightboxAt(index) {
  if (index < 0 || index >= lightboxItems.length) return;
  lightboxIndex = index;
  const { src, caption, date } = lightboxItems[index];

  const lb      = document.getElementById('lightbox');
  const img     = document.getElementById('lightbox-img');
  const meta    = document.getElementById('lightbox-meta');
  const titleEl = document.getElementById('lightbox-title');
  const dateEl  = document.getElementById('lightbox-date');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!lb) return;
  img.src = src;
  img.alt = caption;
  if (titleEl) titleEl.textContent = caption;
  if (dateEl)  dateEl.textContent  = date;
  if (meta)    meta.style.display  = (caption || date) ? 'flex' : 'none';
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Show/hide arrows at ends
  if (prevBtn) prevBtn.classList.toggle('lightbox-arrow--hidden', index === 0);
  if (nextBtn) nextBtn.classList.toggle('lightbox-arrow--hidden', index === lightboxItems.length - 1);
}

function openLightbox(src, caption, date) {
  buildLightboxItems();
  // Find this image's index
  const idx = lightboxItems.findIndex(item => item.src === src);
  showLightboxAt(idx >= 0 ? idx : 0);
}

function navigateLightbox(dir) {
  showLightboxAt(lightboxIndex + dir);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.style.display = 'none';
  document.body.style.overflow = '';
  const img = document.getElementById('lightbox-img');
  if (img) img.src = '';
  lightboxIndex = -1;
}

function attachLightboxListeners() {
  document.querySelectorAll('[data-lightbox]:not([data-lb-bound])').forEach(el => {
    el.setAttribute('data-lb-bound', '1');
    el.addEventListener('click', () => openLightbox(el.dataset.src, el.dataset.caption, el.dataset.date));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(el.dataset.src, el.dataset.caption, el.dataset.date); }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initChannel();
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn  = document.getElementById('lightbox-prev');
  const nextBtn  = document.getElementById('lightbox-next');
  const lb       = document.getElementById('lightbox');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn)  prevBtn.addEventListener('click',  e => { e.stopPropagation(); navigateLightbox(-1); });
  if (nextBtn)  nextBtn.addEventListener('click',  e => { e.stopPropagation(); navigateLightbox(+1); });
  if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(+1);
  });
});
