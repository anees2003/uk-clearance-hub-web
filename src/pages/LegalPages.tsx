import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cookie,
  ExternalLink,
  Mail,
  MessageCircle,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { gsap } from '../animations/gsap';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';
import { useCookieConsent } from '../context/CookieConsentContext';
import { COOKIE_CATEGORY_DEFINITIONS } from '../data/cookieConsent';
import {
  BRAND_EMAIL,
  BRAND_EMAIL_HREF,
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_PREFILLED_URL,
} from '../data/brand';
import {
  HOW_IT_WORKS_DISCLOSURE,
  PRODUCT_CONDITION_GUIDE_CARDS,
} from '../data/homePageData';
import {
  buildBreadcrumbJsonLd,
  ROUTE_SEO_DEFAULTS,
  useSeo,
} from '../utils/seo';

const ADVISER_REVIEW_NOTE =
  'This page should be reviewed by a qualified adviser before launch.';

const AdviserReviewBanner: React.FC<{ testId: string }> = ({ testId }) => (
  <div
    role="note"
    data-testid={testId}
    className="mb-10 rounded-xl border border-amber/40 bg-surface-2 p-4 sm:p-5 flex items-start gap-3.5 shadow-theme"
  >
    <AlertTriangle
      className="w-5 h-5 text-amber shrink-0 mt-0.5"
      aria-hidden="true"
    />
    <div className="space-y-1 text-xs sm:text-sm">
      <p className="font-heading font-bold text-text">{ADVISER_REVIEW_NOTE}</p>
      <p className="text-muted">
        Drafted in plain UK English for UK Clearance Hub&apos;s commission-based
        product discovery and referral model. Please confirm retention periods,
        business registration details, and liability wording with a qualified UK
        legal or data-protection adviser prior to public launch.
      </p>
    </div>
  </div>
);

function usePageReveal(scopeRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scopeEl = scopeRef.current;
    if (!scopeEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = scopeEl.querySelectorAll<HTMLElement>('[data-legal-reveal]');
      blocks.forEach((block) => {
        if (reduced) {
          gsap.set(block, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          block,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });
    }, scopeEl);

    return () => {
      ctx.revert();
    };
  }, [scopeRef]);
}

/* ============================================================================
 * 1. /privacy — Privacy Notice (UK GDPR)
 * ========================================================================== */
export const PrivacyPolicyPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  usePageReveal(pageRef);

  const seoMeta = ROUTE_SEO_DEFAULTS['/privacy'];
  useSeo({
    title: seoMeta.title,
    description: seoMeta.description,
    canonicalPath: '/privacy',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Privacy Notice', path: '/privacy' },
    ]),
  });

  return (
    <div
      ref={pageRef}
      data-testid="privacy-page"
      className="min-h-screen bg-bg text-text"
    >
      <EditorialPageHero
        testId="privacy-hero"
        documentTitle="Privacy Notice & UK GDPR Data Protection"
        eyebrow="UK GDPR & Data Protection Act 2018"
        heading="Privacy Notice"
        intro="How UK Clearance Hub handles customer enquiry details, Lead IDs, supplier introductions, and your UK data protection rights."
      />

      <section className="section-padding">
        <Container>
          <div className="max-w-4xl space-y-10">
            <AdviserReviewBanner testId="privacy-adviser-note" />

            {/* 1. Who We Are */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">01 · Controller Identity</Eyebrow>
              <h2 className="type-h3 font-heading text-text">Who we are</h2>
              <p className="type-body text-text/85">
                <strong>UK Clearance Hub</strong> operates this website as a
                commission-based UK product discovery and referral service. We
                do not sell products directly, hold warehouse inventory, or
                process customer payments on this website.
              </p>
              <p className="type-small text-muted">
                For the purposes of the UK General Data Protection Regulation
                (UK GDPR) and the Data Protection Act 2018, UK Clearance Hub is
                the data controller for personal information you submit directly
                to us. You can contact our privacy desk at{' '}
                <a
                  href={BRAND_EMAIL_HREF}
                  className="text-primary underline underline-offset-4 hover:text-primary-hover font-medium"
                >
                  {BRAND_EMAIL}
                </a>{' '}
                or via WhatsApp on{' '}
                <span className="text-text font-medium tabular-nums">
                  {BRAND_WHATSAPP_DISPLAY}
                </span>
                .
              </p>
            </article>

            {/* 2. What We Collect */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-theme"
            >
              <Eyebrow tone="blue">02 · Information Collected</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                What personal data we collect
              </h2>
              <p className="type-body text-text/85">
                We only collect personal details that you actively choose to
                send to us when making a deal or supplier enquiry:
              </p>
              <ul className="space-y-2.5 type-small text-text/85 pl-5 list-disc">
                <li>
                  <strong>Contact details you provide:</strong> your full name,
                  email address, and/or UK telephone number, plus your preferred
                  contact channel (Email, Phone, or WhatsApp).
                </li>
                <li>
                  <strong>Enquiry content:</strong> your message or question and
                  the specific clearance product or category you enquired about.
                </li>
                <li>
                  <strong>Referral reference metadata:</strong> a randomly
                  generated <strong>Lead ID</strong> (formatted{' '}
                  <code className="font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">
                    UKCH-YYYYMMDD-XXXX
                  </code>
                  ) and the session <strong>source channel</strong> (for example{' '}
                  <code className="font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">
                    direct
                  </code>{' '}
                  or a campaign{' '}
                  <code className="font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">
                    utm_source
                  </code>
                  ) so our team and the fulfilling supplier can match your
                  enquiry accurately.
                </li>
              </ul>
              <p className="type-small text-muted">
                We do <strong>not</strong> collect payment card details, banking
                information, or account passwords, and we never save your
                enquiry form details in browser <code className="font-mono">localStorage</code>.
              </p>
            </article>

            {/* 3. Why We Collect It & Lawful Bases */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-theme"
            >
              <Eyebrow tone="blue">03 · Purpose &amp; Lawful Bases</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Why we use your details and our UK GDPR lawful bases
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="rounded-lg border border-border bg-surface-2 p-5 space-y-2">
                  <h3 className="font-heading text-base font-bold text-text">
                    Consent (Article 6(1)(a) UK GDPR)
                  </h3>
                  <p className="type-small text-muted">
                    When you tick the consent box on our enquiry modal or contact
                    form, you give us permission to respond to your enquiry and,
                    where requested, introduce you to the relevant fulfilling UK
                    supplier. Consent also governs any optional analytics or
                    marketing cookies.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface-2 p-5 space-y-2">
                  <h3 className="font-heading text-base font-bold text-text">
                    Legitimate Interests (Article 6(1)(f) UK GDPR)
                  </h3>
                  <p className="type-small text-muted">
                    Operating our referral enquiry desk, attributing supplier
                    introductions via Lead IDs, preventing spam or misuse, and
                    answering pre-contractual questions you initiate via email or
                    WhatsApp.
                  </p>
                </div>
              </div>
            </article>

            {/* 4. Sharing With Suppliers & Communication Channels */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-theme"
            >
              <Eyebrow tone="blue">04 · Suppliers, WhatsApp &amp; Email</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Sharing with fulfilling UK suppliers &amp; communication channels
              </h2>
              <p className="type-body text-text/85">
                Where you ask us to check stock, delivery, or specifications for
                a specific product, we pass your enquiry details and Lead ID
                only to the relevant verified UK supplier responsible for
                fulfilling that item. Once you deal directly with or purchase
                from a supplier, that supplier acts as an independent data
                controller for fulfilling your order, delivery, and statutory
                warranty.
              </p>
              <p className="type-small text-muted">
                <strong>WhatsApp &amp; Email channels:</strong> Clicking
                &ldquo;Send via WhatsApp&rdquo; or &ldquo;Send via Email&rdquo;
                opens your own WhatsApp or email application with your pre-filled
                Lead ID message. Messages sent over WhatsApp are transmitted via
                WhatsApp Ireland Limited / Meta Platforms under your existing
                WhatsApp account settings and privacy policy. We never sell or
                rent your personal data to third-party marketing lists.
              </p>
            </article>

            {/* 5. Data Retention */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">05 · Storage &amp; Retention</Eyebrow>
              <h2 className="type-h3 font-heading text-text">Data retention</h2>
              <p className="type-body text-text/85">
                We retain email and WhatsApp enquiry correspondence only for as
                long as needed to answer your question, confirm any supplier
                referral attribution, and resolve follow-up queries.
              </p>
              <p className="type-small text-muted">
                <strong>Retention schedule (placeholder to confirm):</strong>{' '}
                Routine customer enquiry records are scheduled for deletion or
                anonymisation after{' '}
                <strong className="text-text">
                  [12 months — placeholder period to be confirmed before launch]
                </strong>{' '}
                from the date of last correspondence, unless a longer period is
                required by UK tax, accounting, or legal obligations.
              </p>
            </article>

            {/* 6. Your UK GDPR Rights & ICO Link */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-theme"
            >
              <Eyebrow tone="blue">06 · Your Legal Rights</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Your rights under UK data protection law
              </h2>
              <p className="type-body text-text/85">
                Under the UK GDPR, you have the right to:
              </p>
              <ul className="space-y-2 type-small text-text/85 pl-5 list-disc">
                <li>
                  <strong>Access:</strong> request a copy of the personal data
                  we hold about you.
                </li>
                <li>
                  <strong>Correction (rectification):</strong> ask us to correct
                  inaccurate or incomplete details.
                </li>
                <li>
                  <strong>Deletion (erasure):</strong> ask us to delete your
                  personal data where there is no lawful reason for us to keep
                  it.
                </li>
                <li>
                  <strong>Objection &amp; restriction:</strong> object to
                  processing based on legitimate interests or withdraw consent
                  at any time.
                </li>
              </ul>
              <p className="type-small text-muted pt-2">
                To exercise any of these rights, email{' '}
                <a
                  href={BRAND_EMAIL_HREF}
                  className="text-primary underline underline-offset-4 hover:text-primary-hover font-medium"
                >
                  {BRAND_EMAIL}
                </a>
                . You also have the right to lodge a complaint with the UK
                supervisory authority, the{' '}
                <strong>Information Commissioner&apos;s Office (ICO)</strong>,
                at{' '}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="privacy-ico-link"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary-hover font-medium"
                >
                  <span>https://ico.org.uk</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                .
              </p>
            </article>

            {/* 7. Cookies Summary & Contact */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-theme"
            >
              <Eyebrow tone="blue">07 · Cookies &amp; Privacy Contact</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Cookies summary &amp; how to contact us
              </h2>
              <p className="type-body text-text/85">
                We use strictly necessary browser storage (<code className="font-mono text-xs">localStorage</code>{' '}
                and <code className="font-mono text-xs">sessionStorage</code>)
                to remember your dark/light theme choice, your cookie consent
                preferences, and the referral source channel for your visit.
                Optional analytics and marketing cookies are disabled by default.
              </p>
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button to="/cookies" variant="primary">
                  Read Full Cookie Policy
                </Button>
                <a
                  href={BRAND_EMAIL_HREF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-strong bg-surface-2 hover:border-primary text-xs font-heading font-semibold uppercase tracking-[0.08em] text-text"
                >
                  <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>{BRAND_EMAIL}</span>
                </a>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </div>
  );
};

/* ============================================================================
 * 2. /cookies — Cookie Policy (UK PECR)
 * ========================================================================== */
export const CookiePolicyPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  usePageReveal(pageRef);
  const { consent, openSettings } = useCookieConsent();

  const seoMeta = ROUTE_SEO_DEFAULTS['/cookies'];
  useSeo({
    title: seoMeta.title,
    description: seoMeta.description,
    canonicalPath: '/cookies',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Cookie Policy', path: '/cookies' },
    ]),
  });

  return (
    <div
      ref={pageRef}
      data-testid="cookies-page"
      className="min-h-screen bg-bg text-text"
    >
      <EditorialPageHero
        testId="cookies-hero"
        documentTitle="Cookie Policy & Browser Storage Controls"
        eyebrow="UK PECR & Browser Storage Transparency"
        heading="Cookie Policy"
        intro="Clear details on every cookie and browser storage key used on UK Clearance Hub, why it is used, and how to change your preferences at any time."
      >
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-testid="cookie-policy-open-settings-btn"
            onClick={openSettings}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer shadow-theme active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Open Cookie Settings</span>
          </button>

          <span
            data-testid="cookie-policy-current-status"
            className="text-xs text-muted"
          >
            {consent
              ? `Saved preferences: Necessary On · Analytics ${
                  consent.categories.analytics ? 'On' : 'Off'
                } · Marketing ${consent.categories.marketing ? 'On' : 'Off'}`
              : 'No optional cookies enabled (default state)'}
          </span>
        </div>
      </EditorialPageHero>

      <section className="section-padding">
        <Container>
          <div className="max-w-4xl space-y-10">
            <AdviserReviewBanner testId="cookies-adviser-note" />

            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">How We Use Storage</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Cookies and browser storage under UK PECR
              </h2>
              <p className="type-body text-text/85">
                Under the UK Privacy and Electronic Communications Regulations
                (PECR), we ask for your consent before setting or reading any
                non-essential cookies or browser storage. We do not load any
                third-party analytics or advertising scripts by default.
              </p>
            </article>

            {/* Category Breakdown */}
            <div data-legal-reveal className="space-y-5">
              <h2 className="type-h2 font-heading text-text">
                Cookie categories &amp; storage keys
              </h2>

              <div className="grid grid-cols-1 gap-5">
                {COOKIE_CATEGORY_DEFINITIONS.map((cat) => (
                  <article
                    key={cat.id}
                    data-testid={`cookies-page-category-${cat.id}`}
                    className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="type-h3 font-heading text-text">
                        {cat.title}
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {cat.badge}
                      </span>
                    </div>
                    <p className="type-body text-text/85">{cat.description}</p>
                    <div className="pt-2 border-t border-border text-xs text-muted">
                      <strong className="text-text font-semibold">
                        Keys &amp; storage location:
                      </strong>{' '}
                      {cat.storageKeys.join(' · ')}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Manage Settings Box */}
            <div
              data-legal-reveal
              className="rounded-xl border border-border-strong bg-bg-elevated bg-hero-glow p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-theme"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <Cookie className="w-4 h-4" aria-hidden="true" />
                  <span>Update Your Choice Anytime</span>
                </div>
                <h2 className="type-h3 font-heading text-text">
                  Want to change your cookie preferences?
                </h2>
                <p className="type-small text-muted">
                  You can reopen the cookie settings modal below or from the
                  &ldquo;Cookie Settings&rdquo; link in the website footer at
                  any time.
                </p>
              </div>

              <button
                type="button"
                data-testid="cookie-policy-bottom-settings-btn"
                onClick={openSettings}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span>Manage Cookie Settings</span>
              </button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

/* ============================================================================
 * 3. /terms — Terms of Use
 * ========================================================================== */
export const TermsOfUsePage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  usePageReveal(pageRef);

  const seoMeta = ROUTE_SEO_DEFAULTS['/terms'];
  useSeo({
    title: seoMeta.title,
    description: seoMeta.description,
    canonicalPath: '/terms',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Terms of Use', path: '/terms' },
    ]),
  });

  return (
    <div
      ref={pageRef}
      data-testid="terms-page"
      className="min-h-screen bg-bg text-text"
    >
      <EditorialPageHero
        testId="terms-hero"
        documentTitle="Terms of Use & Referral Service Disclosure"
        eyebrow="Website Terms & Referral Disclosure"
        heading="Terms of Use"
        intro="Please read these terms carefully before using UK Clearance Hub to browse clearance deals, follow supplier referral links, or submit an enquiry."
      />

      <section className="section-padding">
        <Container>
          <div className="max-w-4xl space-y-10">
            <AdviserReviewBanner testId="terms-adviser-note" />

            {/* 1. Referral Model Explained */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="orange">01 · Referral Business Model</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                We are a product discovery &amp; referral platform — we do not
                sell products
              </h2>
              <p className="type-body text-text/85">
                <strong>UK Clearance Hub</strong> is an online product discovery
                and referral service. We showcase clearance, overstock,
                end-of-line, refurbished, graded, and ex-display deals offered
                by third-party UK suppliers.
              </p>
              <p className="type-body text-text/85">
                We do <strong>not</strong> own or hold stock, we do not operate
                a shopping cart or checkout, and we do not take payments from
                customers. When you decide to purchase a product, your contract
                of sale is formed solely and directly with the fulfilling
                supplier. Final prices, stock availability, order acceptance,
                payment processing, UK delivery, returns, refunds, and statutory
                product warranties are the sole responsibility of the supplier.
              </p>
            </article>

            {/* 2. Affiliate / Commission Disclosure */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">02 · Commercial Transparency</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Affiliate &amp; referral commission disclosure
              </h2>
              <p className="type-body text-text/85">
                {HOW_IT_WORKS_DISCLOSURE}
              </p>
              <p className="type-small text-muted">
                Outbound links to supplier websites include transparent referral
                parameters (such as{' '}
                <code className="font-mono text-xs">
                  utm_source=ukclearancehub
                </code>{' '}
                and a Lead ID reference) so the supplier can identify that your
                visit or enquiry originated on UK Clearance Hub.
              </p>
            </article>

            {/* 3. Accuracy of Listings */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">03 · Listing Information</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Accuracy of listings, prices &amp; sample deals
              </h2>
              <p className="type-body text-text/85">
                Clearance stock moves quickly. While we work to keep product
                descriptions, condition grades (<em>New</em>,{' '}
                <em>Refurbished</em>, <em>Graded</em>, <em>Ex-display</em>), and
                GBP (£) guide prices accurate, all prices and stock statuses are
                subject to confirmation by the fulfilling supplier at the time
                you view the deal or enquire.
              </p>
              <p className="type-small text-muted">
                Reference (&ldquo;Was&rdquo;) prices and saving percentages are
                displayed only where a reference price has been verified. Items
                labelled <strong>&ldquo;Sample listing&rdquo;</strong> are
                illustrative catalogue demonstrations shown while live supplier
                feeds are finalised.
              </p>
            </article>

            {/* 4. Links to Third-Party Sites */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">04 · External Websites</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Links to third-party supplier websites
              </h2>
              <p className="type-body text-text/85">
                Clicking &ldquo;View Deal&rdquo; takes you to an external
                website operated by an independent supplier or retail partner.
                We do not control third-party websites and are not responsible
                for their content, availability, checkout security, or privacy
                practices. Always check the supplier&apos;s own terms and
                conditions, delivery charges, and returns policy before
                completing a purchase.
              </p>
            </article>

            {/* 5. Limitation of Liability Placeholder */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="orange">05 · Liability (Placeholder)</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Limitation of liability
              </h2>
              <p className="type-body text-text/85">
                Nothing in these Terms of Use excludes or limits liability where
                it would be unlawful to do so under UK law (including liability
                for death or personal injury caused by negligence, or fraud).
              </p>
              <p className="type-small text-muted">
                <strong>[Legal adviser placeholder]:</strong> Subject to the
                above, UK Clearance Hub provides deal discovery information on
                an &ldquo;as available&rdquo; basis and is not a party to any
                contract of sale between you and a third-party supplier. Full
                limitation-of-liability wording should be confirmed by a
                qualified legal adviser before launch.
              </p>
            </article>

            {/* 6. Governing Law */}
            <article
              data-legal-reveal
              className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-3 shadow-theme"
            >
              <Eyebrow tone="blue">06 · Jurisdiction</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Governing law (England and Wales)
              </h2>
              <p className="type-body text-text/85">
                These Terms of Use and any dispute or claim arising out of or in
                connection with them are governed by and construed in accordance
                with the laws of <strong>England and Wales</strong>. You and we
                agree that the courts of England and Wales shall have
                jurisdiction, without affecting any mandatory statutory consumer
                protections that apply in Scotland or Northern Ireland.
              </p>
            </article>
          </div>
        </Container>
      </section>
    </div>
  );
};

/* ============================================================================
 * 4. /how-it-works — How UK Clearance Hub Works
 * ========================================================================== */
const CUSTOMER_REFERRAL_STEPS = [
  {
    number: '01',
    title: 'Find a deal',
    description:
      'Browse clearance deals across Electronics & Gadgets, Home Appliances, and Home & Living—or explore our interactive 3D bedroom set to compare bed sizes, mattresses, and furniture.',
  },
  {
    number: '02',
    title: 'View Deal or Enquire',
    description:
      'Click "View Deal" to go straight to the supplier’s website, or click "Enquire Now" / WhatsApp to ask our UK desk about stock, dimensions, or delivery.',
  },
  {
    number: '03',
    title: 'Buy from the supplier',
    description:
      'Complete your purchase directly with the fulfilling UK supplier. We never take payments on this site or add middleman checkout fees.',
  },
  {
    number: '04',
    title: 'Supplier delivers',
    description:
      'The supplier dispatches your order from their UK warehouse and handles delivery updates, returns, and any applicable supplier warranty.',
  },
];

export const HowItWorksPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  usePageReveal(pageRef);

  const seoMeta = ROUTE_SEO_DEFAULTS['/how-it-works'];
  useSeo({
    title: seoMeta.title,
    description: seoMeta.description,
    canonicalPath: '/how-it-works',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'How It Works', path: '/how-it-works' },
    ]),
  });

  return (
    <div
      ref={pageRef}
      data-testid="how-it-works-page"
      className="min-h-screen bg-bg text-text"
    >
      <EditorialPageHero
        testId="how-it-works-hero"
        documentTitle="How Our UK Referral & Deal Service Works"
        eyebrow="Transparent UK Deal Discovery"
        heading="How UK Clearance Hub works"
        intro="We find genuine clearance deals from trusted UK suppliers so you can shop overstock, end-of-line, graded, and ex-display lines with clear condition notes and direct supplier fulfilment."
      >
        <div className="flex flex-wrap items-center gap-3.5">
          <Button to="/deals" variant="orange">
            Browse All Deals
          </Button>
          <Button to="/contact?topic=supplier" variant="outline">
            Partner as a UK Supplier
          </Button>
        </div>
      </EditorialPageHero>

      {/* 1. 4-Step Customer Journey */}
      <section
        data-legal-reveal
        data-testid="how-it-works-steps-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Step-by-Step for Shoppers"
            title="From discovery to supplier delivery in four steps"
            subtitle="UK Clearance Hub is a commission-based product discovery and referral service. We never hold stock or process payments—every order is fulfilled directly by the supplier."
            className="mb-12"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CUSTOMER_REFERRAL_STEPS.map((step) => (
              <article
                key={step.number}
                data-testid={`how-it-works-page-step-${step.number}`}
                className="rounded-xl border border-border bg-surface p-6 flex flex-col justify-between shadow-theme"
              >
                <div>
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-heading text-sm font-extrabold tabular-nums mb-5">
                    {step.number}
                  </span>
                  <h2 className="type-h3 font-heading text-text mb-2.5">
                    {step.title}
                  </h2>
                  <p className="type-small text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Commission Disclosure Banner */}
          <div
            data-testid="how-it-works-page-commission"
            className="mt-10 rounded-xl border border-border-strong bg-surface-2 px-6 py-4 flex items-center gap-3.5"
          >
            <Scale
              className="w-5 h-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm text-muted">
              <strong className="text-text font-semibold">
                Commission disclosure:
              </strong>{' '}
              {HOW_IT_WORKS_DISCLOSURE}
            </p>
          </div>
        </Container>
      </section>

      {/* 2. What Sample Listing, Verified Savings & Lead IDs Mean */}
      <section
        data-legal-reveal
        data-testid="how-it-works-transparency-section"
        className="section-padding border-b border-border bg-bg-elevated"
      >
        <Container>
          <SectionHeading
            eyebrow="Clear Labels, Zero Guesswork"
            title="Understanding our deal labels & Lead IDs"
            subtitle="We believe clearance shopping should be completely transparent. Here is what every badge and reference on our site means."
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="rounded-xl border border-border bg-surface p-6 sm:p-7 space-y-3 shadow-theme">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Verified Savings Only</span>
              </div>
              <h3 className="type-h3 font-heading text-text">
                When we show a &ldquo;Was&rdquo; price
              </h3>
              <p className="type-small text-muted leading-relaxed">
                We only display a struck-through &ldquo;Was&rdquo; reference
                price and an orange percentage saving badge when the reference
                price is higher than the current deal price <strong>and</strong>{' '}
                has been marked as verified. If a reference price is unverified,
                we show only the clean selling price in GBP (£).
              </p>
            </article>

            <article className="rounded-xl border border-border bg-surface p-6 sm:p-7 space-y-3 shadow-theme">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Catalogue Status</span>
              </div>
              <h3 className="type-h3 font-heading text-text">
                What &ldquo;Sample listing&rdquo; means
              </h3>
              <p className="type-small text-muted leading-relaxed">
                Deals carrying a subtle <strong>Sample listing</strong> badge
                demonstrate how verified clearance stock is presented while
                partner supplier feeds are finalised. Sample listings do not
                publish live Schema.org <code className="font-mono">Offer</code>{' '}
                markup in search engines until confirmed live by the supplier.
              </p>
            </article>

            <article className="rounded-xl border border-border bg-surface p-6 sm:p-7 space-y-3 shadow-theme">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-success">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Enquiry Tracking</span>
              </div>
              <h3 className="type-h3 font-heading text-text">
                How Lead IDs work
              </h3>
              <p className="type-small text-muted leading-relaxed">
                Whenever you click &ldquo;View Deal&rdquo; or submit an enquiry,
                we generate a unique reference such as{' '}
                <code className="font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded text-text">
                  UKCH-20261112-A9F2
                </code>
                . Quoting this Lead ID on WhatsApp or email lets our UK desk and
                the supplier locate the exact deal immediately.
              </p>
            </article>
          </div>
        </Container>
      </section>

      {/* 3. Product Condition Guide */}
      <section
        data-legal-reveal
        data-testid="how-it-works-conditions-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Honest Condition Grading"
            title="Product condition grades explained"
            subtitle="Every deal is assigned one of four clear condition grades. Click any grade below to filter live deals."
            className="mb-10"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCT_CONDITION_GUIDE_CARDS.map((card) => (
              <Link
                key={card.condition}
                to={card.to}
                data-testid={`how-it-works-condition-${card.condition}`}
                className="group rounded-xl border border-border bg-surface p-6 flex flex-col justify-between shadow-theme hover:border-primary/60 hover:-translate-y-1 transition-all"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary block mb-2">
                    {card.badgeText}
                  </span>
                  <h3 className="type-h3 font-heading text-text mb-2 group-hover:text-primary transition-colors">
                    {card.condition}
                  </h3>
                  <p className="type-small text-muted leading-relaxed mb-5">
                    {card.summary}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-[0.08em] text-accent">
                  <span>Browse {card.condition} deals</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. For UK Suppliers Section linking to /contact?topic=supplier */}
      <section
        data-legal-reveal
        data-testid="how-it-works-suppliers-section"
        className="section-padding"
      >
        <Container>
          <div className="rounded-2xl border border-border-strong bg-bg-elevated bg-hero-glow p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-theme">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
                <Store className="w-4 h-4" aria-hidden="true" />
                <span>For UK Manufacturers, Distributors &amp; Showrooms</span>
              </div>
              <h2 className="type-h2 font-heading text-text">
                Are you a UK supplier with clearance or overstock lines?
              </h2>
              <p className="type-body text-muted max-w-2xl">
                We partner with verified UK suppliers across Electronics &amp;
                Gadgets, Home Appliances, and Home &amp; Living to promote
                excess, end-of-line, graded, and ex-display stock on a
                transparent referral basis. You keep control of pricing,
                stock, and direct UK dispatch.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-text/85">
                <span className="inline-flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>Direct dispatch from your UK warehouse</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle
                    className="w-4 h-4 text-success"
                    aria-hidden="true"
                  />
                  <span>Qualified buyer enquiries with Lead IDs</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <Button
                to="/contact?topic=supplier"
                variant="orange"
                data-testid="how-it-works-supplier-cta"
              >
                Enquire as a Supplier
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
