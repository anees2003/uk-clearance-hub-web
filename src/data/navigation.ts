export interface NavItem {
  label: string;
  to: string;
}

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const HEADER_NAV_LINKS: NavItem[] = [
  { label: 'Electronics & Gadgets', to: '/deals?category=Electronics+%26+Gadgets' },
  { label: 'Home Appliances', to: '/deals?category=Home+Appliances' },
  { label: 'Home & Living', to: '/home-living' },
  { label: 'All Deals', to: '/deals' },
];

export const HEADER_HELP_LINKS: NavItem[] = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Delivery & Returns', to: '/delivery-returns' },
  { label: 'Mattress Guide', to: '/mattress-guide' },
  { label: 'Size Guide', to: '/bed-size-guide' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Electronics & Gadgets', to: '/deals?category=Electronics+%26+Gadgets' },
      { label: 'Home Appliances', to: '/deals?category=Home+Appliances' },
      { label: 'Home & Living', to: '/home-living' },
      { label: 'All Deals', to: '/deals' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'How it works', to: '/how-it-works' },
      { label: 'About Us', to: '/about' },
      { label: 'Delivery & Returns', to: '/delivery-returns' },
      { label: 'Mattress Guide', to: '/mattress-guide' },
      { label: 'Bed Size Guide', to: '/bed-size-guide' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Notice', to: '/privacy' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Cookie Settings', to: '#cookie-settings' },
      { label: 'Terms of Use', to: '/terms' },
    ],
  },
];

export interface PageMetadata {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/': {
    eyebrow: 'UK Clearance Hub · Genuine Clearance Deals',
    title: 'Clearance Deals from Trusted UK Suppliers.',
    subtitle:
      'Discover genuine ex-display, end-of-line, and overstock clearance deals across Electronics & Gadgets, Home Appliances, and Home & Living.',
  },
  '/deals': {
    eyebrow: 'Live Clearance Catalogue · Verified UK Suppliers',
    title: 'Current Clearance Deals',
    subtitle:
      'Verified clearance deals from trusted UK suppliers. View deal details or enquire directly on WhatsApp.',
  },
  '/home-living': {
    eyebrow: 'Home & Living Clearance · Trusted UK Suppliers',
    title: 'Home & Living Clearance Deals',
    subtitle:
      'Luxury beds, pocket-sprung mattresses, headboards, and bedroom furniture sourced from trusted UK suppliers.',
  },
  '/clearance-deals': {
    eyebrow: 'Limited Stock · Genuine Clearance Deals',
    title: 'Current Clearance Deals',
    subtitle:
      'Verified ex-display, end-of-line, and overstock clearance deals across the UK.',
  },
  '/mattress-guide': {
    eyebrow: 'Sleep Engineering & Comfort',
    title: 'The UK Mattress Buying Guide',
    subtitle:
      'Understand pocket spring counts, natural wool fillings, orthopaedic support tensions, and sleep position alignment before choosing your mattress.',
  },
  '/bed-size-guide': {
    eyebrow: 'Dimensions & Room Planning',
    title: 'UK Bed & Mattress Size Guide',
    subtitle:
      'Complete measurements for Single, Small Double, Double, King, and Super King beds — plus circulation clearance guidance for British bedrooms.',
  },
  '/delivery-returns': {
    eyebrow: 'Supplier Fulfilment & Returns',
    title: 'Delivery & Returns Information',
    subtitle:
      'How supplier-direct UK delivery, white-glove room-of-choice dispatch, and statutory UK consumer returns work.',
  },
  '/about': {
    eyebrow: 'How UK Clearance Hub Works',
    title: 'Genuine Clearance Deals from Trusted UK Suppliers',
    subtitle:
      'UK Clearance Hub connects savvy shoppers directly with verified UK suppliers clearing ex-display, end-of-line, and overstock lines.',
  },
  '/faq': {
    eyebrow: 'Client Support',
    title: 'Frequently Asked Questions',
    subtitle:
      'Clear answers on supplier fulfilment, stock grading, warranties, and how to enquire or buy.',
  },
  '/contact': {
    eyebrow: 'Speak With An Advisor',
    title: 'Contact UK Clearance Hub',
    subtitle:
      'Have a question about a clearance deal, bulk order, or supplier listing? Reach our UK team via email or WhatsApp.',
  },
};

export function formatBedSlugTitle(slug?: string): string {
  if (!slug) return 'Signature Bed Collection';
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function computeHeaderVisibility(
  currentScrollY: number,
  lastScrollY: number,
  currentlyHidden: boolean,
  hideThreshold = 80,
  minDelta = 6
): boolean {
  if (currentScrollY <= hideThreshold) {
    return false;
  }
  const delta = currentScrollY - lastScrollY;
  if (delta > minDelta) {
    return true;
  }
  if (delta < -minDelta) {
    return false;
  }
  return currentlyHidden;
}

export function validateNewsletterEmail(email: string): {
  valid: boolean;
  message: string;
} {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      valid: false,
      message: 'Please enter an email address to join the clearance list.',
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      message: 'Please enter a valid UK or international email address.',
    };
  }
  return {
    valid: true,
    message: 'Thank you. You are subscribed to weekly clearance alerts.',
  };
}
