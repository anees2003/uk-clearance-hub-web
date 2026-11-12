import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_SETTINGS_OPEN_EVENT,
  CookieCategoryKey,
  CookieConsentRecord,
  getStoredConsentRecord,
  hasConsent as checkStoredConsent,
  saveConsentRecord,
} from '../data/cookieConsent';

export interface CookieConsentContextValue {
  consent: CookieConsentRecord | null;
  isBannerVisible: boolean;
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  openSettings: () => void;
  closeSettings: () => void;
  hasConsent: (category: CookieCategoryKey) => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [consent, setConsent] = useState<CookieConsentRecord | null>(() =>
    getStoredConsentRecord()
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleConsentChange = (event: Event) => {
      const custom = event as CustomEvent<CookieConsentRecord>;
      if (custom.detail) {
        setConsent(custom.detail);
      } else {
        setConsent(getStoredConsentRecord());
      }
    };

    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange);
    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpenSettings);

    return () => {
      window.removeEventListener(
        COOKIE_CONSENT_CHANGE_EVENT,
        handleConsentChange
      );
      window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, handleOpenSettings);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const record = saveConsentRecord({ analytics: true, marketing: true });
    setConsent(record);
    setIsSettingsOpen(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const record = saveConsentRecord({ analytics: false, marketing: false });
    setConsent(record);
    setIsSettingsOpen(false);
  }, []);

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      const record = saveConsentRecord(prefs);
      setConsent(record);
      setIsSettingsOpen(false);
    },
    []
  );

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const hasConsent = useCallback(
    (category: CookieCategoryKey) => {
      if (category === 'necessary') return true;
      if (consent) {
        return Boolean(consent.categories[category]);
      }
      return checkStoredConsent(category);
    },
    [consent]
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isBannerVisible: consent === null,
      isSettingsOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openSettings,
      closeSettings,
      hasConsent,
    }),
    [
      consent,
      isSettingsOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openSettings,
      closeSettings,
      hasConsent,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent must be used within a CookieConsentProvider'
    );
  }
  return ctx;
}
