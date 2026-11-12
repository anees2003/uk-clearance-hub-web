import React, { useEffect, useState } from 'react';
import { BRAND_WHATSAPP_PREFILLED_URL } from '../../data/brand';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { MOBILE_MENU_EVENT } from '../layout/Header';

export const OVERLAY_CHANGE_EVENT = 'ukch:overlay-change';

function isAnyBodyOverlayActive(): boolean {
  if (typeof document === 'undefined') return false;
  return (
    document.body.dataset.enquiryModalOpen === 'true' ||
    document.body.dataset.mobileFiltersOpen === 'true'
  );
}

export const FloatingWhatsAppButton: React.FC = () => {
  const { isBannerVisible, isSettingsOpen } = useCookieConsent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState<boolean>(() =>
    isAnyBodyOverlayActive()
  );
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntered(true);
    }, 350);

    const handleMenuToggle = (event: Event) => {
      const custom = event as CustomEvent<{ open: boolean }>;
      setMobileMenuOpen(Boolean(custom.detail?.open));
    };

    const syncOverlay = () => {
      setOverlayOpen(isAnyBodyOverlayActive());
    };

    window.addEventListener(MOBILE_MENU_EVENT, handleMenuToggle);
    window.addEventListener(OVERLAY_CHANGE_EVENT, syncOverlay);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(MOBILE_MENU_EVENT, handleMenuToggle);
      window.removeEventListener(OVERLAY_CHANGE_EVENT, syncOverlay);
    };
  }, []);

  if (
    mobileMenuOpen ||
    isBannerVisible ||
    isSettingsOpen ||
    overlayOpen
  ) {
    return null;
  }

  return (
    <a
      href={BRAND_WHATSAPP_PREFILLED_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with UK Clearance Hub on WhatsApp"
      data-testid="floating-whatsapp-button"
      style={{
        bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        right: 'max(1.5rem, calc(env(safe-area-inset-right, 0px) + 1rem))',
      }}
      className={`fixed z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-success text-white shadow-theme hover:scale-105 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 fill-current"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.3.15.49.22.57.35.07.12.07.72-.17 1.4Z" />
      </svg>
    </a>
  );
};
