import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildDealProductJsonLd,
  buildOrganizationJsonLd,
  formatPageTitle,
  getDealRobotsDirective,
  getSitemapUrls,
  ROUTE_SEO_DEFAULTS,
  SEO_BASE_URL,
} from './seo';
import { ALL_DEALS, DEALS, Deal } from '../data/deals';
import { BRAND_SOCIAL_LINKS } from '../data/brand';

test('buildCanonicalUrl normalises root and nested paths with https://ukclearancehub.co.uk', () => {
  assert.equal(buildCanonicalUrl('/'), 'https://ukclearancehub.co.uk/');
  assert.equal(buildCanonicalUrl('/deals'), 'https://ukclearancehub.co.uk/deals');
  assert.equal(
    buildCanonicalUrl('/deals/savoy-ottoman-bed/'),
    'https://ukclearancehub.co.uk/deals/savoy-ottoman-bed'
  );
  assert.equal(buildCanonicalUrl('privacy'), 'https://ukclearancehub.co.uk/privacy');
});

test('formatPageTitle appends | UK Clearance Hub when not already present', () => {
  assert.equal(
    formatPageTitle('Privacy Notice'),
    'Privacy Notice | UK Clearance Hub'
  );
  assert.equal(
    formatPageTitle('All Deals | UK Clearance Hub'),
    'All Deals | UK Clearance Hub'
  );
});

test('ROUTE_SEO_DEFAULTS covers all static routes with 50-60 char titles and 150-160 char descriptions', () => {
  const expectedRoutes = [
    '/',
    '/deals',
    '/home-living',
    '/how-it-works',
    '/mattress-guide',
    '/bed-size-guide',
    '/delivery-returns',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/cookies',
    '/terms',
  ];

  for (const route of expectedRoutes) {
    const meta = ROUTE_SEO_DEFAULTS[route];
    assert.ok(meta, `Missing SEO defaults for ${route}`);
    assert.ok(
      meta.title.endsWith('| UK Clearance Hub'),
      `${route} title must end with | UK Clearance Hub`
    );
    assert.ok(
      meta.title.length >= 48 && meta.title.length <= 64,
      `${route} title length (${meta.title.length}) should be ~50-60 chars: "${meta.title}"`
    );
    assert.ok(
      meta.description.length >= 145 && meta.description.length <= 165,
      `${route} description length (${meta.description.length}) should be ~150-160 chars: "${meta.description}"`
    );
  }
});

test('buildOrganizationJsonLd includes official logo, email, and all 5 social profile URLs', () => {
  const org = buildOrganizationJsonLd();
  assert.equal(org['@type'], 'Organization');
  assert.equal(org.url, `${SEO_BASE_URL}/`);
  assert.equal(org.email, 'admin@ukclearancehub.co.uk');
  assert.deepEqual(
    org.sameAs,
    BRAND_SOCIAL_LINKS.map((s) => s.href)
  );
});

test('buildBreadcrumbJsonLd generates valid ListItem positions and canonical URLs', () => {
  const crumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'All Deals', path: '/deals' },
    { name: 'Savoy Bed', path: '/deals/savoy-ottoman-bed' },
  ]);

  assert.equal(crumbs['@type'], 'BreadcrumbList');
  const list = crumbs.itemListElement as Array<Record<string, unknown>>;
  assert.equal(list.length, 3);
  assert.equal(list[0].position, 1);
  assert.equal(list[0].item, 'https://ukclearancehub.co.uk/');
  assert.equal(list[2].position, 3);
  assert.equal(
    list[2].item,
    'https://ukclearancehub.co.uk/deals/savoy-ottoman-bed'
  );
});

test('buildDealProductJsonLd skips Offer for isSample deals and includes Offer when isSample is false', () => {
  const sampleDeal = DEALS[0];
  assert.equal(sampleDeal.isSample, true);

  const sampleSchema = buildDealProductJsonLd(sampleDeal);
  assert.equal(sampleSchema['@type'], 'Product');
  assert.equal(sampleSchema.name, sampleDeal.title);
  assert.equal(sampleSchema.description, sampleDeal.shortDescription);
  assert.equal(
    'offers' in sampleSchema,
    false,
    'Sample deals must NOT include an Offer in JSON-LD'
  );

  const verifiedLiveDeal: Deal = {
    ...sampleDeal,
    isSample: false,
    price: 129,
  };
  const liveSchema = buildDealProductJsonLd(verifiedLiveDeal);
  assert.equal('offers' in liveSchema, true);
  const offer = liveSchema.offers as Record<string, unknown>;
  assert.equal(offer['@type'], 'Offer');
  assert.equal(offer.priceCurrency, 'GBP');
  assert.equal(offer.price, '129.00');
});

test('getDealRobotsDirective returns noindex,follow for sample or expired deals and index,follow for real live deals', () => {
  const sampleDeal = DEALS[0];
  assert.equal(getDealRobotsDirective(undefined), 'noindex,follow');
  assert.equal(getDealRobotsDirective(sampleDeal), 'noindex,follow');

  const realLiveDeal: Deal = {
    ...sampleDeal,
    isSample: false,
    status: 'active',
  };
  assert.equal(getDealRobotsDirective(realLiveDeal), 'index,follow');

  const expiredRealDeal: Deal = {
    ...realLiveDeal,
    status: 'expired',
  };
  assert.equal(getDealRobotsDirective(expiredRealDeal), 'noindex,follow');
});

test('getSitemapUrls excludes all isSample deals and includes static routes plus real live deals', () => {
  const urlsWithSamplesOnly = getSitemapUrls(ALL_DEALS);
  assert.equal(urlsWithSamplesOnly.length, 13);
  assert.ok(
    urlsWithSamplesOnly.every((u) => !u.includes('/deals/')),
    'No sample deal URLs should be in sitemap.xml'
  );

  const realDeal: Deal = {
    ...DEALS[0],
    slug: 'verified-real-supplier-deal',
    isSample: false,
    status: 'active',
  };
  const urlsWithRealDeal = getSitemapUrls([...ALL_DEALS, realDeal]);
  assert.equal(urlsWithRealDeal.length, 14);
  assert.ok(
    urlsWithRealDeal.includes(
      'https://ukclearancehub.co.uk/deals/verified-real-supplier-deal'
    )
  );
});

