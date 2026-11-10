/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  HomePage,
  ClearanceDealsPage,
  BedDetailPage,
  MattressGuidePage,
  BedSizeGuidePage,
  DeliveryReturnsPage,
  AboutPage,
  FaqPage,
  ContactPage,
} from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clearance-deals" element={<ClearanceDealsPage />} />
          <Route path="/beds" element={<Navigate to="/beds/savoy-ottoman-bed" replace />} />
          <Route path="/beds/:slug" element={<BedDetailPage />} />
          <Route path="/mattress-guide" element={<MattressGuidePage />} />
          <Route path="/bed-size-guide" element={<BedSizeGuidePage />} />
          <Route path="/delivery-returns" element={<DeliveryReturnsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
