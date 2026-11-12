import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MoveHorizontal,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  Truck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { ScrollTrigger } from '../animations/gsap';
import {
  Deal,
  DealStockStatus,
  ProductColourOption,
  ProductSizeOption,
  STOCK_CONFIRMATION_NOTE,
  UK_BED_SIZES,
  buildDealOutboundUrl,
  formatGBP,
  getDealBySlug,
  getRelatedDeals,
  getSavingPercent,
  isDealLive,
  isValidDealUrl,
} from '../data/deals';
import {
  buildDirectWhatsAppDealUrl,
  generateLeadId,
  getOrInitSourceChannel,
} from '../data/leadFlow';
import type { BedSetHandle } from '../three/bedParts';
import {
  CATEGORY_CAMERA_FRAMING,
  applyCategoryIsolationAndCentring,
  tweenBedSetMaterialColour,
  tweenBedSetWidthScale,
} from '../three/productModelUtils';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/products/ProductCard';
import { DealImagePlaceholder } from '../components/products/DealImagePlaceholder';
import { ReservationEnquiryModal } from '../components/products/ReservationEnquiryModal';
import {
  buildBreadcrumbJsonLd,
  buildDealProductJsonLd,
  getDealRobotsDirective,
  useSeo,
} from '../utils/seo';

const LazyStudioScene = React.lazy(() =>
  import('../three/StudioScene').then((m) => ({ default: m.StudioScene }))
);

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

export const BedDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const deal: Deal | undefined = getDealBySlug(slug);

  useSeo({
    title: deal
      ? `${deal.title} | UK Clearance Hub`
      : 'Deal Not Found | UK Clearance Hub',
    description: deal
      ? deal.shortDescription
      : 'This clearance deal could not be found or is no longer listed. Browse live UK clearance deals across Electronics, Home Appliances, and Home & Living.',
    canonicalPath: deal ? `/deals/${deal.slug}` : `/deals/${slug ?? ''}`,
    robots: getDealRobotsDirective(deal),
    ogType: deal ? 'product' : 'website',
    jsonLd: deal
      ? [
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'All Deals', path: '/deals' },
            {
              name: deal.category,
              path: `/deals?category=${encodeURIComponent(deal.category)}`,
            },
            { name: deal.title, path: `/deals/${deal.slug}` },
          ]),
          buildDealProductJsonLd(deal),
        ]
      : null,
  });

  const pageRef = useRef<HTMLDivElement | null>(null);
  const bedSetRef = useRef<BedSetHandle | null>(null);

  const threeD = deal?.threeDConfig;
  const defaultKingSize =
    threeD?.sizes.find((s) => s.label === 'King') ??
    threeD?.sizes[0] ??
    UK_BED_SIZES[3];

  const [selectedSize, setSelectedSize] =
    useState<ProductSizeOption>(defaultKingSize);
  const [selectedColour, setSelectedColour] = useState<ProductColourOption>(
    () =>
      threeD?.colours[0] ?? {
        name: 'Warm Putty Bouclé',
        hex: 'var(--primary)',
      }
  );
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [hasInteractedWith3D, setHasInteractedWith3D] = useState(false);

  // Modal state (either for the main deal on this page or a related deal card)
  const [activeEnquiry, setActiveEnquiry] = useState<{
    deal: Deal;
    leadId: string;
    selectedOptionSummary?: string;
  } | null>(null);

  // Initialise source channel on mount
  useEffect(() => {
    getOrInitSourceChannel();
  }, []);

  // Sync state when navigating between different /deals/:slug routes
  useEffect(() => {
    if (!deal) return;
    setSelectedImageIdx(0);
    setHasInteractedWith3D(false);
    setActiveEnquiry(null);

    if (deal.threeDConfig) {
      const nextSize =
        deal.threeDConfig.sizes.find((s) => s.label === 'King') ??
        deal.threeDConfig.sizes[0];
      const nextColour = deal.threeDConfig.colours[0];
      setSelectedSize(nextSize);
      setSelectedColour(nextColour);

      if (bedSetRef.current) {
        applyCategoryIsolationAndCentring(
          bedSetRef.current,
          deal.threeDConfig.modelCategory
        );
        tweenBedSetWidthScale(bedSetRef.current, nextSize.widthScale, true);
        tweenBedSetMaterialColour(
          bedSetRef.current,
          deal.threeDConfig.modelCategory,
          nextColour.hex,
          true
        );
      }
    }
  }, [deal]);

  const handleBedSetReady = useCallback(
    (handle: BedSetHandle) => {
      bedSetRef.current = handle;
      if (!deal || !deal.threeDConfig) return;

      const initialSize =
        deal.threeDConfig.sizes.find((s) => s.label === 'King') ??
        deal.threeDConfig.sizes[0];
      const initialColour = deal.threeDConfig.colours[0];

      applyCategoryIsolationAndCentring(handle, deal.threeDConfig.modelCategory);
      tweenBedSetWidthScale(handle, initialSize.widthScale, true);
      tweenBedSetMaterialColour(
        handle,
        deal.threeDConfig.modelCategory,
        initialColour.hex,
        true
      );

      window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 60);
    },
    [deal]
  );

  const handleSelectSize = (sizeOption: ProductSizeOption) => {
    setSelectedSize(sizeOption);
    if (bedSetRef.current && deal?.threeDConfig) {
      tweenBedSetWidthScale(bedSetRef.current, sizeOption.widthScale, false);
    }
  };

  const handleSelectColour = (colourOption: ProductColourOption) => {
    setSelectedColour(colourOption);
    if (bedSetRef.current && deal?.threeDConfig) {
      tweenBedSetMaterialColour(
        bedSetRef.current,
        deal.threeDConfig.modelCategory,
        colourOption.hex,
        false
      );
    }
  };

  const backToDealsUrl =
    (location.state as { fromDealsUrl?: string } | null)?.fromDealsUrl ||
    '/deals';

  // Styled "Deal not found" fallback for unknown slugs
  if (!deal) {
    return (
      <div
        data-testid="product-not-found"
        className="min-h-[80vh] bg-bg text-text py-20 flex items-center"
      >
        <Container>
          <div className="max-w-xl rounded-xl border border-border bg-surface p-8 md:p-12 shadow-theme">
            <Eyebrow tone="orange" className="mb-4">
              404 · Deal Not Found
            </Eyebrow>
            <h1 className="type-h2 font-heading text-text mb-4">
              Deal not found
            </h1>
            <p className="type-body text-muted mb-8">
              The clearance deal you are looking for could not be found. Browse
              our live UK clearance catalogue to explore current deals from
              verified suppliers.
            </p>
            <Button
              to={backToDealsUrl}
              variant="primary"
              data-testid="not-found-back-link"
            >
              Back to Deals
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const live = isDealLive(deal);
  const savingPercent = getSavingPercent(deal);
  const hasVerifiedSaving =
    savingPercent !== null && typeof deal.referencePrice === 'number';
  const hasValidDealUrl = live && isValidDealUrl(deal.dealUrl);
  const relatedDeals = getRelatedDeals(deal, 4);

  const showUkSizeSwitch =
    deal.threeDConfig?.modelCategory === 'Beds' ||
    deal.threeDConfig?.modelCategory === 'Mattresses';

  const selectedOptionSummary = deal.threeDConfig
    ? showUkSizeSwitch
      ? `${selectedSize.label} (${selectedSize.dimensionsCm}) · ${selectedColour.name}`
      : selectedColour.name
    : undefined;

  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/deals/${deal.slug}`
      : `https://ukclearancehub.co.uk/deals/${deal.slug}`;

  const handleOpenMainEnquiry = () => {
    const freshLeadId = generateLeadId();
    setActiveEnquiry({
      deal,
      leadId: freshLeadId,
      selectedOptionSummary,
    });
  };

  const handleViewDealClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const freshLeadId = generateLeadId();
    const outbound = buildDealOutboundUrl(
      deal.dealUrl,
      freshLeadId,
      deal.category
    );
    if (outbound) {
      event.currentTarget.href = outbound;
    }
  };

  const handleWhatsAppEnquiryClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const freshLeadId = generateLeadId();
    const sourceChannel = getOrInitSourceChannel();
    const waUrl = buildDirectWhatsAppDealUrl({
      leadId: freshLeadId,
      deal,
      pageUrl,
      sourceChannel,
      selectedOptionSummary,
    });
    event.currentTarget.href = waUrl;
  };

  return (
    <div
      ref={pageRef}
      data-testid="product-detail-page"
      data-deal-slug={deal.slug}
      data-deal-category={deal.category}
      data-deal-live={live ? 'true' : 'false'}
      className="min-h-screen bg-bg text-text pt-8 md:pt-12 pb-20"
    >
      <Container>
        {/* Top Row: Back to Deals Link + Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={backToDealsUrl}
            data-testid="pdp-back-to-deals"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-surface border border-border-strong text-xs font-heading font-bold text-text hover:border-primary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Deals</span>
          </Link>

          <nav
            aria-label="Breadcrumb"
            data-testid="pdp-breadcrumbs"
            className="flex flex-wrap items-center gap-2 text-xs text-muted"
          >
            <Link to="/" className="hover:text-text transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/deals" className="hover:text-text transition-colors">
              All Deals
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/deals?category=${encodeURIComponent(deal.category)}`}
              className="hover:text-text transition-colors"
            >
              {deal.category}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-text font-semibold truncate max-w-[240px]">
              {deal.title}
            </span>
          </nav>
        </div>

        {/* Expired or Unavailable Deal Banner */}
        {!live && (
          <div
            role="status"
            data-testid="expired-deal-banner"
            className="mb-8 rounded-xl border border-accent/40 bg-surface p-5 sm:p-6 shadow-theme flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <AlertCircle
                className="w-6 h-6 text-accent shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-text">
                  This deal has ended
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  This clearance allocation is no longer available from the
                  supplier. Explore similar live clearance deals below or return
                  to the main catalogue.
                </p>
              </div>
            </div>

            <Link
              to={backToDealsUrl}
              data-testid="expired-banner-back-btn"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-heading font-bold text-xs whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Deals</span>
            </Link>
          </div>
        )}

        {/* Top Split Layout: Left 58% Visual (3D Viewer for converted beds OR Image Gallery) + Right 42% Deal Info Panel */}
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
          {/* Left Column: Interactive 3D Viewer (for converted bed items) OR Image Gallery with Thumbnails */}
          <div className="w-full lg:w-[58%] lg:sticky lg:top-36">
            {deal.threeDConfig ? (
              <div
                data-testid="pdp-3d-viewer"
                onPointerDown={() => setHasInteractedWith3D(true)}
                onWheel={() => setHasInteractedWith3D(true)}
                className="relative w-full h-[52dvh] lg:h-[68dvh] min-h-[380px] max-h-[680px] rounded-xl border border-border bg-surface-2 overflow-hidden cursor-grab active:cursor-grabbing shadow-theme"
              >
                <Suspense
                  fallback={
                    <div
                      className="w-full h-full bg-surface-2 animate-pulse"
                      aria-hidden="true"
                    />
                  }
                >
                  <LazyStudioScene
                    enableOrbitControls={true}
                    autoRotate={!hasInteractedWith3D}
                    autoRotateSpeed={0.65}
                    onOrbitStart={() => setHasInteractedWith3D(true)}
                    cameraInitialPosition={
                      CATEGORY_CAMERA_FRAMING[deal.threeDConfig.modelCategory]
                        .cameraPosition
                    }
                    orbitTarget={
                      CATEGORY_CAMERA_FRAMING[deal.threeDConfig.modelCategory]
                        .orbitTarget
                    }
                    minDistance={
                      CATEGORY_CAMERA_FRAMING[deal.threeDConfig.modelCategory]
                        .minDistance
                    }
                    maxDistance={
                      CATEGORY_CAMERA_FRAMING[deal.threeDConfig.modelCategory]
                        .maxDistance
                    }
                    initialAssembled={true}
                    onBedSetReady={handleBedSetReady}
                  />
                </Suspense>

                {/* Top-left viewer category & active size badge */}
                <div className="pointer-events-none absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
                  <span className="bg-surface/95 backdrop-blur-md border border-border rounded-md px-3 py-1.5 text-[0.6875rem] font-semibold text-text">
                    Interactive 3D Preview · {deal.subcategory}
                  </span>
                  {showUkSizeSwitch && (
                    <span
                      data-testid="pdp-viewer-size-badge"
                      className="bg-primary text-primary-contrast rounded-md px-3 py-1.5 text-[0.6875rem] tabular-nums font-semibold"
                    >
                      {selectedSize.label} ({selectedSize.dimensionsCm})
                    </span>
                  )}
                </div>

                {/* "Drag to rotate" hint */}
                <div
                  data-testid="pdp-drag-hint"
                  data-hidden={hasInteractedWith3D ? 'true' : 'false'}
                  className={`pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-md bg-bg-elevated/90 backdrop-blur-md border border-border text-text px-4 py-2 text-xs font-medium transition-opacity duration-500 ${
                    hasInteractedWith3D ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <MoveHorizontal
                    className="w-3.5 h-3.5 text-primary"
                    aria-hidden="true"
                  />
                  <span>Drag to rotate 3D model</span>
                </div>
              </div>
            ) : (
              <div data-testid="pdp-image-gallery" className="space-y-3">
                {/* Main Gallery Stage */}
                <div className="relative aspect-[4/3] w-full rounded-xl border border-border bg-surface overflow-hidden shadow-theme">
                  {deal.images.length > 0 && deal.images[selectedImageIdx] ? (
                    <img
                      src={deal.images[selectedImageIdx].src}
                      alt={deal.images[selectedImageIdx].alt || deal.title}
                      width={800}
                      height={600}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DealImagePlaceholder
                      subcategory={deal.subcategory}
                      category={deal.category}
                      size="detail"
                    />
                  )}
                </div>

                {/* Thumbnail Strip */}
                <div
                  role="group"
                  aria-label="Product image thumbnails"
                  className="grid grid-cols-4 gap-3"
                >
                  {(deal.images.length > 0
                    ? deal.images
                    : [
                        { src: '', alt: `${deal.title} — Front view` },
                        { src: '', alt: `${deal.title} — Side profile` },
                        { src: '', alt: `${deal.title} — Detail view` },
                      ]
                  ).map((img, idx) => {
                    const active = selectedImageIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        data-testid={`pdp-gallery-thumb-${idx}`}
                        aria-label={img.alt || `View image ${idx + 1}`}
                        aria-pressed={active}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`aspect-[4/3] min-h-[44px] rounded-lg border overflow-hidden cursor-pointer transition-all ${
                          active
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border opacity-75 hover:opacity-100 hover:border-border-strong'
                        }`}
                      >
                        {img.src ? (
                          <img
                            src={img.src}
                            alt={img.alt}
                            width={240}
                            height={180}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <DealImagePlaceholder
                            subcategory={deal.subcategory}
                            category={deal.category}
                            size="thumb"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contiguous Deal Information & Referral Actions */}
          <div
            data-testid="pdp-info-panel"
            className="w-full lg:w-[42%] flex flex-col bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-theme"
          >
            {/* Top Meta Row: Condition Badge + Sample Listing Tag */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  data-testid="pdp-condition-badge"
                  className="inline-block bg-surface-2 border border-border-strong rounded-md px-3 py-1 text-xs font-semibold text-primary"
                >
                  Condition: {deal.condition}
                </span>

                {deal.isSample && (
                  <span
                    data-testid="pdp-sample-tag"
                    className="inline-block bg-bg-elevated border border-border rounded-md px-2.5 py-1 text-xs font-medium text-muted"
                  >
                    Sample listing
                  </span>
                )}
              </div>

              <span className="text-xs text-muted font-medium">
                {deal.subcategory}
              </span>
            </div>

            {/* Brand */}
            <p
              data-testid="pdp-brand"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-1"
            >
              {deal.brand}
            </p>

            {/* Title */}
            <h1
              data-testid="pdp-title"
              className="type-h2 font-heading text-text mb-3"
            >
              {deal.title}
            </h1>

            {/* Condition Note (if present) */}
            {deal.conditionNote && (
              <p
                data-testid="pdp-condition-note"
                className="text-xs text-text/90 bg-bg-elevated border border-border rounded-lg px-3.5 py-2.5 mb-4"
              >
                <strong className="font-semibold text-text">
                  Condition note:
                </strong>{' '}
                {deal.conditionNote}
              </p>
            )}

            {/* Price Block (Verified Saving Rules Strictly Applied) */}
            <div className="flex flex-wrap items-baseline gap-3 pb-4 mb-4 border-b border-border tabular-nums">
              <span
                data-testid="pdp-now-price"
                className="text-3xl font-heading font-extrabold text-text"
              >
                {formatGBP(deal.price)}
              </span>

              {hasVerifiedSaving && (
                <>
                  <span
                    data-testid="pdp-was-price"
                    className="text-base text-muted line-through"
                  >
                    Was {formatGBP(deal.referencePrice!)}
                  </span>
                  <span
                    data-testid="pdp-saving-badge"
                    className="bg-accent text-white rounded-md px-2.5 py-1 text-xs font-bold"
                  >
                    Save {savingPercent}% (
                    {formatGBP(deal.referencePrice! - deal.price)})
                  </span>
                </>
              )}
            </div>

            {/* Stock Status + Supplier Confirmation + Sold & Delivered By */}
            <div className="space-y-2.5 mb-5 pb-5 border-b border-border text-xs">
              <div
                data-testid="pdp-stock-status"
                className="flex flex-wrap items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStockDotClass(
                    deal.stockStatus
                  )}`}
                />
                <span className="font-semibold text-text">
                  {deal.stockStatus}
                </span>
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
                <span
                  data-testid="pdp-stock-confirmation-note"
                  className="text-muted"
                >
                  {STOCK_CONFIRMATION_NOTE}
                </span>
              </div>

              <div
                data-testid="pdp-supplier-line"
                className="flex items-center gap-2 text-text/90"
              >
                <ShieldCheck
                  className="w-4 h-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Sold and delivered by{' '}
                  <strong className="font-semibold text-text">
                    {deal.supplierName}
                  </strong>
                </span>
              </div>

              <div
                data-testid="pdp-delivery-line"
                className="flex items-center gap-2 text-muted"
              >
                <Truck
                  className="w-4 h-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {deal.delivery} ({deal.deliveredBy})
                </span>
              </div>
            </div>

            {/* Short Description */}
            <p
              data-testid="pdp-short-description"
              className="type-small text-text/85 mb-6"
            >
              {deal.shortDescription}
            </p>

            {/* 3D Bed/Mattress Size & Finish Controls (only for converted 3D deals) */}
            {deal.threeDConfig && showUkSizeSwitch && (
              <div
                data-testid="pdp-size-switch"
                className="mb-5 pb-5 border-b border-border"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-text">
                    UK Size
                  </span>
                  <Link
                    to="/bed-size-guide"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    UK Size Guide
                  </Link>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Select UK bed or mattress size"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                >
                  {deal.threeDConfig.sizes.map((sizeOpt) => {
                    const isSelected = selectedSize.label === sizeOpt.label;
                    return (
                      <button
                        key={sizeOpt.label}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={`pdp-size-btn-${sizeOpt.label}`}
                        onClick={() => handleSelectSize(sizeOpt)}
                        className={`px-3 py-2 rounded-lg text-left border transition-all cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? 'bg-primary text-primary-contrast border-primary'
                            : 'bg-surface-2 text-text border-border-strong hover:border-primary'
                        }`}
                      >
                        <span className="block text-xs font-semibold">
                          {sizeOpt.label}
                        </span>
                        <span
                          className={`block text-[0.6875rem] tabular-nums ${
                            isSelected ? 'opacity-85' : 'text-muted'
                          }`}
                        >
                          {sizeOpt.dimensionsCm}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {deal.threeDConfig && (
              <div
                data-testid="pdp-colour-swatches"
                className="mb-6 pb-5 border-b border-border"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-text">
                    Finish / Upholstery
                  </span>
                  <span
                    data-testid="pdp-selected-colour-name"
                    className="text-xs text-muted"
                  >
                    {selectedColour.name}
                  </span>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Select upholstery or finish colour"
                  className="flex flex-wrap items-center gap-2"
                >
                  {deal.threeDConfig.colours.map((swatch) => {
                    const active = selectedColour.name === swatch.name;
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={swatch.name}
                        data-testid={`pdp-swatch-${swatch.name}`}
                        onClick={() => handleSelectColour(swatch)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-[0.98] ${
                          active
                            ? 'border-primary bg-surface-2'
                            : 'border-border-strong bg-transparent hover:border-primary'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-border-strong shrink-0"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-xs text-text font-medium">
                          {swatch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons (View Deal, Enquire Now, WhatsApp Enquiry) */}
            {live ? (
              <div className="space-y-3">
                {hasValidDealUrl && (
                  <div className="space-y-2">
                    <p
                      data-testid="pdp-outbound-supplier-notice"
                      className="text-xs text-muted bg-bg-elevated border border-border rounded-lg px-3 py-2"
                    >
                      You&apos;re going to{' '}
                      <strong className="font-semibold text-text">
                        {deal.supplierName}
                      </strong>
                      . Your purchase is completed with the supplier.
                    </p>
                    <a
                      href={
                        buildDealOutboundUrl(
                          deal.dealUrl,
                          'UKCH-PREVIEW',
                          deal.category
                        ) ?? '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      data-testid="pdp-view-deal-btn"
                      onClick={handleViewDealClick}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-heading font-bold text-sm transition-all active:scale-[0.98] shadow-xs"
                    >
                      <span>View Deal</span>
                      <ExternalLink
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    data-testid="pdp-enquire-now-btn"
                    onClick={handleOpenMainEnquiry}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg font-heading font-bold text-xs transition-all active:scale-[0.98] cursor-pointer ${
                      hasValidDealUrl
                        ? 'border border-border-strong bg-surface-2 hover:border-primary text-text'
                        : 'bg-accent hover:bg-accent-hover text-white shadow-xs'
                    }`}
                  >
                    <MessageSquare
                      className="w-4 h-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Enquire Now</span>
                  </button>

                  <a
                    href={buildDirectWhatsAppDealUrl({
                      leadId: 'UKCH-PREVIEW',
                      deal,
                      pageUrl,
                      sourceChannel: getOrInitSourceChannel(),
                      selectedOptionSummary,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="pdp-whatsapp-enquiry-btn"
                    onClick={handleWhatsAppEnquiryClick}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-success hover:opacity-95 text-white font-heading font-bold text-xs transition-all active:scale-[0.98] shadow-xs"
                  >
                    <MessageCircle
                      className="w-4 h-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>WhatsApp Enquiry</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-bg-elevated border border-border p-4 text-xs text-muted">
                This clearance listing is no longer active. Browse similar live
                deals below or{' '}
                <Link
                  to={backToDealsUrl}
                  className="text-primary font-semibold hover:underline"
                >
                  return to All Deals
                </Link>
                .
              </div>
            )}
          </div>
        </div>

        {/* Below: Highlights + Specifications + Delivery & Condition Explained */}
        <section
          data-testid="pdp-details-section"
          className="mt-16 pt-12 border-t border-border grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left 7 Cols: Description, Highlights & Specifications Table */}
          <div className="lg:col-span-7 space-y-8">
            {/* Description & Highlights */}
            <div className="bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-theme">
              <Eyebrow tone="blue" className="mb-2">
                Deal Overview
              </Eyebrow>
              <h2 className="type-h3 font-heading text-text mb-4">
                Key highlights &amp; description
              </h2>
              <p className="type-body text-text/85 mb-6">{deal.description}</p>

              <h3 className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-text mb-3">
                Highlights
              </h3>
              <ul
                data-testid="pdp-highlights-list"
                className="space-y-2.5"
              >
                {deal.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-text/90"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specifications Table */}
            <div
              data-testid="pdp-specifications-table"
              className="bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-theme"
            >
              <Eyebrow tone="blue" className="mb-2">
                Technical Data
              </Eyebrow>
              <h2 className="type-h3 font-heading text-text mb-5">
                Specifications
              </h2>

              <dl className="divide-y divide-border border-t border-border">
                {Object.entries(deal.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm"
                  >
                    <dt className="font-semibold text-muted">{key}</dt>
                    <dd className="sm:col-span-2 text-text">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right 5 Cols: Delivery & Condition Explained + How Buying Works */}
          <div className="lg:col-span-5 space-y-8">
            {/* Delivery & Condition Explained */}
            <div
              data-testid="pdp-delivery-condition-explained"
              className="bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-theme space-y-4"
            >
              <Eyebrow tone="orange" className="mb-1">
                Transparency &amp; Grading
              </Eyebrow>
              <h2 className="type-h3 font-heading text-text">
                Delivery &amp; condition explained
              </h2>

              <div className="p-4 rounded-lg bg-bg-elevated border border-border space-y-1.5">
                <p className="text-xs font-semibold text-primary">
                  This item is graded: {deal.condition}
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  {deal.condition === 'New' &&
                    'Brand-new, unused clearance or overstock item supplied in factory or transit packaging.'}
                  {deal.condition === 'Refurbished' &&
                    'Professionally inspected, tested, and cleaned by the supplier or manufacturer to full working specification.'}
                  {deal.condition === 'Graded' &&
                    'Unused or open-box stock with minor cosmetic packaging or cabinet marks clearly noted before dispatch.'}
                  {deal.condition === 'Ex-display' &&
                    'Previously displayed in a partner showroom or retail cabinet and inspected prior to dispatch.'}
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted leading-relaxed">
                <p>
                  <strong className="text-text font-semibold">
                    Supplier Fulfilment:
                  </strong>{' '}
                  Sold and delivered by {deal.supplierName}. {deal.delivery} via{' '}
                  {deal.deliveredBy}.
                </p>
                <p>
                  <strong className="text-text font-semibold">
                    Price &amp; Stock Verification:
                  </strong>{' '}
                  Where a &ldquo;Was&rdquo; reference price is shown, it has
                  been verified against historical retail pricing. Final stock
                  availability and delivery slots are confirmed directly by the
                  supplier.
                </p>
              </div>
            </div>

            {/* How Buying Through UK Clearance Hub Works (3 Steps) */}
            <div
              data-testid="pdp-how-buying-works"
              className="bg-surface rounded-xl border border-border p-6 sm:p-8 shadow-theme"
            >
              <Eyebrow tone="blue" className="mb-2">
                Referral Model
              </Eyebrow>
              <h2 className="type-h3 font-heading text-text mb-5">
                How buying through UK Clearance Hub works
              </h2>

              <ol className="space-y-4">
                <li className="flex items-start gap-3.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary font-heading font-bold text-xs shrink-0">
                    <Search className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-text">
                      1. Find the deal
                    </h3>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Browse vetted clearance stock across Electronics, Home
                      Appliances, and Home &amp; Living with transparent
                      condition notes.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 text-accent font-heading font-bold text-xs shrink-0">
                    <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-text">
                      2. Buy from the supplier
                    </h3>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Click &ldquo;View Deal&rdquo; to go straight to the
                      supplier, or send an enquiry via WhatsApp or Email quoting
                      your Lead ID.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/15 text-success font-heading font-bold text-xs shrink-0">
                    <Truck className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-text">
                      3. The supplier delivers
                    </h3>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      The supplier processes your order, dispatches the item to
                      your UK address, and provides customer support and
                      statutory warranty cover.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Related Live Deals */}
        <section
          data-testid="pdp-related-products"
          className="mt-16 pt-12 border-t border-border"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Eyebrow tone="orange" className="mb-2">
                {live ? 'More Clearance Picks' : 'Similar Live Deals'}
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text">
                {live ? 'Related live deals' : 'Available deals in this category'}
              </h2>
            </div>

            <Button to="/deals" variant="outline">
              Browse All Live Deals
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedDeals.map((rel) => (
              <ProductCard
                key={rel.slug}
                deal={rel}
                onEnquire={(targetDeal, leadId) =>
                  setActiveEnquiry({ deal: targetDeal, leadId })
                }
              />
            ))}
          </div>
        </section>
      </Container>

      {/* Enquiry Modal */}
      {activeEnquiry && (
        <ReservationEnquiryModal
          isOpen={true}
          onClose={() => setActiveEnquiry(null)}
          deal={activeEnquiry.deal}
          initialLeadId={activeEnquiry.leadId}
          selectedOptionSummary={activeEnquiry.selectedOptionSummary}
        />
      )}
    </div>
  );
};

export const DealDetailPage = BedDetailPage;
