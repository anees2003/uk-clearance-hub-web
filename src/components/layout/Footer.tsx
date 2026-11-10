import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { FOOTER_COLUMNS, validateNewsletterEmail } from '../../data/navigation';
import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Eyebrow';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateNewsletterEmail(email);
    if (!validation.valid) {
      setError(validation.error ?? 'Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubscribedEmail(email.trim());
    setEmail('');
  };

  return (
    <footer className="border-t border-[rgba(28,28,30,0.12)] bg-[#F3EFE9] text-[#1C1C1E] pt-20 pb-12">
      <Container>
        {/* Top Row: Link Columns + Newsletter Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-[rgba(28,28,30,0.12)]">
          {/* Newsletter Column (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <Eyebrow tone="oak">Private Clearance Dispatch</Eyebrow>
              <h2 className="type-h3 text-[#1C1C1E]">
                Early access to weekly warehouse reductions.
              </h2>
              <p className="type-small text-[#8A8580] max-w-md">
                Receive curated stock alerts when ex-display British divans, solid oak frames, and pocket-sprung mattresses enter clearance at up to 70% off RRP.
              </p>
            </div>

            {subscribedEmail ? (
              <div
                role="status"
                className="flex items-center gap-3 py-3.5 px-4 border border-[#B89B72]/50 bg-[#B89B72]/10 text-[#1C1C1E] text-sm max-w-md"
              >
                <Check className="w-4 h-4 text-[#C8102E] shrink-0" aria-hidden="true" />
                <span>
                  Subscribed <strong>{subscribedEmail}</strong> to UK Clearance Hub alerts.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                noValidate
                className="flex flex-col gap-2 max-w-md"
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address for newsletter
                </label>
                <div className="flex items-stretch border-b border-[#1C1C1E] focus-within:border-[#C8102E] transition-colors">
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your email address"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="w-full bg-transparent py-3 pr-4 text-sm text-[#1C1C1E] placeholder:text-[#8A8580] focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="group inline-flex items-center gap-2 px-3 py-3 text-xs uppercase tracking-[0.16em] font-medium text-[#1C1C1E] hover:text-[#C8102E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </button>
                </div>
                {error && (
                  <p id="newsletter-error" role="alert" className="text-xs text-[#C8102E] pt-1">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Link Columns: Shop, Help, Company (7 cols on desktop) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:pl-12">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <Eyebrow tone="charcoal">{col.title}</Eyebrow>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="type-small text-[#8A8580] hover:text-[#1C1C1E] transition-colors duration-200 inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Large Serif Wordmark */}
        <div className="py-10 md:py-14 border-b border-[rgba(28,28,30,0.12)] overflow-hidden">
          <p
            aria-label="UK Clearance Hub"
            className="font-serif text-[clamp(3.25rem,11vw,10.5rem)] leading-[0.88] tracking-[-0.025em] text-[#1C1C1E] select-none"
          >
            UK Clearance Hub
          </p>
        </div>

        {/* Bottom Attribution & Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#8A8580]">
          <p>
            © UK Clearance Hub. Bed 07 3D model by Doaa Sheha (Sketchfab), CC BY 4.0.
          </p>
          <div className="flex items-center gap-4">
            <span>United Kingdom · Prices Include VAT</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
