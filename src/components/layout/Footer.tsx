import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FOOTER_COLUMNS } from '../../data/navigation';
import { openCookieSettingsModal } from '../../data/cookieConsent';
import {
  BRAND_EMAIL,
  BRAND_EMAIL_HREF,
  BRAND_WHATSAPP_DISPLAY,
  BRAND_WHATSAPP_URL,
  BRAND_SOCIAL_LINKS,
  FOOTER_ABOUT_BLURB,
  MODEL_CREDIT_LINE,
  BrandSocialLink,
  getBrandLogoUrl,
} from '../../data/brand';
import { Container } from '../ui/Container';

const SocialIconSvg: React.FC<{ id: BrandSocialLink['id'] }> = ({ id }) => {
  switch (id) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M13.5 21v-7.5h2.5l.38-3h-2.88V8.6c0-.87.24-1.46 1.49-1.46H16.5V4.45c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.81 1.38-3.81 3.91v2.26H8v3h2.41V21h3.09Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.81 4.81 0 0 0 12 7.2Zm0 7.92A3.12 3.12 0 1 1 15.12 12 3.12 3.12 0 0 1 12 15.12ZM18.12 7a1.12 1.12 0 1 1-1.12-1.12A1.12 1.12 0 0 1 18.12 7Zm3.18 1.14a5.54 5.54 0 0 0-1.51-3.92A5.54 5.54 0 0 0 15.87 2.7c-1.55-.09-6.19-.09-7.74 0a5.54 5.54 0 0 0-3.92 1.51A5.54 5.54 0 0 0 2.7 8.13c-.09 1.55-.09 6.19 0 7.74a5.54 5.54 0 0 0 1.51 3.92 5.54 5.54 0 0 0 3.92 1.51c1.55.09 6.19.09 7.74 0a5.54 5.54 0 0 0 3.92-1.51 5.54 5.54 0 0 0 1.51-3.92c.09-1.55.09-6.19 0-7.74Zm-2 9.4a3.16 3.16 0 0 1-1.78 1.78c-1.23.49-4.16.38-5.52.38s-4.29.11-5.52-.38a3.16 3.16 0 0 1-1.78-1.78c-.49-1.23-.38-4.16-.38-5.52s-.11-4.29.38-5.52a3.16 3.16 0 0 1 1.78-1.78c1.23-.49 4.16-.38 5.52-.38s4.29-.11 5.52.38a3.16 3.16 0 0 1 1.78 1.78c.49 1.23.38 4.16.38 5.52s.11 4.29-.38 5.52Z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M16.6 5.82a4.28 4.28 0 0 1-1.08-2.82h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.22-1.48Z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M18.24 3.5h2.86l-6.25 7.15L22.2 20.5h-5.76l-4.51-5.9-5.16 5.9H3.9l6.69-7.65L3.5 3.5h5.9l4.08 5.39 4.76-5.39Zm-1.01 15.28h1.59L8.58 5.13H6.88l10.35 13.65Z" />
        </svg>
      );
    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M12 3c2.8 0 4.9 1.93 5.06 4.78.04.67-.07 1.72-.14 2.38.28.18.67.27 1.07.27.47 0 .93-.17 1.24-.17.37 0 .68.23.68.58 0 .64-.78 1.06-1.47 1.3-.15.05-.75.23-.88.62-.11.34.15.79.42 1.19.93 1.4 2.21 2.26 3.02 2.55.23.08.4.27.4.5 0 .45-.78.83-1.97 1.03-.31.05-.52.38-.62.75-.11.42-.26.82-.68.82-.32 0-.73-.17-1.31-.17-.77 0-1.56.31-2.42.93-.93.67-1.69 1.04-2.39 1.04-.72 0-1.47-.37-2.4-1.04-.86-.62-1.65-.93-2.42-.93-.58 0-.99.17-1.31.17-.42 0-.57-.4-.68-.82-.1-.37-.31-.7-.62-.75-1.19-.2-1.97-.58-1.97-1.03 0-.23.17-.42.4-.5.81-.29 2.09-1.15 3.02-2.55.27-.4.53-.85.42-1.19-.13-.39-.73-.57-.88-.62-.69-.24-1.47-.66-1.47-1.3 0-.35.31-.58.68-.58.31 0 .77.17 1.24.17.4 0 .79-.09 1.07-.27-.07-.66-.18-1.71-.14-2.38C7.1 4.93 9.2 3 12 3Z" />
        </svg>
      );
  }
};

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const [logoError, setLogoError] = useState(false);
  const isDark = theme === 'dark';
  const activeLogoUrl = getBrandLogoUrl(theme);

  return (
    <footer
      data-testid="site-footer"
      className={`relative z-20 border-t border-border text-white ${
        isDark ? 'bg-bg-elevated' : 'bg-navy-deep'
      }`}
    >
      <Container className="py-16 md:py-20">
        {/* 4 columns on desktop, 2 on tablet, 1 on mobile with 24px+ gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-14 border-b border-white/12">
          {/* Column 1: Theme-aware full logo + About blurb + Direct contact & Socials */}
          <div className="flex flex-col items-start">
            <Link
              to="/"
              data-testid="footer-logo-link"
              className={`inline-flex items-center mb-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                isDark
                  ? 'rounded-lg py-1'
                  : 'bg-surface rounded-xl px-4 py-3 shadow-sm'
              }`}
            >
              {!logoError ? (
                <img
                  src={activeLogoUrl}
                  alt="UK Clearance Hub"
                  width={157}
                  height={100}
                  loading="lazy"
                  decoding="async"
                  onError={() => setLogoError(true)}
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              ) : (
                <span className="font-heading text-xl font-extrabold tracking-[-0.02em] whitespace-nowrap">
                  <span className={isDark ? 'text-white' : 'text-text'}>
                    UK Clearance{' '}
                  </span>
                  <span className="text-accent">Hub</span>
                </span>
              )}
            </Link>

            <h2 className="text-xs font-heading uppercase tracking-[0.16em] text-primary font-bold mb-2">
              About UK Clearance Hub
            </h2>
            <p
              data-testid="footer-about-blurb"
              className="type-small text-white/80 max-w-md mb-6 leading-relaxed"
            >
              {FOOTER_ABOUT_BLURB}
            </p>

            {/* Contact Links: Email & WhatsApp */}
            <div className="flex flex-col gap-2.5 text-sm mb-6">
              <a
                href={BRAND_EMAIL_HREF}
                data-testid="footer-email-link"
                className="inline-flex items-center gap-2 text-white/90 hover:text-amber"
              >
                <Mail className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>{BRAND_EMAIL}</span>
              </a>

              <a
                href={BRAND_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-whatsapp-link"
                className="inline-flex items-center gap-2 text-white/90 hover:text-amber tabular-nums"
              >
                <MessageCircle className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                <span>WhatsApp: {BRAND_WHATSAPP_DISPLAY}</span>
              </a>
            </div>

            {/* Social Icons (Facebook, Instagram, TikTok, X, Snapchat) */}
            <div
              data-testid="footer-social-links"
              className="flex items-center gap-2.5"
            >
              {BRAND_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow UK Clearance Hub on ${social.label}`}
                  data-testid={`footer-social-${social.id}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 hover:bg-accent hover:-translate-y-0.5 text-white"
                >
                  <SocialIconSvg id={social.id} />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2, 3, 4: Shop, Help, Legal */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lg:pl-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-white mb-4">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to === '#cookie-settings' ? (
                      <button
                        type="button"
                        data-testid="footer-cookie-settings-btn"
                        onClick={openCookieSettingsModal}
                        className="type-small text-white/75 hover:text-accent cursor-pointer text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        to={link.to}
                        className="type-small text-white/75 hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Legal & Attribution Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/65">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p>© {new Date().getFullYear()} UK Clearance Hub. All rights reserved.</p>
            <span className="hidden sm:inline text-white/25" aria-hidden="true">
              ·
            </span>
            <p>All prices in GBP (£). Commission-based UK product discovery &amp; referral service.</p>
          </div>

          <p
            data-testid="footer-model-credit"
            className="text-white/60"
          >
            {MODEL_CREDIT_LINE}
          </p>
        </div>
      </Container>
    </footer>
  );
};
