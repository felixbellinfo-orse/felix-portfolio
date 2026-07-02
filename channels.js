// ============================================================
// CHANNELS INDEX — fetches Felix Bell's Are.na channels
// ============================================================

// Add channels here.
// tags = plain text labels of your choosing — these become the filter buttons.
const ARENA_CHANNELS = [
  {
    slug: 'what-if-these-trees-could-speak',
    label: 'what if these trees could speak',
    tags: ['sound', 'ecology', 'workshop'],
  },
    {
    slug: 'orse-audio',
    label: 'orse audio',
    tags: ['sound', 'speakers', 'events'],
  },
  {
    slug: 'on-behalf-of-the-environment-pedagogies-of-unrest',
    label: 'on behalf of the environment',
    tags: ['research', 'installation'],
  },
    {
    slug: 'two-sisters',
    label: 'two sisters',
    tags: ['sound', 'speakers', 'events'],
    },
      {
    slug: 'interior-biome',
    label: 'interior biome',
    tags: ['sound', 'ecology'] ,
    },

    {
  label: '↳ educating gods',
  url: 'https://bauhaus-dessau.de/en/knowledge/publications/on-behalf-of-the-environment-pedagogies-of-unrest-bauhaus-bauhaus-taschenbuch-30/',
  tags: ['writing', 'ecology'],
  role: 'Written contribution',
  with: 'Bauhaus Dessau',
  date: '2024',
  thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnL63KNhqZaJT6i2I2kS68o10WfUDUKZtMuHOGBE6OZmhOLi-ylh-sIus&s=10',
},

   {
  label: '↳ what spills?',
  url: 'https://cthulhubooks.com/products/we?variant=53388477694278',
  tags: ['writing', 'ecology'],
  role: 'Written contribution',
  with: 'The Institute for Postnatural Studies',
  date: '2023',
  thumbnail: 'https://cthulhubooks.com/cdn/shop/files/image_0ce1da46-9d9d-4bd5-936e-7b49007a5f8f.jpg?v=1730764940',
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

function renderChannelCard(channel, slug, label, tags, externalUrl, overrides = {}) {
  const thumb = overrides.thumbnail || getChannelThumb(channel);
  const url = externalUrl ? externalUrl : `channel.html?slug=${encodeURIComponent(slug)}`;
  const targetAttr = externalUrl ? ' target="_blank" rel="noopener"' : '';
  const created = overrides.date ? overrides.date : formatDate(channel.created_at);
  const updated = overrides.date ? null : formatDate(channel.updated_at);
  const cats = (tags || []).join(' ');
  const { role: arenaRole, with: arenaWith } = parseChannelDesc(channel);
  const role    = overrides.role  !== undefined ? overrides.role  : arenaRole;
  const withVal = overrides.with  !== undefined ? overrides.with  : arenaWith;

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
      const { slug, label, tags, url: externalUrl, role, with: withVal, date, thumbnail } = ARENA_CHANNELS[i];
      const overrides = { role, with: withVal, date, thumbnail };
      if (result.status === 'fulfilled' && result.value !== null) {
        return renderChannelCard(result.value, slug, label, tags, externalUrl, overrides);
      } else {
        // external link card or failed fetch — render from config directly
        return renderChannelCard(
          { created_at: null, updated_at: null, contents: [] },
          slug, label, tags, externalUrl, overrides
        );
      }
    });

    grid.innerHTML = cards.join('');
  } catch (err) {
    grid.innerHTML = `<p class="error-state">Could not load channels. <a href="https://www.are.na/felix-bell" target="_blank" rel="noopener">View on Are.na ↗</a></p>`;
  }
}

document.addEventListener('DOMContentLoaded', initChannels);
