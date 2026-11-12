import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, MessageSquare } from 'lucide-react';
import {
  Deal,
  DealStockStatus,
  buildDealOutboundUrl,
  formatGBP,
  getSavingPercent,
  isValidDealUrl,
} from '../../data/deals';
import { generateLeadId } from '../../data/leadFlow';
import { DealImagePlaceholder } from './DealImagePlaceholder';

export interface ProductCardProps {
  deal: Deal;
  onEnquire?: (deal: Deal, leadId: string) => void;
  fromDealsUrl?: string;
}

function getStockDotClass(stockStatus: DealStockStatus): string {
  switch (stockStatus) {
    case 'In stock':
      return 'bg-success';
    case 'Low stock':
      return 'bg-accent';
    case 'Check with supplier':
      return 'bg-primary';
    case 'Out of stock':
      return 'bg-muted';
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({
  deal,
  onEnquire,
  fromDealsUrl: fromDealsUrlProp,
}) => {
  const location = useLocation();
  const [imgFailed, setImgFailed] = useState(false);

  const savingPercent = getSavingPercent(deal);
  const hasVerifiedSaving =
    savingPercent !== null && typeof deal.referencePrice === 'number';
  const hasValidDealUrl = isValidDealUrl(deal.dealUrl);

  const fromDealsUrl =
    fromDealsUrlProp ??
    (location.pathname === '/deals' ||
    location.pathname === '/home-living' ||
    location.pathname === '/clearance-deals'
      ? `${location.pathname === '/clearance-deals' ? '/deals' : location.pathname}${location.search}`
      : '/deals');

  const primaryImage = deal.images.length > 0 && !imgFailed ? deal.images[0] : null;

  const handleEnquireClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const leadId = generateLeadId();
    onEnquire?.(deal, leadId);
  };

  const handleViewDealClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    const leadId = generateLeadId();
    const outbound = buildDealOutboundUrl(deal.dealUrl, leadId, deal.category);
    if (outbound) {
      event.currentTarget.href = outbound;
    }
  };

  return (
    <article
      data-testid={`deal-card-${deal.slug}`}
      data-flip-id={deal.slug}
      data-category={deal.category}
      data-subcategory={deal.subcategory}
      data-condition={deal.condition}
      data-price={deal.price}
      className="interactive-surface group relative flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:-translate-y-1 hover:border-primary/40 shadow-theme shadow-theme-hover"
    >
      {/* Card Main Link Area (Image + Brand + Title + Price + Stock + Delivery) */}
      <Link
        to={`/deals/${deal.slug}`}
        state={{ fromDealsUrl }}
        data-testid={`deal-card-link-${deal.slug}`}
        aria-label={`${deal.title} — ${formatGBP(deal.price)}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {/* Image Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-elevated border-b border-border flex items-center justify-center">
          {/* Top Badges: Condition (left) + Verified Saving % (right) */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
            <span
              data-testid={`deal-card-condition-${deal.slug}`}
              className="bg-surface/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[0.6875rem] font-semibold text-text border border-border"
            >
              {deal.condition}
            </span>

            {hasVerifiedSaving && (
              <span
                data-testid={`deal-card-saving-${deal.slug}`}
                className="bg-accent px-2.5 py-1 rounded-md text-[0.6875rem] font-bold text-white tabular-nums shadow-xs"
              >
                Save {savingPercent}%
              </span>
            )}
          </div>

          {/* Image or Clean Branded Placeholder */}
          <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            {primaryImage ? (
              <img
                src={primaryImage.src}
                alt={primaryImage.alt || deal.title}
                width={640}
                height={480}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover select-none"
                loading="lazy"
              />
            ) : (
              <DealImagePlaceholder
                subcategory={deal.subcategory}
                category={deal.category}
                size="card"
              />
            )}
          </div>

          {/* Bottom-left Sample Listing Tag */}
          {deal.isSample && (
            <div className="absolute bottom-2.5 left-3 z-20 pointer-events-none">
              <span
                data-testid={`deal-card-sample-tag-${deal.slug}`}
                className="inline-block bg-bg-elevated/90 backdrop-blur-xs border border-border px-2 py-0.5 rounded text-[0.625rem] font-medium text-muted"
              >
                Sample listing
              </span>
            </div>
          )}
        </div>

        {/* Retail Body */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            {/* Brand (small, muted) */}
            <p
              data-testid={`deal-card-brand-${deal.slug}`}
              className="text-xs text-muted font-medium truncate mb-1"
            >
              {deal.brand} · {deal.subcategory}
            </p>

            {/* Title (2 lines max) */}
            <h3
              data-testid={`deal-card-title-${deal.slug}`}
              className="font-heading text-base font-bold text-text group-hover:text-primary line-clamp-2 leading-snug min-h-[2.6rem]"
            >
              {deal.title}
            </h3>
          </div>

          <div className="mt-4 pt-3 border-t border-border space-y-2">
            {/* Price Row: Current price large, verified "Was" price struck through */}
            <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
              <span
                data-testid={`deal-card-price-${deal.slug}`}
                className="text-xl font-heading font-extrabold text-text"
              >
                {formatGBP(deal.price)}
              </span>

              {hasVerifiedSaving && (
                <span
                  data-testid={`deal-card-was-price-${deal.slug}`}
                  className="text-xs text-muted line-through"
                >
                  Was {formatGBP(deal.referencePrice!)}
                </span>
              )}
            </div>

            {/* Stock status with coloured dot */}
            <div
              data-testid={`deal-card-stock-${deal.slug}`}
              className="flex items-center gap-2 text-xs text-text font-medium"
            >
              <span
                aria-hidden="true"
                className={`w-2 h-2 rounded-full shrink-0 ${getStockDotClass(
                  deal.stockStatus
                )}`}
              />
              <span>{deal.stockStatus}</span>
            </div>

            {/* Delivery line */}
            <p
              data-testid={`deal-card-delivery-${deal.slug}`}
              className="text-xs text-muted truncate"
            >
              {deal.delivery}
            </p>
          </div>
        </div>
      </Link>

      {/* Action Buttons Footer */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center gap-2.5">
        {hasValidDealUrl ? (
          <>
            <a
              href={buildDealOutboundUrl(deal.dealUrl, 'UKCH-PREVIEW', deal.category) ?? '#'}
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid={`deal-card-view-deal-btn-${deal.slug}`}
              onClick={handleViewDealClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-xs px-3.5 py-2.5 min-h-[44px] transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <span>View Deal</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </a>

            <button
              type="button"
              data-testid={`deal-card-enquire-btn-${deal.slug}`}
              onClick={handleEnquireClick}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-surface-2 hover:border-primary hover:text-primary text-text font-heading font-semibold text-xs px-3.5 py-2.5 min-h-[44px] transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <span>Enquire</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              data-testid={`deal-card-enquire-now-btn-${deal.slug}`}
              onClick={handleEnquireClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-xs px-3.5 py-2.5 min-h-[44px] transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Enquire Now</span>
            </button>

            <Link
              to={`/deals/${deal.slug}`}
              state={{ fromDealsUrl }}
              data-testid={`deal-card-details-btn-${deal.slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-border-strong bg-surface-2 hover:border-primary hover:text-primary text-text font-heading font-semibold text-xs px-3.5 py-2.5 min-h-[44px] transition-all active:scale-[0.98] whitespace-nowrap"
            >
              Details
            </Link>
          </>
        )}
      </div>
    </article>
  );
};

export const DealCard = ProductCard;
