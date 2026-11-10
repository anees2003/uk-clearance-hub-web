import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { HEADER_NAV_LINKS, computeHeaderVisibility } from '../../data/navigation';
import { Container } from '../ui/Container';

export const Header: React.FC = () => {
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when full-screen mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Scroll direction tracking for hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 24);
      setIsHidden((prevHidden) =>
        computeHeaderVisibility(currentY, lastScrollY.current, prevHidden)
      );
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerTransform =
    isHidden && !mobileMenuOpen ? '-translate-y-full' : 'translate-y-0';

  const surfaceBackdrop =
    isScrolled && !mobileMenuOpen
      ? 'bg-[#F3EFE9]/85 backdrop-blur-md border-b border-[rgba(28,28,30,0.12)]'
      : 'bg-transparent border-b border-transparent';

  return (
    <>
      <header
        data-testid="site-header"
        data-hidden={isHidden && !mobileMenuOpen ? 'true' : 'false'}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${headerTransform} ${surfaceBackdrop}`}
      >
        <Container className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 h-20">
          {/* Zone 1: Left Serif Wordmark */}
          <Link
            to="/"
            className="font-serif text-[1.35rem] sm:text-2xl md:text-[1.7rem] font-medium tracking-tight text-[#1C1C1E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C1C1E]"
          >
            UK Clearance Hub
          </Link>

          {/* Zone 2: Centre Navigation Links (Desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 xl:gap-9"
          >
            {HEADER_NAV_LINKS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `nav-link-underline text-[0.875rem] font-normal tracking-[0.02em] transition-colors duration-200 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#1C1C1E] font-medium'
                      : 'text-[#1C1C1E]/80 hover:text-[#1C1C1E]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Right Clearance Red Pill + Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              to="/clearance-deals"
              className="inline-flex items-center gap-1.5 bg-[#C8102E] text-[#F3EFE9] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[0.65rem] sm:text-[0.75rem] font-medium tracking-[0.08em] sm:tracking-[0.12em] uppercase whitespace-nowrap shrink-0 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E]"
            >
              <span>Up to 70% off</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-fullscreen-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 text-[#1C1C1E] border border-[rgba(28,28,30,0.12)] transition-colors hover:bg-[#1C1C1E]/5 focus-visible:outline-2 focus-visible:outline-[#1C1C1E] cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Full-Screen Menu with Staggered Links */}
      <div
        id="mobile-fullscreen-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-30 bg-[#F3EFE9] flex flex-col justify-between pt-28 pb-10 px-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-2 border-t border-[rgba(28,28,30,0.12)] pt-8">
          <p className="type-eyebrow text-[#8A8580] mb-4">Directory</p>
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {HEADER_NAV_LINKS.map((item, idx) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${80 + idx * 55}ms` : '0ms',
                }}
                className={({ isActive }) =>
                  `group flex items-center justify-between py-3.5 border-b border-[rgba(28,28,30,0.12)] font-serif text-3xl sm:text-4xl tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    mobileMenuOpen
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  } ${isActive ? 'text-[#C8102E]' : 'text-[#1C1C1E]'}`
                }
              >
                <span>{item.label}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="w-5 h-5 text-[#8A8580] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#1C1C1E]"
                />
              </NavLink>
            ))}
          </nav>
        </div>

        <div
          style={{
            transitionDelay: mobileMenuOpen ? '420ms' : '0ms',
          }}
          className={`flex flex-col gap-3 pt-6 transition-all duration-500 ${
            mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#8A8580]">
            <span>UK Mainland Delivery</span>
            <span>NBF Approved Craftsmanship</span>
          </div>
        </div>
      </div>
    </>
  );
};
