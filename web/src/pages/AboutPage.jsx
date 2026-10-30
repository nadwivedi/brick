import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, ChevronRight, Code2, ExternalLink, Factory, Layers, MapPin, ShieldCheck, Smartphone, Target, Users,
} from 'lucide-react';
import JsonLd from '../components/JsonLd';
import WhatsAppButton from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { ABOUT_PAGE, CONTACT_PAGE, FEATURES_PAGE } from '../lib/publicNav';
import { site } from '../lib/site';

export const TITLE = `About Us | Brick Kiln Management Software - ${site.name}`;
export const DESCRIPTION = `${site.name} is brick kiln management software made by ${site.maker.name}, for brick kilns, bhattas and plants across India. Based in Raipur, Chhattisgarh.`;

const VALUES = [
  { icon: Layers, title: 'Made for brick plants', text: 'Built around how brick businesses actually work: plants, brick types, trips and parties.' },
  { icon: Smartphone, title: 'Simple to use', text: 'Clear screens your manager and staff can learn in a day, on any device.' },
  { icon: ShieldCheck, title: 'Safe & secure', text: 'Password-protected logins, with each business seeing only its own data.' },
];

const WHO = [
  { icon: Factory, title: 'Single kiln owners', text: 'One bhatta or plant, run without paper registers: production, stock, sales and dues in one place.' },
  { icon: Building2, title: 'Multi-plant businesses', text: 'Several kilns or plants from one login, with every record kept plant-wise.' },
  { icon: Users, title: 'Managers & accountants', text: 'Daily entries for managers, and ledgers and reports ready for the accountant.' },
];

// About-page, organisation and breadcrumb data for Google and AI answers
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      name: TITLE,
      url: site.url + ABOUT_PAGE,
      about: {
        '@type': 'Organization',
        name: site.name,
        url: `${site.url}/`,
        sameAs: [site.instagram],
        email: site.email,
        telephone: site.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Shankar Nagar',
          addressLocality: 'Raipur',
          addressRegion: 'Chhattisgarh',
          addressCountry: 'IN',
        },
        areaServed: 'IN',
        parentOrganization: { '@type': 'Organization', name: site.maker.name, url: site.maker.url },
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'About Us', item: site.url + ABOUT_PAGE },
      ],
    },
  ],
};

export default function AboutPage() {
  usePageMeta(TITLE, DESCRIPTION, ABOUT_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <JsonLd data={STRUCTURED_DATA} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:pb-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">About Us</span>
            </nav>
            <div className="mx-auto mt-10 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">About Us</p>
              <h1 className="mt-3 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                About {site.name}:{' '}
                <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Brick Kiln Management Software</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                {site.name} is management software built for brick manufacturing businesses, from a single kiln to
                several plants. It brings production, stock, sales, purchases, labour and accounts together, so owners
                and managers can make decisions on up-to-date numbers instead of guesswork.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Our mission</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Run Every Brick Plant Digitally, With No Paperwork</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Most brick kilns still run on paper registers and memory: how many bricks were made, how much cement is
                left, which party still owes money. {site.name} replaces those registers with one app that works on the
                phone at the kiln and the computer in the office, and works out stock, dues and profit for you.
              </p>
              <Link to={FEATURES_PAGE} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                See all features <ChevronRight size={16} />
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-8 ring-1 ring-orange-200">
              <Target size={32} className="text-orange-700" />
              <ul className="mt-5 space-y-3 text-slate-700">
                {['Know what was made, what was sold and who has to pay', 'Stock and dues worked out automatically', 'One login for one kiln or many plants', 'Mobile app, desktop software and browser'].map(t => (
                  <li key={t} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="What we stand for" title="Built for Brick Businesses" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Icon size={26} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Who we serve" title="Who Uses BrickManager" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {WHO.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-gradient-to-b from-orange-50/70 to-white p-6 ring-1 ring-orange-100">
                  <Icon size={26} className="text-orange-700" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Maker */}
        <section aria-labelledby="maker" className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:flex-row sm:p-10 sm:text-left">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 text-white shadow-lg">
                <Code2 size={30} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Made by</p>
                <h2 id="maker" className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{site.maker.name}</h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {site.name} is designed, built and supported by{' '}
                  <a href={site.maker.url} target="_blank" rel="noopener" className="font-semibold text-primary-700 hover:underline">{site.maker.name}</a>.
                  Visit their website to see their other software and services.
                </p>
              </div>
              <a
                href={site.maker.url}
                target="_blank"
                rel="noopener"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-primary-300 hover:text-primary-700"
              >
                softwarebytes.in <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Location + CTA */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.06]" />
            <div className="relative">
              <MapPin size={32} className="mx-auto text-orange-100" />
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Based in Raipur, Serving Brick Kilns Across India</h2>
              <p className="mx-auto mt-4 max-w-xl text-orange-50">{site.address}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Get Started <ArrowRight size={18} />
                </a>
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
