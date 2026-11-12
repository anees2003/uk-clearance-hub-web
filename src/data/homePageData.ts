import {
  Deal,
  DealCategory,
  DealCondition,
  DEALS,
  formatGBP,
  getSavingPercent,
  isDealLive,
} from './deals';

export interface HeroCarouselSlide {
  id: 'tech' | 'appliances' | 'bedroom-3d';
  eyebrow: string;
  headline: string;
  subtext: string;
  primaryCta: {
    label: string;
    to: string;
  };
  secondaryCta: {
    label: string;
    to: string;
  };
  visualType: 'deals' | '3d-bed';
  featuredCategory?: DealCategory;
}

export const HERO_CAROUSEL_AUTO_ADVANCE_MS = 6000;

export const HERO_CAROUSEL_SLIDES: HeroCarouselSlide[] = [
  {
    id: 'tech',
    eyebrow: 'Electronics & Gadgets · Verified Savings',
    headline: 'Clearance deals on top tech',
    subtext:
      'Headphones, 4K QLED TVs, OLED tablets, titanium GPS smartwatches and LiDAR robot vacuums from trusted UK suppliers.',
    primaryCta: {
      label: 'Shop Deals',
      to: '/deals?category=Electronics%20%26%20Gadgets',
    },
    secondaryCta: {
      label: 'Browse All Deals',
      to: '/deals',
    },
    visualType: 'deals',
    featuredCategory: 'Electronics & Gadgets',
  },
  {
    id: 'appliances',
    eyebrow: 'Home Appliances · Direct UK Dispatch',
    headline: 'Home appliances for less',
    subtext:
      'Dual-zone air fryers, inverter steam washing machines, no-frost fridge freezers and bean-to-cup coffee machines at genuine clearance prices.',
    primaryCta: {
      label: 'Shop Deals',
      to: '/deals?category=Home%20Appliances',
    },
    secondaryCta: {
      label: 'How It Works',
      to: '/how-it-works',
    },
    visualType: 'deals',
    featuredCategory: 'Home Appliances',
  },
  {
    id: 'bedroom-3d',
    eyebrow: 'Home & Living · Interactive 3D Showroom',
    headline: 'Build your bedroom for less',
    subtext:
      'Explore our scroll-driven 3D bedroom set and shop beds, pocket-sprung mattresses and bedroom furniture from trusted UK suppliers.',
    primaryCta: {
      label: 'Shop Deals',
      to: '/home-living',
    },
    secondaryCta: {
      label: 'Bed Size Guide',
      to: '/bed-size-guide',
    },
    visualType: '3d-bed',
    featuredCategory: 'Home & Living',
  },
];

export interface SearchSuggestionChip {
  label: string;
  to: string;
}

export const HERO_SEARCH_SUGGESTION_CHIPS: SearchSuggestionChip[] = [
  { label: 'Air fryer', to: '/deals?q=Air%20fryer' },
  { label: 'Headphones', to: '/deals?q=Headphones' },
  { label: 'Washing machine', to: '/deals?q=Washing%20machine' },
  { label: 'Mattress', to: '/deals?q=Mattress' },
  { label: 'TV', to: '/deals?q=TV' },
];

export interface TrustStripItem {
  id: string;
  title: string;
  description: string;
  iconKey: 'clearance' | 'suppliers' | 'delivery' | 'whatsapp';
}

export const TRUST_STRIP_ITEMS: TrustStripItem[] = [
  {
    id: 'genuine-clearance',
    title: 'Genuine clearance deals',
    description: 'Overstock, end-of-line and graded stock with clear notes.',
    iconKey: 'clearance',
  },
  {
    id: 'trusted-suppliers',
    title: 'Trusted UK suppliers',
    description: 'Every listing is fulfilled by vetted UK trade partners.',
    iconKey: 'suppliers',
  },
  {
    id: 'supplier-delivery',
    title: 'Delivery handled by suppliers',
    description: 'Direct UK dispatch and support from each supplier.',
    iconKey: 'delivery',
  },
  {
    id: 'whatsapp-enquiry',
    title: 'Enquire on WhatsApp',
    description: 'Quick answers on stock and specs from our UK team.',
    iconKey: 'whatsapp',
  },
];

export interface CategoryTileStat {
  id: 'electronics' | 'appliances' | 'home-living' | 'all-deals';
  title: string;
  subtitle: string;
  to: string;
  liveCount: number;
  lowestPrice: number;
  fromPriceLabel: string;
  iconKey: 'cpu' | 'sparkles' | 'bed' | 'grid';
}

export function computeCategoryTileStats(
  deals: Deal[] = DEALS,
  now: Date = new Date()
): CategoryTileStat[] {
  const liveDeals = deals.filter((d) => isDealLive(d, now));

  const getStatsForCategory = (cat?: DealCategory) => {
    const matching = cat
      ? liveDeals.filter((d) => d.category === cat)
      : liveDeals;
    const liveCount = matching.length;
    const lowestPrice =
      matching.length > 0 ? Math.min(...matching.map((d) => d.price)) : 0;
    return {
      liveCount,
      lowestPrice,
      fromPriceLabel: `From ${formatGBP(lowestPrice)}`,
    };
  };

  const tech = getStatsForCategory('Electronics & Gadgets');
  const appliances = getStatsForCategory('Home Appliances');
  const homeLiving = getStatsForCategory('Home & Living');
  const all = getStatsForCategory(undefined);

  return [
    {
      id: 'electronics',
      title: 'Electronics & Gadgets',
      subtitle: 'ANC headphones, 4K QLED TVs, OLED tablets & smart tech',
      to: '/deals?category=Electronics%20%26%20Gadgets',
      ...tech,
      iconKey: 'cpu',
    },
    {
      id: 'appliances',
      title: 'Home Appliances',
      subtitle: 'Air fryers, laundry, refrigeration & espresso machines',
      to: '/deals?category=Home%20Appliances',
      ...appliances,
      iconKey: 'sparkles',
    },
    {
      id: 'home-living',
      title: 'Home & Living',
      subtitle: 'Interactive 3D bedroom story, beds, mattresses & furniture',
      to: '/home-living',
      ...homeLiving,
      iconKey: 'bed',
    },
    {
      id: 'all-deals',
      title: 'All Deals',
      subtitle: 'Browse the complete live UK clearance catalogue',
      to: '/deals',
      ...all,
      iconKey: 'grid',
    },
  ];
}

/**
 * Returns up to `limit` live deals for the "Featured clearance deals" horizontal strip,
 * preferring deals with the biggest verified savings first.
 */
export function getFeaturedClearanceDeals(
  deals: Deal[] = DEALS,
  limit: number = 8,
  now: Date = new Date()
): Deal[] {
  const liveDeals = deals.filter((d) => isDealLive(d, now));
  return [...liveDeals]
    .sort((a, b) => {
      const savingA = getSavingPercent(a) ?? -1;
      const savingB = getSavingPercent(b) ?? -1;
      if (savingB !== savingA) {
        return savingB - savingA;
      }
      return a.recommendedRank - b.recommendedRank;
    })
    .slice(0, limit);
}

/**
 * Returns up to `limit` newest live deals for the "New this week" grid.
 */
export function getNewestLiveDeals(
  deals: Deal[] = DEALS,
  limit: number = 8,
  now: Date = new Date()
): Deal[] {
  const liveDeals = deals.filter((d) => isDealLive(d, now));
  return [...liveDeals]
    .sort(
      (a, b) =>
        b.addedOrder - a.addedOrder || a.recommendedRank - b.recommendedRank
    )
    .slice(0, limit);
}

/**
 * Returns all live deals in the "Home & Living" category for /home-living.
 */
export function getLiveHomeLivingDeals(
  deals: Deal[] = DEALS,
  now: Date = new Date()
): Deal[] {
  return deals
    .filter((d) => isDealLive(d, now) && d.category === 'Home & Living')
    .sort((a, b) => a.recommendedRank - b.recommendedRank);
}

/**
 * Returns top live deals for a specific category to showcase inside Hero Carousel slides 1 & 2.
 */
export function getSlideShowcaseDeals(
  category: DealCategory,
  deals: Deal[] = DEALS,
  limit: number = 3,
  now: Date = new Date()
): Deal[] {
  return deals
    .filter((d) => isDealLive(d, now) && d.category === category)
    .sort((a, b) => {
      const savingA = getSavingPercent(a) ?? -1;
      const savingB = getSavingPercent(b) ?? -1;
      return savingB - savingA || a.recommendedRank - b.recommendedRank;
    })
    .slice(0, limit);
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    stepNumber: '01',
    title: 'Find a deal',
    description:
      'Browse or search verified clearance offers across tech, home appliances, and bedroom furniture with clear condition notes.',
  },
  {
    stepNumber: '02',
    title: 'Buy from the supplier',
    description:
      'View Deal takes you to the supplier, who confirms price and stock — or send a direct enquiry with your unique Lead ID.',
  },
  {
    stepNumber: '03',
    title: 'Supplier delivers',
    description:
      'Fulfilment, UK delivery, and statutory warranty care are handled directly by the fulfilling supplier.',
  },
];

export const HOW_IT_WORKS_DISCLOSURE =
  'UK Clearance Hub may earn a commission when you buy through our links. This never changes the price you pay.';

export interface ConditionGuideCard {
  condition: DealCondition;
  title: string;
  badgeText: string;
  summary: string;
  whatToExpect: string;
  to: string;
}

export const PRODUCT_CONDITION_GUIDE_CARDS: ConditionGuideCard[] = [
  {
    condition: 'New',
    title: 'New',
    badgeText: 'Factory Sealed',
    summary:
      'Brand-new, unused overstock or end-of-line items in original retail or protective factory packaging.',
    whatToExpect:
      '100% untouched item with full accessories and standard statutory consumer rights from the supplier.',
    to: '/deals?condition=New',
  },
  {
    condition: 'Refurbished',
    title: 'Refurbished',
    badgeText: 'Tested & Certified',
    summary:
      'Professionally inspected, bench-tested, cleaned, and restored to full working specification by the supplier or manufacturer.',
    whatToExpect:
      'Verified hardware performance and sanitised finish; supplied in retail or plain protective transit packaging.',
    to: '/deals?condition=Refurbished',
  },
  {
    condition: 'Graded',
    title: 'Graded',
    badgeText: 'Unblemished / Box Mark',
    summary:
      'Unused customer returns, outer-carton damaged stock, or items with a minor cosmetic blemish disclosed on the listing.',
    whatToExpect:
      'Substantial savings on functional appliances and electronics where only the carton or a non-visible panel has a mark.',
    to: '/deals?condition=Graded',
  },
  {
    condition: 'Ex-display',
    title: 'Ex-display',
    badgeText: 'Showroom Piece',
    summary:
      'Previously displayed in a UK retail cabinet or partner furniture showroom and inspected prior to dispatch.',
    whatToExpect:
      'Checked, cleaned, and re-wrapped by the supplier with any specific showroom notes stated clearly on the deal page.',
    to: '/deals?condition=Ex-display',
  },
];

export interface HomeLivingGuideCard {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  ctaLabel: string;
}

export const HOME_LIVING_GUIDE_CARDS: HomeLivingGuideCard[] = [
  {
    id: 'mattress-guide',
    eyebrow: 'Sleep Engineering',
    title: 'Mattress Guide',
    description:
      'Compare pocket spring counts, natural wool fillings, and test our interactive 1–10 firmness calibrator for side, back, and front sleepers.',
    to: '/mattress-guide',
    ctaLabel: 'Read Mattress Guide',
  },
  {
    id: 'bed-size-guide',
    eyebrow: 'UK Dimensions & Room Fit',
    title: 'Bed Size Guide',
    description:
      'Exact measurements for UK Single, Small Double, Double, King, and Super King beds — plus our interactive 60cm bedroom floor planner.',
    to: '/bed-size-guide',
    ctaLabel: 'Open Size Guide',
  },
  {
    id: 'delivery-returns',
    eyebrow: 'Supplier Fulfilment',
    title: 'Delivery & Returns',
    description:
      'Understand how supplier-direct UK dispatch, two-person bedroom delivery, and your statutory UK consumer rights work.',
    to: '/delivery-returns',
    ctaLabel: 'View Delivery Info',
  },
];

/**
 * Determines whether the initial Preloader should wait for the 3D bed.glb model to finish loading.
 * The homepage (/) and general deal listing pages do NOT wait for the 3D model so they load fast.
 * Only pages with primary 3D showroom experiences wait for the GLB.
 */
export function doesRouteWaitFor3DModel(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return (
    clean === '/home-living' ||
    clean === '/mattress-guide' ||
    clean === '/about' ||
    clean === '/contact'
  );
}

/**
 * Wraps a carousel slide index within [0, total - 1].
 */
export function wrapSlideIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}
