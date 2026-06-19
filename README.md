# Felix Bell — Portfolio

Personal portfolio site pulling content live from [Are.na](https://www.are.na/felix-bell).

Built with plain HTML, CSS, and JavaScript — no build step, no dependencies.

---

## How it works

The site reads from Are.na's public API. Each Are.na channel becomes a page on the site. Blocks in a channel are displayed as a mosaic grid — images, links, text.

---

## Controlling block layout from Are.na

You can control how any block appears on the site by adding directives to its **description** field on Are.na (the text area below the title on a block's page).

### Layout

```
layout: full
```
Spans all 4 columns — good for a hero image or wide panorama.

```
layout: full contain
```
Spans all 4 columns, image sits centred with padding around it (not cropped). Good for portrait images or diagrams.

```
layout: half
```
2 columns × 2 rows.

```
layout: quarter
```
1 column × 1 row. This is the default.

```
layout: tall
```
1 column × 2 rows. Good for portrait images.

### Combining with contain

You can add `contain` to any layout to stop the image being cropped:

```
layout: half contain
```

Without `contain`, images fill the cell edge-to-edge (`object-fit: cover`).  
With `contain`, the full image is shown with padding inside the cell.

### Disabling the lightbox

```
permalink: false
```

By default, clicking an image opens it full-screen. Add this to disable that — useful for hero or decorative images.

### Combining directives

Write each directive on its own line:

```
layout: full contain
permalink: false
```

---

## Default behaviour (no directives)

Everything is **1 column × 1 row** by default. Use `layout:` directives to make anything bigger.

---

## Choosing a thumbnail for a channel card

By default the first image in a channel is used as the card thumbnail on the index page. To pick a specific image, go to that block on Are.na, open its description field, and add:

```
thumbnail: true
```

Only one block per channel needs this.

---

## Adding channel info (Role / With)

To show Role and With on a channel card, go to the **channel's own description** on Are.na and add:

```
role: Sound Engineer
with: V&A
```

Each on its own line. These appear below the title on the index card.

---

## Adding channels

Open `channels.js` and add entries to the `ARENA_CHANNELS` array:

```js
const ARENA_CHANNELS = [
  {
    slug: 'soundsystem-yu-vopqlbgg',
    label: 'soundsystem',
    tags: ['sound', 'installation'],
  },
  {
    slug: 'your-new-channel-slug',
    label: 'your label',
    tags: ['sound'],
  },
];
```

- **slug** — the last part of your Are.na channel URL (`are.na/felix-bell/my-channel` → `my-channel`)
- **label** — what you want it called on the site
- **tags** — filter button labels (any words you choose)

---

## Day-to-day workflow

### Pull (get latest from GitHub before editing)

```bash
git pull
```

Always do this first before making changes, especially if you've edited on another machine.

### Push (send your changes to GitHub)

```bash
git add .
git commit -m "describe what you changed"
git push
```

The site updates at [felixbellinfo-orse.github.io/felix-portfolio](https://felixbellinfo-orse.github.io/felix-portfolio/) within about a minute.

### If your local files are out of date and you want to force-reset to GitHub

```bash
git fetch origin && git reset --hard origin/main
```

Warning — this overwrites any local changes you haven't pushed yet.

---

## Local preview

```bash
npm start     # starts local server at http://localhost:3000
```

If you get "address already in use":

```bash
kill $(lsof -t -i:3000) && npm start
```

---

## Editing the header

Open `header.js` — change any value in the `HEADER_INFO` object at the top. It updates across all pages automatically.

```js
const HEADER_INFO = {
  name:     'Felix Bell',
  tagline:  'Sound & Space',
  location: 'Rotterdam',
  phone:    '+31 6 1234 5678',
  email:    'felixbell.info@gmail.com',
};
```

---

## File structure

```
index.html      — home page, lists all channels
channel.html    — single channel view, shows all blocks
about.html      — about page
style.css       — all styles
header.js       — shared header (edit here to update all pages)
channels.js     — fetches and renders the channel index
channel.js      — fetches and renders a single channel's blocks
ticker.js       — scrolling ticker bar (Are.na text blocks)
theme.js        — light/dark mode toggle
server.js       — local dev server (proxies Are.na API)
README.md       — this file
```

---

## Hosting

Site is live at [felixbellinfo-orse.github.io/felix-portfolio](https://felixbellinfo-orse.github.io/felix-portfolio/)

To re-deploy: push to `main` — GitHub Pages rebuilds automatically.
