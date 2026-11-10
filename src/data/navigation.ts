export interface NavItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const HEADER_NAV_LINKS: NavItem[] = [
  { label: 'Clearance Deals', href: '/clearance-deals' },
  { label: 'Beds', href: '/beds/savoy-ottoman-bed' },
  { label: 'Mattress Guide', href: '/mattress-guide' },
  { label: 'Size Guide', href: '/bed-size-guide' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Clearance Deals', href: '/clearance-deals' },
      { label: 'Ottoman & Divan Beds', href: '/beds/savoy-ottoman-bed' },
      { label: 'Upholstered Bed Frames', href: '/beds/kensington-wingback-bed' },
      { label: 'Solid Oak Frames', href: '/beds/cotswold-oak-bed' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Mattress Guide', href: '/mattress-guide' },
      { label: 'Bed Size Guide', href: '/bed-size-guide' },
      { label: 'Delivery & Returns', href: '/delivery-returns' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Clearance Showroom', href: '/clearance-deals' },
    ],
  },
];

export interface PageMeta {
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const PAGE_METADATA: Record<string, PageMeta> = {
  '/': {
    path: '/',
    eyebrow: 'British Bedroom Craftsmanship · Clearance Prices',
    title: 'UK Clearance Hub',
    subtitle:
      'Architectural bed frames, pocket-sprung mattresses, and handcrafted British bedroom furniture at up to 70% off retail prices.',
  },
  '/clearance-deals': {
    path: '/clearance-deals',
    eyebrow: 'Up to 70% Off RRP · Immediate Dispatch',
    title: 'Clearance Deals',
    subtitle:
      'End-of-line, ex-display, and overstocked luxury beds and orthopaedic mattresses inspected at our UK distribution hub.',
  },
  '/mattress-guide': {
    path: '/mattress-guide',
    eyebrow: 'Sleep Engineering & Tension Advice',
    title: 'Mattress Guide',
    subtitle:
      'Compare pocket-sprung counts, natural British wool fillings, and orthopaedic support tensions tailored to how you sleep.',
  },
  '/bed-size-guide': {
    path: '/bed-size-guide',
    eyebrow: 'UK Standard Dimensions & Room Planning',
    title: 'Bed Size Guide',
    subtitle:
      'Exact measurements for UK Single, Small Double, Double, King, and Super King bed frames and mattresses.',
  },
  '/delivery-returns': {
    path: '/delivery-returns',
    eyebrow: 'Two-Person White-Glove UK Courier',
    title: 'Delivery & Returns',
    subtitle:
      'Room-of-choice delivery across mainland Britain, optional frame assembly, and our straightforward 30-day returns promise.',
  },
  '/about': {
    path: '/about',
    eyebrow: 'Direct From British Workshops',
    title: 'About UK Clearance Hub',
    subtitle:
      'How we partner with heritage Yorkshire and Midlands bedmakers to bring surplus luxury sleep pieces direct to your bedroom.',
  },
  '/faq': {
    path: '/faq',
    eyebrow: 'Customer Care & Product Queries',
    title: 'Frequently Asked Questions',
    subtitle:
      'Everything you need to know about our clearance grading, NBF-approved manufacturers, structural warranties, and delivery slots.',
  },
  '/contact': {
    path: '/contact',
    eyebrow: 'Speak With Our Sleep Specialists',
    title: 'Contact Us',
    subtitle:
      'Get in touch with our UK customer service team for bespoke dimensions, fabric swatches, or trade clearance enquiries.',
  },
};

/**
 * Formats a bed slug (e.g. "savoy-ottoman-bed") into a clean UK editorial title.
 */
export function formatBedSlugTitle(slug: string | undefined): string {
  if (!slug || !slug.trim()) {
    return 'Signature Bed Collection';
  }
  return slug
    .trim()
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determines whether the fixed header should be hidden based on scroll position and delta.
 */
export function computeHeaderVisibility(
  currentScrollY: number,
  lastScrollY: number,
  currentlyHidden: boolean,
  threshold = 64,
  minDelta = 6
): boolean {
  if (currentScrollY <= threshold) {
    return false; // Always visible near the top of the page
  }
  const delta = currentScrollY - lastScrollY;
  if (Math.abs(delta) < minDelta) {
    return currentlyHidden;
  }
  return delta > 0; // true = hidden when scrolling down, false = visible when scrolling up
}

/**
 * Validates newsletter email address input.
 */
export function validateNewsletterEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter your email address.' };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid UK or international email address.' };
  }
  return { valid: true };
}
