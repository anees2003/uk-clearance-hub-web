import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, RotateCcw, Search } from 'lucide-react';
import { gsap, Flip, ScrollTrigger } from '../animations/gsap';
import {
  ALL_DEALS,
  DEALS,
  DEAL_CATEGORIES,
  DEAL_CONDITIONS,
  MAX_DEAL_PRICE,
  DEFAULT_DEAL_FILTERS,
  Deal,
  DealCategory,
  DealCondition,
  DealFilterState,
  DealSortOption,
  filterAndSortDeals,
  getSubcategoriesForCategory,
  parseDealFilterQueryParams,
  serializeDealFilterQueryParams,
} from '../data/deals';
import { getOrInitSourceChannel } from '../data/leadFlow';
import {
  buildBreadcrumbJsonLd,
  ROUTE_SEO_DEFAULTS,
  useSeo,
} from '../utils/seo';
import { useModalFocusTrap } from '../utils/useModalFocusTrap';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { OVERLAY_CHANGE_EVENT } from '../components/ui/FloatingWhatsAppButton';
import { ProductCard } from '../components/products/ProductCard';
import { PriceRangeSlider } from '../components/products/PriceRangeSlider';
import { ReservationEnquiryModal } from '../components/products/ReservationEnquiryModal';

const SEARCH_SUGGESTIONS = [
  'Headphones',
  'Vacuum',
  'Air Fryer',
  'Bed',
  'Mattress',
  'Smart TV',
];

export const ClearanceDealsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeEnquiry, setActiveEnquiry] = useState<{
    deal: Deal;
    leadId: string;
  } | null>(null);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  useModalFocusTrap(mobileFiltersOpen, mobileSheetRef, () =>
    setMobileFiltersOpen(false)
  );

  // Initialise acquisition source channel in sessionStorage on first visit
  useEffect(() => {
    getOrInitSourceChannel();
  }, []);

  const filters = useMemo<DealFilterState>(
    () => parseDealFilterQueryParams(searchParams, location.pathname),
    [searchParams, location.pathname]
  );

  const availableSubcategories = useMemo(
    () => getSubcategoriesForCategory(filters.category),
    [filters.category]
  );

  const filteredDeals = useMemo(
    () => filterAndSortDeals(ALL_DEALS, filters),
    [filters]
  );

  const pageHeading = useMemo(() => {
    if (filters.q) {
      return `Results for '${filters.q}'`;
    }
    if (filters.category !== 'All') {
      return filters.category;
    }
    return 'All Deals';
  }, [filters.q, filters.category]);

  const dealsSeo = ROUTE_SEO_DEFAULTS['/deals'];
  useSeo({
    title:
      pageHeading === 'All Deals'
        ? dealsSeo.title
        : `${pageHeading} | UK Clearance Hub`,
    description: dealsSeo.description,
    canonicalPath: '/deals',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: pageHeading, path: '/deals' },
    ]),
  });

  // Lock body scroll & broadcast overlay state while mobile filter sheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.mobileFiltersOpen = mobileFiltersOpen
      ? 'true'
      : 'false';
    window.dispatchEvent(new CustomEvent(OVERLAY_CHANGE_EVENT));

    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!activeEnquiry) {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.dataset.mobileFiltersOpen = 'false';
      window.dispatchEvent(new CustomEvent(OVERLAY_CHANGE_EVENT));
      if (!activeEnquiry) {
        document.body.style.overflow = '';
      }
    };
  }, [mobileFiltersOpen, activeEnquiry]);

  const captureFlipStateBeforeUpdate = () => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const cards = gridEl.querySelectorAll<HTMLElement>('[data-flip-id]');
    if (cards.length > 0) {
      flipStateRef.current = Flip.getState(cards);
    }
  };

  const updateFilters = (patch: Partial<DealFilterState>) => {
    captureFlipStateBeforeUpdate();
    setSearchParams(
      (prevParams) => {
        const currentFilters = parseDealFilterQueryParams(
          prevParams,
          location.pathname
        );
        const nextFilters: DealFilterState = {
          ...currentFilters,
          ...patch,
        };

        // Reset subcategory if category changed and old subcategory doesn't belong to new category
        if (
          patch.category !== undefined &&
          patch.subcategory === undefined &&
          nextFilters.subcategory !== 'All'
        ) {
          const validSubs = getSubcategoriesForCategory(nextFilters.category);
          if (!validSubs.includes(nextFilters.subcategory)) {
            nextFilters.subcategory = 'All';
          }
        }

        return serializeDealFilterQueryParams(nextFilters);
      },
      { replace: true }
    );
  };

  const handleClearSearch = () => {
    updateFilters({ q: '' });
  };

  const handleClearAllFilters = () => {
    captureFlipStateBeforeUpdate();
    setSearchParams({}, { replace: true });
  };

  // GSAP Flip layout animation when filteredDeals changes
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    const gridEl = gridRef.current;
    if (!state || !gridEl) return;

    flipStateRef.current = null;
    const currentCards = gridEl.querySelectorAll<HTMLElement>('[data-flip-id]');

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || currentCards.length === 0) {
      ScrollTrigger.refresh();
      return;
    }

    gsap.killTweensOf(currentCards);
    gsap.set(currentCards, { clearProps: 'transform,opacity' });

    Flip.from(state, {
      targets: currentCards,
      duration: 0.36,
      ease: 'power2.out',
      stagger: 0.015,
      simple: true,
      clearProps: 'transform,opacity',
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        ),
      onComplete: () => {
        gsap.set(currentCards, { clearProps: 'transform,opacity' });
        ScrollTrigger.refresh();
      },
    });
  }, [filteredDeals]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count += 1;
    if (filters.subcategory !== 'All') count += 1;
    if (filters.condition !== 'All') count += 1;
    if (filters.minPrice > 0 || filters.maxPrice < MAX_DEAL_PRICE) count += 1;
    if (filters.inStockOnly) count += 1;
    if (filters.verifiedSavingsOnly) count += 1;
    if (filters.q) count += 1;
    return count;
  }, [filters]);

  const hasActiveFilters =
    activeFilterCount > 0 || filters.sort !== DEFAULT_DEAL_FILTERS.sort;

  const renderFilterControls = (scopePrefix: 'desktop' | 'mobile') => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-text mb-2.5">
          Category
        </h3>
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-col gap-1.5"
        >
          {(['All', ...DEAL_CATEGORIES] as const).map((cat) => {
            const active = filters.category === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`${scopePrefix}-filter-category-${cat}`}
                aria-pressed={active}
                onClick={() =>
                  updateFilters({
                    category: cat as DealCategory | 'All',
                  })
                }
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border flex items-center justify-between ${
                  active
                    ? 'bg-primary text-primary-contrast border-primary font-semibold'
                    : 'bg-bg text-text/85 border-border hover:border-primary/50 hover:text-text'
                }`}
              >
                <span className="truncate">
                  {cat === 'All' ? 'All Categories' : cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Filter */}
      <div>
        <h3 className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-text mb-2.5">
          Subcategory
        </h3>
        <div
          role="group"
          aria-label="Filter by subcategory"
          className="flex flex-wrap gap-1.5"
        >
          {(['All', ...availableSubcategories] as const).map((sub) => {
            const active =
              filters.subcategory.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                type="button"
                data-testid={`${scopePrefix}-filter-subcategory-${sub}`}
                aria-pressed={active}
                onClick={() => updateFilters({ subcategory: sub })}
                className={`px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer border ${
                  active
                    ? 'bg-primary text-primary-contrast border-primary font-semibold'
                    : 'bg-bg text-muted border-border hover:border-primary/50 hover:text-text'
                }`}
              >
                {sub === 'All' ? 'All' : sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <h3 className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-text mb-2.5">
          Condition
        </h3>
        <div
          role="group"
          aria-label="Filter by condition"
          className="grid grid-cols-2 gap-1.5"
        >
          {(['All', ...DEAL_CONDITIONS] as const).map((cond) => {
            const active = filters.condition === cond;
            return (
              <button
                key={cond}
                type="button"
                data-testid={`${scopePrefix}-filter-condition-${cond}`}
                aria-pressed={active}
                onClick={() =>
                  updateFilters({
                    condition: cond as DealCondition | 'All',
                  })
                }
                className={`px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer border text-center ${
                  active
                    ? 'bg-accent text-white border-accent font-semibold'
                    : 'bg-bg text-muted border-border hover:border-primary/50 hover:text-text'
                }`}
              >
                {cond === 'All' ? 'All' : cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="pt-2 border-t border-border">
        <PriceRangeSlider
          minLimit={0}
          maxLimit={MAX_DEAL_PRICE}
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          step={10}
          onChange={(nextMin, nextMax) =>
            updateFilters({ minPrice: nextMin, maxPrice: nextMax })
          }
        />
      </div>

      {/* Toggle Filters: In stock only + Verified savings only */}
      <div className="pt-2 border-t border-border space-y-3">
        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
          <span className="text-xs font-medium text-text">In stock only</span>
          <input
            type="checkbox"
            data-testid={`${scopePrefix}-filter-in-stock`}
            checked={filters.inStockOnly}
            onChange={(e) => updateFilters({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
          <span className="text-xs font-medium text-text">
            Verified savings only
          </span>
          <input
            type="checkbox"
            data-testid={`${scopePrefix}-filter-verified-savings`}
            checked={filters.verifiedSavingsOnly}
            onChange={(e) =>
              updateFilters({ verifiedSavingsOnly: e.target.checked })
            }
            className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
          />
        </label>
      </div>

      {/* Reset All Filters Button */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            data-testid={`${scopePrefix}-reset-filters-btn`}
            onClick={handleClearAllFilters}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-strong bg-surface-2 hover:border-accent hover:text-accent text-xs font-semibold text-text transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset all filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={pageRef}
      data-testid="clearance-deals-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* Header Area */}
      <section className="relative overflow-hidden py-8 md:py-12 border-b border-border bg-bg-elevated bg-hero-glow">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <Eyebrow tone="orange" className="mb-2.5">
                UK Clearance Hub · Referral Catalogue
              </Eyebrow>
              <h1
                data-testid="deals-page-heading"
                className="type-h1 font-heading text-text mb-2"
              >
                {pageHeading}
              </h1>
              <p
                data-testid="deals-supplier-confirmation-line"
                className="type-small text-muted"
              >
                Prices and stock are confirmed by the supplier.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="clearance-results-count"
                className="text-sm text-muted tabular-nums bg-surface px-3.5 py-2.5 min-h-[44px] inline-flex items-center gap-1 rounded-lg border border-border"
              >
                <span>Showing</span>
                <strong className="font-semibold text-text">
                  {filteredDeals.length}
                </strong>
                <span>of</span>
                <strong className="font-semibold text-text">
                  {DEALS.length}
                </strong>
                <span>live deals</span>
              </p>

              {filters.q && (
                <button
                  type="button"
                  data-testid="header-clear-search-btn"
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-surface-2 border border-border-strong text-xs font-semibold text-accent hover:text-text cursor-pointer"
                >
                  <span>Clear search</span>
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content: Left Filter Sidebar (Desktop) + Sort Bar & 4-Col Grid */}
      <section className="py-8 md:py-12">
        <Container>
          {/* Mobile Filter & Sort Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-6 lg:hidden">
            <button
              type="button"
              data-testid="mobile-filters-open-btn"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-surface border border-border-strong text-xs font-heading font-bold text-text cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded bg-primary text-primary-contrast text-[0.6875rem] font-bold tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="mobile-deals-sort-select"
                className="text-xs text-muted whitespace-nowrap sr-only sm:not-sr-only"
              >
                Sort:
              </label>
              <select
                id="mobile-deals-sort-select"
                data-testid="mobile-deals-sort-select"
                value={filters.sort}
                onChange={(e) =>
                  updateFilters({ sort: e.target.value as DealSortOption })
                }
                className="bg-surface rounded-lg border border-border-strong px-3 py-2.5 min-h-[44px] text-xs font-semibold text-text focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="saving-desc">Biggest verified saving</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-7">
            {/* Desktop Left Filter Sidebar */}
            <aside
              aria-label="Deal filters"
              data-testid="deals-desktop-sidebar"
              className="hidden lg:block w-[250px] shrink-0 bg-surface rounded-xl border border-border p-5 shadow-theme sticky top-36"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <h2 className="font-heading text-sm font-bold text-text flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>Filter Deals</span>
                </h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              {renderFilterControls('desktop')}
            </aside>

            {/* Right Column: Desktop Sort Bar + Deal Cards Grid */}
            <div className="flex-1 w-full min-w-0">
              {/* Desktop Top Sort & Active Filter Bar */}
              <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">
                    Showing{' '}
                    <strong className="text-text font-semibold tabular-nums">
                      {filteredDeals.length}
                    </strong>{' '}
                    {filteredDeals.length === 1 ? 'deal' : 'deals'}
                  </span>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      data-testid="clearance-reset-inline-btn"
                      onClick={handleClearAllFilters}
                      className="ml-2 text-xs font-semibold text-accent hover:text-text underline underline-offset-4 cursor-pointer"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <label
                    htmlFor="clearance-sort-select"
                    className="text-xs text-muted font-medium whitespace-nowrap"
                  >
                    Sort by
                  </label>
                  <select
                    id="clearance-sort-select"
                    data-testid="clearance-sort-select"
                    value={filters.sort}
                    onChange={(e) =>
                      updateFilters({ sort: e.target.value as DealSortOption })
                    }
                    className="bg-surface rounded-lg border border-border-strong px-3.5 py-2 text-xs font-semibold text-text focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="saving-desc">Biggest verified saving</option>
                    <option value="price-asc">Price low to high</option>
                    <option value="price-desc">Price high to low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {/* Deals Grid: 4 cols at 1440px (xl), 3 at 1024px (lg), 2 at 768px (sm), 1 on mobile */}
              {filteredDeals.length > 0 ? (
                <div
                  ref={gridRef}
                  data-testid="clearance-product-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {filteredDeals.map((deal) => (
                    <ProductCard
                      key={deal.slug}
                      deal={deal}
                      onEnquire={(targetDeal, leadId) =>
                        setActiveEnquiry({ deal: targetDeal, leadId })
                      }
                    />
                  ))}
                </div>
              ) : (
                <div
                  data-testid="clearance-empty-state"
                  className="py-16 px-6 text-center rounded-xl border border-border bg-surface shadow-theme flex flex-col items-center"
                >
                  <Search
                    className="w-10 h-10 text-primary mb-3 stroke-[1.6]"
                    aria-hidden="true"
                  />
                  <h2 className="type-h3 font-heading text-text mb-2">
                    No deals found
                  </h2>
                  <p className="type-small text-muted max-w-md mb-5">
                    {filters.q
                      ? `We couldn't find any live clearance deals matching "${filters.q}". Try one of the popular searches below or clear your search.`
                      : 'No live clearance deals match your active filter combination. Try broadening your price range or resetting your filters.'}
                  </p>

                  {/* Suggestions */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <span className="text-xs text-muted">Try searching:</span>
                    {SEARCH_SUGGESTIONS.map((term) => (
                      <button
                        key={term}
                        type="button"
                        data-testid={`empty-suggestion-${term}`}
                        onClick={() =>
                          updateFilters({
                            q: term,
                            category: 'All',
                            subcategory: 'All',
                            condition: 'All',
                          })
                        }
                        className="px-3.5 py-2 min-h-[44px] sm:min-h-[36px] rounded-md bg-surface-2 border border-border-strong text-xs font-medium text-text hover:border-primary hover:text-primary cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {filters.q && (
                      <Button
                        type="button"
                        variant="orange"
                        data-testid="empty-clear-search-btn"
                        onClick={handleClearSearch}
                      >
                        Clear search
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      data-testid="clearance-empty-clear-btn"
                      onClick={handleClearAllFilters}
                    >
                      Show All Deals
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Mobile Slide-Up Filter Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileFiltersOpen}
        aria-label="Filter deals"
        data-testid="mobile-filter-sheet"
        className={`fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-bg/75 backdrop-blur-xs transition-opacity duration-300 ${
          mobileFiltersOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setMobileFiltersOpen(false);
          }
        }}
      >
        <div
          ref={mobileSheetRef}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          className={`w-full max-h-[85dvh] bg-surface border-t border-border-strong rounded-t-2xl flex flex-col shadow-theme transition-transform duration-300 ${
            mobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-text flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Filter Deals ({filteredDeals.length})</span>
            </h2>
            <button
              type="button"
              aria-label="Close filters"
              data-testid="mobile-filter-sheet-close"
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-text cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {renderFilterControls('mobile')}
          </div>

          <div className="p-4 border-t border-border bg-bg-elevated flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-3 min-h-[44px] rounded-lg border border-border-strong text-xs font-semibold text-text hover:border-accent cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              data-testid="mobile-filter-apply-btn"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 py-3 px-5 min-h-[44px] rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-xs cursor-pointer"
            >
              View {filteredDeals.length}{' '}
              {filteredDeals.length === 1 ? 'Deal' : 'Deals'}
            </button>
          </div>
        </div>
      </div>

      {/* Deal Enquiry Modal */}
      {activeEnquiry && (
        <ReservationEnquiryModal
          isOpen={true}
          onClose={() => setActiveEnquiry(null)}
          deal={activeEnquiry.deal}
          initialLeadId={activeEnquiry.leadId}
        />
      )}
    </div>
  );
};
