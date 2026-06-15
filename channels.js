// ============================================================
// CHANNELS INDEX — fetches Felix Bell's Are.na channels
// ============================================================

// Add channels here.
// appearsIn = Are.na slugs of the parent channels this work belongs to.
// These become the filter tabs — fetched live so titles update automatically.
const ARENA_CHANNELS = [
  {
    slug: 'soundsystem-yu-vopqlbgg',
    label: 'soundsystem',
    appearsIn: ['sound-p-hgk4lwt-k', 'installation-3ychr9gvdzg'],
  },
  // Add more channels below as you create them on Are.na:
  // { slug: 'your-channel-slug', label: 'channel name', appearsIn: ['sound-xirpilcp9ru'] },
];

const CHANNELS_API = 'https://api.are.na/v2/channels/';

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
  const res = await fetch(`${CHANNELS_API}${slug}?per=8`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchChannelTitle(slug) {
  try {
    const res = await fetch(`${CHANNELS_API}${slug}`);
    if (!res.ok) return slug;
    const data = await res.json();
    return data.title || slug;
  } catch {
    return slug;
  }
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

function renderChannelCard(channel, slug, label, appearsIn) {
  const thumb = getChannelThumb(channel);
  const url = `channel.html?slug=${encodeURIComponent(slug)}`;
  const created = formatDate(channel.created_at);
  const updated = formatDate(channel.updated_at);
  const cats = (appearsIn || []).join(' ');

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

function buildFilters(tabs) {
  // tabs = [{ slug, title }]
  const filtersEl = document.getElementById('channel-filters');
  if (!filtersEl) return;

  filtersEl.innerHTML = [{ slug: 'all', title: 'All' }, ...tabs].map(tab => `
    <button
      class="filter-btn${tab.slug === 'all' ? ' filter-btn--active' : ''}"
      data-filter="${tab.slug}"
      aria-pressed="${tab.slug === 'all' ? 'true' : 'false'}"
    >${tab.title}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });
}

function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('filter-btn--active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('#channels-grid .channel-card').forEach(card => {
    const cats = card.dataset.categories ? card.dataset.categories.split(' ') : [];
    const visible = filter === 'all' || cats.includes(filter);
    card.classList.toggle('channel-card--hidden', !visible);
  });
}

// ---- Init ----

async function initChannels() {
  const grid = document.getElementById('channels-grid');
  if (!grid) return;

  // Collect unique parent channel slugs across all cards
  const allSlugs = [...new Set(
    ARENA_CHANNELS.flatMap(ch => ch.appearsIn || [])
  )];

  // Fetch titles for all parent channels in parallel
  let tabs = [];
  if (allSlugs.length > 0) {
    const titles = await Promise.all(allSlugs.map(fetchChannelTitle));
    tabs = allSlugs.map((slug, i) => ({ slug, title: titles[i] }));
    buildFilters(tabs);
    document.getElementById('channel-filters').style.display = 'flex';
  }

  // Skeletons while fetching
  grid.innerHTML = `<div class="skeleton-grid" style="padding:0;max-width:100%">${skeletonCards(ARENA_CHANNELS.length)}</div>`;

  try {
    const results = await Promise.allSettled(
      ARENA_CHANNELS.map(({ slug }) => fetchChannelPreview(slug))
    );

    const cards = results.map((result, i) => {
      const { slug, label, appearsIn } = ARENA_CHANNELS[i];
      if (result.status === 'fulfilled') {
        return renderChannelCard(result.value, slug, label, appearsIn);
      } else {
        const cats = (appearsIn || []).join(' ');
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
