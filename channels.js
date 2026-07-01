// ============================================================
// CHANNELS INDEX — fetches Felix Bell's Are.na channels
// ============================================================

// Add channels here.
// tags = plain text labels of your choosing — these become the filter buttons.
const ARENA_CHANNELS = [
  {
    slug: 'soundsystem-yu-vopqlbgg',
    label: 'soundsystem',
    tags: ['sound', ],
  },
  {
    slug: 'sound-rewire',
    label: 'sound rewire',
    tags: ['sound', 'installation'],
  },
    {
    slug: 'two-sisters',
    label: 'two sisters',
    tags: ['sound', 'speakers'],
    },
      {
    slug: 'interior-biome',
    label: 'interior biome',
    tags: ['sound'] ,
    },
  // Add more channels below:
  // { slug: 'your-channel-slug', label: 'channel name', tags: ['sound'] },
];

const CHANNELS_API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '/arena/channels/' : 'https://api.are.na/v2/channels/';

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
  const res = await fetch(`${CHANNELS_API}${slug}?per=50`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


function getChannelThumb(channel) {
  if (!channel.contents) return null;
  // First pass: look for a block with `thumbnail: true` in its description
  for (const block of channel.contents) {
    const desc = (block.description || '')
      .replace(/```/g, '').replace(/\*\*/g, '').replace(/`/g, '');
    if (/thumbnail:\s*true/i.test(desc) && block.image && block.image.display) {
      return block.image.display.url;
    }
  }
  // Fall back to first image block
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

function parseChannelDesc(channel) {
  const desc = (channel.metadata && channel.metadata.description)
    ? channel.metadata.description
    : channel.description || '';
  const role  = (desc.match(/role:\s*(.+)/i)  || [])[1];
  const with_ = (desc.match(/with:\s*(.+)/i)  || [])[1];
  return { role: role ? role.trim() : '', with: with_ ? with_.trim() : '' };
}

function renderChannelCard(channel, slug, label, tags, externalUrl) {
  const thumb = getChannelThumb(channel);
  const url = externalUrl ? externalUrl : `channel.html?slug=${encodeURIComponent(slug)}`;
  const targetAttr = externalUrl ? ' target="_blank" rel="noopener"' : '';
  const created = formatDate(channel.created_at);
  const updated = formatDate(channel.updated_at);
  const cats = (tags || []).join(' ');
  const { role, with: withVal } = parseChannelDesc(channel);

  const thumbHtml = thumb
    ? `<img src="${thumb}" alt="${label}" loading="lazy" />`
    : `<span class="channel-card-thumb-placeholder">—</span>`;

  const roleWith = (role || withVal) ? `
    <div class="channel-card-rolewith">
      ${role    ? `<span class="channel-card-role">Role: ${role}</span>` : ''}
      ${withVal ? `<span class="channel-card-with">With: ${withVal}</span>` : ''}
    </div>` : '';

  const dateMeta = (created || updated) ? `
    <div class="channel-card-dates">
      ${created ? `<span>Started ${created}</span>` : ''}
      ${updated ? `<span>Updated ${updated}</span>` : ''}
    </div>` : '';

  return `
    <a href="${url}"${targetAttr} class="channel-card" data-categories="${cats}">
      <div class="channel-card-thumb">${thumbHtml}</div>
      <div class="channel-card-body">
        <h2 class="channel-card-title">${label || channel.title}</h2>
        ${roleWith}
        <div class="channel-card-footer">${dateMeta}</div>
      </div>
    </a>
  `;
}

// ---- Filter buttons ----

function buildFilters(tags) {
  const filtersEl = document.getElementById('channel-filters');
  if (!filtersEl) return;

  filtersEl.innerHTML = ['all', ...tags].map(tag => `
    <button
      class="filter-btn${tag === 'all' ? ' filter-btn--active' : ''}"
      data-filter="${tag}"
      aria-pressed="${tag === 'all' ? 'true' : 'false'}"
    >${tag}</button>
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
    card.style.display = visible ? '' : 'none';
  });
}

// ---- Init ----

async function initChannels() {
  const grid = document.getElementById('channels-grid');
  if (!grid) return;

  // Collect unique tags across all cards
  const allTags = [...new Set(
    ARENA_CHANNELS.flatMap(ch => ch.tags || [])
  )];

  if (allTags.length > 0) {
    buildFilters(allTags);
    document.getElementById('channel-filters').style.display = 'flex';
  }

  // Skeletons while fetching
  grid.innerHTML = `<div class="skeleton-grid" style="padding:0;max-width:100%">${skeletonCards(ARENA_CHANNELS.length)}</div>`;

  try {
    const results = await Promise.allSettled(
      ARENA_CHANNELS.map(({ slug, url }) => url ? Promise.resolve(null) : fetchChannelPreview(slug))
    );

    const cards = results.map((result, i) => {
      const { slug, label, tags, url: externalUrl } = ARENA_CHANNELS[i];
      if (result.status === 'fulfilled' && result.value !== null) {
        return renderChannelCard(result.value, slug, label, tags, externalUrl);
      } else {
        const cats = (tags || []).join(' ');
        const href = externalUrl ? externalUrl : `channel.html?slug=${encodeURIComponent(slug)}`;
        const targetAttr = externalUrl ? ' target="_blank" rel="noopener"' : '';
        return `
          <a href="${href}"${targetAttr} class="channel-card" data-categories="${cats}">
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
