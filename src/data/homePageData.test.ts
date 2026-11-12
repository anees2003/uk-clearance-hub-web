import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_CAROUSEL_SLIDES,
  HERO_SEARCH_SUGGESTION_CHIPS,
  TRUST_STRIP_ITEMS,
  computeCategoryTileStats,
  getFeaturedClearanceDeals,
  getNewestLiveDeals,
  getLiveHomeLivingDeals,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_DISCLOSURE,
  PRODUCT_CONDITION_GUIDE_CARDS,
  HOME_LIVING_GUIDE_CARDS,
  doesRouteWaitFor3DModel,
  wrapSlideIndex,
} from './homePageData';
import { ALL_DEALS, getSavingPercent, isDealLive } from './deals';
import { resolveContactTopicFromQuery } from './informativePages';

test('HERO_CAROUSEL_SLIDES defines the 3 required slides and destination links', () => {
  assert.equal(HERO_CAROUSEL_SLIDES.length, 3);
  assert.deepEqual(
    HERO_CAROUSEL_SLIDES.map((s) => ({
      headline: s.headline,
      to: s.primaryCta.to,
      visualType: s.visualType,
    })),
    [
      {
        headline: 'Clearance deals on top tech',
        to: '/deals?category=Electronics%20%26%20Gadgets',
        visualType: 'deals',
      },
      {
        headline: 'Home appliances for less',
        to: '/deals?category=Home%20Appliances',
        visualType: 'deals',
      },
      {
        headline: 'Build your bedroom for less',
        to: '/home-living',
        visualType: '3d-bed',
      },
    ]
  );
});

test('HERO_SEARCH_SUGGESTION_CHIPS and TRUST_STRIP_ITEMS match Step 11 spec', () => {
  assert.deepEqual(
    HERO_SEARCH_SUGGESTION_CHIPS.map((c) => c.label),
    ['Air fryer', 'Headphones', 'Washing machine', 'Mattress', 'TV']
  );
  assert.deepEqual(
    TRUST_STRIP_ITEMS.map((t) => t.title),
    [
      'Genuine clearance deals',
      'Trusted UK suppliers',
      'Delivery handled by suppliers',
      'Enquire on WhatsApp',
    ]
  );
});

test('computeCategoryTileStats computes live counts and lowest prices from real deals', () => {
  const tiles = computeCategoryTileStats(ALL_DEALS);
  assert.equal(tiles.length, 4);

  assert.deepEqual(
    tiles.map((t) => ({
      title: t.title,
      to: t.to,
      liveCount: t.liveCount,
      fromPriceLabel: t.fromPriceLabel,
    })),
    [
      {
        title: 'Electronics & Gadgets',
        to: '/deals?category=Electronics%20%26%20Gadgets',
        liveCount: 6,
        fromPriceLabel: 'From £64',
      },
      {
        title: 'Home Appliances',
        to: '/deals?category=Home%20Appliances',
        liveCount: 6,
        fromPriceLabel: 'From £69',
      },
      {
        title: 'Home & Living',
        to: '/home-living',
        liveCount: 6,
        fromPriceLabel: 'From £149',
      },
      {
        title: 'All Deals',
        to: '/deals',
        liveCount: 18,
        fromPriceLabel: 'From £64',
      },
    ]
  );
});

test('getFeaturedClearanceDeals returns 8 live deals ordered by biggest verified saving', () => {
  const featured = getFeaturedClearanceDeals(ALL_DEALS, 8);
  assert.equal(featured.length, 8);
  featured.forEach((deal, idx) => {
    assert.equal(isDealLive(deal), true);
    const saving = getSavingPercent(deal);
    assert.ok(saving !== null && saving > 0);
    if (idx > 0) {
      const prevSaving = getSavingPercent(featured[idx - 1])!;
      assert.ok(prevSaving >= saving);
    }
  });
});

test('getNewestLiveDeals returns 8 newest live deals and excludes expired/unavailable deals', () => {
  const newest = getNewestLiveDeals(ALL_DEALS, 8);
  assert.equal(newest.length, 8);
  newest.forEach((deal, idx) => {
    assert.equal(isDealLive(deal), true);
    if (idx > 0) {
      assert.ok(newest[idx - 1].addedOrder >= deal.addedOrder);
    }
  });
});

test('getLiveHomeLivingDeals returns only the 6 live Home & Living deals', () => {
  const homeLivingDeals = getLiveHomeLivingDeals(ALL_DEALS);
  assert.equal(homeLivingDeals.length, 6);
  homeLivingDeals.forEach((d) => {
    assert.equal(isDealLive(d), true);
    assert.equal(d.category, 'Home & Living');
  });
});

test('HOW_IT_WORKS_STEPS, HOW_IT_WORKS_DISCLOSURE, and PRODUCT_CONDITION_GUIDE_CARDS match spec', () => {
  assert.deepEqual(
    HOW_IT_WORKS_STEPS.map((s) => s.title),
    ['Find a deal', 'Buy from the supplier', 'Supplier delivers']
  );
  assert.equal(
    HOW_IT_WORKS_DISCLOSURE,
    'UK Clearance Hub may earn a commission when you buy through our links. This never changes the price you pay.'
  );
  assert.deepEqual(
    PRODUCT_CONDITION_GUIDE_CARDS.map((c) => ({
      condition: c.condition,
      to: c.to,
    })),
    [
      { condition: 'New', to: '/deals?condition=New' },
      { condition: 'Refurbished', to: '/deals?condition=Refurbished' },
      { condition: 'Graded', to: '/deals?condition=Graded' },
      { condition: 'Ex-display', to: '/deals?condition=Ex-display' },
    ]
  );
  assert.deepEqual(
    HOME_LIVING_GUIDE_CARDS.map((g) => g.to),
    ['/mattress-guide', '/bed-size-guide', '/delivery-returns']
  );
});

test('doesRouteWaitFor3DModel does not wait on / or /deals, and waits on /home-living', () => {
  assert.equal(doesRouteWaitFor3DModel('/'), false);
  assert.equal(doesRouteWaitFor3DModel('/deals'), false);
  assert.equal(doesRouteWaitFor3DModel('/home-living'), true);
  assert.equal(doesRouteWaitFor3DModel('/mattress-guide'), true);
  assert.equal(doesRouteWaitFor3DModel('/about'), true);
  assert.equal(doesRouteWaitFor3DModel('/contact'), true);
});

test('wrapSlideIndex and resolveContactTopicFromQuery behave deterministically', () => {
  assert.equal(wrapSlideIndex(0, 3), 0);
  assert.equal(wrapSlideIndex(3, 3), 0);
  assert.equal(wrapSlideIndex(-1, 3), 2);
  assert.equal(
    resolveContactTopicFromQuery('supplier'),
    'Supplier partnership & stock listing'
  );
});
