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
Spans 2 columns.

```
layout: quarter
```
1 column. This is the default — you only need to write this if you want to override an auto-hero.

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

If a block has no description directives:

- **First image** in the channel → automatically full width (hero)
- **Every 7th image** → half width (for rhythm)
- **All other images** → 1 column
- **Text blocks** → always full width
- **Channel blocks** → 1 column

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

```bash
git pull                        # get latest before editing
# make your changes in VS Code
git add .
git commit -m "describe change"
git push                        # site updates in ~1 minute
```

---

## Local preview

```bash
npm start     # runs live-server, opens browser at localhost:8080
              # requires: npm install -g live-server (once only)
```

---

## File structure

```
index.html      — home page, lists all channels
channel.html    — single channel view, shows all blocks
about.html      — about page
style.css       — all styles
channels.js     — fetches and renders the channel index
channel.js      — fetches and renders a single channel's blocks
ticker.js       — scrolling ticker bar (Are.na text blocks)
theme.js        — light/dark mode toggle
README.md       — this file
```

---

## Hosting

Site is live at [felixbellinfo-orse.github.io/felix-portfolio](https://felixbellinfo-orse.github.io/felix-portfolio/)

To re-deploy: push to `main` — GitHub Pages rebuilds automatically.
