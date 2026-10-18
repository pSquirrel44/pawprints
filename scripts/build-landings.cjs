#!/usr/bin/env node
// Builds one standalone landing page per app domain from the shared design
// file public/pawprint_landing.html:
//   public/landing-cat.html  -> instameow.app  (The Catwalk only)
//   public/landing-dog.html  -> instawoof.app  (The Dog Park only)
//
// Each output contains ONLY its own brand page (no parent page, no link to the
// other app). Company info, privacy and terms live on pawprintsnetwork.com, so
// the footer links out to those pages there.
//
// Plain CommonJS on purpose: no ESM-only syntax (see scripts/preflight.cjs).

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const source = fs.readFileSync(path.join(__dirname, '..', 'landing-src', 'pawprint_landing.html'), 'utf8');

const PARENT = 'https://pawprintsnetwork.com';
const YEAR = new Date().getFullYear();

const brands = {
  cat: {
    out: 'landing-cat.html',
    title: 'The Catwalk | Social network for cats',
    description: 'The Catwalk is a social network for cats and the people who serve them.',
    name: 'The Catwalk',
    start: '<div id="page-cat" class="page">',
    end: '<div id="page-dog" class="page">',
  },
  dog: {
    out: 'landing-dog.html',
    title: 'The Dog Park | Social network for dogs',
    description: 'The Dog Park is a social network for dogs and their humans.',
    name: 'The Dog Park',
    start: '<div id="page-dog" class="page">',
    end: '<script src="/pawprint_landing.js"></script>',
  },
};

function slice(html, startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker, s + startMarker.length);
  if (s === -1 || e === -1) {
    throw new Error('build-landings: marker not found: ' + (s === -1 ? startMarker : endMarker));
  }
  return html.slice(s, e);
}

function build(key) {
  const b = brands[key];

  // Everything before the first page (head, styles, nav) and the closing tags.
  const head = source.slice(0, source.indexOf('<!-- ── NAV'));
  const nav = source.slice(source.indexOf('<!-- ── NAV'), source.indexOf('<!-- ═', source.indexOf('<!-- ── NAV')));

  let page = slice(source, b.start, b.end);

  // Show this page by default.
  page = page.replace('class="page"', 'class="page active"');

  // Remove the "← Back" button that led to the parent brand page.
  page = page.replace(/\s*<button[^>]*data-show-page="parent"[^>]*>[^<]*<\/button>/g, '');

  // Replace every footer with one that links to the parent company.
  const footer =
    '<footer class="site-footer">\n    © ' + YEAR + ' Pawprint Network LLC · ' +
    '<a href="' + PARENT + '">About</a> · ' +
    '<a href="' + PARENT + '/privacy.html">Privacy</a> · ' +
    '<a href="' + PARENT + '/terms.html">Terms</a> · ' +
    '<a href="/app">Open App</a>\n  </footer>';
  page = page.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/g, footer);

  // The app host decides the brand; do not pass ?app= (it can only mislead).
  page = page.replace(/\/app\?app=(cat|dog)/g, '/app');

  // Simple brand-only nav: this site's name on the left, a single app link on the right.
  const brandNav =
    '<nav class="nav">\n  <a href="/" class="nav-logo"><span>' + b.name + '</span></a>\n' +
    '  <div class="nav-links"><a class="nav-btn ' + key + '" href="/app">Open App</a></div>\n</nav>\n\n';

  let html = head
    .replace(/<title>[\s\S]*?<\/title>/, '<title>' + b.title + '</title>')
    .replace('</title>', '</title>\n<meta name="description" content="' + b.description + '">');

  html += brandNav + page + '\n<script src="/pawprint_landing.js"></script>\n</body>\n</html>\n';

  // Drop developer comments (CSS and HTML). They mention the other brand and
  // only add bytes. Safe here: no data URI or URL in this file contains "/*".
  html = html.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

  // Safety checks: the other brand and the parent deck must not leak through.
  const other = key === 'cat' ? 'dog' : 'cat';
  const forbidden = [
    'id="page-' + other + '"',
    'id="page-parent"',
    other === 'dog' ? 'instawoof' : 'instameow',
    brands[other].name,
  ];
  for (const f of forbidden) {
    if (html.indexOf(f) !== -1) {
      throw new Error('build-landings: "' + f + '" leaked into ' + b.out);
    }
  }
  if (html.indexOf('data-show-page') !== -1) {
    throw new Error('build-landings: leftover data-show-page link in ' + b.out);
  }

  fs.writeFileSync(path.join(publicDir, b.out), html);
  console.log('✅ ' + b.out + ' (' + Math.round(html.length / 1024) + ' KB)');
}

build('cat');
build('dog');
