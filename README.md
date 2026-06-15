# Felix Bell — Portfolio

Personal portfolio site pulling content live from [Are.na](https://www.are.na/felix-bell).

Built with plain HTML, CSS, and JavaScript — no build step, no dependencies.

## How it works

The site reads from Are.na's public API. Each Are.na channel becomes a page on the site. Blocks in a channel are displayed as a masonry grid — images, links, videos, text.

## Adding channels

Open `channels.js` and add entries to the `ARENA_CHANNELS` array:

```js
const ARENA_CHANNELS = [
  { slug: 'soundsystem-yu-vopqlbgg', label: 'soundsystem' },
  { slug: 'your-new-channel-slug',   label: 'your label'  },
];
```

The slug is the last part of your Are.na channel URL — e.g. `are.na/felix-bell/my-channel` → slug is `my-channel`.

## Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `Deploy from a branch` → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/reponame`

## Structure

```
index.html      — home page, lists all channels
channel.html    — single channel view, shows all blocks
style.css       — all styles
channels.js     — fetches and renders the channel index
channel.js      — fetches and renders a single channel's blocks
theme.js        — light/dark mode toggle
README.md
```

## Local preview

Just open `index.html` in a browser. No server needed for local preview (Are.na API is CORS-friendly).
