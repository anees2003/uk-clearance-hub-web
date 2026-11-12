import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  MessageCircle,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  BRAND_ICON_URL,
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_URL,
  HEADER_CATEGORIES,
  buildDealsSearchUrl,
} from '../../data/brand';
import { HEADER_HELP_LINKS } from '../../data/navigation';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { Container } from '../ui/Container';

export const MOBILE_MENU_EVENT = 'uk-clearance-hub:mobile-menu';

const ThemeToggleButton: React.FC<{
  testId: string;
  showLabel?: boolean;
  className?: string;
}> = ({ testId, showLabel = false, className = '' }) => {
  const { theme, toggleTheme, toggleAriaLabel } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={toggleAriaLabel}
      title={toggleAriaLabel}
      onClick={(e) => toggleTheme(e)}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 hover:border-primary/50 hover:bg-surface text-text cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.96] ${
        showLabel ? 'px-3.5 py-2.5 min-h-[44px] text-xs font-semibold' : 'w-11 h-11'
      } ${className}`.trim()}
    >
      <span className="relative flex items-center justify-center w-5 h-5">
        <Sun
          aria-hidden="true"
          className={`w-4 h-4 text-amber absolute transition-all duration-300 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`w-4 h-4 text-primary absolute transition-all duration-300 ${
            isDark
              ? 'opacity-0 rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </span>
      {showLabel && (
        <span>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</span>
      )}
    </button>
  );
};

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [iconError, setIconError] = useState(false);
  const [hoveredCatIndex, setHoveredCatIndex] = useState<number | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const categoryNavRef = useRef<HTMLElement | null>(null);
  const categoryLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useModalFocusTrap(mobileOpen, mobileMenuRef, () => setMobileOpen(false));

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Keep search input synced with ?q= when on /deals
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setSearchQuery(q);
  }, [searchParams, location.pathname]);

  // Close mobile menu and mobile search panel on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  // Broadcast mobile menu open state so FloatingWhatsAppButton hides when menu is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.mobileMenuOpen = mobileOpen ? 'true' : 'false';
      document.body.style.overflow = mobileOpen ? 'hidden' : '';
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(MOBILE_MENU_EVENT, { detail: { open: mobileOpen } })
      );
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCategoryActive = useCallback(
    (item: (typeof HEADER_CATEGORIES)[number]): boolean => {
      const currentCategory = searchParams.get('category');
      if (item.to === '/home-living') {
        return location.pathname === '/home-living';
      }
      if (item.categoryParam) {
        return (
          (location.pathname === '/deals' ||
            location.pathname === '/clearance-deals') &&
          currentCategory === item.categoryParam
        );
      }
      if (item.to === '/deals') {
        return (
          (location.pathname === '/deals' ||
            location.pathname === '/clearance-deals') &&
          !currentCategory
        );
      }
      return location.pathname === item.to;
    },
    [location.pathname, searchParams]
  );

  // Measure active or hovered category link so the underline slides smoothly between items
  useEffect(() => {
    const updateSlidingUnderline = () => {
      const navEl = categoryNavRef.current;
      if (!navEl) return;

      const activeIdx = HEADER_CATEGORIES.findIndex((c) => isCategoryActive(c));
      const targetIdx = hoveredCatIndex !== null ? hoveredCatIndex : activeIdx;

      if (targetIdx < 0) {
        setUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      const linkEl = categoryLinkRefs.current[targetIdx];
      if (!linkEl) {
        setUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      const navRect = navEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();
      setUnderlineStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    };

    updateSlidingUnderline();
    window.addEventListener('resize', updateSlidingUnderline, { passive: true });
    return () => window.removeEventListener('resize', updateSlidingUnderline);
  }, [hoveredCatIndex, isCategoryActive, location.pathname, location.search]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const targetUrl = buildDealsSearchUrl(searchQuery);
    setMobileOpen(false);
    setMobileSearchOpen(false);
    navigate(targetUrl);
  };

  return (
    <>
      <header
        data-testid="site-header"
        data-scrolled={scrolled ? 'true' : 'false'}
        className={`sticky top-0 left-0 right-0 z-40 border-b border-border transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? 'bg-surface/90 backdrop-blur-md shadow-theme'
            : 'bg-surface'
        }`}
      >
        {/* 1. Top Utility Bar (Deep Navy / Elevated Dark Bar) */}
        <div
          data-testid="header-utility-bar"
          className="bg-navy-deep text-white text-xs py-2 border-b border-white/8"
        >
          <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <div className="flex items-center gap-4 md:gap-6">
              <span className="inline-flex items-center gap-1.5 font-medium text-white/95">
                <ShieldCheck className="w-3.5 h-3.5 text-amber shrink-0" aria-hidden="true" />
                <span>Clearance deals from trusted UK suppliers</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-white/80">
                <Truck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                <span>Delivery handled by suppliers</span>
              </span>
            </div>

            <div className="flex items-center gap-4 md:gap-6 ml-auto">
              <div className="hidden lg:flex items-center gap-5 text-white/80">
                <Link to="/how-it-works" className="hover:text-white">
                  How it works
                </Link>
                <Link to="/faq" className="hover:text-white">
                  FAQ
                </Link>
                <Link to="/contact" className="hover:text-white">
                  Contact
                </Link>
              </div>
              <a
                href={BRAND_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="header-utility-whatsapp"
                className="inline-flex items-center gap-1.5 font-medium text-white hover:text-amber whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
                <span>WhatsApp: {BRAND_WHATSAPP_DISPLAY}</span>
              </a>
            </div>
          </Container>
        </div>

        {/* 2. Main Header Row: Logo left + Search Bar centre (max-w 560px) + Theme Toggle & Orange "Shop Deals" CTA right */}
        <Container className="py-3 md:py-3.5 flex items-center justify-between gap-4 md:gap-6">
          {/* Brand Wordmark & ~40px Icon */}
          <Link
            to="/"
            data-testid="header-brand-link"
            className="inline-flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-sm"
          >
            {!iconError && (
              <img
                src={BRAND_ICON_URL}
                alt=""
                width={66}
                height={40}
                decoding="async"
                onError={() => setIconError(true)}
                className="h-9 sm:h-10 w-auto object-contain shrink-0"
              />
            )}
            <span className="font-heading text-lg sm:text-xl md:text-[1.375rem] font-extrabold tracking-[-0.02em] whitespace-nowrap">
              <span className="text-text">UK Clearance </span>
              <span className="text-accent">Hub</span>
            </span>
          </Link>

          {/* Desktop Centre Search Bar (max-width 560px, submits to /deals?q=...) */}
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            data-testid="header-search-form"
            className="hidden md:flex flex-1 max-w-[560px] mx-auto relative items-center"
          >
            <label htmlFor="header-search-input" className="sr-only">
              Search clearance deals
            </label>
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              id="header-search-input"
              data-testid="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clearance deals…"
              className="w-full bg-bg border border-border-strong rounded-lg pl-11 pr-24 py-2.5 text-sm text-text placeholder:text-muted focus:bg-surface focus:border-primary focus:ring-2 focus:ring-focus/25 focus:outline-none"
            />
            <button
              type="submit"
              data-testid="header-search-submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md cursor-pointer active:scale-[0.98]"
            >
              Search
            </button>
          </form>

          {/* Desktop Right Actions: Theme Switcher + Orange "Shop Deals" Button */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggleButton testId="theme-toggle-desktop" />

            <Link
              to="/deals"
              data-testid="header-shop-deals-btn"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-accent hover:bg-accent-hover hover:-translate-y-0.5 active:scale-[0.98] text-white font-heading font-bold text-sm tracking-tight whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span>Shop Deals</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile Controls: Theme Toggle + Search Icon + Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggleButton testId="theme-toggle-mobile-header" />

            <button
              type="button"
              aria-label={mobileSearchOpen ? 'Close search bar' : 'Open search bar'}
              aria-expanded={mobileSearchOpen}
              data-testid="header-mobile-search-btn"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-text hover:bg-surface-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              data-testid="header-mobile-menu-btn"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-text hover:bg-surface-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </Container>

        {/* Animated Collapsible Mobile Search Bar */}
        <div
          aria-hidden={!mobileSearchOpen}
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
            mobileSearchOpen
              ? 'max-h-24 opacity-100 border-t border-border bg-bg-elevated'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <Container className="py-3">
            <form onSubmit={handleSearchSubmit} role="search" className="relative flex items-center">
              <label htmlFor="mobile-inline-search-input" className="sr-only">
                Search clearance deals
              </label>
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none"
              />
              <input
                id="mobile-inline-search-input"
                type="search"
                tabIndex={mobileSearchOpen ? 0 : -1}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clearance deals…"
                className="w-full bg-surface border border-border-strong rounded-lg pl-10 pr-20 py-2.5 min-h-[44px] text-base text-text placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                tabIndex={mobileSearchOpen ? 0 : -1}
                className="absolute right-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md"
              >
                Go
              </button>
            </form>
          </Container>
        </div>

        {/* 3. Desktop Category Row with Smooth Sliding Underline */}
        <div
          data-testid="header-category-row"
          className="hidden md:block border-t border-border bg-surface/95"
        >
          <Container className="flex items-center justify-between gap-6">
            <nav
              ref={categoryNavRef}
              aria-label="Clearance categories"
              onMouseLeave={() => setHoveredCatIndex(null)}
              className="relative flex items-center gap-6"
            >
              {HEADER_CATEGORIES.map((item, idx) => {
                const active = isCategoryActive(item);
                return (
                  <Link
                    key={item.label}
                    ref={(el) => {
                      categoryLinkRefs.current[idx] = el;
                    }}
                    to={item.to}
                    onMouseEnter={() => setHoveredCatIndex(idx)}
                    data-testid={`header-category-link-${item.label}`}
                    data-active={active ? 'true' : 'false'}
                    className={`group relative py-3 text-sm font-medium whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-primary font-semibold'
                        : 'text-text hover:text-primary'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Smooth Sliding Category Indicator */}
              <span
                aria-hidden="true"
                data-testid="header-category-sliding-underline"
                className="pointer-events-none absolute bottom-0 h-[2.5px] bg-accent rounded-full transition-[transform,width,opacity] duration-300"
                style={{
                  transform: `translateX(${underlineStyle.left}px)`,
                  width: `${underlineStyle.width}px`,
                  opacity: underlineStyle.opacity,
                }}
              />
            </nav>

            {/* Quick Guides & Informative Links */}
            <div className="hidden lg:flex items-center gap-5 text-xs font-medium text-muted">
              <Link
                to="/mattress-guide"
                className={`hover:text-text whitespace-nowrap ${
                  location.pathname === '/mattress-guide'
                    ? 'text-primary font-semibold'
                    : ''
                }`}
              >
                Mattress Guide
              </Link>
              <Link
                to="/bed-size-guide"
                className={`hover:text-text whitespace-nowrap ${
                  location.pathname === '/bed-size-guide'
                    ? 'text-primary font-semibold'
                    : ''
                }`}
              >
                Bed Size Guide
              </Link>
              <Link
                to="/delivery-returns"
                className={`hover:text-text whitespace-nowrap ${
                  location.pathname === '/delivery-returns'
                    ? 'text-primary font-semibold'
                    : ''
                }`}
              >
                Delivery &amp; Returns
              </Link>
            </div>
          </Container>
        </div>
      </header>

      {/* Full-Screen Animated Mobile Menu Panel */}
      <div
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation menu"
        data-testid="mobile-menu-panel"
        data-open={mobileOpen ? 'true' : 'false'}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        className={`fixed inset-0 z-50 bg-surface text-text flex flex-col justify-between overflow-y-auto md:hidden transition-[opacity,transform] duration-300 ${
          mobileOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-3 pointer-events-none'
        }`}
      >
        {/* Mobile Panel Top Header */}
        <div>
          <div className="bg-navy-deep text-white py-2.5 text-xs">
            <Container className="flex items-center justify-between gap-4">
              <span>Clearance deals from trusted UK suppliers</span>
              <a
                href={BRAND_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={mobileOpen ? 0 : -1}
                className="text-amber font-medium whitespace-nowrap"
              >
                WhatsApp Us
              </a>
            </Container>
          </div>

          <div className="py-4 border-b border-border">
            <Container className="flex items-center justify-between gap-4">
              <Link
                to="/"
                tabIndex={mobileOpen ? 0 : -1}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2.5"
              >
                {!iconError && (
                  <img
                    src={BRAND_ICON_URL}
                    alt=""
                    width={59}
                    height={36}
                    decoding="async"
                    onError={() => setIconError(true)}
                    className="h-9 w-auto object-contain shrink-0"
                  />
                )}
                <span className="font-heading text-lg font-extrabold tracking-[-0.02em]">
                  <span className="text-text">UK Clearance </span>
                  <span className="text-accent">Hub</span>
                </span>
              </Link>

              <button
                type="button"
                tabIndex={mobileOpen ? 0 : -1}
                aria-label="Close navigation menu"
                data-testid="mobile-menu-close-btn"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-text hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </Container>
          </div>

          {/* Search Input inside Mobile Menu */}
          <div className="py-4 border-b border-border bg-bg-elevated">
            <Container>
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                data-testid="mobile-menu-search-form"
                className="relative"
              >
                <label htmlFor="mobile-menu-search-input" className="sr-only">
                  Search clearance deals
                </label>
                <Search
                  aria-hidden="true"
                  className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="mobile-menu-search-input"
                  data-testid="mobile-menu-search-input"
                  type="search"
                  tabIndex={mobileOpen ? 0 : -1}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clearance deals…"
                  className="w-full bg-surface border border-border-strong rounded-lg pl-10 pr-20 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  tabIndex={mobileOpen ? 0 : -1}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md"
                >
                  Search
                </button>
              </form>
            </Container>
          </div>

          {/* Categories List */}
          <div className="py-6">
            <Container>
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="type-eyebrow text-muted">Shop Categories</p>
                <ThemeToggleButton
                  testId="theme-toggle-mobile-menu"
                  showLabel={true}
                />
              </div>

              <nav
                aria-label="Mobile categories"
                className="flex flex-col divide-y divide-border"
              >
                {HEADER_CATEGORIES.map((cat) => {
                  const active = isCategoryActive(cat);
                  return (
                    <Link
                      key={cat.label}
                      to={cat.to}
                      tabIndex={mobileOpen ? 0 : -1}
                      onClick={() => setMobileOpen(false)}
                      className={`py-3.5 flex items-center justify-between font-heading text-lg font-bold ${
                        active ? 'text-accent' : 'text-text hover:text-primary'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted" />
                    </Link>
                  );
                })}
              </nav>

              {/* Help & Guides Links */}
              <p className="type-eyebrow text-muted mt-8 mb-3">
                Guides &amp; Customer Help
              </p>
              <nav
                aria-label="Mobile help and guides"
                className="grid grid-cols-2 gap-3"
              >
                {HEADER_HELP_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    tabIndex={mobileOpen ? 0 : -1}
                    onClick={() => setMobileOpen(false)}
                    className="px-3.5 py-2.5 rounded-lg bg-surface-2 border border-border text-xs font-medium text-text hover:border-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </Container>
          </div>
        </div>

        {/* Mobile Panel Bottom CTAs */}
        <div className="py-5 border-t border-border bg-bg-elevated">
          <Container className="space-y-3">
            <Link
              to="/deals"
              tabIndex={mobileOpen ? 0 : -1}
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-sm"
            >
              <span>Shop All Clearance Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={BRAND_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={mobileOpen ? 0 : -1}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-navy-deep text-white font-medium text-xs"
            >
              <MessageCircle className="w-4 h-4 text-success" />
              <span>Chat on WhatsApp ({BRAND_WHATSAPP_DISPLAY})</span>
            </a>
          </Container>
        </div>
      </div>
    </>
  );
};
