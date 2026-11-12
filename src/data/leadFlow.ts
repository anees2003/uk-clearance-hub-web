import { BRAND_EMAIL } from './brand';
import { Deal } from './deals';

export const SOURCE_CHANNEL_SESSION_KEY = 'ukch_source_channel';

const LEAD_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a unique Lead ID in the format "UKCH-YYYYMMDD-XXXX"
 * where XXXX is 4 random uppercase alphanumeric characters.
 */
export function generateLeadId(
  now: Date = new Date(),
  randomFn: () => number = Math.random
): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    const idx = Math.floor(
      Math.max(0, Math.min(0.999999, randomFn())) * LEAD_ID_CHARS.length
    );
    suffix += LEAD_ID_CHARS[idx];
  }

  return `UKCH-${year}${month}${day}-${suffix}`;
}

export function isValidLeadId(leadId: string): boolean {
  return /^UKCH-\d{8}-[A-Z0-9]{4}$/.test(leadId);
}

/**
 * Extracts or initialises the visitor's acquisition source channel on first visit
 * from URL query params (utm_source / utm_medium / ref) or document.referrer domain,
 * persisting it in sessionStorage for the session.
 */
export function resolveSourceChannelFromLocation(
  search: string = '',
  referrer: string = ''
): string {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const utmSource = (params.get('utm_source') ?? '').trim();
  const utmMedium = (params.get('utm_medium') ?? '').trim();
  const ref = (params.get('ref') ?? '').trim();

  if (utmSource && utmMedium) {
    return `${utmSource}/${utmMedium}`;
  }
  if (utmSource) {
    return utmSource;
  }
  if (utmMedium) {
    return `medium:${utmMedium}`;
  }
  if (ref) {
    return `ref:${ref}`;
  }

  if (referrer && referrer.trim()) {
    try {
      const refUrl = new URL(referrer.trim());
      if (refUrl.hostname) {
        return `referrer:${refUrl.hostname.replace(/^www\./i, '')}`;
      }
    } catch {
      // Ignore malformed referrer URL
    }
  }

  return 'direct';
}

export function getOrInitSourceChannel(
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null,
  search?: string,
  referrer?: string
): string {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.sessionStorage
        : null;

  if (targetStorage) {
    try {
      const existing = targetStorage.getItem(SOURCE_CHANNEL_SESSION_KEY);
      if (existing && existing.trim()) {
        return existing.trim();
      }
    } catch {
      // Ignore storage read failure in restricted mode
    }
  }

  const resolved = resolveSourceChannelFromLocation(
    search !== undefined
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : '',
    referrer !== undefined
      ? referrer
      : typeof document !== 'undefined'
        ? document.referrer
        : ''
  );

  if (targetStorage) {
    try {
      targetStorage.setItem(SOURCE_CHANNEL_SESSION_KEY, resolved);
    } catch {
      // Ignore storage write failure
    }
  }

  return resolved;
}

export type PreferredContactMethod = 'Email' | 'Phone' | 'WhatsApp';

export interface DealEnquiryFormInput {
  name: string;
  email: string;
  phone: string;
  preferredContact: PreferredContactMethod;
  message: string;
  consent: boolean;
}

export interface DealEnquiryValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof DealEnquiryFormInput | 'contact', string>>;
}

export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Validates UK mobile and landline telephone numbers (e.g. 07700 900123, +44 7700 900123, 020 7946 0000).
 */
export function isValidUkPhoneNumber(phone: string): boolean {
  const compact = phone.replace(/[\s()-]/g, '');
  if (!compact) return false;
  return /^(?:(?:\+44|0044)[1-9]\d{8,9}|0[1-9]\d{8,9})$/.test(compact);
}

export function validateDealEnquiry(
  input: DealEnquiryFormInput
): DealEnquiryValidationResult {
  const errors: Partial<Record<keyof DealEnquiryFormInput | 'contact', string>> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name.';
  }

  const hasEmail = Boolean(input.email && input.email.trim());
  const hasPhone = Boolean(input.phone && input.phone.trim());

  if (!hasEmail && !hasPhone) {
    errors.contact = 'Please provide either an email address or a UK phone number.';
  } else {
    if (hasEmail && !isValidEmailAddress(input.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (hasPhone && !isValidUkPhoneNumber(input.phone)) {
      errors.phone = 'Please enter a valid UK phone or mobile number (e.g. 07700 900123).';
    }
  }

  if (!input.consent) {
    errors.consent =
      'Please confirm that UK Clearance Hub may use your details to respond to your enquiry.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface EnquiryPayloadContext {
  leadId: string;
  deal: Deal;
  pageUrl: string;
  sourceChannel: string;
  submittedAtIso?: string;
  selectedOptionSummary?: string;
}

/**
 * Builds the direct WhatsApp enquiry URL for the green "WhatsApp Enquiry" button on the Deal Detail page.
 * Includes Lead ID, product title, product ID, and page URL.
 */
export function buildDirectWhatsAppDealUrl(ctx: EnquiryPayloadContext): string {
  const lines = [
    'Hello UK Clearance Hub, I would like to enquire about this deal:',
    `• Lead ID: ${ctx.leadId}`,
    `• Deal: ${ctx.deal.title}`,
    `• Product ID: ${ctx.deal.id}`,
    `• Supplier Ref: ${ctx.deal.supplierId}`,
    ...(ctx.selectedOptionSummary ? [`• Selected Option: ${ctx.selectedOptionSummary}`] : []),
    `• Source: ${ctx.sourceChannel}`,
    `• Page URL: ${ctx.pageUrl}`,
  ];
  return `https://wa.me/447344540043?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * Builds the formatted summary body shared by the modal's "Send via WhatsApp" and "Send via Email" actions.
 * Internal IDs (product ID & supplier ID) are included in the outbound message text for the UKCH team,
 * never displayed in the visible UI.
 */
export function buildEnquiryMessageBody(
  ctx: EnquiryPayloadContext,
  form: DealEnquiryFormInput
): string {
  const timestamp = ctx.submittedAtIso ?? new Date().toISOString();
  const referralDestination = ctx.deal.dealUrl && ctx.deal.dealUrl.trim() ? ctx.deal.dealUrl : 'none';

  const lines = [
    `Lead ID: ${ctx.leadId}`,
    `Date & Time: ${timestamp}`,
    `Product ID: ${ctx.deal.id}`,
    `Product Title: ${ctx.deal.title}`,
    `Internal Supplier ID: ${ctx.deal.supplierId}`,
    `Source Channel: ${ctx.sourceChannel}`,
    `Referral Destination: ${referralDestination}`,
    `Page URL: ${ctx.pageUrl}`,
    ...(ctx.selectedOptionSummary ? [`Selected Variant: ${ctx.selectedOptionSummary}`] : []),
    '',
    '--- Customer Details ---',
    `Name: ${form.name.trim()}`,
    `Email: ${form.email.trim() || 'Not provided'}`,
    `Phone: ${form.phone.trim() || 'Not provided'}`,
    `Preferred Contact Method: ${form.preferredContact}`,
    `Message: ${form.message.trim() || 'No additional message'}`,
  ];

  return lines.join('\n');
}

export function buildModalWhatsAppUrl(
  ctx: EnquiryPayloadContext,
  form: DealEnquiryFormInput
): string {
  const body = buildEnquiryMessageBody(ctx, form);
  return `https://wa.me/447344540043?text=${encodeURIComponent(body)}`;
}

export function buildModalMailtoUrl(
  ctx: EnquiryPayloadContext,
  form: DealEnquiryFormInput
): string {
  const subject = `Enquiry ${ctx.leadId} – ${ctx.deal.title}`;
  const body = buildEnquiryMessageBody(ctx, form);
  return `mailto:${BRAND_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Verifies that rendered visible text does not leak any internal Product ID (UKCH-P-XXXX)
 * or internal Supplier ID (SUP-XXX).
 */
export function containsInternalIdInText(visibleText: string): boolean {
  if (!visibleText) return false;
  return /\bUKCH-P-\d{4}\b/.test(visibleText) || /\bSUP-\d{3}\b/.test(visibleText);
}
