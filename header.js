// ============================================================
// SHARED HEADER — edit here to update across all pages
// ============================================================

const HEADER_INFO = {
  name:     'Felix Bell',
  tagline:  'Sound & Space',
  location: 'Rotterdam',
  phone:    '+31 6 8785 1523',
  email:    'felixbell.info@gmail.com',
};

(function injectHeader() {
  const el = document.querySelector('.site-header');
  if (!el) return;

  el.innerHTML = `
    <a href="index.html" class="info-item info-name">${HEADER_INFO.name}</a>
    <span class="info-item info-tagline">${HEADER_INFO.tagline}</span>
    <span class="info-item info-location">${HEADER_INFO.location}</span>
    <span class="info-item info-phone">${HEADER_INFO.phone}</span>
    <a href="mailto:${HEADER_INFO.email}" class="info-item info-email">${HEADER_INFO.email}</a>
    <div class="info-right">
      <a href="about.html" class="info-item info-about">About</a>
      <button data-theme-toggle aria-label="Switch theme" class="theme-toggle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  `;
})();
