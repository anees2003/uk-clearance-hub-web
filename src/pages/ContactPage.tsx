import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { gsap } from '../animations/gsap';
import {
  CONTACT_TOPICS,
  ContactFormInput,
  resolveContactTopicFromQuery,
  validateContactForm,
} from '../data/informativePages';
import {
  BRAND_EMAIL,
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_PREFILLED_URL,
} from '../data/brand';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';
import { ContactPillowsView } from '../three/SharedViewCanvas';

export const ContactPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get('topic');

  const [formState, setFormState] = useState<ContactFormInput>(() => ({
    name: '',
    email: '',
    phone: '',
    topic: resolveContactTopicFromQuery(topicParam),
    message: '',
  }));

  useEffect(() => {
    if (topicParam) {
      setFormState((prev) => ({
        ...prev,
        topic: resolveContactTopicFromQuery(topicParam),
      }));
    }
  }, [topicParam]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormInput, string>>
  >({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = pageEl.querySelectorAll<HTMLElement>('[data-contact-reveal]');
      blocks.forEach((block) => {
        if (reduced) {
          gsap.set(block, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          block,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });
    }, pageEl);

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!submitted || !successRef.current) return;
    gsap.fromTo(
      successRef.current,
      { opacity: 0, y: 18, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }
    );
  }, [submitted]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateContactForm(formState);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  return (
    <div
      ref={pageRef}
      data-testid="contact-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero */}
      <EditorialPageHero
        testId="contact-hero"
        documentTitle="Contact Us"
        eyebrow="Deal Support & Supplier Concierge"
        heading="Speak with our UK clearance specialists"
        intro="Whether you have a question about a clearance deal, want to check supplier stock and delivery timescales, or prefer to chat directly on WhatsApp—our team responds within two working hours."
      />

      {/* 2. Two-Column Layout: Left Form with Floating Labels + Right Contact Details & Floating 3D Pillows */}
      <section data-contact-reveal className="section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            {/* Left Column: Contact Form with Floating Labels */}
            <div className="lg:col-span-7 border border-border bg-surface p-6 sm:p-10 md:p-12 rounded-sm shadow-theme">
              {submitted ? (
                <div
                  ref={successRef}
                  role="status"
                  aria-live="polite"
                  data-testid="contact-form-success"
                  className="py-10 text-center flex flex-col items-center space-y-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-success stroke-[1.5]" aria-hidden="true" />
                  <Eyebrow tone="navy">Enquiry Received</Eyebrow>
                  <h2 className="type-h2 font-heading text-text">
                    Thank you, {formState.name}
                  </h2>
                  <p className="type-body text-muted max-w-md">
                    We have logged your enquiry regarding{' '}
                    <strong className="text-text font-semibold">
                      {formState.topic}
                    </strong>{' '}
                    and sent a copy to{' '}
                    <span className="text-text">{formState.email}</span>. A
                    member of our UK support team will reply within 2 working
                    hours (Mon–Sat, 9am–6pm).
                  </p>
                  <div className="pt-4">
                    <Button
                      type="button"
                      variant="primary"
                      data-testid="contact-reset-btn"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({
                          name: '',
                          email: '',
                          phone: '',
                          topic: CONTACT_TOPICS[0],
                          message: '',
                        });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <Eyebrow tone="orange" className="mb-2">
                      Direct Enquiry Form
                    </Eyebrow>
                    <h2 className="type-h3 font-heading text-text">
                      Send a message to our team
                    </h2>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    data-testid="contact-form"
                    className="space-y-6"
                  >
                    {/* Floating Label: Full Name */}
                    <div className="relative">
                      <input
                        id="contact-name"
                        data-testid="contact-input-name"
                        type="text"
                        required
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? 'contact-error-name' : undefined
                        }
                        placeholder=" "
                        value={formState.name}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, name: e.target.value }))
                        }
                        className="peer w-full bg-surface-2 border border-border-strong px-4 pt-6 pb-2.5 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none rounded-sm transition-colors"
                      />
                      <label
                        htmlFor="contact-name"
                        className="pointer-events-none absolute left-4 top-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:text-primary"
                      >
                        Full Name *
                      </label>
                      {errors.name && (
                        <p
                          id="contact-error-name"
                          role="alert"
                          data-testid="contact-error-name"
                          className="mt-1.5 text-xs text-accent font-medium"
                        >
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Floating Label: Email */}
                      <div className="relative">
                        <input
                          id="contact-email"
                          data-testid="contact-input-email"
                          type="email"
                          required
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={
                            errors.email ? 'contact-error-email' : undefined
                          }
                          placeholder=" "
                          value={formState.email}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              email: e.target.value,
                            }))
                          }
                          className="peer w-full bg-surface-2 border border-border-strong px-4 pt-6 pb-2.5 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none rounded-sm transition-colors"
                        />
                        <label
                          htmlFor="contact-email"
                          className="pointer-events-none absolute left-4 top-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:text-primary"
                        >
                          Email Address *
                        </label>
                        {errors.email && (
                          <p
                            id="contact-error-email"
                            role="alert"
                            data-testid="contact-error-email"
                            className="mt-1.5 text-xs text-accent font-medium"
                          >
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Floating Label: UK Phone */}
                      <div className="relative">
                        <input
                          id="contact-phone"
                          data-testid="contact-input-phone"
                          type="tel"
                          required
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={
                            errors.phone ? 'contact-error-phone' : undefined
                          }
                          placeholder=" "
                          value={formState.phone}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              phone: e.target.value,
                            }))
                          }
                          className="peer w-full bg-surface-2 border border-border-strong px-4 pt-6 pb-2.5 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none rounded-sm transition-colors"
                        />
                        <label
                          htmlFor="contact-phone"
                          className="pointer-events-none absolute left-4 top-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:text-primary"
                        >
                          UK Telephone / Mobile *
                        </label>
                        {errors.phone && (
                          <p
                            id="contact-error-phone"
                            role="alert"
                            data-testid="contact-error-phone"
                            className="mt-1.5 text-xs text-accent font-medium"
                          >
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Floating Label: Topic Select */}
                    <div className="relative">
                      <select
                        id="contact-topic"
                        data-testid="contact-select-topic"
                        aria-invalid={Boolean(errors.topic)}
                        aria-describedby={
                          errors.topic ? 'contact-error-topic' : undefined
                        }
                        value={formState.topic}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, topic: e.target.value }))
                        }
                        className="w-full bg-surface-2 border border-border-strong px-4 pt-6 pb-2.5 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none cursor-pointer rounded-sm transition-colors"
                      >
                        {CONTACT_TOPICS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor="contact-topic"
                        className="pointer-events-none absolute left-4 top-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted"
                      >
                        Enquiry Topic *
                      </label>
                      {errors.topic && (
                        <p
                          id="contact-error-topic"
                          role="alert"
                          data-testid="contact-error-topic"
                          className="mt-1.5 text-xs text-accent font-medium"
                        >
                          {errors.topic}
                        </p>
                      )}
                    </div>

                    {/* Floating Label: Message */}
                    <div className="relative">
                      <textarea
                        id="contact-message"
                        data-testid="contact-input-message"
                        rows={5}
                        required
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={
                          errors.message ? 'contact-error-message' : undefined
                        }
                        placeholder=" "
                        value={formState.message}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            message: e.target.value,
                          }))
                        }
                        className="peer w-full bg-surface-2 border border-border-strong px-4 pt-7 pb-3 text-sm text-text focus:bg-surface focus:border-primary focus:outline-none resize-y rounded-sm transition-colors"
                      />
                      <label
                        htmlFor="contact-message"
                        className="pointer-events-none absolute left-4 top-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:text-primary"
                      >
                        Your Message (Include item name or UK postcode if applicable) *
                      </label>
                      {errors.message && (
                        <p
                          id="contact-error-message"
                          role="alert"
                          data-testid="contact-error-message"
                          className="mt-1.5 text-xs text-accent font-medium"
                        >
                          {errors.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                      <span className="text-xs text-muted">
                        All enquiries answered by our UK team within 2 working hours.
                      </span>
                      <Button
                        type="submit"
                        variant="cta"
                        data-testid="contact-submit-btn"
                      >
                        Send Enquiry
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Right Column: Contact Details, Showroom Address Placeholder, Floating 3D Pillows & Quick Links */}
            <div className="lg:col-span-5 space-y-8">
              {/* Small 3D Pillows_Front + Pillows_Back Element Softly Floating */}
              <ContactPillowsView />

              {/* Contact Details Card */}
              <div
                data-testid="contact-details-card"
                className="border border-border bg-surface p-6 sm:p-8 space-y-6 rounded-sm shadow-theme"
              >
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-1 font-semibold">
                    WhatsApp &amp; Telephone Desk
                  </span>
                  <a
                    href={BRAND_WHATSAPP_PREFILLED_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading font-bold text-2xl text-text hover:text-primary transition-colors tabular-nums block"
                  >
                    {BRAND_WHATSAPP_DISPLAY}
                  </a>
                  <p className="text-xs text-muted mt-0.5">
                    Instant WhatsApp chat with our UK deals team
                  </p>
                </div>

                <div className="pt-5 border-t border-border">
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-1 font-semibold">
                    Official Email Support
                  </span>
                  <a
                    href={`mailto:${BRAND_EMAIL}`}
                    className="font-heading font-bold text-xl sm:text-2xl text-text hover:text-primary transition-colors break-all"
                  >
                    {BRAND_EMAIL}
                  </a>
                </div>

                <div className="pt-5 border-t border-border">
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted mb-1 font-semibold">
                    Opening Hours
                  </span>
                  <p
                    data-testid="contact-opening-hours"
                    className="text-base font-bold text-text"
                  >
                    Mon–Sat 9am–6pm
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Closed Sundays &amp; UK Bank Holidays
                  </p>
                </div>

                {/* Clearly Marked Showroom Address Placeholder */}
                <div
                  data-testid="contact-address-placeholder"
                  className="pt-5 border-t border-border"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted font-semibold">
                      UK Registered Office &amp; Hub
                    </span>
                    <span className="bg-amber/20 text-amber px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.14em] font-semibold rounded-xs">
                      Placeholder — To Replace
                    </span>
                  </div>
                  <address className="not-italic text-sm text-text bg-surface-2 border border-dashed border-border-strong p-3.5 rounded-sm">
                    <strong className="block font-semibold text-text mb-1">
                      [SHOWROOM ADDRESS PLACEHOLDER — TO BE REPLACED]
                    </strong>
                    UK Clearance Hub Midlands Office, Unit 4 Heritage Mill
                    Trading Estate, [Street Name], [Town/City], [Postcode e.g.
                    DE1 2AB], United Kingdom
                  </address>
                </div>

                {/* Direct Links to FAQ and Delivery Pages */}
                <div className="pt-5 border-t border-border flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/faq"
                    data-testid="contact-link-faq"
                    className="flex-1 flex items-center justify-between border border-border-strong px-4 py-3 text-xs uppercase tracking-[0.16em] text-text font-semibold hover:bg-primary hover:text-primary-contrast hover:border-primary transition-all rounded-sm"
                  >
                    <span>Read FAQs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/delivery-returns"
                    data-testid="contact-link-delivery"
                    className="flex-1 flex items-center justify-between border border-border-strong px-4 py-3 text-xs uppercase tracking-[0.16em] text-text font-semibold hover:bg-primary hover:text-primary-contrast hover:border-primary transition-all rounded-sm"
                  >
                    <span>Delivery &amp; Returns</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
