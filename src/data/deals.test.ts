import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DEALS,
  DEALS,
  DEAL_CATEGORIES,
  DEAL_CONDITIONS,
  MAX_DEAL_PRICE,
  buildDealOutboundUrl,
  computeBedSizeZOffsets,
  filterAndSortDeals,
  formatGBP,
  getDealBySlug,
  getRelatedDeals,
  getSavingPercent,
  isDealLive,
  isValidDealUrl,
  parseDealFilterQueryParams,
  serializeDealFilterQueryParams,
} from './deals';
import { SUPPLIERS, getSupplierById } from './suppliers';
import {
  buildDirectWhatsAppDealUrl,
  buildModalMailtoUrl,
  buildModalWhatsAppUrl,
  containsInternalIdInText,
  generateLeadId,
  getOrInitSourceChannel,
  isValidLeadId,
  resolveSourceChannelFromLocation,
  validateDealEnquiry,
} from './leadFlow';

test('SUPPLIERS defines 3 sample UK suppliers and DEALS defines 18 live sample deals (6 per category)', () => {
  assert.equal(SUPPLIERS.length, 3);
  assert.ok(getSupplierById('SUP-001'));
  assert.ok(getSupplierById('SUP-002'));
  assert.ok(getSupplierById('SUP-003'));

  assert.equal(DEALS.length, 18);

  for (const cat of DEAL_CATEGORIES) {
    const inCategory = DEALS.filter((d) => d.category === cat);
    assert.equal(
      inCategory.length,
      6,
      `Expected 6 live sample deals in ${cat}, got ${inCategory.length}`
    );
  }

  for (const deal of DEALS) {
    assert.match(deal.id, /^UKCH-P-\d{4}$/);
    assert.ok(DEAL_CONDITIONS.includes(deal.condition));
    assert.equal(deal.isSample, true);
    assert.equal(deal.dealUrl, undefined);
    assert.ok(getSupplierById(deal.supplierId));
  }
});

test('getSavingPercent returns null unless referencePrice exists AND priceVerified is true', () => {
  // Verified reference price -> returns rounded saving percentage
  assert.equal(
    getSavingPercent({ price: 89, referencePrice: 219, priceVerified: true }),
    59
  );
  assert.equal(
    getSavingPercent({ price: 699, referencePrice: 1599, priceVerified: true }),
    56
  );

  // Unverified reference price -> must return null
  assert.equal(
    getSavingPercent({ price: 199, referencePrice: 329, priceVerified: false }),
    null
  );

  // Missing reference price -> must return null
  assert.equal(
    getSavingPercent({ price: 64, referencePrice: undefined, priceVerified: true }),
    null
  );

  // Price >= referencePrice -> must return null
  assert.equal(
    getSavingPercent({ price: 250, referencePrice: 200, priceVerified: true }),
    null
  );
});

test('formatGBP formats whole and fractional GBP amounts accurately', () => {
  assert.equal(formatGBP(699), '£699');
  assert.equal(formatGBP(1599), '£1,599');
  assert.equal(formatGBP(64.5), '£64.50');
});

test('isDealLive, getDealBySlug, and getRelatedDeals handle active, expired, and unavailable deals', () => {
  const activeDeal = getDealBySlug('savoy-ottoman-bed');
  assert.ok(activeDeal);
  assert.equal(isDealLive(activeDeal), true);

  const expiredDeal = getDealBySlug('ashford-upholstered-bed');
  assert.ok(expiredDeal);
  assert.equal(expiredDeal.status, 'expired');
  assert.equal(isDealLive(expiredDeal), false);

  const unavailableDeal = getDealBySlug('kensington-wingback-bed');
  assert.ok(unavailableDeal);
  assert.equal(unavailableDeal.status, 'unavailable');
  assert.equal(isDealLive(unavailableDeal), false);

  // Future vs past expiresAt check on active deal
  const futureDate = new Date('2026-06-01T00:00:00.000Z');
  const pastDate = new Date('2026-08-01T00:00:00.000Z');
  const timedDeal = {
    ...activeDeal,
    expiresAt: '2026-07-01T00:00:00.000Z',
  };
  assert.equal(isDealLive(timedDeal, futureDate), true);
  assert.equal(isDealLive(timedDeal, pastDate), false);

  // getRelatedDeals never returns expired or unavailable deals
  const related = getRelatedDeals(expiredDeal, 6);
  assert.equal(related.length, 6);
  assert.ok(related.every((d) => isDealLive(d)));
  assert.ok(related.every((d) => d.id !== expiredDeal.id));
});

test('isValidDealUrl and buildDealOutboundUrl validate HTTPS and preserve existing query params', () => {
  assert.equal(isValidDealUrl(undefined), false);
  assert.equal(isValidDealUrl(''), false);
  assert.equal(isValidDealUrl('http://insecure.example.co.uk/deal'), false);
  assert.equal(isValidDealUrl('javascript:alert(1)'), false);
  assert.equal(
    isValidDealUrl('https://supplier.example.co.uk/product/123?sku=abc'),
    true
  );

  const outbound = buildDealOutboundUrl(
    'https://supplier.example.co.uk/product/123?sku=abc&color=oak#specs',
    'UKCH-20261111-7G9K',
    'Home & Living'
  );
  assert.ok(outbound);
  const parsed = new URL(outbound);
  assert.equal(parsed.origin, 'https://supplier.example.co.uk');
  assert.equal(parsed.pathname, '/product/123');
  assert.equal(parsed.searchParams.get('sku'), 'abc');
  assert.equal(parsed.searchParams.get('color'), 'oak');
  assert.equal(parsed.searchParams.get('utm_source'), 'ukclearancehub');
  assert.equal(parsed.searchParams.get('utm_medium'), 'referral');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'Home & Living');
  assert.equal(parsed.searchParams.get('ukch_ref'), 'UKCH-20261111-7G9K');
  assert.equal(parsed.hash, '#specs');

  assert.equal(
    buildDealOutboundUrl('http://insecure.example.co.uk', 'UKCH-20261111-ABCD'),
    null
  );
});

test('filterAndSortDeals filters by category, subcategory, condition, price, stock, verified savings, and search query', () => {
  // Always excludes expired/unavailable deals from ALL_DEALS
  const allLive = filterAndSortDeals(ALL_DEALS, {});
  assert.equal(allLive.length, 18);

  // Category filter
  const electronics = filterAndSortDeals(ALL_DEALS, {
    category: 'Electronics & Gadgets',
  });
  assert.equal(electronics.length, 6);

  // Subcategory filter
  const vacuums = filterAndSortDeals(ALL_DEALS, {
    subcategory: 'Cordless Vacuums',
  });
  assert.equal(vacuums.length, 1);
  assert.equal(vacuums[0].slug, 'vortexclean-v12-anti-tangle-cordless-vacuum');

  // Condition filter
  const graded = filterAndSortDeals(ALL_DEALS, {
    condition: 'Graded',
  });
  assert.ok(graded.length >= 3);
  assert.ok(graded.every((d) => d.condition === 'Graded'));

  // In stock only
  const inStock = filterAndSortDeals(ALL_DEALS, {
    inStockOnly: true,
  });
  assert.ok(inStock.every((d) => d.stockStatus === 'In stock'));

  // Verified savings only
  const verifiedOnly = filterAndSortDeals(ALL_DEALS, {
    verifiedSavingsOnly: true,
  });
  assert.ok(verifiedOnly.length > 0 && verifiedOnly.length < 18);
  assert.ok(verifiedOnly.every((d) => getSavingPercent(d) !== null));

  // Search query matching title, brand, category, subcategory, and highlights
  const searchLidar = filterAndSortDeals(ALL_DEALS, {
    q: 'LiDAR carpet',
  });
  assert.equal(searchLidar.length, 1);
  assert.equal(
    searchLidar[0].slug,
    'aerosweep-lidar-self-empty-robot-vacuum'
  );

  // Sorting: Biggest verified saving puts highest verified saving first
  const bySaving = filterAndSortDeals(ALL_DEALS, {
    sort: 'saving-desc',
  });
  const firstSaving = getSavingPercent(bySaving[0]) ?? -1;
  const lastSaving = getSavingPercent(bySaving[bySaving.length - 1]) ?? -1;
  assert.ok(firstSaving >= lastSaving);

  // Sorting: Price low to high
  const byPriceAsc = filterAndSortDeals(ALL_DEALS, {
    sort: 'price-asc',
  });
  assert.ok(byPriceAsc[0].price <= byPriceAsc[1].price);
});

test('parseDealFilterQueryParams and serializeDealFilterQueryParams round-trip cleanly', () => {
  const params = new URLSearchParams(
    'category=Home+Appliances&condition=Graded&minPrice=100&maxPrice=400&inStock=true&verified=true&sort=price-asc&q=fridge'
  );
  const parsed = parseDealFilterQueryParams(params);
  assert.equal(parsed.category, 'Home Appliances');
  assert.equal(parsed.condition, 'Graded');
  assert.equal(parsed.minPrice, 100);
  assert.equal(parsed.maxPrice, 400);
  assert.equal(parsed.inStockOnly, true);
  assert.equal(parsed.verifiedSavingsOnly, true);
  assert.equal(parsed.sort, 'price-asc');
  assert.equal(parsed.q, 'fridge');

  const serialized = serializeDealFilterQueryParams(parsed);
  assert.deepEqual(serialized, {
    category: 'Home Appliances',
    condition: 'Graded',
    minPrice: '100',
    maxPrice: '400',
    inStock: 'true',
    verified: 'true',
    sort: 'price-asc',
    q: 'fridge',
  });

  // Legacy category=Mattresses maps to Home & Living + subcategory=Mattresses
  const legacyParams = new URLSearchParams('category=Mattresses');
  const legacyParsed = parseDealFilterQueryParams(legacyParams);
  assert.equal(legacyParsed.category, 'Home & Living');
  assert.equal(legacyParsed.subcategory, 'Mattresses');
  assert.ok(MAX_DEAL_PRICE >= 699);
});

test('Lead ID generation, source channel resolution, enquiry validation, and outbound WhatsApp/Email links', () => {
  const fixedDate = new Date(2026, 10, 11); // 11 Nov 2026
  const leadId = generateLeadId(fixedDate, () => 0.1);
  assert.ok(isValidLeadId(leadId));
  assert.match(leadId, /^UKCH-20261111-[A-Z0-9]{4}$/);

  assert.equal(
    resolveSourceChannelFromLocation(
      '?utm_source=newsletter&utm_medium=email',
      ''
    ),
    'newsletter/email'
  );
  assert.equal(
    resolveSourceChannelFromLocation('', 'https://www.google.co.uk/search?q=deals'),
    'referrer:google.co.uk'
  );
  assert.equal(resolveSourceChannelFromLocation('', ''), 'direct');

  // Session storage persistence
  const mockStore = new Map<string, string>();
  const storageAdapter = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
  };
  const ch1 = getOrInitSourceChannel(
    storageAdapter,
    '?utm_source=tiktok',
    ''
  );
  assert.equal(ch1, 'tiktok');
  const ch2 = getOrInitSourceChannel(storageAdapter, '', '');
  assert.equal(ch2, 'tiktok');

  // Enquiry validation
  const invalidEmpty = validateDealEnquiry({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'Email',
    message: '',
    consent: false,
  });
  assert.equal(invalidEmpty.valid, false);
  assert.ok(invalidEmpty.errors.name);
  assert.ok(invalidEmpty.errors.contact);
  assert.ok(invalidEmpty.errors.consent);

  const validWithPhoneOnly = validateDealEnquiry({
    name: 'Arthur Pendelton',
    email: '',
    phone: '07700 900123',
    preferredContact: 'WhatsApp',
    message: 'Is delivery available to York?',
    consent: true,
  });
  assert.equal(validWithPhoneOnly.valid, true);

  // WhatsApp & Email builders include Lead ID, product ID, and supplier ID in message payload
  const sampleDeal = DEALS[0];
  const ctx = {
    leadId: 'UKCH-20261111-AB12',
    deal: sampleDeal,
    pageUrl: `https://ukclearancehub.co.uk/deals/${sampleDeal.slug}`,
    sourceChannel: 'direct',
    submittedAtIso: '2026-11-11T14:00:00.000Z',
  };
  const form = {
    name: 'Arthur Pendelton',
    email: 'arthur@example.co.uk',
    phone: '07700 900123',
    preferredContact: 'WhatsApp' as const,
    message: 'Checking stock',
    consent: true,
  };

  const directWa = buildDirectWhatsAppDealUrl(ctx);
  assert.ok(directWa.startsWith('https://wa.me/447344540043?text='));
  assert.ok(decodeURIComponent(directWa).includes('UKCH-20261111-AB12'));
  assert.ok(decodeURIComponent(directWa).includes(sampleDeal.id));

  const modalWa = buildModalWhatsAppUrl(ctx, form);
  assert.ok(decodeURIComponent(modalWa).includes(sampleDeal.supplierId));
  assert.ok(decodeURIComponent(modalWa).includes('Referral Destination: none'));

  const mailto = buildModalMailtoUrl(ctx, form);
  assert.ok(mailto.startsWith('mailto:admin@ukclearancehub.co.uk?subject='));
  assert.ok(
    decodeURIComponent(mailto).includes(
      `Enquiry UKCH-20261111-AB12 – ${sampleDeal.title}`
    )
  );
  assert.ok(decodeURIComponent(mailto).includes(sampleDeal.supplierId));
});

test('containsInternalIdInText detects internal product and supplier IDs and confirms public fields are clean', () => {
  assert.equal(containsInternalIdInText('Product UKCH-P-0001'), true);
  assert.equal(containsInternalIdInText('Supplier SUP-002'), true);
  assert.equal(
    containsInternalIdInText('Reference Lead ID: UKCH-20261111-9F4A'),
    false
  );

  // Verify no public-facing Deal field (title, brand, shortDescription, description, highlights, supplierName) contains internal IDs
  for (const deal of ALL_DEALS) {
    const publicText = [
      deal.title,
      deal.brand,
      deal.category,
      deal.subcategory,
      deal.shortDescription,
      deal.description,
      deal.supplierName,
      deal.delivery,
      deal.deliveredBy,
      deal.conditionNote ?? '',
      ...deal.highlights,
      ...Object.keys(deal.specs),
      ...Object.values(deal.specs),
    ].join(' ');
    assert.equal(
      containsInternalIdInText(publicText),
      false,
      `Deal ${deal.slug} leaked an internal ID in public text`
    );
  }

  const zOffsets = computeBedSizeZOffsets(1.16, 0, 0.95, -1.35, 1.35);
  assert.equal(zOffsets.scaleZMultiplier, 1.16);
  assert.ok(zOffsets.leftDeltaZ < 0);
  assert.ok(zOffsets.rightDeltaZ > 0);
});
