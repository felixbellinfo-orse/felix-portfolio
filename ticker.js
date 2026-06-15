// ============================================================
// TICKER — fetches text blocks from two Are.na channels
// and renders two scrolling marquee rows.
//
// HOW TO USE:
// 1. Create two channels on Are.na (set to closed, not private)
// 2. Add text blocks — one item per block, e.g. "building a new subwoofer"
// 3. Paste the channel slugs below
// ============================================================

const TICKER_CHANNELS = {
  working: 'currently-working-on-zw5gap1hceo',
  wantTo:  'would-like-to-work-on',  // ← replace with your slug when ready
};

const ARENA_API = 'https://api.are.na/v2/channels/';
const SEPARATOR = '\u00a0\u00a0\u00a0\u2736\u00a0\u00a0\u00a0'; // ✶ with spacing
const PLACEHOLDER = 'would-like-to-work-on1';

async function fetchTextBlocks(slug) {
  try {
    const res = await fetch(`${ARENA_API}${slug}/contents?per=100&sort=position&direction=asc`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.contents || [])
      .filter(b => b.class === 'Text' && b.content && b.content.trim())
      .map(b => b.content.trim());
  } catch {
    return [];
  }
}

function buildTickerTrack(items) {
  const text = items.join(SEPARATOR) + SEPARATOR;
  // Duplicate for seamless loop
  return `<span class="ticker-track" aria-hidden="true">${text}</span><span class="ticker-track">${text}</span>`;
}

function showRow(rowEl, scrollEl, items) {
  if (items.length > 0) {
    scrollEl.innerHTML = buildTickerTrack(items);
    rowEl.style.display = 'flex';
    return true;
  } else {
    rowEl.style.display = 'none';
    return false;
  }
}

async function initTickers() {
  const tickerBar    = document.getElementById('ticker-bar');
  const workingRow   = document.querySelector('.ticker-row--working');
  const wantRow      = document.querySelector('.ticker-row--want');
  const workingScroll = document.getElementById('ticker-working');
  const wantScroll    = document.getElementById('ticker-want');

  if (!tickerBar) return;

  const [workingItems, wantItems] = await Promise.all([
    fetchTextBlocks(TICKER_CHANNELS.working),
    TICKER_CHANNELS.wantTo === PLACEHOLDER ? Promise.resolve([]) : fetchTextBlocks(TICKER_CHANNELS.wantTo),
  ]);

  const hasWorking = showRow(workingRow, workingScroll, workingItems);
  const hasWant    = showRow(wantRow, wantScroll, wantItems);

  if (hasWorking || hasWant) {
    tickerBar.removeAttribute('style'); // clear the display:none
    tickerBar.style.opacity = '1';
  }
}

document.addEventListener('DOMContentLoaded', initTickers);
