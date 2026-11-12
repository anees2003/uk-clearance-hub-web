import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { COOKIE_CATEGORY_DEFINITIONS } from '../../data/cookieConsent';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';
import { Container } from '../ui/Container';

export const CookieConsentBanner: React.FC = () => {
  const {
    consent,
    isBannerVisible,
    isSettingsOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  const modalCardRef = useRef<HTMLDivElement | null>(null);
  useModalFocusTrap(isSettingsOpen, modalCardRef, closeSettings);

  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
    consent?.categories.analytics ?? false
  );
  const [marketingEnabled, setMarketingEnabled] = useState<boolean>(
    consent?.categories.marketing ?? false
  );

  // Sync local toggle state whenever modal opens or saved consent updates
  useEffect(() => {
    if (consent) {
      setAnalyticsEnabled(consent.categories.analytics);
      setMarketingEnabled(consent.categories.marketing);
    } else {
      setAnalyticsEnabled(false);
      setMarketingEnabled(false);
    }
  }, [consent, isSettingsOpen]);

  return (
    <>
      {/* Bottom First-Visit UK PECR Cookie Banner */}
      {isBannerVisible && !isSettingsOpen && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          data-testid="cookie-consent-banner"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          className="fixed bottom-0 inset-x-0 z-50 border-t border-border-strong bg-bg-elevated/95 backdrop-blur-md text-text shadow-theme transition-all duration-300"
        >
          <Container className="py-4 sm:py-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
              <div className="flex items-start gap-3.5 max-w-3xl">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-2 border border-border text-primary shrink-0 mt-0.5">
                  <Cookie className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="font-heading text-sm font-bold text-text">
                    Your privacy &amp; cookie choices
                  </p>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    We use strictly necessary browser storage to remember your
                    theme and session referral source. Optional analytics and
                    marketing cookies are off by default and only run with your
                    consent. Read our{' '}
                    <Link
                      to="/cookies"
                      className="text-primary underline underline-offset-4 hover:text-primary-hover font-medium"
                    >
                      Cookie Policy
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy"
                      className="text-primary underline underline-offset-4 hover:text-primary-hover font-medium"
                    >
                      Privacy Notice
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Equal prominence for Accept all and Reject non-essential, plus Manage settings */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  data-testid="cookie-manage-btn"
                  onClick={openSettings}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg border border-border-strong bg-surface hover:border-primary text-text text-xs font-heading font-semibold uppercase tracking-[0.08em] cursor-pointer active:scale-[0.98]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Manage settings</span>
                </button>

                <button
                  type="button"
                  data-testid="cookie-reject-btn"
                  onClick={rejectNonEssential}
                  className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Reject non-essential
                </button>

                <button
                  type="button"
                  data-testid="cookie-accept-all-btn"
                  onClick={acceptAll}
                  className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Accept all
                </button>
              </div>
            </div>
          </Container>
        </aside>
      )}

      {/* Cookie Preferences Modal */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-modal-title"
          data-testid="cookie-settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSettings();
            }
          }}
        >
          <div
            ref={modalCardRef}
            className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-border-strong bg-bg-elevated text-text shadow-theme p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>UK PECR &amp; GDPR Controls</span>
                </div>
                <h2
                  id="cookie-settings-modal-title"
                  className="font-heading text-xl sm:text-2xl font-extrabold text-text"
                >
                  Cookie &amp; Browser Storage Settings
                </h2>
                <p className="text-xs sm:text-sm text-muted">
                  Choose which optional cookie categories you allow. Strictly
                  necessary storage is always active so the website can function
                  properly.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close cookie settings"
                data-testid="cookie-modal-close-btn"
                onClick={closeSettings}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-surface hover:border-primary text-muted hover:text-text cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              {COOKIE_CATEGORY_DEFINITIONS.map((cat) => {
                const isChecked =
                  cat.id === 'necessary'
                    ? true
                    : cat.id === 'analytics'
                    ? analyticsEnabled
                    : marketingEnabled;

                return (
                  <div
                    key={cat.id}
                    data-testid={`cookie-category-card-${cat.id}`}
                    className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-base font-bold text-text">
                          {cat.title}
                        </h3>
                        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-primary">
                          {cat.badge}
                        </span>
                      </div>

                      {cat.alwaysActive ? (
                        <span
                          data-testid="cookie-toggle-necessary"
                          className="text-xs font-semibold text-success uppercase tracking-[0.1em]"
                        >
                          Always on
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            data-testid={`cookie-toggle-${cat.id}`}
                            aria-label={`Allow ${cat.title} cookies`}
                            checked={isChecked}
                            onChange={(e) => {
                              if (cat.id === 'analytics') {
                                setAnalyticsEnabled(e.target.checked);
                              } else if (cat.id === 'marketing') {
                                setMarketingEnabled(e.target.checked);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 rounded-full bg-surface-2 border border-border-strong peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 transition-colors relative">
                            <span
                              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </div>
                          <span className="ml-2.5 text-xs font-semibold text-text">
                            {isChecked ? 'On' : 'Off'}
                          </span>
                        </label>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {cat.description}
                    </p>

                    <p className="text-[0.6875rem] text-muted/85 pt-1">
                      <strong className="text-text font-semibold">
                        Storage keys:
                      </strong>{' '}
                      {cat.storageKeys.join(' · ')}
                    </p>
                  </div>
                );
              })}
            </div>

            {consent && (
              <p
                data-testid="cookie-saved-timestamp"
                className="text-xs text-muted tabular-nums"
              >
                Last saved preference (v{consent.version}):{' '}
                {new Date(consent.updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-testid="cookie-modal-reject-btn"
                  onClick={rejectNonEssential}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-border-strong bg-surface hover:border-primary text-text text-xs font-heading font-semibold uppercase tracking-[0.08em] cursor-pointer active:scale-[0.98]"
                >
                  Reject non-essential
                </button>

                <button
                  type="button"
                  data-testid="cookie-modal-accept-all-btn"
                  onClick={acceptAll}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-border-strong bg-surface hover:border-primary text-text text-xs font-heading font-semibold uppercase tracking-[0.08em] cursor-pointer active:scale-[0.98]"
                >
                  Accept all
                </button>
              </div>

              <button
                type="button"
                data-testid="cookie-save-prefs-btn"
                onClick={() =>
                  savePreferences({
                    analytics: analyticsEnabled,
                    marketing: marketingEnabled,
                  })
                }
                className="px-5 py-2.5 min-h-[44px] rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-heading font-bold uppercase tracking-[0.08em] cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
