import React from 'react';
import { Box } from 'lucide-react';

export type ThreeUnavailableVariant = 'inline' | 'background';

interface ThreeUnavailablePanelProps {
  /**
   * `inline`: fills a 3D slot (card, viewer box).
   * `background`: replaces a full-screen 3D backdrop; only a small note at the bottom,
   * so it never sits behind page text.
   */
  variant?: ThreeUnavailableVariant;
  className?: string;
}

// Deliberately imports nothing from three.js, so it renders even when the 3D code fails to load.
export const ThreeUnavailablePanel: React.FC<ThreeUnavailablePanelProps> = ({
  variant = 'inline',
  className = '',
}) => {
  if (variant === 'background') {
    return (
      <div
        data-testid="three-unavailable-panel"
        data-variant="background"
        className={`absolute inset-0 bg-bg bg-hero-glow ${className}`.trim()}
      >
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-theme">
          <Box className="h-4 w-4 shrink-0" aria-hidden="true" />
          3D view unavailable
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="three-unavailable-panel"
      data-variant="inline"
      className={`flex h-full min-h-[12rem] w-full flex-col items-center justify-center gap-2 bg-surface-2 px-6 py-8 text-center ${className}`.trim()}
    >
      <Box className="h-8 w-8 text-muted" aria-hidden="true" />
      <p className="font-heading text-base font-bold text-text">3D view unavailable</p>
      <p className="text-sm text-muted">Everything else on this page works as normal.</p>
    </div>
  );
};
