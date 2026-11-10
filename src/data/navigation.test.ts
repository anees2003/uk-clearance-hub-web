import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_NAV_LINKS,
  FOOTER_COLUMNS,
  formatBedSlugTitle,
  computeHeaderVisibility,
  validateNewsletterEmail,
} from './navigation';

test('HEADER_NAV_LINKS contains the 6 required UK Clearance Hub navigation items', () => {
  const labels = HEADER_NAV_LINKS.map((item) => item.label);
  assert.deepEqual(labels, [
    'Clearance Deals',
    'Beds',
    'Mattress Guide',
    'Size Guide',
    'About',
    'Contact',
  ]);
});

test('FOOTER_COLUMNS contains Shop, Help, and Company link columns', () => {
  const titles = FOOTER_COLUMNS.map((col) => col.title);
  assert.deepEqual(titles, ['Shop', 'Help', 'Company']);
});

test('formatBedSlugTitle converts URL slugs to editorial title case', () => {
  assert.equal(formatBedSlugTitle('savoy-ottoman-bed'), 'Savoy Ottoman Bed');
  assert.equal(formatBedSlugTitle('cotswold-oak-bed'), 'Cotswold Oak Bed');
  assert.equal(formatBedSlugTitle(''), 'Signature Bed Collection');
});

test('computeHeaderVisibility hides header on scroll down past threshold and shows on scroll up', () => {
  // Near top of page -> always visible (hidden = false)
  assert.equal(computeHeaderVisibility(20, 0, false), false);
  // Scrolling down past threshold -> hidden = true
  assert.equal(computeHeaderVisibility(180, 100, false), true);
  // Scrolling up -> hidden = false
  assert.equal(computeHeaderVisibility(120, 180, true), false);
  // Micro-scroll smaller than delta -> retains previous state
  assert.equal(computeHeaderVisibility(122, 120, false), false);
});

test('validateNewsletterEmail validates empty and malformed emails', () => {
  assert.equal(validateNewsletterEmail('').valid, false);
  assert.equal(validateNewsletterEmail('not-an-email').valid, false);
  assert.equal(validateNewsletterEmail('client@ukclearancehub.co.uk').valid, true);
});
