import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import { Deal, formatGBP } from '../../data/deals';
import {
  DealEnquiryFormInput,
  PreferredContactMethod,
  buildModalMailtoUrl,
  buildModalWhatsAppUrl,
  generateLeadId,
  getOrInitSourceChannel,
  validateDealEnquiry,
} from '../../data/leadFlow';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { OVERLAY_CHANGE_EVENT } from '../ui/FloatingWhatsAppButton';

export interface ReservationEnquiryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  deal: Deal | null;
  initialLeadId?: string;
  selectedOptionSummary?: string;
}

const INITIAL_FORM_STATE: DealEnquiryFormInput = {
  name: '',
  email: '',
  phone: '',
  preferredContact: 'Email',
  message: '',
  consent: false,
};

export const ReservationEnquiryModal: React.FC<ReservationEnquiryModalProps> = ({
  isOpen: isOpenProp,
  onClose,
  deal,
  initialLeadId,
  selectedOptionSummary,
}) => {
  const isOpen = isOpenProp !== undefined ? isOpenProp : Boolean(deal);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] =
    useState<DealEnquiryFormInput>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DealEnquiryFormInput | 'contact', string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string>(() =>
    initialLeadId && initialLeadId.trim()
      ? initialLeadId.trim()
      : generateLeadId()
  );
  const [submittedAtIso, setSubmittedAtIso] = useState<string>('');
  const [rendered, setRendered] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(deal);

  const handleClearAndClose = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setSubmitted(false);
    setErrors({});
    onClose();
  }, [onClose]);

  useModalFocusTrap(isOpen, modalCardRef, handleClearAndClose);

  useEffect(() => {
    if (deal) {
      setActiveDeal(deal);
    }
  }, [deal]);

  // Generate or adopt fresh Lead ID whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setLeadId(
        initialLeadId && initialLeadId.trim()
          ? initialLeadId.trim()
          : generateLeadId()
      );
      setSubmitted(false);
      setErrors({});
    }
  }, [isOpen, initialLeadId, deal?.slug]);

  // Smooth fade + scale enter/exit animation, body scroll lock & overlay broadcast while open
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
        document.body.dataset.enquiryModalOpen = 'true';
        window.dispatchEvent(new CustomEvent(OVERLAY_CHANGE_EVENT));
      }
      const raf = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.dataset.enquiryModalOpen = 'false';
        window.dispatchEvent(new CustomEvent(OVERLAY_CHANGE_EVENT));
      }
      const timer = window.setTimeout(() => {
        setRendered(false);
      }, 260);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.dataset.enquiryModalOpen = 'false';
        window.dispatchEvent(new CustomEvent(OVERLAY_CHANGE_EVENT));
      }
    };
  }, []);

  const resolvedDeal = deal ?? activeDeal;
  if (!rendered || !resolvedDeal) return null;

  const sourceChannel = getOrInitSourceChannel();
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/deals/${resolvedDeal.slug}`
      : `https://ukclearancehub.co.uk/deals/${resolvedDeal.slug}`;

  const payloadContext = {
    leadId,
    deal: resolvedDeal,
    pageUrl,
    sourceChannel,
    submittedAtIso: submittedAtIso || new Date().toISOString(),
    selectedOptionSummary,
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateDealEnquiry(formState);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmittedAtIso(new Date().toISOString());
    setSubmitted(true);
  };

  const handleAfterSend = () => {
    window.setTimeout(() => {
      setFormState(INITIAL_FORM_STATE);
      setSubmitted(false);
      setErrors({});
      onClose();
    }, 150);
  };

  const whatsAppHref = submitted
    ? buildModalWhatsAppUrl(payloadContext, formState)
    : '#';
  const mailtoHref = submitted
    ? buildModalMailtoUrl(payloadContext, formState)
    : '#';

  const emailDescribedBy = [
    errors.email ? 'enquiry-error-email' : '',
    errors.contact ? 'enquiry-error-contact' : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const phoneDescribedBy = [
    errors.phone ? 'enquiry-error-phone' : '',
    errors.contact ? 'enquiry-error-contact' : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-enquiry-modal-title"
      data-testid="deal-enquiry-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-bg/75 backdrop-blur-sm transition-opacity duration-250 overflow-y-auto ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClearAndClose();
        }
      }}
    >
      <div
        ref={modalCardRef}
        className={`relative w-full max-w-[560px] my-auto bg-surface rounded-xl border border-border-strong p-6 sm:p-8 text-text shadow-theme transition-[transform,opacity] duration-250 ${
          visible
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-95 translate-y-2 opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label="Close enquiry modal"
          data-testid="enquiry-modal-close"
          onClick={handleClearAndClose}
          className="absolute top-3.5 right-3.5 inline-flex items-center justify-center w-11 h-11 text-muted hover:text-text cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="enquiry-modal-summary"
            className="py-2 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2
                className="w-8 h-8 text-success shrink-0 stroke-[1.8]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-semibold text-primary">
                  Enquiry Ready to Send
                </p>
                <h3
                  id="deal-enquiry-modal-title"
                  className="type-h3 font-heading text-text"
                >
                  Choose how to send your enquiry
                </h3>
              </div>
            </div>

            {/* Lead ID & Summary Card (never shows internal product ID or supplier ID) */}
            <div className="rounded-xl border border-border bg-bg-elevated p-4 mb-5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                <span className="text-xs text-muted font-medium">
                  Your Reference Lead ID
                </span>
                <span
                  data-testid="enquiry-summary-lead-id"
                  className="font-mono text-xs font-bold text-primary bg-surface px-2.5 py-1 rounded-md border border-border-strong tabular-nums"
                >
                  {leadId}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-muted">Deal</span>
                <span className="text-xs font-semibold text-text text-right">
                  {resolvedDeal.title} ({formatGBP(resolvedDeal.price)})
                </span>
              </div>

              {selectedOptionSummary && (
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs text-muted">Selected Option</span>
                  <span className="text-xs text-text text-right">
                    {selectedOptionSummary}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-muted">Name</span>
                <span className="text-xs text-text font-medium text-right">
                  {formState.name.trim()}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-muted">Contact</span>
                <span className="text-xs text-text text-right">
                  {[formState.email.trim(), formState.phone.trim()]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  (Prefers {formState.preferredContact})
                </span>
              </div>
            </div>

            <p className="text-xs text-muted mb-5">
              Select WhatsApp or Email below to send your enquiry with Lead ID{' '}
              <strong className="text-text font-mono">{leadId}</strong> directly
              to our UK team. Your details are not stored on this device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="enquiry-send-whatsapp-btn"
                onClick={handleAfterSend}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-success hover:opacity-95 px-4 py-3 min-h-[44px] text-xs font-heading font-bold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Send via WhatsApp</span>
              </a>

              <a
                href={mailtoHref}
                data-testid="enquiry-send-email-btn"
                onClick={handleAfterSend}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-4 py-3 min-h-[44px] text-xs font-heading font-bold text-primary-contrast shadow-xs transition-all active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Send via Email</span>
              </a>
            </div>

            <button
              type="button"
              data-testid="enquiry-summary-close-btn"
              onClick={handleClearAndClose}
              className="mt-4 self-center px-3 py-2 min-h-[44px] text-xs text-muted hover:text-text underline underline-offset-4 cursor-pointer"
            >
              Close and clear form
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-accent mb-1">
              Supplier Deal Enquiry · Reference {leadId}
            </p>
            <h3
              id="deal-enquiry-modal-title"
              className="type-h3 font-heading text-text mb-1.5 pr-10"
            >
              Enquire about {resolvedDeal.title}
            </h3>
            <p className="text-xs text-muted mb-5">
              Guide price{' '}
              <span className="text-text font-semibold tabular-nums">
                {formatGBP(resolvedDeal.price)}
              </span>{' '}
              · Sold and delivered by{' '}
              <span className="text-text font-medium">{resolvedDeal.supplierName}</span>.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name (Required) */}
              <div>
                <label
                  htmlFor="enquiry-name"
                  className="block text-xs font-semibold text-text mb-1.5"
                >
                  Full Name <span className="text-accent">*</span>
                </label>
                <input
                  id="enquiry-name"
                  type="text"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'enquiry-error-name' : undefined}
                  data-testid="enquiry-input-name"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="e.g. Eleanor Vance"
                  className="w-full bg-bg rounded-lg border border-border-strong px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:bg-surface focus:border-primary focus:outline-none"
                />
                {errors.name && (
                  <p
                    id="enquiry-error-name"
                    role="alert"
                    data-testid="enquiry-error-name"
                    className="mt-1 text-xs text-accent font-medium"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email or UK Phone (At least one required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="enquiry-email"
                    className="block text-xs font-semibold text-text mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="enquiry-email"
                    type="email"
                    aria-invalid={Boolean(errors.email || errors.contact)}
                    aria-describedby={emailDescribedBy}
                    data-testid="enquiry-input-email"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder="name@example.co.uk"
                    className="w-full bg-bg rounded-lg border border-border-strong px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:bg-surface focus:border-primary focus:outline-none"
                  />
                  {errors.email && (
                    <p
                      id="enquiry-error-email"
                      role="alert"
                      data-testid="enquiry-error-email"
                      className="mt-1 text-xs text-accent font-medium"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="enquiry-phone"
                    className="block text-xs font-semibold text-text mb-1.5"
                  >
                    UK Phone / Mobile
                  </label>
                  <input
                    id="enquiry-phone"
                    type="tel"
                    aria-invalid={Boolean(errors.phone || errors.contact)}
                    aria-describedby={phoneDescribedBy}
                    data-testid="enquiry-input-phone"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, phone: e.target.value }))
                    }
                    placeholder="07700 900123"
                    className="w-full bg-bg rounded-lg border border-border-strong px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:bg-surface focus:border-primary focus:outline-none"
                  />
                  {errors.phone && (
                    <p
                      id="enquiry-error-phone"
                      role="alert"
                      data-testid="enquiry-error-phone"
                      className="mt-1 text-xs text-accent font-medium"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {errors.contact && (
                <p
                  id="enquiry-error-contact"
                  role="alert"
                  data-testid="enquiry-error-contact"
                  className="-mt-2 text-xs text-accent font-medium"
                >
                  {errors.contact}
                </p>
              )}

              {/* Preferred Contact Method */}
              <div>
                <label
                  htmlFor="enquiry-preferred-contact"
                  className="block text-xs font-semibold text-text mb-1.5"
                >
                  Preferred Contact Method
                </label>
                <select
                  id="enquiry-preferred-contact"
                  data-testid="enquiry-select-preferred-contact"
                  value={formState.preferredContact}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      preferredContact: e.target.value as PreferredContactMethod,
                    }))
                  }
                  className="w-full bg-bg rounded-lg border border-border-strong px-3.5 py-2.5 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              {/* Optional Message */}
              <div>
                <label
                  htmlFor="enquiry-message"
                  className="block text-xs font-semibold text-text mb-1.5"
                >
                  Message <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="enquiry-message"
                  rows={3}
                  data-testid="enquiry-input-message"
                  value={formState.message}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, message: e.target.value }))
                  }
                  placeholder="Questions about stock availability, delivery postcode, or condition grading…"
                  className="w-full bg-bg rounded-lg border border-border-strong px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:bg-surface focus:border-primary focus:outline-none resize-y"
                />
              </div>

              {/* Required Consent Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    id="enquiry-consent"
                    type="checkbox"
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={
                      errors.consent ? 'enquiry-error-consent' : undefined
                    }
                    data-testid="enquiry-checkbox-consent"
                    checked={formState.consent}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, consent: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    I agree that UK Clearance Hub may use these details to
                    respond to my enquiry, as described in the{' '}
                    <Link
                      to="/privacy"
                      onClick={handleClearAndClose}
                      className="text-primary hover:underline"
                    >
                      Privacy Notice
                    </Link>
                    . <span className="text-accent">*</span>
                  </span>
                </label>
                {errors.consent && (
                  <p
                    id="enquiry-error-consent"
                    role="alert"
                    data-testid="enquiry-error-consent"
                    className="mt-1 text-xs text-accent font-medium"
                  >
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClearAndClose}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-muted hover:text-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="enquiry-submit-btn"
                  className="px-5 py-2.5 min-h-[44px] rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-xs tracking-tight cursor-pointer active:scale-[0.98]"
                >
                  Continue to Send
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export const DealEnquiryModal = ReservationEnquiryModal;
