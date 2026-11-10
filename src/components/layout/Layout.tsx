import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLenis } from '../../animations/useLenis';
import { FilmGrain } from '../ui/FilmGrain';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';

export const Layout: React.FC = () => {
  useLenis();

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EFE9] text-[#1C1C1E] relative">
      <FilmGrain />
      <ScrollToTop />
      <Header />
      <main id="main-content" className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
