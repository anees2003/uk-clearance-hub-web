import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { gsap } from '../animations/gsap';
import { splitLines, SplitLinesResult } from '../animations/splitLines';
import { HeroBannerCarousel } from '../components/home/HeroBannerCarousel';
import { ProductCard } from '../components/products/ProductCard';
import { ReservationEnquiryModal } from '../components/products/ReservationEnquiryModal';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import {
  BRAND_SOCIAL_LINKS,
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_PREFILLED_URL,
  BrandSocialLink,
} from '../data/brand';
import { Deal, DEALS } from '../data/deals';
import {
  CategoryTileStat,
  computeCategoryTileStats,
  getFeaturedClearanceDeals,
  getNewestLiveDeals,
  HOW_IT_WORKS_DISCLOSURE,
  HOW_IT_WORKS_STEPS,
  PRODUCT_CONDITION_GUIDE_CARDS,
  TRUST_STRIP_ITEMS,
  TrustStripItem,
} from '../data/homePageData';
import {
  buildOrganizationJsonLd,
  ROUTE_SEO_DEFAULTS,
  useSeo,
} from '../utils/seo';

const SocialIconSvg: React.FC<{ id: BrandSocialLink['id'] }> = ({ id }) => {
  switch (id) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M13.5 21v-7.5h2.5l.38-3h-2.88V8.6c0-.87.24-1.46 1.49-1.46H16.5V4.45c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.81 1.38-3.81 3.91v2.26H8v3h2.41V21h3.09Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.81 4.81 0 0 0 12 7.2Zm0 7.92A3.12 3.12 0 1 1 15.12 12 3.12 3.12 0 0 1 12 15.12ZM18.12 7a1.12 1.12 0 1 1-1.12-1.12A1.12 1.12 0 0 1 18.12 7Zm3.18 1.14a5.54 5.54 0 0 0-1.51-3.92A5.54 5.54 0 0 0 15.87 2.7c-1.55-.09-6.19-.09-7.74 0a5.54 5.54 0 0 0-3.92 1.51A5.54 5.54 0 0 0 2.7 8.13c-.09 1.55-.09 6.19 0 7.74a5.54 5.54 0 0 0 1.51 3.92 5.54 5.54 0 0 0 3.92 1.51c1.55.09 6.19.09 7.74 0a5.54 5.54 0 0 0 3.92-1.51 5.54 5.54 0 0 0 1.51-3.92c.09-1.55.09-6.19 0-7.74Zm-2 9.4a3.16 3.16 0 0 1-1.78 1.78c-1.23.49-4.16.38-5.52.38s-4.29.11-5.52-.38a3.16 3.16 0 0 1-1.78-1.78c-.49-1.23-.38-4.16-.38-5.52s-.11-4.29.38-5.52a3.16 3.16 0 0 1 1.78-1.78c1.23-.49 4.16-.38 5.52-.38s4.29-.11 5.52.38a3.16 3.16 0 0 1 1.78 1.78c.49 1.23.38 4.16.38 5.52s.11 4.29-.38 5.52Z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M16.6 5.82a4.28 4.28 0 0 1-1.08-2.82h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.22-1.48Z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M18.24 3.5h2.86l-6.25 7.15L22.2 20.5h-5.76l-4.51-5.9-5.16 5.9H3.9l6.69-7.65L3.5 3.5h5.9l4.08 5.39 4.76-5.39Zm-1.01 15.28h1.59L8.58 5.13H6.88l10.35 13.65Z" />
        </svg>
      );
    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M12 3c2.8 0 4.9 1.93 5.06 4.78.04.67-.07 1.72-.14 2.38.28.18.67.27 1.07.27.47 0 .93-.17 1.24-.17.37 0 .68.23.68.58 0 .64-.78 1.06-1.47 1.3-.15.05-.75.23-.88.62-.11.34.15.79.42 1.19.93 1.4 2.21 2.26 3.02 2.55.23.08.4.27.4.5 0 .45-.78.83-1.97 1.03-.31.05-.52.38-.62.75-.11.42-.26.82-.68.82-.32 0-.73-.17-1.31-.17-.77 0-1.56.31-2.42.93-.93.67-1.69 1.04-2.39 1.04-.72 0-1.47-.37-2.4-1.04-.86-.62-1.65-.93-2.42-.93-.58 0-.99.17-1.31.17-.42 0-.57-.4-.68-.82-.1-.37-.31-.7-.62-.75-1.19-.2-1.97-.58-1.97-1.03 0-.23.17-.42.4-.5.81-.29 2.09-1.15 3.02-2.55.27-.4.53-.85.42-1.19-.13-.39-.73-.57-.88-.62-.69-.24-1.47-.66-1.47-1.3 0-.35.31-.58.68-.58.31 0 .77.17 1.24.17.4 0 .79-.09 1.07-.27-.07-.66-.18-1.71-.14-2.38C7.1 4.93 9.2 3 12 3Z" />
        </svg>
      );
  }
};

export const HomePage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const featuredRowRef = useRef<HTMLDivElement | null>(null);
  const howItWorksLineDesktopRef = useRef<HTMLDivElement | null>(null);
  const howItWorksSectionRef = useRef<HTMLElement | null>(null);

  const [enquireDeal, setEnquireDeal] = useState<Deal | null>(null);
  const [isDraggingRow, setIsDraggingRow] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);

  const categoryTiles = useMemo(() => computeCategoryTileStats(DEALS), []);
  const featuredDeals = useMemo(() => getFeaturedClearanceDeals(DEALS, 8), []);
  const newestDeals = useMemo(() => getNewestLiveDeals(DEALS, 8), []);

  const homeSeo = ROUTE_SEO_DEFAULTS['/'];
  useSeo({
    title: homeSeo.title,
    description: homeSeo.description,
    canonicalPath: '/',
    jsonLd: buildOrganizationJsonLd(),
  });

  // GSAP ScrollTrigger reveals (splitLines headings, staggered cards, and connecting line)
  useEffect(() => {
    const scopeEl = pageRef.current;
    if (!scopeEl) return;

    const splits: SplitLinesResult[] = [];
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // 1. Line-split section headings
      const headingEls = scopeEl.querySelectorAll<HTMLElement>(
        '[data-home-split-heading]'
      );
      headingEls.forEach((headingEl) => {
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

      // 2. Staggered card groups
      const staggerGroups = scopeEl.querySelectorAll<HTMLElement>(
        '[data-home-stagger-group]'
      );
      staggerGroups.forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>(
          '[data-home-stagger-item]'
        );
        if (items.length === 0) return;

        if (reduced) {
          gsap.set(items, { opacity: 1, y: 0 });
          return;
        }

        gsap.fromTo(
          items,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: group,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // 3. How It Works connecting line draw on scroll
      if (howItWorksLineDesktopRef.current && howItWorksSectionRef.current) {
        if (reduced) {
          gsap.set(howItWorksLineDesktopRef.current, { scaleX: 1 });
        } else {
          gsap.fromTo(
            howItWorksLineDesktopRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              ease: 'power2.out',
              duration: 1.1,
              scrollTrigger: {
                trigger: howItWorksSectionRef.current,
                start: 'top 78%',
                end: 'bottom 55%',
                scrub: 0.6,
              },
            }
          );
        }
      }
    }, scopeEl);

    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  const scrollFeaturedRow = (dir: -1 | 1) => {
    const row = featuredRowRef.current;
    if (!row) return;
    const scrollAmount = Math.max(320, Math.round(row.clientWidth * 0.72));
    row.scrollBy({
      left: dir * scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleRowPointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const row = featuredRowRef.current;
    if (!row) return;
    // Do not hijack clicks on links or buttons inside cards
    if ((e.target as HTMLElement).closest('a,button')) return;
    setIsDraggingRow(true);
    dragStartXRef.current = e.pageX - row.offsetLeft;
    dragStartScrollLeftRef.current = row.scrollLeft;
  };

  const handleRowPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRow || !featuredRowRef.current) return;
    e.preventDefault();
    const x = e.pageX - featuredRowRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.4;
    featuredRowRef.current.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  const stopRowDragging = () => {
    if (isDraggingRow) {
      setIsDraggingRow(false);
    }
  };

  const renderTrustIcon = (iconKey: TrustStripItem['iconKey']) => {
    switch (iconKey) {
      case 'clearance':
        return <BadgePercent className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />;
      case 'suppliers':
        return <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />;
      case 'delivery':
        return <Truck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5 text-success shrink-0" aria-hidden="true" />;
    }
  };

  const renderCategoryIcon = (iconKey: CategoryTileStat['iconKey']) => {
    switch (iconKey) {
      case 'cpu':
        return <Cpu className="w-6 h-6 text-primary" aria-hidden="true" />;
      case 'sparkles':
        return <Sparkles className="w-6 h-6 text-accent" aria-hidden="true" />;
      case 'bed':
        return <BedDouble className="w-6 h-6 text-primary" aria-hidden="true" />;
      case 'grid':
        return <LayoutGrid className="w-6 h-6 text-amber" aria-hidden="true" />;
    }
  };

  return (
    <div
      ref={pageRef}
      data-testid="deals-home-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. HERO BANNER CAROUSEL + SEARCH BAR & SUGGESTION CHIPS */}
      <HeroBannerCarousel />

      {/* 2. TRUST STRIP (4 compact items in a row) */}
      <section
        aria-label="Why shop with UK Clearance Hub"
        data-testid="home-trust-strip"
        className="py-5 border-y border-border bg-bg-elevated"
      >
        <Container>
          <div
            data-home-stagger-group
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {TRUST_STRIP_ITEMS.map((item) => (
              <div
                key={item.id}
                data-home-stagger-item
                data-testid={`trust-strip-item-${item.id}`}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
                  {renderTrustIcon(item.iconKey)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading text-sm font-bold text-text">
                    {item.title}
                  </h2>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. SHOP BY CATEGORY (4 tiles with live deal count & "From £<lowest price>") */}
      <section
        aria-labelledby="home-categories-heading"
        data-testid="home-categories-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Eyebrow tone="blue" className="mb-2">
                Browse by Department
              </Eyebrow>
              <h2
                id="home-categories-heading"
                data-home-split-heading
                className="type-h2 font-heading text-text"
              >
                Shop by category
              </h2>
            </div>
            <p className="text-sm text-muted max-w-md">
              Live clearance counts and starting prices updated directly from our
              active UK supplier catalogue.
            </p>
          </div>

          <div
            data-home-stagger-group
            data-testid="home-categories-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {categoryTiles.map((tile) => (
              <Link
                key={tile.id}
                to={tile.to}
                data-home-stagger-item
                data-testid={`home-category-tile-${tile.id}`}
                className="group flex flex-col justify-between p-6 rounded-xl bg-surface border border-border hover:border-primary/60 hover:-translate-y-1 shadow-theme hover:shadow-theme-hover transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <span className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                      {renderCategoryIcon(tile.iconKey)}
                    </span>
                    <span
                      data-testid={`home-category-count-${tile.id}`}
                      className="text-xs font-semibold text-muted tabular-nums"
                    >
                      {tile.liveCount} live deals
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-text group-hover:text-primary transition-colors mb-2">
                    {tile.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {tile.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <span
                    data-testid={`home-category-from-${tile.id}`}
                    className="font-heading text-sm font-extrabold text-accent tabular-nums"
                  >
                    {tile.fromPriceLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-heading font-bold text-text group-hover:text-primary transition-colors">
                    <span>Explore</span>
                    <ArrowRight
                      className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. FEATURED CLEARANCE DEALS (Horizontal scrollable/draggable row of 8 deals with biggest verified savings) */}
      <section
        aria-labelledby="home-featured-deals-heading"
        data-testid="home-featured-deals-section"
        className="section-padding border-b border-border bg-bg-elevated"
      >
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <Eyebrow tone="orange" className="mb-2">
                Verified Discounts
              </Eyebrow>
              <h2
                id="home-featured-deals-heading"
                data-home-split-heading
                className="type-h2 font-heading text-text"
              >
                Featured clearance deals
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Desktop Prev / Next Scroll Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Scroll featured deals left"
                  data-testid="featured-deals-prev-btn"
                  onClick={() => scrollFeaturedRow(-1)}
                  className="w-10 h-10 rounded-lg border border-border-strong bg-surface hover:border-primary hover:text-primary text-text inline-flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll featured deals right"
                  data-testid="featured-deals-next-btn"
                  onClick={() => scrollFeaturedRow(1)}
                  className="w-10 h-10 rounded-lg border border-border-strong bg-surface hover:border-primary hover:text-primary text-text inline-flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <Link
                to="/deals"
                data-testid="featured-deals-view-all-link"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border-strong bg-surface hover:border-primary text-xs font-heading font-bold uppercase tracking-[0.1em] text-text hover:text-primary transition-colors whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div
            ref={featuredRowRef}
            data-home-stagger-group
            data-testid="featured-deals-row"
            onMouseDown={handleRowPointerDown}
            onMouseMove={handleRowPointerMove}
            onMouseUp={stopRowDragging}
            onMouseLeave={stopRowDragging}
            className={`flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth select-none ${
              isDraggingRow ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {featuredDeals.map((deal) => (
              <div
                key={deal.slug}
                data-home-stagger-item
                className="w-[285px] sm:w-[310px] lg:w-[325px] shrink-0 snap-start"
              >
                <ProductCard
                  deal={deal}
                  onEnquire={(selected) => setEnquireDeal(selected)}
                  fromDealsUrl="/"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. NEW OFFERS ("New this week", grid of the 8 newest live deals) */}
      <section
        aria-labelledby="home-newest-deals-heading"
        data-testid="home-newest-deals-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Eyebrow tone="blue" className="mb-2">
                Latest Supplier Arrivals
              </Eyebrow>
              <h2
                id="home-newest-deals-heading"
                data-home-split-heading
                className="type-h2 font-heading text-text"
              >
                New this week
              </h2>
            </div>

            <Link
              to="/deals?sort=newest"
              data-testid="newest-deals-view-all-link"
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-[0.12em] text-primary hover:underline whitespace-nowrap"
            >
              <span>View all newest deals</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div
            data-home-stagger-group
            data-testid="newest-deals-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {newestDeals.map((deal) => (
              <div key={deal.slug} data-home-stagger-item className="h-full">
                <ProductCard
                  deal={deal}
                  onEnquire={(selected) => setEnquireDeal(selected)}
                  fromDealsUrl="/"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. HOW IT WORKS (3 steps with a connecting line that draws on scroll + commission disclosure) */}
      <section
        ref={howItWorksSectionRef}
        aria-labelledby="home-how-it-works-heading"
        data-testid="home-how-it-works-section"
        className="section-padding border-b border-border bg-bg-elevated"
      >
        <Container>
          <div className="max-w-2xl mb-12">
            <Eyebrow tone="orange" className="mb-2">
              Transparent Referral Model
            </Eyebrow>
            <h2
              id="home-how-it-works-heading"
              data-home-split-heading
              className="type-h2 font-heading text-text"
            >
              How buying through UK Clearance Hub works
            </h2>
          </div>

          <div className="relative">
            {/* Connecting Line on Desktop that draws on scroll */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-11 left-[12%] right-[12%] h-[2px] bg-border overflow-hidden pointer-events-none"
            >
              <div
                ref={howItWorksLineDesktopRef}
                data-testid="how-it-works-connecting-line"
                className="h-full w-full bg-primary origin-left will-change-transform"
              />
            </div>

            <div
              data-home-stagger-group
              className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
            >
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div
                  key={step.stepNumber}
                  data-home-stagger-item
                  data-testid={`how-it-works-step-${step.stepNumber}`}
                  className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-theme flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-lg bg-primary text-primary-contrast font-mono font-bold text-sm tabular-nums flex items-center justify-center mb-5 shadow-xs">
                      {step.stepNumber}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-text mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p
            data-testid="how-it-works-commission-disclosure"
            className="mt-8 text-xs sm:text-sm text-muted text-center max-w-2xl mx-auto"
          >
            {HOW_IT_WORKS_DISCLOSURE}
          </p>
        </Container>
      </section>

      {/* 7. PRODUCT CONDITION GUIDE (4 cards explaining New, Refurbished, Graded and Ex-display) */}
      <section
        aria-labelledby="home-condition-guide-heading"
        data-testid="home-condition-guide-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Eyebrow tone="blue" className="mb-2">
                Clear Stock Grading
              </Eyebrow>
              <h2
                id="home-condition-guide-heading"
                data-home-split-heading
                className="type-h2 font-heading text-text"
              >
                Product condition guide
              </h2>
            </div>
            <p className="text-sm text-muted max-w-md">
              Every listing states its exact condition grade upfront so you know
              precisely what to expect before contacting the supplier.
            </p>
          </div>

          <div
            data-home-stagger-group
            data-testid="home-condition-guide-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {PRODUCT_CONDITION_GUIDE_CARDS.map((card) => {
              const count = DEALS.filter(
                (d) => d.condition === card.condition
              ).length;
              return (
                <Link
                  key={card.condition}
                  to={card.to}
                  data-home-stagger-item
                  data-testid={`condition-guide-card-${card.condition.toLowerCase()}`}
                  className="group flex flex-col justify-between p-6 rounded-xl bg-surface border border-border hover:border-primary/60 hover:-translate-y-1 shadow-theme hover:shadow-theme-hover transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {card.badgeText}
                      </span>
                      <span className="text-xs text-muted tabular-nums">
                        {count} live deals
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold text-text group-hover:text-primary transition-colors mb-2.5">
                      {card.title}
                    </h3>
                    <p className="text-sm text-text/90 leading-relaxed mb-3">
                      {card.summary}
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      {card.whatToExpect}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-heading font-bold uppercase tracking-[0.1em] text-accent">
                    <span>Shop {card.title} deals</span>
                    <ArrowRight
                      className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 8. SUPPLIER & DELIVERY INFO (Two-column section + "Are you a supplier?" box) */}
      <section
        aria-labelledby="home-supplier-delivery-heading"
        data-testid="home-supplier-delivery-section"
        className="section-padding border-b border-border bg-bg-elevated"
      >
        <Container>
          <div
            data-home-stagger-group
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
          >
            {/* Left Column: Supplier Delivery & Confirmation Info */}
            <div
              data-home-stagger-item
              className="lg:col-span-7 p-6 sm:p-8 md:p-10 rounded-2xl bg-surface border border-border shadow-theme flex flex-col justify-between"
            >
              <div>
                <Eyebrow tone="blue" className="mb-2.5">
                  Fulfilment &amp; Dispatch
                </Eyebrow>
                <h2
                  id="home-supplier-delivery-heading"
                  data-home-split-heading
                  className="type-h2 font-heading text-text mb-4"
                >
                  Supplier-direct UK delivery &amp; stock confirmation
                </h2>
                <p className="text-sm sm:text-base text-muted leading-relaxed mb-6">
                  UK Clearance Hub is a product discovery and referral service. We
                  connect you directly with verified UK trade, retail, and
                  manufacturer suppliers clearing genuine excess stock.
                </p>

                <ul className="space-y-3.5 text-sm text-text/90">
                  <li className="flex items-start gap-3">
                    <Truck className="w-4 h-4 text-primary shrink-0 mt-1" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-text">
                        Delivery handled by each supplier:
                      </strong>{' '}
                      From tracked next-day parcel couriers for electronics to
                      two-person room-of-choice crews for beds and large appliances.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-1" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-text">
                        Clear timescales on every deal:
                      </strong>{' '}
                      Estimated UK dispatch windows (typically 2–5 working days) and
                      courier methods are displayed on every deal card and detail
                      page.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BadgePercent className="w-4 h-4 text-accent shrink-0 mt-1" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-text">
                        Prices and stock confirmed by the supplier:
                      </strong>{' '}
                      Clearance allocations move quickly, so final availability and
                      pricing are always confirmed directly with the fulfilling
                      supplier.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-5 border-t border-border flex flex-wrap items-center gap-4">
                <Button to="/delivery-returns" variant="outline">
                  Delivery &amp; Returns Guide
                </Button>
                <Button to="/faq" variant="ghost">
                  Read Customer FAQs
                </Button>
              </div>
            </div>

            {/* Right Column: "Are you a supplier?" Invitation Box */}
            <div
              data-home-stagger-item
              data-testid="home-supplier-invitation-box"
              className="lg:col-span-5 p-6 sm:p-8 md:p-10 rounded-2xl bg-surface border border-border-strong shadow-theme bg-hero-glow flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <Eyebrow tone="orange" className="mb-2">
                  Trade &amp; Brand Partners
                </Eyebrow>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-text mb-3">
                  Are you a supplier?
                </h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed mb-5">
                  Partner with UK Clearance Hub to move end-of-line, overstock,
                  refurbished, or showroom ex-display lines directly to high-intent
                  UK buyers on a transparent referral basis.
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  You retain full control over pricing, stock allocation, and direct
                  customer fulfilment while we drive qualified UK enquiries and
                  outbound deal traffic.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-border">
                <Button
                  to="/contact?topic=supplier"
                  variant="orange"
                  data-testid="home-supplier-contact-btn"
                  className="w-full justify-center"
                >
                  Partner With Us
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 9. FOLLOW US + WHATSAPP CTA BAND */}
      <section
        aria-label="Follow UK Clearance Hub and chat on WhatsApp"
        data-testid="home-follow-whatsapp-band"
        className="section-padding"
      >
        <Container>
          <div className="rounded-2xl bg-surface border border-border-strong p-6 sm:p-10 md:p-12 shadow-theme flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <Eyebrow tone="blue">Stay Connected</Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Follow daily deal drops or chat with our UK team on WhatsApp
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Follow us across social media for newly verified UK clearance lines,
                or message us directly on WhatsApp if you have a question about any
                deal.
              </p>

              {/* Social Icons (same links as Footer) */}
              <div
                data-testid="home-social-links"
                className="pt-1 flex flex-wrap items-center gap-2.5"
              >
                {BRAND_SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow UK Clearance Hub on ${social.label}`}
                    data-testid={`home-social-link-${social.id}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-2 hover:bg-primary hover:text-primary-contrast border border-border text-xs font-medium text-text transition-colors"
                  >
                    <SocialIconSvg id={social.id} />
                    <span>{social.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Large Green "Chat on WhatsApp" Button */}
            <div className="shrink-0 w-full sm:w-auto">
              <a
                href={BRAND_WHATSAPP_PREFILLED_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="home-whatsapp-cta-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-success hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] text-white font-heading font-bold text-base tracking-tight shadow-theme transition-all whitespace-nowrap"
              >
                <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Chat on WhatsApp ({BRAND_WHATSAPP_DISPLAY})</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Lead ID Enquiry Modal */}
      <ReservationEnquiryModal
        deal={enquireDeal}
        onClose={() => setEnquireDeal(null)}
      />
    </div>
  );
};
