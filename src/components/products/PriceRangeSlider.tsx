import React, { useCallback, useRef } from 'react';
import { formatPrice } from '../../data/deals';

export interface PriceRangeSliderProps {
  minLimit: number;
  maxLimit: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onChange: (nextMin: number, nextMax: number) => void;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  minLimit,
  maxLimit,
  minValue,
  maxValue,
  step = 10,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const safeRange = Math.max(1, maxLimit - minLimit);

  const minPercent = Math.max(
    0,
    Math.min(100, ((minValue - minLimit) / safeRange) * 100)
  );
  const maxPercent = Math.max(
    0,
    Math.min(100, ((maxValue - minLimit) / safeRange) * 100)
  );

  const clampMin = useCallback(
    (candidate: number) => {
      const snapped = Math.round(candidate / step) * step;
      return Math.max(minLimit, Math.min(snapped, maxValue - step));
    },
    [minLimit, maxValue, step]
  );

  const clampMax = useCallback(
    (candidate: number) => {
      const snapped = Math.round(candidate / step) * step;
      return Math.min(maxLimit, Math.max(snapped, minValue + step));
    },
    [maxLimit, minValue, step]
  );

  const handleMinKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let next = minValue;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      next = clampMin(minValue + step);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      next = clampMin(minValue - step);
    } else if (event.key === 'PageUp') {
      next = clampMin(minValue + step * 5);
    } else if (event.key === 'PageDown') {
      next = clampMin(minValue - step * 5);
    } else if (event.key === 'Home') {
      next = minLimit;
    } else if (event.key === 'End') {
      next = Math.max(minLimit, maxValue - step);
    } else {
      return;
    }
    event.preventDefault();
    onChange(next, maxValue);
  };

  const handleMaxKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let next = maxValue;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      next = clampMax(maxValue + step);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      next = clampMax(maxValue - step);
    } else if (event.key === 'PageUp') {
      next = clampMax(maxValue + step * 5);
    } else if (event.key === 'PageDown') {
      next = clampMax(maxValue - step * 5);
    } else if (event.key === 'Home') {
      next = Math.min(maxLimit, minValue + step);
    } else if (event.key === 'End') {
      next = maxLimit;
    } else {
      return;
    }
    event.preventDefault();
    onChange(minValue, next);
  };

  const startPointerDrag = (handleType: 'min' | 'max') => (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const updateFromClientX = (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const rawValue = minLimit + ratio * safeRange;
      if (handleType === 'min') {
        onChange(clampMin(rawValue), maxValue);
      } else {
        onChange(minValue, clampMax(rawValue));
      }
    };

    const handleMove = (moveEvent: PointerEvent) => {
      updateFromClientX(moveEvent.clientX);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      data-testid="price-range-slider"
      className="flex flex-col gap-2 min-w-[210px] sm:min-w-[240px]"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
        <span>Price Range</span>
        <span
          data-testid="price-range-live-values"
          className="font-semibold text-text tabular-nums"
        >
          {formatPrice(minValue)} — {formatPrice(maxValue)}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-6 flex items-center select-none touch-none"
      >
        {/* Background Track */}
        <div className="w-full h-[3px] bg-border-strong rounded-full relative">
          {/* Active Fill Segment */}
          <div
            data-testid="price-range-active-track"
            className="absolute top-0 bottom-0 bg-primary rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Minimum Handle */}
        <button
          type="button"
          role="slider"
          aria-label="Minimum price"
          aria-valuemin={minLimit}
          aria-valuemax={maxValue - step}
          aria-valuenow={minValue}
          aria-valuetext={formatPrice(minValue)}
          data-testid="price-slider-min-handle"
          onKeyDown={handleMinKeyDown}
          onPointerDown={startPointerDrag('min')}
          style={{ left: `${minPercent}%` }}
          className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-surface border-2 border-primary cursor-grab active:cursor-grabbing hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus z-10"
        />

        {/* Maximum Handle */}
        <button
          type="button"
          role="slider"
          aria-label="Maximum price"
          aria-valuemin={minValue + step}
          aria-valuemax={maxLimit}
          aria-valuenow={maxValue}
          aria-valuetext={formatPrice(maxValue)}
          data-testid="price-slider-max-handle"
          onKeyDown={handleMaxKeyDown}
          onPointerDown={startPointerDrag('max')}
          style={{ left: `${maxPercent}%` }}
          className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-primary cursor-grab active:cursor-grabbing hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus z-20"
        />
      </div>
    </div>
  );
};
