import { useEffect } from 'react';
import {
  BRAND_EMAIL,
  BRAND_LOGO_URL,
  BRAND_NAME,
  BRAND_SOCIAL_LINKS,
  BRAND_WHATSAPP_DISPLAY,
} from '../data/brand';
import { Deal, isDealLive } from '../data/deals';

export const SEO_BASE_URL = 'https://ukclearancehub.co.uk';
export const SEO_DEFAULT_IMAGE = BRAND_LOGO_URL;
export const SEO_SITE_NAME = BRAND_NAME;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SeoConfig {
  /** Page title (format "<Page> | UK Clearance Hub", target 50–60 chars) */
  title: string;
  /** Meta description (target 150–160 chars) */
  description: string;
  /** Route pathname starting with / (e.g. "/deals") */
  canonicalPath: string;
  /** Robots directive, defaults to "index,follow" */
  robots?: 'index,follow' | 'noindex,follow' | 'noindex,nofollow';
  /** OpenGraph type, defaults to "website" */
  ogType?: 'website' | 'product' | 'article';
  /** Optional custom social share image URL, defaults to official brand logo */
  imageUrl?: string;
  /** Optional JSON-LD schema object or array of schema objects */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

export function buildCanonicalUrl(pathname: string): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (clean === '/') return `${SEO_BASE_URL}/`;
  return `${SEO_BASE_URL}${clean.replace(/\/+$/, '')}`;
}

export function formatPageTitle(pageTitle: string): string {
  if (pageTitle.includes(SEO_SITE_NAME)) {
    return pageTitle;
  }
  return `${pageTitle} | ${SEO_SITE_NAME}`;
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_SITE_NAME,
    url: `${SEO_BASE_URL}/`,
    logo: SEO_DEFAULT_IMAGE,
    email: BRAND_EMAIL,
    telephone: BRAND_WHATSAPP_DISPLAY,
    sameAs: BRAND_SOCIAL_LINKS.map((s) => s.href),
  };
}

export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

function mapDealConditionSchemaUrl(condition: Deal['condition']): string {
  switch (condition) {
    case 'New':
      return 'https://schema.org/NewCondition';
    case 'Refurbished':
      return 'https://schema.org/RefurbishedCondition';
    case 'Graded':
    case 'Ex-display':
      return 'https://schema.org/UsedCondition';
  }
}

function mapDealAvailabilitySchemaUrl(
  stockStatus: Deal['stockStatus'],
  live: boolean
): string {
  if (!live || stockStatus === 'Out of stock') {
    return 'https://schema.org/OutOfStock';
  }
  if (stockStatus === 'Low stock') {
    return 'https://schema.org/LimitedAvailability';
  }
  return 'https://schema.org/InStock';
}

/**
 * Builds Schema.org Product JSON-LD for a deal detail page.
 * CRITICAL RULE (Step 12): Includes an Offer ONLY when the price is real
 * (`!deal.isSample`). Skips `offers` completely for `isSample` deals.
 */
export function buildDealProductJsonLd(
  deal: Deal,
  now: Date = new Date()
): Record<string, unknown> {
  const canonicalUrl = buildCanonicalUrl(`/deals/${deal.slug}`);
  const imageUrl =
    deal.images.length > 0 && deal.images[0]?.src
      ? deal.images[0].src
      : SEO_DEFAULT_IMAGE;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    description: deal.shortDescription,
    sku: deal.slug,
    category: `${deal.category} > ${deal.subcategory}`,
    image: [imageUrl],
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: deal.brand,
    },
    itemCondition: mapDealConditionSchemaUrl(deal.condition),
  };

  // Include Offer ONLY when !deal.isSample and price > 0
  if (!deal.isSample && deal.price > 0) {
    const live = isDealLive(deal, now);
    schema.offers = {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'GBP',
      price: deal.price.toFixed(2),
      itemCondition: mapDealConditionSchemaUrl(deal.condition),
      availability: mapDealAvailabilitySchemaUrl(deal.stockStatus, live),
      seller: {
        '@type': 'Organization',
        name: deal.supplierName,
      },
    };
  }

  return schema;
}

/**
 * Step 13 Sample Content Safety:
 * Returns "noindex,follow" for missing deals, expired/unavailable deals, OR sample deals (`deal.isSample === true`).
 * Returns "index,follow" ONLY when the deal is live and is a verified real supplier deal (`isSample === false`).
 */
export function getDealRobotsDirective(
  deal: Deal | undefined,
  now: Date = new Date()
): 'index,follow' | 'noindex,follow' {
  if (!deal || deal.isSample || !isDealLive(deal, now)) {
    return 'noindex,follow';
  }
  return 'index,follow';
}

/**
 * Step 13 Sample Content Safety:
 * Returns all canonical URLs to include in sitemap.xml:
 * - All 13 static routes
 * - Live deals ONLY when `!deal.isSample` (excludes all sample listings until real deals replace them).
 */
export function getSitemapUrls(
  deals: Deal[],
  now: Date = new Date()
): string[] {
  const staticPaths = Object.keys(ROUTE_SEO_DEFAULTS);
  const staticUrls = staticPaths.map((p) => buildCanonicalUrl(p));
  const realLiveDealUrls = deals
    .filter((d) => !d.isSample && isDealLive(d, now))
    .map((d) => buildCanonicalUrl(`/deals/${d.slug}`));
  return [...staticUrls, ...realLiveDealUrls];
}

export const ROUTE_SEO_DEFAULTS: Record<
  string,
  { title: string; description: string; robots?: SeoConfig['robots'] }
> = {
  '/': {
    title: 'Clearance Deals from Trusted UK Suppliers | UK Clearance Hub',
    description:
      'Discover genuine UK clearance deals across Electronics & Gadgets, Home Appliances, and Home & Living. Fulfilled directly by vetted UK suppliers in GBP (£).',
  },
  '/deals': {
    title: 'All Clearance Deals & Verified UK Savings | UK Clearance Hub',
    description:
      'Browse live UK clearance deals on electronics, home appliances, beds, and mattresses. Filter by condition, category, and verified savings from UK suppliers.',
  },
  '/home-living': {
    title: 'Home & Living 3D Showroom & Bedroom Deals | UK Clearance Hub',
    description:
      'Explore our interactive 3D bedroom set and shop clearance beds, pocket-sprung mattresses, headboards, and furniture from trusted UK suppliers at clearance prices.',
  },
  '/how-it-works': {
    title: 'How Our UK Referral & Deal Service Works | UK Clearance Hub',
    description:
      'Learn how UK Clearance Hub finds genuine clearance deals from vetted UK suppliers, how condition grades and verified savings work, and how suppliers deliver.',
  },
  '/mattress-guide': {
    title: 'UK Mattress Buying & Firmness Tension Guide | UK Clearance Hub',
    description:
      'Compare pocket-sprung, hybrid, and orthopaedic mattresses with our interactive 3D firmness calibrator and sleep-position guide before choosing a UK clearance deal.',
  },
  '/bed-size-guide': {
    title: 'UK Bed & Mattress Dimensions & Size Guide | UK Clearance Hub',
    description:
      'Check standard UK Single, Small Double, Double, King, and Super King bed dimensions and test your bedroom measurements with our 60cm clearance planner.',
  },
  '/delivery-returns': {
    title: 'Supplier Delivery Areas & UK Returns Guide | UK Clearance Hub',
    description:
      'How supplier-direct UK mainland, Highlands, and Northern Ireland delivery works, plus your statutory 14-day cancellation and Consumer Rights Act protections.',
  },
  '/about': {
    title: 'About Us & Our Supplier Verification Model | UK Clearance Hub',
    description:
      'Discover how UK Clearance Hub connects shoppers with verified UK suppliers clearing genuine ex-display, end-of-line, and overstock lines across Britain.',
  },
  '/faq': {
    title: 'Frequently Asked Questions & Customer Help | UK Clearance Hub',
    description:
      'Read clear answers about UK Clearance Hub referrals, condition grading, Lead IDs, supplier dispatch timescales, and UK consumer rights for clearance items.',
  },
  '/contact': {
    title: 'Contact Our UK Deals & Supplier Desk Team | UK Clearance Hub',
    description:
      'Enquire about a clearance deal or apply to list surplus stock as a UK supplier. Reach the UK Clearance Hub team directly by email or WhatsApp chat.',
  },
  '/privacy': {
    title: 'Privacy Notice & UK GDPR Data Protection | UK Clearance Hub',
    description:
      'Read how UK Clearance Hub handles customer enquiry details, Lead IDs, supplier introductions, and your UK GDPR data protection and ICO privacy rights.',
  },
  '/cookies': {
    title: 'Cookie Policy & Browser Storage Controls | UK Clearance Hub',
    description:
      'Understand how UK Clearance Hub uses strictly necessary, analytics, and marketing browser storage under UK PECR and update your cookie consent settings.',
  },
  '/terms': {
    title: 'Terms of Use & Referral Service Disclosure | UK Clearance Hub',
    description:
      'Read the Terms of Use for UK Clearance Hub, explaining our commission-based referral model, supplier fulfilment responsibilities, and England & Wales law.',
  },
};

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLdScript(
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null
): void {
  if (typeof document === 'undefined') return;
  const scriptId = 'ukch-jsonld-schema';
  let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!jsonLd) {
    if (scriptEl) {
      scriptEl.remove();
    }
    return;
  }

  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = scriptId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const payload = Array.isArray(jsonLd)
    ? {
        '@context': 'https://schema.org',
        '@graph': jsonLd.map((item) => {
          const copy = { ...item };
          delete copy['@context'];
          return copy;
        }),
      }
    : jsonLd;

  scriptEl.textContent = JSON.stringify(payload);
}

export function applySeoToDocumentHead(config: SeoConfig): void {
  if (typeof document === 'undefined') return;

  const fullTitle = formatPageTitle(config.title);
  const canonicalUrl = buildCanonicalUrl(config.canonicalPath);
  const robots = config.robots ?? 'index,follow';
  const ogType = config.ogType ?? 'website';
  const imageUrl = config.imageUrl ?? SEO_DEFAULT_IMAGE;

  document.title = fullTitle;

  upsertMetaTag('name', 'description', config.description);
  upsertMetaTag('name', 'robots', robots);
  upsertCanonicalLink(canonicalUrl);

  // OpenGraph tags
  upsertMetaTag('property', 'og:title', fullTitle);
  upsertMetaTag('property', 'og:description', config.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:type', ogType);
  upsertMetaTag('property', 'og:image', imageUrl);
  upsertMetaTag('property', 'og:site_name', SEO_SITE_NAME);

  // Twitter Card tags
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', fullTitle);
  upsertMetaTag('name', 'twitter:description', config.description);
  upsertMetaTag('name', 'twitter:image', imageUrl);

  // Structured Data JSON-LD
  upsertJsonLdScript(config.jsonLd ?? null);
}

/**
 * Custom React hook to manage per-route <title>, description, canonical URL,
 * OpenGraph, Twitter Card, robots, and JSON-LD structured data without external packages.
 */
export function useSeo(config: SeoConfig): void {
  const jsonLdSerialized = config.jsonLd ? JSON.stringify(config.jsonLd) : '';

  useEffect(() => {
    applySeoToDocumentHead(config);
  }, [
    config.title,
    config.description,
    config.canonicalPath,
    config.robots,
    config.ogType,
    config.imageUrl,
    jsonLdSerialized,
  ]);
}
