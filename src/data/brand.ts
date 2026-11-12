import { ThemeMode } from './theme';

export const BRAND_NAME = 'UK Clearance Hub';

export const BRAND_LOGO_DARK_URL =
  'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo-dark.png';

export const BRAND_LOGO_LIGHT_URL =
  'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo.png';

export const BRAND_LOGO_URL = BRAND_LOGO_LIGHT_URL;

export const BRAND_ICON_URL =
  'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-icon.png';

export function getBrandLogoUrl(theme: ThemeMode): string {
  return theme === 'dark' ? BRAND_LOGO_DARK_URL : BRAND_LOGO_LIGHT_URL;
}


export const BRAND_EMAIL = 'admin@ukclearancehub.co.uk';
export const BRAND_EMAIL_HREF = 'mailto:admin@ukclearancehub.co.uk';

export const BRAND_WHATSAPP_DISPLAY = '+44 7344 540043';
export const BRAND_WHATSAPP_URL = 'https://wa.me/447344540043';
export const BRAND_WHATSAPP_PREFILLED_URL =
  'https://wa.me/447344540043?text=Hi%20UK%20Clearance%20Hub%2C%20I%20have%20a%20question%20about%20a%20deal.';

export const BRAND_COLOURS = {
  navy: '#041C58',
  brandBlue: '#1170D8',
  skyBlue: '#16A5F4',
  orange: '#FD7209',
  amber: '#FFC829',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  border: 'rgba(4,28,88,0.10)',
  mutedText: '#5B6785',
  whatsappGreen: '#25D366',
  heroGradient: 'linear-gradient(135deg, #16A5F4, #1170D8 55%, #041C58)',
} as const;

export interface BrandSocialLink {
  id: 'facebook' | 'instagram' | 'tiktok' | 'x' | 'snapchat';
  label: string;
  href: string;
}

export const BRAND_SOCIAL_LINKS: BrandSocialLink[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/ukclearancehub.official',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/ukclearancehub/',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com/@ukclearancehub',
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    href: 'https://x.com/ukclearancehub',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    href: 'https://www.snapchat.com/@ukclearancehub',
  },
];

export interface HeaderCategoryItem {
  label: string;
  to: string;
  categoryParam?: string;
}

export const HEADER_CATEGORIES: HeaderCategoryItem[] = [
  {
    label: 'Electronics & Gadgets',
    to: '/deals?category=Electronics+%26+Gadgets',
    categoryParam: 'Electronics & Gadgets',
  },
  {
    label: 'Home Appliances',
    to: '/deals?category=Home+Appliances',
    categoryParam: 'Home Appliances',
  },
  {
    label: 'Home & Living',
    to: '/home-living',
  },
  {
    label: 'All Deals',
    to: '/deals',
  },
];

export const FOOTER_ABOUT_BLURB =
  'We find genuine clearance deals from trusted UK suppliers. Purchases are completed with the supplier, who handles stock and delivery.';

export const MODEL_CREDIT_LINE =
  'Bed 07 3D model by Doaa Sheha (Sketchfab), CC BY 4.0.';

export function buildDealsSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return '/deals';
  }
  return `/deals?q=${encodeURIComponent(trimmed)}`;
}
