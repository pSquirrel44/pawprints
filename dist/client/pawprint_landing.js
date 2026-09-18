// Pawprint Network landing page interactivity.
//
// This used to live in an inline <script> block with onclick="..." attributes
// on every button. The server sends a strict Content-Security-Policy header
// (script-src 'self' ...; script-src-attr 'none') that blocks BOTH inline
// <script> tags and inline onclick attributes — so none of it ever ran, and
// every button on this page silently did nothing. Moving the code to this
// external, same-origin file (allowed by script-src 'self') and swapping
// onclick="..." for data-page="..." + addEventListener fixes that while
// keeping the strict CSP in place.

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  observeReveals();
}

// Scroll reveal
function observeReveals() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

function wirePageButtons() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.getAttribute('data-page'));
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  observeReveals();
  wirePageButtons();
});
