import React from 'react';
import {
  BRAND_EMAIL,
  BRAND_EMAIL_HREF,
  BRAND_WHATSAPP_PREFILLED_URL,
} from '../../data/brand';

export type BoundaryErrorKind = 'general' | 'needs-refresh';

// Messages browsers use when a lazily loaded page's code can't be fetched
// (after a new deploy, or on a flaky connection). A reload fixes both.
const NEEDS_REFRESH_PATTERNS = [
  /failed to fetch dynamically imported module/i, // Chrome, Edge
  /error loading dynamically imported module/i, // Firefox
  /importing a module script failed/i, // Safari
  /unable to preload css/i, // Vite preload helper
];

export function classifyBoundaryError(error: unknown): BoundaryErrorKind {
  if (!error || typeof error !== 'object') return 'general';
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') return 'needs-refresh';
  if (typeof message !== 'string') return 'general';
  return NEEDS_REFRESH_PATTERNS.some((pattern) => pattern.test(message))
    ? 'needs-refresh'
    : 'general';
}

export function shouldResetBoundary(
  hasError: boolean,
  prevResetKey: unknown,
  nextResetKey: unknown
): boolean {
  return hasError && prevResetKey !== nextResetKey;
}

interface ErrorFallbackProps {
  kind: BoundaryErrorKind;
  onRetry: () => void;
}

const buttonBase =
  'inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg font-heading font-bold text-sm transition-colors';
const outlineButton = `${buttonBase} border border-border-strong text-text hover:bg-surface-2`;
// Same as Button.tsx: `text-primary-contrast` isn't a registered Tailwind colour yet (fixed in step 3).
const primaryButton = `${buttonBase} bg-primary text-[var(--primary-contrast)] hover:bg-primary-hover`;

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ kind, onRetry }) => {
  const needsRefresh = kind === 'needs-refresh';
  return (
    <div className="min-h-[60dvh] w-full flex items-center justify-center px-4 py-16 bg-bg text-text">
      <div
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-theme text-center"
      >
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-[-0.02em]">
          {needsRefresh ? 'This page needs a refresh' : 'Sorry, this page didn’t load'}
        </h1>
        <p className="mt-3 text-muted">
          {needsRefresh
            ? 'Part of this page couldn’t be loaded. Reloading usually fixes it.'
            : 'Something went wrong on our side. Please try again, or get in touch and we’ll help.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {needsRefresh ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={primaryButton}
            >
              Reload
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className={primaryButton}
            >
              Try again
            </button>
          )}
          <a href="/" className={outlineButton}>
            Home
          </a>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a
            href={BRAND_WHATSAPP_PREFILLED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={outlineButton}
          >
            Ask on WhatsApp
          </a>
          <a href={BRAND_EMAIL_HREF} className={outlineButton} aria-label={`Email us at ${BRAND_EMAIL}`}>
            Email us
          </a>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  /** When this value changes (e.g. the route path), a caught error is cleared. */
  resetKey?: unknown;
  /** Custom fallback. Pass `null` to render nothing when the subtree fails. */
  fallback?: React.ReactNode;
  /** Called once with the caught error (e.g. to raise the shared "3D failed" signal). */
  onError?: (error: unknown) => void;
}

interface ErrorBoundaryState {
  error: unknown;
  kind: BoundaryErrorKind;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, kind: 'general' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, kind: classifyBoundaryError(error) };
  }

  componentDidCatch(error: unknown): void {
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (shouldResetBoundary(this.state.error !== null, prevProps.resetKey, this.props.resetKey)) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ error: null, kind: 'general' });
  };

  render(): React.ReactNode {
    if (this.state.error === null) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <ErrorFallback kind={this.state.kind} onRetry={this.reset} />;
  }
}
