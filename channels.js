// ============================================================
// CHANNELS INDEX — fetches Felix Bell's Are.na channels
// ============================================================

// Add channels here. Each entry can have one or more categories.
// Categories become filter buttons automatically — just use
// whatever names make sense to you.
const ARENA_CHANNELS = [
  { slug: 'soundsystem-yu-vopqlbgg', label: 'soundsystem', categories: ['sound'] },
  // Add more channels below as you create them on Are.na:
  // { slug: 'your-channel-slug', label: 'channel name', categories: ['design', 'sound'] },
];

const ARENA_API = 'https://api.are.na/v2/channels/';

// ---- Helpers ----

function skeletonCards(n) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

async function fetchChannelPreview(slug) {
  const res = await fetch(`${ARENA_API}${slug}?per=8`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getChannelThumb(channel) {
  if (!channel.contents) return null;
  for (const block of channel.contents) {
    if (block.image && block.image.display && block.image.display.url) {
      return block.image.display.url;
    }
  }
  return null;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---- Card renderer ----

function renderChannelCard(channel, slug, label, categories) {
  const thumb = getChannelThumb(channel);
  const url = `channel.html?slug=${encodeURIComponent(slug)}`;
  const created = formatDate(channel.created_at);
  const updated = formatDate(channel.updated_at);
  const cats = (categories || []).join(' ');

  const thumbHtml = thumb
    ? `<img src="${thumb}" alt="${label}" loading="lazy" />`
    : `<span class="channel-card-thumb-placeholder">—</span>`;

  const dateMeta = (created || updated)
    ? `<p class="channel-card-meta">${created ? `Started ${created}` : ''}${created && updated ? '<br>' : ''}${updated ? `Updated ${updated}` : ''}</p>`
    : '';

  return `
    <a href="${url}" class="channel-card" data-categories="${cats}">
      <div class="channel-card-thumb">${thumbHtml}</div>
      <div class="channel-card-body">
        <h2 class="channel-card-title">${label || channel.title}</h2>
        ${dateMeta}
      </div>
    </a>
  `;
}

// ---- Filter buttons ----

function buildFilters(categories) {
  const filtersEl = document.getElementById('channel-filters');
  if (!filtersEl) return;

  // Always start with "All"
  const all = ['all', ...categories];

  filtersEl.innerHTML = all.map(cat => `
    <button
      class="filter-btn${cat === 'all' ? ' filter-btn--active' : ''}"
      data-filter="${cat}"
      aria-pressed="${cat === 'all' ? 'true' : 'false'}"
    >${cat === 'all' ? 'All' : cat}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });
}

function applyFilter(filter) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('filter-btn--active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Show/hide cards
  const cards = document.querySelectorAll('#channels-grid .channel-card');
  cards.forEach(card => {
    const cats = card.dataset.categories ? card.dataset.categories.split(' ') : [];
    const visible = filter === 'all' || cats.includes(filter);
    card.classList.toggle('channel-card--hidden', !visible);
  });
}

// ---- Init ----

async function initChannels() {
  const grid = document.getElementById('channels-grid');
  if (!grid) return;

  // Collect unique categories from the channel list
  const allCats = [...new Set(
    ARENA_CHANNELS.flatMap(ch => ch.categories || [])
  )].sort();

  // Only show filters if there are categories defined
  if (allCats.length > 0) {
    buildFilters(allCats);
    document.getElementById('channel-filters').style.display = 'flex';
  }

  // Skeletons while fetching
  grid.innerHTML = `<div class="skeleton-grid" style="padding:0;max-width:100%">${skeletonCards(ARENA_CHANNELS.length)}</div>`;

  try {
    const results = await Promise.allSettled(
      ARENA_CHANNELS.map(({ slug }) => fetchChannelPreview(slug))
    );

    const cards = results.map((result, i) => {
      const { slug, label, categories } = ARENA_CHANNELS[i];
      if (result.status === 'fulfilled') {
        return renderChannelCard(result.value, slug, label, categories);
      } else {
        const cats = (categories || []).join(' ');
        return `
          <a href="channel.html?slug=${encodeURIComponent(slug)}" class="channel-card" data-categories="${cats}">
            <div class="channel-card-thumb"><span class="channel-card-thumb-placeholder">—</span></div>
            <div class="channel-card-body">
              <h2 class="channel-card-title">${label}</h2>
            </div>
          </a>
        `;
      }
    });

    grid.innerHTML = cards.join('');
  } catch (err) {
    grid.innerHTML = `<p class="error-state">Could not load channels. <a href="https://www.are.na/felix-bell" target="_blank" rel="noopener">View on Are.na ↗</a></p>`;
  }
}

document.addEventListener('DOMContentLoaded', initChannels);
