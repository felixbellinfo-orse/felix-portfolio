// ============================================================
// TICKER — typewriter effect for two Are.na channels
// ============================================================

const TICKER_CHANNELS = {
  working: 'currently-working-on-zw5gap1hceo',
  wantTo:  'would-like-to-work-on',  // ← replace with your slug when ready
};

const ARENA_API = 'https://api.are.na/v2/channels/';
const PLACEHOLDER = 'would-like-to-work-on';

const TYPE_SPEED   = 55;  // ms per character typed
const DELETE_SPEED = 30;  // ms per character deleted
const PAUSE_AFTER  = 2400; // ms to wait after fully typed
const PAUSE_BEFORE = 400;  // ms to wait before typing next item

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typewriter(el, items) {
  if (!items.length) return;
  let i = 0;

  while (true) {
    const text = items[i % items.length];

    // Type out
    for (let c = 0; c <= text.length; c++) {
      el.textContent = text.slice(0, c);
      await sleep(TYPE_SPEED);
    }

    await sleep(PAUSE_AFTER);

    // Delete — but only if there's more than one item
    if (items.length > 1) {
      for (let c = text.length; c >= 0; c--) {
        el.textContent = text.slice(0, c);
        await sleep(DELETE_SPEED);
      }
      await sleep(PAUSE_BEFORE);
    }

    i++;
  }
}

function showRow(rowEl, textEl, items) {
  if (items.length > 0) {
    rowEl.style.display = 'flex';
    typewriter(textEl, items);
    return true;
  } else {
    rowEl.style.display = 'none';
    return false;
  }
}

async function initTickers() {
  const tickerBar  = document.getElementById('ticker-bar');
  const workingRow = document.querySelector('.ticker-row--working');
  const wantRow    = document.querySelector('.ticker-row--want');
  const workingEl  = document.getElementById('ticker-working');
  const wantEl     = document.getElementById('ticker-want');

  if (!tickerBar) return;

  const [workingItems, wantItems] = await Promise.all([
    fetchTextBlocks(TICKER_CHANNELS.working),
    TICKER_CHANNELS.wantTo === PLACEHOLDER ? Promise.resolve([]) : fetchTextBlocks(TICKER_CHANNELS.wantTo),
  ]);

  const hasWorking = showRow(workingRow, workingEl, workingItems);
  const hasWant    = showRow(wantRow, wantEl, wantItems);

  if (hasWorking || hasWant) {
    tickerBar.removeAttribute('style');
    tickerBar.style.opacity = '1';
  }
}

document.addEventListener('DOMContentLoaded', initTickers);
