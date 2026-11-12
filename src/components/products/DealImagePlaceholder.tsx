import React from 'react';
import {
  Headphones,
  Watch,
  Tablet,
  Speaker,
  Disc,
  Tv,
  Flame,
  RefreshCw,
  Snowflake,
  Coffee,
  Wind,
  Zap,
  BedDouble,
  Layers,
  PanelTop,
  Archive,
  Sofa,
  Grid,
  Package,
} from 'lucide-react';
import { DealCategory } from '../../data/deals';

export interface DealImagePlaceholderProps {
  subcategory: string;
  category: DealCategory;
  title?: string;
  size?: 'card' | 'detail' | 'thumb';
}

function getSubcategoryIcon(subcategory: string) {
  const key = subcategory.trim().toLowerCase();
  switch (key) {
    case 'headphones':
      return Headphones;
    case 'smartwatches':
      return Watch;
    case 'tablets':
      return Tablet;
    case 'bluetooth speakers':
      return Speaker;
    case 'robot vacuums':
      return Disc;
    case '4k tvs':
      return Tv;
    case 'air fryers':
      return Flame;
    case 'washing machines':
      return RefreshCw;
    case 'fridge freezers':
      return Snowflake;
    case 'coffee machines':
      return Coffee;
    case 'cordless vacuums':
      return Wind;
    case 'microwaves':
      return Zap;
    case 'beds':
      return BedDouble;
    case 'mattresses':
      return Layers;
    case 'headboards':
      return PanelTop;
    case 'bedside tables':
      return Archive;
    case 'sofas':
      return Sofa;
    case 'rugs':
      return Grid;
    default:
      return Package;
  }
}

export const DealImagePlaceholder: React.FC<DealImagePlaceholderProps> = ({
  subcategory,
  category,
  size = 'card',
}) => {
  const IconComponent = getSubcategoryIcon(subcategory);

  const iconBoxSize =
    size === 'detail'
      ? 'w-20 h-20 rounded-2xl'
      : size === 'thumb'
        ? 'w-9 h-9 rounded-lg'
        : 'w-14 h-14 rounded-xl';

  const iconSvgSize =
    size === 'detail'
      ? 'w-9 h-9'
      : size === 'thumb'
        ? 'w-4 h-4'
        : 'w-7 h-7';

  return (
    <div
      data-testid="deal-image-placeholder"
      data-subcategory={subcategory}
      className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden bg-bg-elevated bg-hero-glow"
    >
      {/* Subtle architectural grid lines using semantic border token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-lg border border-border/60"
      />

      <div
        className={`relative z-10 flex items-center justify-center border border-border-strong bg-surface/90 text-primary shadow-theme ${iconBoxSize} transition-transform duration-300 group-hover:scale-105`}
      >
        <IconComponent className={`${iconSvgSize} stroke-[1.6]`} aria-hidden="true" />
      </div>

      {size !== 'thumb' && (
        <div className="relative z-10 mt-3 flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold text-text tracking-tight">
            {subcategory}
          </span>
          <span className="text-[0.6875rem] text-muted font-medium">
            Image coming soon
          </span>
          {size === 'detail' && (
            <span className="mt-1 text-[0.6875rem] text-muted">
              {category} · UK Supplier Clearance
            </span>
          )}
        </div>
      )}
    </div>
  );
};
