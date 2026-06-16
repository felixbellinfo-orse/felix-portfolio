// ============================================================
// TICKER — fetches text blocks from two Are.na channels
// and renders two seamlessly scrolling rows.
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
const PLACEHOLDER = ''; // no placeholder — both channels are live
const SPEED = 60; // pixels per second — increase to scroll faster

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
  return `<span class="ticker-track">${text}${text}</span>`;
}

function startScroll(scrollEl) {
  const track = scrollEl.querySelector('.ticker-track');
  if (!track) return;

  requestAnimationFrame(() => {
    const fullWidth = track.scrollWidth / 2;
    let x = 0;
    let last = null;

    function step(ts) {
      if (last === null) last = ts;
      const delta = (ts - last) / 1000;
      last = ts;

      x -= SPEED * delta;
      if (x <= -fullWidth) x += fullWidth;

      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

function showRow(rowEl, scrollEl, items) {
  if (items.length > 0) {
    scrollEl.innerHTML = buildTickerTrack(items);
    rowEl.style.visibility = 'visible';
    rowEl.style.flex = '1';
    startScroll(scrollEl);
    return true;
  } else {
    rowEl.style.visibility = 'hidden';
    rowEl.style.flex = '0';
    rowEl.style.overflow = 'hidden';
    rowEl.style.minWidth = '0';
    rowEl.style.maxWidth = '0';
    return false;
  }
}

async function initTickers() {
  const tickerBar     = document.getElementById('ticker-bar');
  const workingRow    = document.querySelector('.ticker-row--working');
  const wantRow       = document.querySelector('.ticker-row--want');
  const workingScroll = document.getElementById('ticker-working');
  const wantScroll    = document.getElementById('ticker-want');

  if (!tickerBar) return;

  const [workingItems, wantItems] = await Promise.all([
    fetchTextBlocks(TICKER_CHANNELS.working),
    fetchTextBlocks(TICKER_CHANNELS.wantTo),
  ]);

  const hasWorking = showRow(workingRow, workingScroll, workingItems);
  const hasWant    = showRow(wantRow, wantScroll, wantItems);

  if (hasWorking || hasWant) {
    tickerBar.style.display = 'flex';
    tickerBar.style.opacity = '1';
  }
}

document.addEventListener('DOMContentLoaded', initTickers);
