import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, IndianRupee, LifeBuoy, Mail, MapPin, MonitorPlay, Phone, Sparkles } from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { CONTACT_PAGE, FEATURES_PAGE, PRICE_PAGE } from '../lib/publicNav';
import { appLink, site, telLink, whatsappLink } from '../lib/site';

const TITLE = `Contact Us | Brick Kiln Management Software - ${site.name}`;
const DESCRIPTION = `Contact ${site.name} for a demo, pricing or support with brick kiln management software. Call or WhatsApp ${site.phone}, email ${site.email}. ${site.address}.`;

const CONTACTS = [
  { icon: Phone, label: 'Mobile', value: site.phone, href: telLink },
  { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
  { icon: MapPin, label: 'Address', value: site.address },
];

const HELP = [
  { icon: MonitorPlay, title: 'Book a demo', text: 'See how production, stock, billing and ledgers work for a brick kiln like yours.' },
  { icon: IndianRupee, title: 'Plans & pricing', text: 'Find the right plan for one kiln or several plants.', to: PRICE_PAGE, link: 'See prices' },
  { icon: Sparkles, title: 'Features', text: 'Ask about WhatsApp reminders, AI bill entry, alerts, reports and more.', to: FEATURES_PAGE, link: 'See all features' },
  { icon: LifeBuoy, title: 'Customer support', text: 'Already using the software? Reach us for help with your account.', href: appLink('/login'), link: 'Login to the app' },
];

const FAQS = [
  {
    q: `How can I get a demo of ${site.name}?`,
    a: `Call or WhatsApp us on ${site.phone}, or email ${site.email}, and we will show you how ${site.name} works for your brick kiln.`,
  },
  {
    q: `Where is ${site.name} located?`,
    a: `${site.name} is based in ${site.address}, and works with brick kilns and plants across India.`,
  },
  {
    q: 'Can I contact you on WhatsApp?',
    a: `Yes. WhatsApp is the quickest way to reach us. Message us on ${site.phone} with your question.`,
  },
];

// Contact details, location, FAQs and breadcrumb for Google; the FAQ text matches the visible FAQs word for word
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      name: TITLE,
      url: site.url + CONTACT_PAGE,
      about: {
        '@type': 'Organization',
        name: site.name,
        url: `${site.url}/`,
        email: site.email,
        telephone: site.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Shankar Nagar',
          addressLocality: 'Raipur',
          addressRegion: 'Chhattisgarh',
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales and customer support',
          telephone: site.phone,
          email: site.email,
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Contact Us', item: site.url + CONTACT_PAGE },
      ],
    },
  ],
};

export default function ContactPage() {
  usePageMeta(TITLE, DESCRIPTION, CONTACT_PAGE);

  // Contact buttons open this page from further down another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero + contact details */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:pb-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Contact Us</span>
            </nav>
            <div className="mx-auto mt-10 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Contact Us</p>
              <h1 className="mt-3 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                Talk to {site.name} About Your{' '}
                <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Brick Kiln</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                Want a demo of our brick kiln management software, a price for your plant, or help with your account?
                Call, WhatsApp or email us and we&apos;ll get back to you.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CONTACTS.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    {href
                      ? <a href={href} className="mt-0.5 block break-words font-semibold text-slate-900 hover:text-primary-700">{value}</a>
                      : <p className="mt-0.5 font-semibold text-slate-900">{value}</p>}
                  </div>
                </div>
              ))}
              <a
                href={whatsappLink(`Hi, I'd like to know more about ${site.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white shadow-md shadow-emerald-700/20 transition hover:from-emerald-700 hover:to-emerald-600"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <WhatsAppIcon size={22} />
                </span>
                <span>
                  <span className="block font-semibold">Chat on WhatsApp</span>
                  <span className="block text-sm text-emerald-50">Quickest way to reach us</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* How we can help */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="How we can help" title="Questions We Can Help With" />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HELP.map(({ icon: Icon, title, text, to, href, link }) => (
                <div key={title} className="flex flex-col rounded-2xl bg-gradient-to-b from-orange-50/70 to-white p-6 ring-1 ring-orange-100">
                  <Icon size={26} className="text-orange-700" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  {to && <Link to={to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">{link} <ChevronRight size={16} /></Link>}
                  {href && <a href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">{link} <ChevronRight size={16} /></a>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Find us" title="Our Office in Raipur, Chhattisgarh" text={site.address} />
            <div className="mt-10 overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200">
              <iframe
                title={`${site.name} location: ${site.address}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`}
                className="h-72 w-full border-0 sm:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Contact FAQs" />
            <div className="mt-10 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition open:bg-white open:shadow-md open:ring-orange-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-orange-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
