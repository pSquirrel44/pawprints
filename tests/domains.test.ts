import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { getAppBrand, isCorporateDomain, isLandingDomain } from '../server/domains';

test('each domain maps to exactly one site', () => {
  assert.equal(isCorporateDomain('pawprintsnetwork.com'), true);
  assert.equal(isCorporateDomain('WWW.PawprintsNetwork.com'), true);
  assert.equal(isCorporateDomain('instameow.app'), false);
  assert.equal(isCorporateDomain('instawoof.app'), false);

  assert.equal(getAppBrand('instameow.app'), 'cat');
  assert.equal(getAppBrand('www.instameow.app'), 'cat');
  assert.equal(getAppBrand('instawoof.app'), 'dog');
  assert.equal(getAppBrand('www.instawoof.app'), 'dog');
  assert.equal(getAppBrand('pawprintsnetwork.com'), null);
  assert.equal(getAppBrand('pawprints-ryn4.onrender.com'), null);
  assert.equal(getAppBrand('localhost'), null);

  assert.equal(isLandingDomain('pawprintsnetwork.com'), true);
  assert.equal(isLandingDomain('instameow.app'), true);
  assert.equal(isLandingDomain('localhost'), false);
});

test('generated landing pages contain only their own brand', () => {
  const root = process.cwd();
  execFileSync(process.execPath, [join(root, 'scripts', 'build-landings.cjs')], { stdio: 'pipe' });

  const cat = readFileSync(join(root, 'public', 'landing-cat.html'), 'utf8');
  const dog = readFileSync(join(root, 'public', 'landing-dog.html'), 'utf8');

  assert.match(cat, /The Catwalk/);
  assert.doesNotMatch(cat, /instawoof|The Dog Park|page-dog|page-parent/);
  assert.match(dog, /The Dog Park/);
  assert.doesNotMatch(dog, /instameow|The Catwalk|page-cat|page-parent/);

  for (const html of [cat, dog]) {
    assert.match(html, /https:\/\/pawprintsnetwork\.com\/privacy\.html/);
    assert.match(html, /https:\/\/pawprintsnetwork\.com\/terms\.html/);
    assert.doesNotMatch(html, /\?app=/);
    assert.doesNotMatch(html, /data-show-page/);
  }
});
