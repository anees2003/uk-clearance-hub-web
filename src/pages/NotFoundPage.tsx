import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, Search, ShoppingBag } from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { buildDealsSearchUrl } from '../data/brand';
import { HERO_SEARCH_SUGGESTION_CHIPS } from '../data/homePageData';
import { useSeo } from '../utils/seo';

export const NotFoundPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useSeo({
    title: 'Page Not Found (404) — Browse UK Deals | UK Clearance Hub',
    description:
      'We could not find the page you were looking for. Search live UK clearance deals across Electronics, Home Appliances, and Home & Living or return home.',
    canonicalPath: '/404',
    robots: 'noindex,follow',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(buildDealsSearchUrl(query));
  };

  return (
    <section
      data-testid="not-found-page"
      className="section-padding min-h-[72vh] flex items-center bg-bg text-text relative overflow-hidden"
    >
      <Container>
        <div className="max-w-2xl mx-auto rounded-2xl border border-border-strong bg-surface p-8 sm:p-12 text-center shadow-theme space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-2 border border-border text-primary mx-auto">
            <Compass className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <Eyebrow tone="orange" className="justify-center">
              Error 404 · Page Not Found
            </Eyebrow>
            <h1
              data-testid="not-found-heading"
              className="type-h1 font-heading text-text"
            >
              We couldn&apos;t find that page
            </h1>
            <p className="type-body text-muted max-w-lg mx-auto">
              The link you followed may have moved or the clearance deal may no
              longer be listed. Search our live catalogue below or head back to
              All Deals.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            role="search"
            data-testid="not-found-search-form"
            className="max-w-lg mx-auto relative flex items-center"
          >
            <label htmlFor="not-found-search-input" className="sr-only">
              Search clearance deals
            </label>
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              id="not-found-search-input"
              data-testid="not-found-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search air fryers, headphones, mattresses…"
              className="w-full bg-bg border border-border-strong rounded-lg pl-11 pr-28 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
            />
            <button
              type="submit"
              data-testid="not-found-search-submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Suggestion Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
            <span>Popular:</span>
            {HERO_SEARCH_SUGGESTION_CHIPS.map((chip, idx) => (
              <React.Fragment key={chip.label}>
                <button
                  type="button"
                  onClick={() => navigate(chip.to)}
                  className="text-text/85 hover:text-primary underline underline-offset-4 cursor-pointer"
                >
                  {chip.label}
                </button>
                {idx < HERO_SEARCH_SUGGESTION_CHIPS.length - 1 && (
                  <span aria-hidden="true">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Primary Navigation Actions */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-center gap-3.5">
            <Button
              to="/deals"
              variant="orange"
              data-testid="not-found-all-deals-btn"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Browse All Deals
            </Button>

            <Button
              to="/"
              variant="outline"
              data-testid="not-found-home-btn"
            >
              <Home className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Back to Home
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
