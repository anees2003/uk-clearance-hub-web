import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_NAV_LINKS,
  FOOTER_COLUMNS,
  formatBedSlugTitle,
  computeHeaderVisibility,
  validateNewsletterEmail,
} from './navigation';
import {
  BRAND_LOGO_URL,
  BRAND_ICON_URL,
  BRAND_EMAIL,
  BRAND_WHATSAPP_URL,
  BRAND_SOCIAL_LINKS,
  buildDealsSearchUrl,
} from './brand';

test('HEADER_NAV_LINKS contains the 4 Step 9 UK Clearance Hub category items', () => {
  const labels = HEADER_NAV_LINKS.map((item) => item.label);
  assert.deepEqual(labels, [
    'Electronics & Gadgets',
    'Home Appliances',
    'Home & Living',
    'All Deals',
  ]);
});

test('FOOTER_COLUMNS contains Shop, Help, and Legal link columns', () => {
  const titles = FOOTER_COLUMNS.map((col) => col.title);
  assert.deepEqual(titles, ['Shop', 'Help', 'Legal']);
});

test('Brand constants match official UK Clearance Hub URLs and contacts', () => {
  assert.equal(
    BRAND_LOGO_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo.png'
  );
  assert.equal(
    BRAND_ICON_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-icon.png'
  );
  assert.equal(BRAND_EMAIL, 'admin@ukclearancehub.co.uk');
  assert.equal(BRAND_WHATSAPP_URL, 'https://wa.me/447344540043');
  assert.equal(BRAND_SOCIAL_LINKS.length, 5);
});

test('buildDealsSearchUrl builds clean /deals?q=... URLs', () => {
  assert.equal(buildDealsSearchUrl(''), '/deals');
  assert.equal(buildDealsSearchUrl('  '), '/deals');
  assert.equal(buildDealsSearchUrl('ottoman bed'), '/deals?q=ottoman%20bed');
});

test('formatBedSlugTitle converts URL slugs to editorial title case', () => {
  assert.equal(formatBedSlugTitle('savoy-ottoman-bed'), 'Savoy Ottoman Bed');
  assert.equal(formatBedSlugTitle('cotswold-oak-bed'), 'Cotswold Oak Bed');
  assert.equal(formatBedSlugTitle(''), 'Signature Bed Collection');
});

test('computeHeaderVisibility hides header on scroll down past threshold and shows on scroll up', () => {
  assert.equal(computeHeaderVisibility(20, 0, false), false);
  assert.equal(computeHeaderVisibility(180, 100, false), true);
  assert.equal(computeHeaderVisibility(120, 180, true), false);
  assert.equal(computeHeaderVisibility(122, 120, false), false);
});

test('validateNewsletterEmail validates empty and malformed emails', () => {
  assert.equal(validateNewsletterEmail('').valid, false);
  assert.equal(validateNewsletterEmail('not-an-email').valid, false);
  assert.equal(validateNewsletterEmail('client@ukclearancehub.co.uk').valid, true);
});
