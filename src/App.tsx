/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import { Layout } from './components/layout';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const ClearanceDealsPage = lazy(() =>
  import('./pages/ClearanceDealsPage').then((m) => ({
    default: m.ClearanceDealsPage,
  }))
);
const BedDetailPage = lazy(() =>
  import('./pages/BedDetailPage').then((m) => ({ default: m.BedDetailPage }))
);
const HomeLivingPage = lazy(() =>
  import('./pages/HomeLivingPage').then((m) => ({ default: m.HomeLivingPage }))
);
const HowItWorksPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.HowItWorksPage }))
);
const MattressGuidePage = lazy(() =>
  import('./pages/MattressGuidePage').then((m) => ({
    default: m.MattressGuidePage,
  }))
);
const BedSizeGuidePage = lazy(() =>
  import('./pages/BedSizeGuidePage').then((m) => ({
    default: m.BedSizeGuidePage,
  }))
);
const DeliveryReturnsPage = lazy(() =>
  import('./pages/DeliveryReturnsPage').then((m) => ({
    default: m.DeliveryReturnsPage,
  }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const FaqPage = lazy(() =>
  import('./pages/FaqPage').then((m) => ({ default: m.FaqPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const CookiePolicyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.CookiePolicyPage }))
);
const TermsOfUsePage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.TermsOfUsePage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const ClearanceDealsRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/deals${location.search}`} replace />;
};

const LegacyBedSlugRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  return (
    <Navigate
      to={`/deals/${slug ?? 'savoy-ottoman-bed'}${location.search}`}
      state={location.state}
      replace
    />
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <CookieConsentProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/deals" element={<ClearanceDealsPage />} />
              <Route path="/deals/:slug" element={<BedDetailPage />} />
              <Route path="/home-living" element={<HomeLivingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route
                path="/clearance-deals"
                element={<ClearanceDealsRedirect />}
              />
              <Route
                path="/beds"
                element={<Navigate to="/deals/savoy-ottoman-bed" replace />}
              />
              <Route path="/beds/:slug" element={<LegacyBedSlugRedirect />} />
              <Route path="/mattress-guide" element={<MattressGuidePage />} />
              <Route path="/bed-size-guide" element={<BedSizeGuidePage />} />
              <Route
                path="/delivery-returns"
                element={<DeliveryReturnsPage />}
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/terms" element={<TermsOfUsePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CookieConsentProvider>
    </ThemeProvider>
  );
}


