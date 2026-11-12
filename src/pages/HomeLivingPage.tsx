import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Compass, Ruler, Truck } from 'lucide-react';
import { BedSetHandle, StudioScene } from '../three';
import {
  ASSEMBLY_CHAPTERS,
  useAssemblyTimeline,
} from '../animations/useAssemblyTimeline';
import { gsap, ScrollTrigger } from '../animations/gsap';
import { splitLines, SplitLinesResult } from '../animations/splitLines';
import { AssemblyChapterPanel } from '../components/home/AssemblyChapterPanel';
import { ChapterProgress } from '../components/ui/ChapterProgress';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/products/ProductCard';
import { ReservationEnquiryModal } from '../components/products/ReservationEnquiryModal';
import { Deal } from '../data/deals';
import {
  getLiveHomeLivingDeals,
  HOME_LIVING_GUIDE_CARDS,
} from '../data/homePageData';
import {
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_PREFILLED_URL,
} from '../data/brand';
import {
  buildBreadcrumbJsonLd,
  ROUTE_SEO_DEFAULTS,
  useSeo,
} from '../utils/seo';

export const HomeLivingPage: React.FC = () => {
  const bedSetRef = useRef<BedSetHandle | null>(null);
  const [bedSetHandle, setBedSetHandle] = useState<BedSetHandle | null>(null);
  const chaptersWrapperRef = useRef<HTMLDivElement | null>(null);
  const lowerContentRef = useRef<HTMLDivElement | null>(null);
  const dealsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const guidesHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const [enquireDeal, setEnquireDeal] = useState<Deal | null>(null);

  const homeLivingDeals = useMemo(() => getLiveHomeLivingDeals(), []);

  const hlSeo = ROUTE_SEO_DEFAULTS['/home-living'];
  useSeo({
    title: hlSeo.title,
    description: hlSeo.description,
    canonicalPath: '/home-living',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Home & Living', path: '/home-living' },
    ]),
  });

  const handleBedSetReady = useCallback((handle: BedSetHandle) => {
    bedSetRef.current = handle;
    setBedSetHandle(handle);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  useAssemblyTimeline({
    bedSet: bedSetHandle,
    chaptersWrapperRef,
  });

  // Reveal animations for the lower solid --bg section covering the canvas
  useEffect(() => {
    const scopeEl = lowerContentRef.current;
    if (!scopeEl) return;

    const splits: SplitLinesResult[] = [];
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const headings = [dealsHeadingRef.current, guidesHeadingRef.current].filter(
        Boolean
      ) as HTMLElement[];

      headings.forEach((headingEl) => {
        const split = splitLines(headingEl);
        splits.push(split);
        if (reduced) {
          gsap.set(split.lineInners, { yPercent: 0 });
        } else {
          gsap.fromTo(
            split.lineInners,
            { yPercent: 105 },
            {
              yPercent: 0,
              duration: 0.85,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: headingEl,
                start: 'top 88%',
                once: true,
              },
            }
          );
        }
      });

      const staggerGroups = scopeEl.querySelectorAll<HTMLElement>(
        '[data-hl-stagger-group]'
      );
      staggerGroups.forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>('[data-hl-stagger-item]');
        if (items.length === 0) return;
        if (reduced) {
          gsap.set(items, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: group,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });
    }, scopeEl);

    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  const renderGuideIcon = (id: string) => {
    switch (id) {
      case 'mattress-guide':
        return <Compass className="w-5 h-5 text-primary" aria-hidden="true" />;
      case 'bed-size-guide':
        return <Ruler className="w-5 h-5 text-accent" aria-hidden="true" />;
      default:
        return <Truck className="w-5 h-5 text-primary" aria-hidden="true" />;
    }
  };

  return (
    <div data-testid="home-living-page" className="relative w-full">
      {/* Chapter Progress Bar (Desktop right-edge vertical track & stops, Mobile 2px top bar) */}
      <ChapterProgress chaptersWrapperRef={chaptersWrapperRef} />

      {/* Screen-reader text alternative for the decorative 3D assembly canvas */}
      <p className="sr-only">
        Interactive 3D showcase of a 9-part UK bedroom set (hardwood bed base,
        hybrid pocket-sprung mattress, winged upholstered headboard, pillows,
        duvet, throw, and matching bedside tables) that assembles as you scroll.
      </p>

      {/* Fixed Full-Screen 3D Studio Scene behind HTML content (mounted only on /home-living) */}
      <div
        aria-hidden="true"
        data-testid="home-living-3d-canvas-wrapper"
        className="fixed inset-0 w-full h-[100dvh] z-0 pointer-events-none"
      >
        <StudioScene
          ref={bedSetRef}
          enableOrbitControls={false}
          showCornerProgress={false}
          initialAssembled={false}
          onBedSetReady={handleBedSetReady}
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* 8 Scroll-Driven Assembly Chapter Sections (100vh each) */}
      <div
        ref={chaptersWrapperRef}
        data-testid="assembly-chapters-wrapper"
        className="relative z-10 w-full pointer-events-none"
      >
        {ASSEMBLY_CHAPTERS.map((chapter) => (
          <AssemblyChapterPanel key={chapter.id} chapter={chapter} />
        ))}
      </div>

      {/* Solid --bg Section Covering the Fixed 3D Canvas after the 8 chapters */}
      <div
        ref={lowerContentRef}
        id="home-living-catalogue"
        data-testid="home-living-lower-section"
        className="relative z-20 w-full bg-bg border-t border-border"
      >
        {/* 1. Live Home & Living Deals Grid */}
        <section
          aria-labelledby="home-living-deals-heading"
          data-testid="home-living-deals-section"
          className="section-padding border-b border-border"
        >
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <Eyebrow tone="orange" className="mb-2.5">
                  Home &amp; Living Clearance
                </Eyebrow>
                <h2
                  id="home-living-deals-heading"
                  ref={dealsHeadingRef}
                  className="type-h2 font-heading text-text"
                >
                  Live bedroom &amp; living deals
                </h2>
                <p className="mt-2 text-sm text-muted max-w-2xl">
                  Every bed frame, pocket-sprung mattress, headboard, bedside table,
                  and sofa below is sourced from vetted UK suppliers. Prices and
                  stock are confirmed directly by the supplier.
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  to="/deals?category=Home%20%26%20Living"
                  variant="outline"
                  data-testid="home-living-view-all-btn"
                >
                  View all Home &amp; Living deals
                </Button>
              </div>
            </div>

            <div
              data-hl-stagger-group
              data-testid="home-living-deals-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {homeLivingDeals.map((deal) => (
                <div
                  key={deal.slug}
                  data-hl-stagger-item
                  className="h-full"
                >
                  <ProductCard
                    deal={deal}
                    onEnquire={(selected) => setEnquireDeal(selected)}
                    fromDealsUrl="/home-living"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* 2. Quick Links to Mattress Guide, Bed Size Guide, and Delivery & Returns */}
        <section
          aria-labelledby="home-living-guides-heading"
          data-testid="home-living-guides-section"
          className="section-padding border-b border-border bg-bg-elevated"
        >
          <Container>
            <div className="max-w-2xl mb-10">
              <Eyebrow tone="blue" className="mb-2.5">
                Buying Guides &amp; Room Planning
              </Eyebrow>
              <h2
                id="home-living-guides-heading"
                ref={guidesHeadingRef}
                className="type-h2 font-heading text-text"
              >
                Plan your bedroom with confidence
              </h2>
              <p className="mt-2 text-sm text-muted">
                Unsure whether a King or Super King fits your room, or which spring
                tension suits your sleeping position? Use our specialist UK guides.
              </p>
            </div>

            <div
              data-hl-stagger-group
              data-testid="home-living-guides-grid"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {HOME_LIVING_GUIDE_CARDS.map((card) => (
                <Link
                  key={card.id}
                  to={card.to}
                  data-hl-stagger-item
                  data-testid={`home-living-guide-card-${card.id}`}
                  className="group flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-surface border border-border hover:border-primary/50 hover:-translate-y-1 shadow-theme hover:shadow-theme-hover transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        {card.eyebrow}
                      </span>
                      <span className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        {renderGuideIcon(card.id)}
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold text-text group-hover:text-primary transition-colors mb-2.5">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-heading font-bold uppercase tracking-[0.12em] text-primary">
                    <span>{card.ctaLabel}</span>
                    <ArrowRight
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* 3. WhatsApp Enquiry CTA */}
        <section
          aria-label="Home and Living WhatsApp enquiry"
          data-testid="home-living-whatsapp-cta"
          className="section-padding"
        >
          <Container>
            <div className="rounded-2xl bg-surface border border-border-strong p-6 sm:p-10 md:p-12 shadow-theme bg-hero-glow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <Eyebrow tone="orange" className="mb-2.5">
                  Direct UK Bedroom Desk
                </Eyebrow>
                <h2 className="type-h3 font-heading text-text">
                  Checking stock, fabric swatches or UK delivery slots?
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-muted leading-relaxed">
                  Message our UK team on WhatsApp for fast confirmation on bed
                  dimensions, mattress tensions, or current supplier lead times.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <a
                  href={BRAND_WHATSAPP_PREFILLED_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="home-living-whatsapp-btn"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-success hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] text-white font-heading font-bold text-sm tracking-tight shadow-theme transition-all whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Chat on WhatsApp ({BRAND_WHATSAPP_DISPLAY})</span>
                </a>

                <Button
                  to="/deals?category=Home%20%26%20Living"
                  variant="outline"
                >
                  Shop Home &amp; Living Deals
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </div>

      {/* Lead ID Enquiry Modal */}
      <ReservationEnquiryModal
        deal={enquireDeal}
        onClose={() => setEnquireDeal(null)}
      />
    </div>
  );
};
