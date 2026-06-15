// ============================================================
// CHANNELS INDEX — fetches Felix Bell's Are.na channels
// ============================================================

// Hard-coded channel list — add/remove slugs here to control what appears
// on your homepage. The order here is the order on the page.
const ARENA_CHANNELS = [
  { slug: 'soundsystem-yu-vopqlbgg', label: 'soundsystem' },
  // Add more channels below as you create them on Are.na:
  // { slug: 'your-channel-slug', label: 'channel name' },
];

const ARENA_API = 'https://api.are.na/v2/channels/';

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
  // Fetch channel with a few blocks for the cover image
  const res = await fetch(`${ARENA_API}${slug}?per=8`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getChannelThumb(channel) {
  // Find first block with an image
  if (!channel.contents) return null;
  for (const block of channel.contents) {
    if (block.image && block.image.display && block.image.display.url) {
      return block.image.display.url;
    }
  }
  return null;
}

function renderChannelCard(channel, slug, label) {
  const thumb = getChannelThumb(channel);
  const count = channel.length || 0;
  const url = `channel.html?slug=${encodeURIComponent(slug)}`;

  const thumbHtml = thumb
    ? `<img src="${thumb}" alt="${label}" loading="lazy" />`
    : `<span class="channel-card-thumb-placeholder">—</span>`;

  return `
    <a href="${url}" class="channel-card">
      <div class="channel-card-thumb">${thumbHtml}</div>
      <div class="channel-card-body">
        <h2 class="channel-card-title">${label || channel.title}</h2>
        <p class="channel-card-meta">${count} block${count !== 1 ? 's' : ''}</p>
      </div>
    </a>
  `;
}

async function initChannels() {
  const grid = document.getElementById('channels-grid');
  if (!grid) return;

  // Show skeletons
  grid.innerHTML = `<div class="skeleton-grid" style="padding:0;max-width:100%">${skeletonCards(ARENA_CHANNELS.length)}</div>`;

  try {
    const results = await Promise.allSettled(
      ARENA_CHANNELS.map(({ slug }) => fetchChannelPreview(slug))
    );

    const cards = results.map((result, i) => {
      const { slug, label } = ARENA_CHANNELS[i];
      if (result.status === 'fulfilled') {
        return renderChannelCard(result.value, slug, label);
      } else {
        return `
          <a href="channel.html?slug=${encodeURIComponent(slug)}" class="channel-card">
            <div class="channel-card-thumb"><span class="channel-card-thumb-placeholder">—</span></div>
            <div class="channel-card-body">
              <h2 class="channel-card-title">${label}</h2>
              <p class="channel-card-meta">—</p>
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
