export const COOKIE_CONSENT_STORAGE_KEY = 'ukch_cookie_consent_v1';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_CHANGE_EVENT = 'ukch:cookie-consent-change';
export const COOKIE_SETTINGS_OPEN_EVENT = 'ukch:cookie-settings-open';

export type CookieCategoryKey = 'necessary' | 'analytics' | 'marketing';

export interface CookieCategoriesState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  version: number;
  updatedAt: string;
  categories: CookieCategoriesState;
}

export interface CookieCategoryMetadata {
  id: CookieCategoryKey;
  title: string;
  badge: string;
  alwaysActive: boolean;
  description: string;
  storageKeys: string[];
}

export const COOKIE_CATEGORY_DEFINITIONS: CookieCategoryMetadata[] = [
  {
    id: 'necessary',
    title: 'Strictly necessary',
    badge: 'Always active',
    alwaysActive: true,
    description:
      'Required for core site operation, including remembering your dark or light theme preference, recording your session referral source channel, and storing your cookie privacy choice.',
    storageKeys: [
      'uk-clearance-hub-theme (localStorage)',
      'ukch_source_channel (sessionStorage)',
      'ukch_cookie_consent_v1 (localStorage)',
      'ukch_deals_scroll_y (sessionStorage)',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    badge: 'Optional (off by default)',
    alwaysActive: false,
    description:
      'Helps us understand which clearance categories, guides, and search terms are most useful to UK visitors so we can improve site navigation and performance. No analytics scripts run unless you enable this option.',
    storageKeys: ['Currently none loaded (reserved for future consent-gated analytics)'],
  },
  {
    id: 'marketing',
    title: 'Marketing & referral attribution',
    badge: 'Optional (off by default)',
    alwaysActive: false,
    description:
      'Used only if we introduce optional campaign measurement for social media promotions. Outbound supplier links always include standard referral parameters when you click "View Deal", but no third-party marketing pixels run without your consent.',
    storageKeys: ['Currently none loaded (reserved for future consent-gated campaigns)'],
  },
];

export function createConsentRecord(
  input: { analytics: boolean; marketing: boolean },
  now: Date = new Date()
): CookieConsentRecord {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: now.toISOString(),
    categories: {
      necessary: true,
      analytics: Boolean(input.analytics),
      marketing: Boolean(input.marketing),
    },
  };
}

export function parseConsentRecord(raw: string | null): CookieConsentRecord | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== COOKIE_CONSENT_VERSION ||
      typeof parsed.updatedAt !== 'string' ||
      !parsed.categories ||
      typeof parsed.categories !== 'object'
    ) {
      return null;
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      updatedAt: parsed.updatedAt,
      categories: {
        necessary: true,
        analytics: Boolean(parsed.categories.analytics),
        marketing: Boolean(parsed.categories.marketing),
      },
    };
  } catch {
    return null;
  }
}

export function getStoredConsentRecord(
  storage?: Pick<Storage, 'getItem'> | null
): CookieConsentRecord | null {
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== 'undefined'
        ? window.localStorage
        : null;
    if (!targetStorage) return null;
    const raw = targetStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return parseConsentRecord(raw);
  } catch {
    return null;
  }
}

export function saveConsentRecord(
  categories: { analytics: boolean; marketing: boolean },
  storage?: Pick<Storage, 'setItem'> | null,
  now: Date = new Date()
): CookieConsentRecord {
  const record = createConsentRecord(categories, now);
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== 'undefined'
        ? window.localStorage
        : null;
    if (targetStorage) {
      targetStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: record })
      );
    }
  } catch {
    // Ignore storage write errors in restricted environments
  }
  return record;
}

/**
 * UK PECR helper so any future analytics or marketing script can check consent
 * before loading or firing. Strictly necessary storage is always permitted.
 */
export function hasConsent(
  category: CookieCategoryKey,
  storage?: Pick<Storage, 'getItem'> | null
): boolean {
  if (category === 'necessary') return true;
  const record = getStoredConsentRecord(storage);
  if (!record) return false;
  return Boolean(record.categories[category]);
}

/**
 * Dispatches a global event to reopen the Cookie Settings modal from anywhere
 * (e.g. Footer "Cookie Settings" button or /cookies policy page).
 */
export function openCookieSettingsModal(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_OPEN_EVENT));
  }
}
