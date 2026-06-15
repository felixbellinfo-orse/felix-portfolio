// ============================================================
// CHANNEL PAGE — fetches and renders a single Are.na channel
// ============================================================

const ARENA_API = 'https://api.are.na/v2/channels/';
const PER_PAGE = 24;

let currentSlug = '';
let currentPage = 1;
let totalBlocks = 0;

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || '';
}

// ---- Block renderers ----

function renderImageBlock(block) {
  const img = block.image && block.image.display ? block.image.display.url : null;
  if (!img) return null;
  const title = block.title || '';
  const desc = block.description ? `<p class="block-description">${escapeHtml(block.description)}</p>` : '';

  return `
    <div class="block-item block-image"
         data-lightbox
         data-src="${escapeAttr(block.image.original ? block.image.original.url : img)}"
         data-caption="${escapeAttr(title)}"
         tabindex="0"
         role="button"
         aria-label="View image: ${escapeAttr(title || 'image')}">
      <img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" loading="lazy" />
      ${desc}
    </div>
  `;
}

function renderLinkBlock(block) {
  const url = block.source && block.source.url ? block.source.url : '#';
  const title = block.title || block.generated_title || 'Link';
  const provider = block.source && block.source.provider ? block.source.provider.name : '';
  const thumb = block.image && block.image.display ? block.image.display.url : null;
  const desc = block.description ? `<p class="block-description">${escapeHtml(block.description)}</p>` : '';

  const thumbHtml = thumb ? `<div class="block-link-thumb"><img src="${escapeAttr(thumb)}" alt="" loading="lazy" /></div>` : '';

  return `
    <div class="block-item">
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="block-link">
        ${thumbHtml}
        <div class="block-link-body">
          <p class="block-link-title">${escapeHtml(title)}</p>
          ${provider ? `<p class="block-link-source">${escapeHtml(provider)}</p>` : ''}
        </div>
      </a>
      ${desc}
    </div>
  `;
}

function renderTextBlock(block) {
  const html = block.content_html || (block.content ? `<p>${escapeHtml(block.content)}</p>` : '');
  if (!html) return null;
  return `
    <div class="block-item">
      <div class="block-text">
        <div class="block-text-content">${html}</div>
      </div>
    </div>
  `;
}

function renderMediaBlock(block) {
  const url = block.source && block.source.url ? block.source.url : '#';
  const title = block.title || block.generated_title || '';
  const thumb = block.image && block.image.display ? block.image.display.url : null;
  const desc = block.description ? `<p class="block-description">${escapeHtml(block.description)}</p>` : '';

  const thumbHtml = thumb
    ? `<div class="block-media-thumb">
        <img src="${escapeAttr(thumb)}" alt="" loading="lazy" />
        <span class="block-media-play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
       </div>`
    : '';

  return `
    <div class="block-item">
      <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="block-media">
        ${thumbHtml}
        ${title ? `<div class="block-media-body"><p class="block-media-title">${escapeHtml(title)}</p></div>` : ''}
      </a>
      ${desc}
    </div>
  `;
}

function renderChannelBlock(block) {
  // Nested channel inside a channel
  const title = block.title || 'Channel';
  const url = `channel.html?slug=${encodeURIComponent(block.slug)}`;
  const count = block.length || 0;
  return `
    <div class="block-item">
      <a href="${url}" class="block-channel">
        <p class="block-channel-label">channel · ${count} block${count !== 1 ? 's' : ''}</p>
        <p class="block-channel-title">${escapeHtml(title)}</p>
      </a>
    </div>
  `;
}

function renderBlock(block) {
  switch (block.class) {
    case 'Image':
      return renderImageBlock(block);
    case 'Link':
      return renderLinkBlock(block);
    case 'Text':
      return renderTextBlock(block);
    case 'Media':
      return renderMediaBlock(block);
    case 'Channel':
      return renderChannelBlock(block);
    case 'Attachment':
      return renderLinkBlock(block); // treat as link
    default:
      return null;
  }
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

// ---- Fetch & render ----

async function fetchBlocks(slug, page) {
  const res = await fetch(`${ARENA_API}${slug}/contents?per=${PER_PAGE}&page=${page}&sort=position&direction=asc`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchChannelInfo(slug) {
  const res = await fetch(`${ARENA_API}${slug}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function appendBlocks(blocks) {
  const grid = document.getElementById('blocks-grid');
  blocks.forEach(block => {
    const html = renderBlock(block);
    if (html) {
      const div = document.createElement('div');
      div.innerHTML = html.trim();
      const el = div.firstChild;
      grid.appendChild(el);
    }
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
  } catch (err) {
    if (btn) { btn.textContent = 'Error — try again'; btn.disabled = false; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function initChannel() {
  currentSlug = getSlugFromURL();
  if (!currentSlug) {
    window.location.href = 'index.html';
    return;
  }

  const titleEl = document.getElementById('channel-title');
  const metaEl = document.getElementById('channel-meta');
  const grid = document.getElementById('blocks-grid');

  // Skeleton
  if (grid) {
    grid.innerHTML = Array.from({ length: 9 }, () => `
      <div class="block-item" style="height:200px;background:var(--color-surface-offset);animation:skeleton-pulse 1.6s ease-in-out infinite;"></div>
    `).join('');
  }

  try {
    // Fetch channel info and first page of blocks in parallel
    const [info, blocksData] = await Promise.all([
      fetchChannelInfo(currentSlug),
      fetchBlocks(currentSlug, 1)
    ]);

    // Update page title
    const title = info.title || currentSlug;
    document.title = `${title} — Felix Bell`;
    if (titleEl) titleEl.textContent = title;
    if (metaEl) metaEl.textContent = '';

    totalBlocks = info.length || 0;

    // Clear skeleton and render blocks
    if (grid) grid.innerHTML = '';
    appendBlocks(blocksData.contents || []);
    updateLoadMore();

    // Load more button
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.addEventListener('click', loadMore);

  } catch (err) {
    if (titleEl) titleEl.textContent = 'Channel';
    if (grid) grid.innerHTML = `<p class="error-state">Could not load channel. <a href="https://www.are.na/felix-bell/${currentSlug}" target="_blank" rel="noopener">View on Are.na ↗</a></p>`;
  }
}

// ---- Lightbox ----

function openLightbox(src, caption) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  if (!lb) return;
  img.src = src;
  img.alt = caption || '';
  if (cap) cap.textContent = caption || '';
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  lb.focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.style.display = 'none';
  document.body.style.overflow = '';
  const img = document.getElementById('lightbox-img');
  if (img) img.src = '';
}

function attachLightboxListeners() {
  document.querySelectorAll('[data-lightbox]:not([data-lb-bound])').forEach(el => {
    el.setAttribute('data-lb-bound', '1');
    el.addEventListener('click', function () {
      openLightbox(this.dataset.src, this.dataset.caption);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(this.dataset.src, this.dataset.caption);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initChannel();

  const closeBtn = document.getElementById('lightbox-close');
  const lb = document.getElementById('lightbox');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
});
