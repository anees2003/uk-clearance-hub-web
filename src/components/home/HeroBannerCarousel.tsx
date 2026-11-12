import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Search,
} from 'lucide-react';
import { gsap } from '../../animations/gsap';
import {
  HERO_CAROUSEL_AUTO_ADVANCE_MS,
  HERO_CAROUSEL_SLIDES,
  HERO_SEARCH_SUGGESTION_CHIPS,
  getSlideShowcaseDeals,
  wrapSlideIndex,
} from '../../data/homePageData';
import { buildDealsSearchUrl } from '../../data/brand';
import { Deal, formatGBP, getSavingPercent } from '../../data/deals';
import { DealImagePlaceholder } from '../products/DealImagePlaceholder';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Eyebrow';

const LazyHomeHeroBedPreviewView = React.lazy(() =>
  import('../../three/SharedViewCanvas').then((m) => ({
    default: m.HomeHeroBedPreviewView,
  }))
);

const SlideDealShowcase: React.FC<{ deals: Deal[]; categoryLabel: string }> = ({
  deals,
  categoryLabel,
}) => {
  const leadDeal = deals[0];
  const secondaryDeals = deals.slice(1, 3);

  if (!leadDeal) return null;

  const leadSaving = getSavingPercent(leadDeal);

  return (
    <div
      data-testid="carousel-slide-deal-visual"
      className="w-full grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch"
    >
      {/* Featured Spotlight Deal Card */}
      <Link
        to={`/deals/${leadDeal.slug}`}
        data-testid={`carousel-featured-deal-${leadDeal.slug}`}
        className="sm:col-span-7 group flex flex-col justify-between rounded-xl bg-surface border border-border-strong p-4 sm:p-5 shadow-theme hover:border-primary/60 transition-all"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              {leadDeal.condition} · {leadDeal.subcategory}
            </span>
            {leadSaving !== null && (
              <span className="px-2.5 py-0.5 rounded-sm bg-accent text-white text-[0.6875rem] font-heading font-bold uppercase tracking-[0.08em] tabular-nums">
                Save {leadSaving}%
              </span>
            )}
          </div>

          <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-3.5 border border-border">
            <DealImagePlaceholder
              subcategory={leadDeal.subcategory}
              category={leadDeal.category}
              size="card"
            />
          </div>

          <p className="text-xs text-muted font-medium mb-1">
            {leadDeal.brand} · {categoryLabel}
          </p>
          <h3 className="font-heading text-base sm:text-lg font-bold text-text group-hover:text-primary transition-colors line-clamp-2">
            {leadDeal.title}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="font-heading text-xl sm:text-2xl font-extrabold text-text">
              {formatGBP(leadDeal.price)}
            </span>
            {leadSaving !== null && leadDeal.referencePrice && (
              <span className="text-xs text-muted line-through">
                Was {formatGBP(leadDeal.referencePrice)}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-heading font-bold text-accent group-hover:translate-x-0.5 transition-transform">
            <span>View Deal</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>

      {/* Secondary Stacked Deal Cards */}
      <div className="sm:col-span-5 flex flex-col gap-3.5 justify-between">
        {secondaryDeals.map((deal) => {
          const saving = getSavingPercent(deal);
          return (
            <Link
              key={deal.slug}
              to={`/deals/${deal.slug}`}
              data-testid={`carousel-secondary-deal-${deal.slug}`}
              className="group flex-1 flex flex-col justify-between rounded-xl bg-surface border border-border p-4 shadow-theme hover:border-primary/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {deal.subcategory}
                  </span>
                  {saving !== null && (
                    <span className="text-[0.6875rem] font-heading font-bold text-accent tabular-nums">
                      Save {saving}%
                    </span>
                  )}
                </div>
                <p className="font-heading text-sm font-bold text-text group-hover:text-primary transition-colors line-clamp-2">
                  {deal.title}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border flex items-baseline justify-between gap-2 tabular-nums">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-base font-extrabold text-text">
                    {formatGBP(deal.price)}
                  </span>
                  {saving !== null && deal.referencePrice && (
                    <span className="text-[0.6875rem] text-muted line-through">
                      Was {formatGBP(deal.referencePrice)}
                    </span>
                  )}
                </div>
                <span className="text-[0.6875rem] text-muted">
                  {deal.stockStatus}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const HeroBannerCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [userPaused, setUserPaused] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [hoverPaused, setHoverPaused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isPaused = userPaused || hoverPaused;

  const slideStageRef = useRef<HTMLDivElement | null>(null);
  const headlineInnerRef = useRef<HTMLSpanElement | null>(null);
  const copyBlockRef = useRef<HTMLDivElement | null>(null);
  const visualBlockRef = useRef<HTMLDivElement | null>(null);
  const progressFillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const progressTweenRef = useRef<gsap.core.Tween | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const totalSlides = HERO_CAROUSEL_SLIDES.length;
  const activeSlide =
    HERO_CAROUSEL_SLIDES[activeIndex] ?? HERO_CAROUSEL_SLIDES[0];

  const slideShowcaseMap = useMemo(
    () => ({
      'Electronics & Gadgets': getSlideShowcaseDeals(
        'Electronics & Gadgets',
        undefined,
        3
      ),
      'Home Appliances': getSlideShowcaseDeals('Home Appliances', undefined, 3),
      'Home & Living': getSlideShowcaseDeals('Home & Living', undefined, 3),
    }),
    []
  );

  const goToSlide = useCallback(
    (nextIndex: number, dir?: 1 | -1) => {
      const wrapped = wrapSlideIndex(nextIndex, totalSlides);
      if (wrapped === activeIndex) return;
      const computedDir: 1 | -1 = dir ?? (nextIndex > activeIndex ? 1 : -1);
      setDirection(computedDir);
      setActiveIndex(wrapped);
    },
    [activeIndex, totalSlides]
  );

  const handleNext = useCallback(() => {
    goToSlide(activeIndex + 1, 1);
  }, [activeIndex, goToSlide]);

  const handlePrev = useCallback(() => {
    goToSlide(activeIndex - 1, -1);
  }, [activeIndex, goToSlide]);

  // Masked headline reveal + smooth cross-slide with GSAP when activeIndex changes
  useEffect(() => {
    const stageEl = slideStageRef.current;
    if (!stageEl) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [
            headlineInnerRef.current,
            copyBlockRef.current,
            visualBlockRef.current,
          ].filter(Boolean),
          { opacity: 1, x: 0, yPercent: 0 }
        );
        return;
      }

      if (headlineInnerRef.current) {
        gsap.fromTo(
          headlineInnerRef.current,
          { yPercent: 108 },
          {
            yPercent: 0,
            duration: 0.72,
            ease: 'power4.out',
            overwrite: true,
          }
        );
      }

      if (copyBlockRef.current) {
        gsap.fromTo(
          copyBlockRef.current,
          { opacity: 0, x: direction * 26 },
          {
            opacity: 1,
            x: 0,
            duration: 0.58,
            delay: 0.06,
            ease: 'power3.out',
            overwrite: true,
          }
        );
      }

      if (visualBlockRef.current) {
        gsap.fromTo(
          visualBlockRef.current,
          { opacity: 0, x: direction * 34 },
          {
            opacity: 1,
            x: 0,
            duration: 0.64,
            delay: 0.08,
            ease: 'power3.out',
            overwrite: true,
          }
        );
      }
    }, stageEl);

    return () => ctx.revert();
  }, [activeIndex, direction]);

  // Auto-advance every 6s with animated progress bar & pause on hover/focus/reduced-motion
  useEffect(() => {
    progressTweenRef.current?.kill();

    progressFillRefs.current.forEach((el, idx) => {
      if (!el) return;
      if (idx < activeIndex) {
        el.style.transform = 'scaleX(1)';
      } else {
        el.style.transform = 'scaleX(0)';
      }
    });

    const activeBarEl = progressFillRefs.current[activeIndex];
    if (!activeBarEl) return;

    const proxy = { p: 0 };
    const tween = gsap.to(proxy, {
      p: 1,
      duration: HERO_CAROUSEL_AUTO_ADVANCE_MS / 1000,
      ease: 'none',
      paused: isPaused,
      onUpdate: () => {
        activeBarEl.style.transform = `scaleX(${proxy.p})`;
      },
      onComplete: () => {
        setDirection(1);
        setActiveIndex((prev) => wrapSlideIndex(prev + 1, totalSlides));
      },
    });

    progressTweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    const tween = progressTweenRef.current;
    if (!tween) return;
    if (isPaused) {
      tween.pause();
    } else {
      tween.play();
    }
  }, [isPaused]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement)?.tagName === 'INPUT') return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrev();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (
      !touch ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    ) {
      return;
    }
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(buildDealsSearchUrl(searchQuery));
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured UK clearance campaigns"
      data-testid="home-hero-carousel-section"
      onKeyDown={handleKeyDown}
      className="pt-5 pb-8 sm:pt-7 sm:pb-10"
    >
      <Container>
        {/* Rounded Hero Banner Container (~70dvh on desktop, auto on mobile) */}
        <div
          data-testid="home-hero-banner"
          data-active-slide={activeSlide.id}
          data-active-index={activeIndex}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocusCapture={() => setHoverPaused(true)}
          onBlurCapture={() => setHoverPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          className="relative w-full lg:min-h-[68dvh] rounded-2xl border border-border-strong bg-bg-elevated bg-hero-glow shadow-theme overflow-hidden p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {/* Slide Content Stage */}
          <div
            ref={slideStageRef}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${activeIndex + 1} of ${totalSlides}: ${activeSlide.headline}`}
            aria-live={isPaused ? 'polite' : 'off'}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto"
          >
            {/* Left Column: Eyebrow + Masked Headline + 1-Line Subtext + CTAs */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <Eyebrow tone="orange" data-testid="hero-slide-eyebrow">
                {activeSlide.eyebrow}
              </Eyebrow>

              <h1
                data-testid="hero-slide-headline"
                className="font-heading text-[clamp(2.1rem,4.3vw,3.85rem)] font-extrabold tracking-[-0.025em] leading-[1.04] text-text balance"
              >
                <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                  <span
                    ref={headlineInnerRef}
                    className="block will-change-transform"
                  >
                    {activeSlide.headline}
                  </span>
                </span>
              </h1>

              <div ref={copyBlockRef} className="space-y-6 will-change-transform">
                <p
                  data-testid="hero-slide-subtext"
                  className="text-sm sm:text-base text-muted max-w-xl leading-relaxed"
                >
                  {activeSlide.subtext}
                </p>

                <div className="flex flex-wrap items-center gap-3.5">
                  <Button
                    to={activeSlide.primaryCta.to}
                    variant="orange"
                    data-testid="hero-slide-primary-cta"
                  >
                    {activeSlide.primaryCta.label}
                  </Button>

                  <Button
                    to={activeSlide.secondaryCta.to}
                    variant="outline"
                    data-testid="hero-slide-secondary-cta"
                  >
                    {activeSlide.secondaryCta.label}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Slide 3 renders live 3D bed preview via SharedViewCanvas; Slides 1 & 2 render featured deal visuals */}
            <div
              ref={visualBlockRef}
              className="lg:col-span-6 w-full will-change-transform"
            >
              {activeSlide.visualType === '3d-bed' ? (
                <div className="space-y-3">
                  <Suspense
                    fallback={
                      <div
                        className="w-full h-[280px] sm:h-[340px] lg:h-[380px] rounded-xl bg-surface/60 border border-border-strong animate-pulse"
                        aria-hidden="true"
                      />
                    }
                  >
                    <LazyHomeHeroBedPreviewView />
                  </Suspense>
                  <div className="flex items-center justify-between gap-4 px-1 text-xs text-muted">
                    <span>
                      Scroll-driven 9-part 3D bedroom set on Home &amp; Living
                    </span>
                    <Link
                      to="/home-living"
                      className="font-heading font-bold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Open 3D Story</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <SlideDealShowcase
                  deals={
                    slideShowcaseMap[
                      activeSlide.featuredCategory ?? 'Electronics & Gadgets'
                    ]
                  }
                  categoryLabel={
                    activeSlide.featuredCategory ?? 'Electronics & Gadgets'
                  }
                />
              )}
            </div>
          </div>

          {/* Bottom Controls: Progress Indicators + Pause/Play + Prev/Next Buttons */}
          <div className="mt-8 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Choose campaign slide"
              className="flex items-center gap-3 flex-1 max-w-md"
            >
              {HERO_CAROUSEL_SLIDES.map((slide, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}: ${slide.headline}`}
                    data-testid={`hero-slide-indicator-${idx}`}
                    onClick={() => goToSlide(idx)}
                    className="group flex-1 text-left py-2.5 min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-xs"
                  >
                    <span
                      className={`block text-[0.75rem] font-heading font-bold mb-1.5 truncate transition-colors ${
                        isActive
                          ? 'text-text'
                          : 'text-muted group-hover:text-text'
                      }`}
                    >
                      0{idx + 1}.{' '}
                      {slide.id === 'tech'
                        ? 'Top Tech'
                        : slide.id === 'appliances'
                        ? 'Appliances'
                        : '3D Bedroom'}
                    </span>
                    <span className="block w-full h-1 bg-border-strong rounded-full overflow-hidden">
                      <span
                        ref={(el) => {
                          progressFillRefs.current[idx] = el;
                        }}
                        className="block h-full w-full bg-accent origin-left will-change-transform"
                        style={{
                          transform:
                            idx < activeIndex ? 'scaleX(1)' : 'scaleX(0)',
                        }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={
                  userPaused ? 'Resume slide autoplay' : 'Pause slide autoplay'
                }
                aria-pressed={userPaused}
                data-testid="hero-carousel-pause-btn"
                onClick={() => setUserPaused((p) => !p)}
                className="w-11 h-11 rounded-lg border border-border-strong bg-surface hover:border-primary hover:text-primary text-text inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                {userPaused ? (
                  <Play className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Pause className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Previous slide"
                data-testid="hero-carousel-prev-btn"
                onClick={handlePrev}
                className="w-11 h-11 rounded-lg border border-border-strong bg-surface hover:border-primary hover:text-primary text-text inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                data-testid="hero-carousel-next-btn"
                onClick={handleNext}
                className="w-11 h-11 rounded-lg border border-border-strong bg-surface hover:border-primary hover:text-primary text-text inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Below Banner: Large Search Bar + Quick Suggestion Chips */}
        <div
          data-testid="home-hero-search-panel"
          className="mt-5 rounded-xl bg-surface border border-border p-4 sm:p-5 shadow-theme"
        >
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            data-testid="home-hero-search-form"
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <label htmlFor="home-hero-search-input" className="sr-only">
                Search clearance deals
              </label>
              <Search
                aria-hidden="true"
                className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="home-hero-search-input"
                data-testid="home-hero-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clearance deals…"
                className="w-full bg-bg border border-border-strong rounded-lg pl-12 pr-4 py-3.5 min-h-[44px] text-base sm:text-base text-text placeholder:text-muted focus:bg-surface focus:border-primary focus:ring-2 focus:ring-focus/25 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              data-testid="home-hero-search-submit"
              className="px-6 py-3.5 min-h-[44px] rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-sm tracking-tight inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-[0.98] transition-all"
            >
              <span>Search Deals</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted mr-1">
              Popular searches:
            </span>
            {HERO_SEARCH_SUGGESTION_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                to={chip.to}
                data-testid={`hero-search-chip-${chip.label
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
                className="inline-flex items-center px-3.5 py-2 min-h-[44px] sm:min-h-[36px] rounded-md bg-surface-2 hover:bg-primary hover:text-primary-contrast border border-border text-xs font-medium text-text transition-colors whitespace-nowrap"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
