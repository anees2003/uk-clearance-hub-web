import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { gsap } from '../animations/gsap';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FaqCategory,
  filterFaqItems,
  findFaqByHash,
} from '../data/informativePages';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';

export const FaqPage: React.FC = () => {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const hashItem = findFaqByHash(FAQ_ITEMS, window.location.hash);
    if (hashItem) {
      return { [hashItem.id]: true };
    }
    return { [FAQ_ITEMS[0].id]: true };
  });

  const pageRef = useRef<HTMLDivElement | null>(null);

  const filteredItems = useMemo(
    () => filterFaqItems(FAQ_ITEMS, activeCategory, searchQuery),
    [activeCategory, searchQuery]
  );

  // Handle deep-link hashes such as /faq#delivery-time or legal hashes (#privacy, #cookies, #terms)
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash || location.hash;
      if (!hash) return;
      const cleanId = hash.replace(/^#/, '').trim();
      const matched = findFaqByHash(FAQ_ITEMS, hash);
      if (matched) {
        setActiveCategory('All');
        setSearchQuery('');
        setOpenIds((prev) => ({ ...prev, [matched.id]: true }));
      }

      window.setTimeout(() => {
        const targetEl = document.getElementById(matched ? matched.id : cleanId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [location.hash]);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = pageEl.querySelectorAll<HTMLElement>('[data-faq-reveal]');
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

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      ref={pageRef}
      data-testid="faq-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero with Live Search Input */}
      <EditorialPageHero
        testId="faq-hero"
        documentTitle="Frequently Asked Questions"
        eyebrow="Client Support & Guidance"
        heading="Frequently asked questions"
        intro="Everything you need to know about how UK Clearance Hub connects you with verified UK suppliers, ex-display and overstock condition grading, two-person UK delivery, and statutory 14-day home returns."
      >
        <div className="relative max-w-xl">
          <label htmlFor="faq-live-search" className="sr-only">
            Search frequently asked questions
          </label>
          <Search
            aria-hidden="true"
            className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            id="faq-live-search"
            data-testid="faq-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. delivery time, ex-display, returns, VAT)..."
            className="w-full bg-surface border border-border-strong pl-11 pr-10 py-3.5 text-sm text-text placeholder:text-muted focus:bg-surface-2 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none rounded-sm transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search query"
              data-testid="faq-search-clear-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </EditorialPageHero>

      {/* 2. Category Tabs + Animated Accordion */}
      <section data-faq-reveal className="section-padding">
        <Container>
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
            <div
              role="tablist"
              aria-label="Filter FAQ by category"
              className="flex flex-wrap items-center gap-2"
            >
              {FAQ_CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={`faq-tab-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-2 text-xs uppercase tracking-[0.16em] border transition-all cursor-pointer rounded-sm active:scale-[0.98] ${
                      active
                        ? 'bg-primary text-primary-contrast border-primary font-semibold'
                        : 'bg-surface text-text/80 border-border-strong hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <span
              data-testid="faq-results-count"
              className="text-xs uppercase tracking-[0.16em] text-muted tabular-nums font-semibold"
            >
              Showing {filteredItems.length} of {FAQ_ITEMS.length} questions
            </span>
          </div>

          {/* Accordion List */}
          {filteredItems.length > 0 ? (
            <div
              data-testid="faq-accordion-list"
              className="max-w-4xl divide-y divide-border border-y border-border bg-surface px-6 rounded-sm shadow-theme"
            >
              {filteredItems.map((item, idx) => {
                const isOpen = Boolean(openIds[item.id]);
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    data-testid={`faq-item-${item.id}`}
                    className="py-1"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      data-testid={`faq-btn-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                      className="w-full py-5 flex items-start justify-between gap-6 text-left cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs text-accent font-semibold tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted font-semibold">
                            {item.category}
                          </span>
                        </div>
                        <h2 className="type-h3 font-heading text-text group-hover:text-primary transition-colors">
                          {item.question}
                        </h2>
                      </div>

                      <ChevronDown
                        className={`w-5 h-5 text-muted shrink-0 mt-2 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        data-testid={`faq-panel-${item.id}`}
                        className="pb-6 pl-0 sm:pl-7 pr-4 text-text/85 type-body max-w-3xl transition-all duration-300"
                      >
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              data-testid="faq-empty-state"
              className="py-16 px-6 text-center border border-border bg-surface max-w-4xl rounded-sm shadow-theme"
            >
              <p className="type-eyebrow text-muted mb-2">
                No Matching Questions
              </p>
              <h2 className="type-h3 font-heading text-text mb-3">
                We couldn&apos;t find any questions matching &ldquo;{searchQuery}&rdquo;
              </h2>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
              >
                Reset Search &amp; Filters
              </Button>
            </div>
          )}

          {/* Legal & Referral Disclosure Anchors (#privacy, #cookies, #terms) */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div
              id="privacy"
              className="border border-border bg-surface p-6 rounded-sm shadow-theme flex flex-col justify-between"
            >
              <div>
                <Eyebrow tone="blue" className="mb-2">
                  UK GDPR &amp; Data Protection
                </Eyebrow>
                <h3 className="font-heading font-bold text-lg text-text mb-2">
                  Privacy Notice
                </h3>
                <p className="type-small text-muted mb-4">
                  We only collect contact details you explicitly submit via our
                  enquiry forms or WhatsApp desk. We never sell personal data to
                  third-party mailing lists.
                </p>
              </div>
              <Button to="/privacy" variant="outline" size="md">
                Read Privacy Notice
              </Button>
            </div>

            <div
              id="cookies"
              className="border border-border bg-surface p-6 rounded-sm shadow-theme flex flex-col justify-between"
            >
              <div>
                <Eyebrow tone="blue" className="mb-2">
                  UK PECR &amp; Browser Storage
                </Eyebrow>
                <h3 className="font-heading font-bold text-lg text-text mb-2">
                  Cookie Policy
                </h3>
                <p className="type-small text-muted mb-4">
                  Strictly necessary storage remembers your theme and session
                  referral source, while optional analytics and marketing
                  cookies remain off unless you opt in.
                </p>
              </div>
              <Button to="/cookies" variant="outline" size="md">
                Read Cookie Policy
              </Button>
            </div>

            <div
              id="terms"
              className="border border-border bg-surface p-6 rounded-sm shadow-theme flex flex-col justify-between"
            >
              <div>
                <Eyebrow tone="orange" className="mb-2">
                  Referral Disclosure
                </Eyebrow>
                <h3 className="font-heading font-bold text-lg text-text mb-2">
                  Terms of Use
                </h3>
                <p className="type-small text-muted mb-4">
                  UK Clearance Hub is a product discovery and referral platform.
                  All stock, payments, delivery, and statutory UK warranties are
                  fulfilled directly by the verified supplier.
                </p>
              </div>
              <Button to="/terms" variant="outline" size="md">
                Read Terms of Use
              </Button>
            </div>
          </div>

          {/* Ending CTA: "Still have a question?" linking to /contact */}
          <div
            data-faq-reveal
            className="mt-16 border border-border-strong bg-bg-elevated bg-hero-glow text-text p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-sm shadow-theme"
          >
            <div className="max-w-xl">
              <Eyebrow tone="amber" className="mb-3">
                Direct Support Desk
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-3">
                Still have a question?
              </h2>
              <p className="type-small text-muted">
                Our UK team can answer questions about any featured deal, check
                supplier stock availability, or connect you via WhatsApp.
              </p>
            </div>

            <Button
              to="/contact"
              variant="cta"
              data-testid="faq-contact-cta-btn"
              className="shrink-0"
            >
              Ask Our Team
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
