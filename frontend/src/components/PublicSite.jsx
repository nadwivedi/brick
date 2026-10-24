import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Boxes, ChevronRight, Hammer, LogIn, Mail, MapPin, Menu, Phone, ShoppingCart, X } from 'lucide-react';
import Logo from './Logo';
import Modal from './Modal';
import { WhatsAppIcon } from './WhatsAppButton';
import useEscapeKey from '../hooks/useEscapeKey';
import { site, telLink, whatsappLink } from '../lib/site';
import { BHATTA_PAGE, MANUFACTURING_PAGE, PRICE_PAGE, useGoToSection } from '../lib/publicNav';

// Navbar, footer and artwork shared by the public pages (homepage and product pages).

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'contact', label: 'Contact Us' },
];

// Faint brick-wall texture used behind the hero and the closing banner.
export function BrickPattern({ className = '' }) {
  const id = `bricks${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width="56" height="28" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="54" height="12" rx="1.5" />
          <rect x="-27" y="15" width="54" height="12" rx="1.5" />
          <rect x="29" y="15" width="54" height="12" rx="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// A small stack of bricks drawn in SVG, so the page needs no photos.
export function BrickStack({ className = '' }) {
  const rows = [
    { y: 64, xs: [0, 44, 88] },
    { y: 42, xs: [22, 66] },
    { y: 20, xs: [44] },
  ];
  return (
    <svg viewBox="0 0 132 86" className={className} aria-hidden="true">
      {rows.map(({ y, xs }) => xs.map(x => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="42" height="20" rx="2.5" fill="#c2410c" />
          <rect x={x} y={y} width="42" height="5" rx="2.5" fill="#ea580c" />
          <rect x={x + 6} y={y + 10} width="8" height="4" rx="1" fill="#9a3412" opacity="0.5" />
          <rect x={x + 28} y={y + 11} width="6" height="3" rx="1" fill="#9a3412" opacity="0.4" />
        </g>
      )))}
    </svg>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEscapeKey(menuOpen, () => setMenuOpen(false));
  const goToSection = useGoToSection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id) => (e) => {
    setMenuOpen(false);
    goToSection(id)(e);
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition ${scrolled || menuOpen ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur' : 'border-transparent bg-transparent'}`}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6" aria-label="Main">
        <a href="/#home" onClick={goTo('home')} aria-label={`${site.name} home`}>
          <Logo name={site.name} />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map(n => (
            <a key={n.id} href={`/#${n.id}`} onClick={goTo(n.id)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              {n.label}
            </a>
          ))}
          <Link to="/login" className="btn-primary ml-3 px-5 py-2.5">
            <LogIn size={16} /> Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="icon-btn text-slate-700 md:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          {NAV.map(n => (
            <a key={n.id} href={`/#${n.id}`} onClick={goTo(n.id)} className="block rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-slate-100">
              {n.label}
            </a>
          ))}
          <Link to="/login" className="btn-primary mt-2 w-full py-3">
            <LogIn size={16} /> Login
          </Link>
        </div>
      )}
    </header>
  );
}

export function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-slate-600">{text}</p>}
    </div>
  );
}

const SERVICES = [
  { icon: Hammer, label: 'Brick Production' },
  { icon: Boxes, label: 'Inventory Management' },
  { icon: ShoppingCart, label: 'Sales & Orders' },
  { icon: BarChart3, label: 'Reports' },
];

// Shown in a popup from the footer. Review and replace with your own policy text before going live.
const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', `When you create an account, ${site.name} stores the details you enter, such as your name, mobile number and business records, so the software can work for you.`],
      ['Contact form', 'The contact form on this page does not store your details on our servers. Submitting it opens WhatsApp with your message filled in, and nothing is sent until you tap send.'],
      ['How your data is used', 'Your business data is used only to run your account. Each business sees only its own records, and we do not sell your data.'],
      ['Questions', `For any privacy question, write to us at ${site.email}.`],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Using the software', `${site.name} is provided to help you manage your brick business. You are responsible for the accuracy of the entries you make.`],
      ['Your account', 'Keep your login details private. You are responsible for activity under your account.'],
      ['Your data', 'The records you enter belong to your business. Please keep your own copies of important reports.'],
      ['Contact', `For any question about these terms, write to us at ${site.email}.`],
    ],
  },
};

function PolicyModal({ policy, onClose }) {
  useEscapeKey(true, onClose);
  return (
    <Modal title={policy.title} subtitle={site.name} onClose={onClose} maxWidth="max-w-lg"
      footer={<button type="button" onClick={onClose} className="btn-primary">Close</button>}>
      <div className="space-y-4">
        {policy.sections.map(([heading, text]) => (
          <div key={heading}>
            <h3 className="font-semibold text-slate-900">{heading}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

const footerLinkCls = 'group inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-orange-700';

function FooterHeading({ children }) {
  return <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{children}</h3>;
}

export function Footer() {
  const [policy, setPolicy] = useState(null);
  const jump = useGoToSection();
  const arrow = <ChevronRight size={14} className="shrink-0 text-orange-500 transition group-hover:translate-x-0.5" />;

  const contacts = [
    { icon: Phone, value: site.phone, href: telLink },
    { icon: Mail, value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, value: site.address },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-white via-orange-50/40 to-slate-50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-slate-300/60 via-slate-400 to-slate-300/60" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Logo name={site.name} subtitle="Brick Manufacturing Management" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
            Software that helps brick manufacturers track production, stock, sales, dues and expenses, all in one place.
          </p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-[#1ebe5b]"
          >
            <WhatsAppIcon size={18} /> Chat on WhatsApp
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-1 md:grid-cols-2 lg:col-span-5 lg:flex lg:justify-between lg:gap-6 lg:whitespace-nowrap">
          <div>
            <FooterHeading>Quick Links</FooterHeading>
            <ul className="mt-5 space-y-3">
              {NAV.map(n => (
                <li key={n.id}><a href={`/#${n.id}`} onClick={jump(n.id)} className={footerLinkCls}>{arrow}{n.label}</a></li>
              ))}
              <li><Link to="/login" className={footerLinkCls}>{arrow}Login</Link></li>
            </ul>
          </div>
          {/* Product names can be long, so this column wraps instead of pushing the others aside */}
          <div className="lg:w-40 lg:whitespace-normal">
            <FooterHeading>Products</FooterHeading>
            <ul className="mt-5 space-y-3">
              {[
                { to: BHATTA_PAGE, label: 'Bhatta Software' },
                { to: MANUFACTURING_PAGE, label: 'Bricks Manufacturing Software' },
                { to: PRICE_PAGE, label: 'Brick Kiln Software Price in India' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={footerLinkCls.replace('items-center', 'items-start')}>
                    <span className="mt-[3px]">{arrow}</span>{label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <FooterHeading>Services</FooterHeading>
            <ul className="mt-5 space-y-3">
              {SERVICES.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <a href="/#features" onClick={jump('features')} className={footerLinkCls}>
                    <Icon size={15} className="shrink-0 text-orange-600" />{label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          <FooterHeading>Contact Us</FooterHeading>
          <ul className="mt-5 space-y-4">
            {contacts.map(({ icon: Icon, value, href }) => (
              <li key={value} className="flex items-start gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-orange-700 shadow-sm ring-1 ring-slate-200">
                  <Icon size={15} />
                </span>
                {href
                  ? <a href={href} className="mt-1.5 break-all text-slate-600 transition hover:text-orange-700">{value}</a>
                  : <span className="mt-1.5 text-slate-600">{value}</span>}
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200">
                <WhatsAppIcon size={15} />
              </span>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-slate-600 transition hover:text-emerald-700">
                WhatsApp us
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Extra bottom space on phones keeps the floating WhatsApp button off these links */}
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 pb-24 pt-6 text-sm text-slate-500 sm:flex-row sm:px-6 sm:pb-6">
          <p className="text-center sm:text-left">Copyright © {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setPolicy(POLICIES.privacy)} className="transition hover:text-orange-700 hover:underline">Privacy Policy</button>
            <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
            <button type="button" onClick={() => setPolicy(POLICIES.terms)} className="transition hover:text-orange-700 hover:underline">Terms & Conditions</button>
          </div>
        </div>
      </div>

      {policy && <PolicyModal policy={policy} onClose={() => setPolicy(null)} />}
    </footer>
  );
}
