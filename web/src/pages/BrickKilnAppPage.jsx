import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Boxes, CheckCircle2, ChevronDown, ChevronRight, Factory, FileText, IndianRupee, Lock, Monitor,
  RefreshCw, Smartphone, Tablet, Truck, Users, Wallet,
} from 'lucide-react';
import JsonLd from '../components/JsonLd';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  APP_PAGE, BHATTA_PAGE, CONTACT_PAGE, FEATURES_PAGE, ONLINE_PAGE, PAYMENT_PAGE, PRICE_PAGE, PRODUCTION_PAGE, scrollToSection,
} from '../lib/publicNav';
import { appLink, site, whatsappLink } from '../lib/site';

export const TITLE = `Brick Kiln Management App for Android & iOS | ${site.name}`;
export const DESCRIPTION = `${site.name} brick kiln management app for Android and iPhone: record production, stock, sales, payments and expenses from your phone at the kiln.`;

// What owners and supervisors do from the phone at the kiln
const FEATURES = [
  { icon: Factory, title: 'Production entry', text: 'Enter bricks made by brick type and shift, with damaged bricks, right where they are made.' },
  { icon: Boxes, title: 'Raw material stock', text: 'Coal, soil, fly ash and cement stock moves with every purchase and production entry.' },
  { icon: FileText, title: 'GST bills on the phone', text: 'Make a sales invoice with transport and trip charges while the truck is being loaded.' },
  { icon: IndianRupee, title: 'Payments in and out', text: 'Record money received and paid, in cash or bank, the moment it changes hands.' },
  { icon: Users, title: 'Party ledgers & dues', text: 'See who owes what, and send balance-due reminders on WhatsApp in a tap.' },
  { icon: Wallet, title: 'Expenses', text: 'Note diesel, repairs, labour advances and other expenses before they are forgotten.' },
  { icon: Truck, title: 'Vehicles & labour', text: 'Keep vehicle trips, vehicle ledgers and labour records with the rest of your accounts.' },
  { icon: BarChart3, title: 'Reports anywhere', text: 'Check today’s production, sales, dues and profit & loss from home or on the road.' },
];

const DEVICES = [
  { icon: Smartphone, title: 'Android phones', text: 'The Android app runs on the phones your supervisors and munshis already carry.' },
  { icon: Tablet, title: 'iPhone & iPad', text: 'The iOS app works on iPhone and iPad with the same screens and the same account.' },
  { icon: Monitor, title: 'Desktop & browser', text: 'Desktop software for the office computer, and the browser on any device.' },
  { icon: RefreshCw, title: 'Always in sync', text: 'An entry made on one device shows up on all the others, so everyone sees the same numbers.' },
];

// How a customer gets the app, as described on the features page
const STEPS = [
  { title: 'Choose a plan', text: 'One kiln or multiple kilns. Every feature and the mobile app are included in both.' },
  { title: 'Get the app', text: 'We share the Android and iOS app with you, along with the desktop software.' },
  { title: 'Log in and start', text: 'Log in with your account and add your brick types, materials and parties.' },
];

const FAQS = [
  {
    q: 'Is there a brick kiln management app for Android and iPhone?',
    a: `Yes. ${site.name} has a brick kiln management app for Android phones and tablets and for iPhone and iPad. It works with the same account as the desktop software and the web browser.`,
  },
  {
    q: 'What can I do in the brick kiln app?',
    a: 'Record production by brick type and shift, raw material purchases and stock, sales invoices with GST and transport charges, payments, expenses, party ledgers and dues, vehicles and labour, and see reports and profit & loss.',
  },
  {
    q: 'How do I get the app?',
    a: `After you buy a plan, we share the ${site.name} mobile app and desktop software with you to install. You log in with your account and every entry shows up on all your devices.`,
  },
  {
    q: 'Can more than one person use the app at the kiln?',
    a: 'Yes. Install the app on the phones you need and log in with your account. Entries made on any phone, tablet or computer show up on all of them.',
  },
  {
    q: 'Can I manage more than one kiln from the app?',
    a: 'Yes. With the multi brick kiln plan you manage every kiln or plant from one login, with production, stock, sales and expenses kept plant-wise.',
  },
  {
    q: 'How much does the brick kiln app cost?',
    a: `The mobile app is included in every plan: ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}. There is no extra charge for the app or the desktop software.`,
  },
];

// FAQ and breadcrumb data for Google; the FAQ text matches the visible FAQs word for word
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Brick Kiln Management App', item: site.url + APP_PAGE },
      ],
    },
  ],
};

// Hero artwork: today's kiln summary on a phone
function PhoneMock() {
  return (
    <figure
      role="img"
      aria-label="Sample BrickManager app screen on a phone: today's bricks made, bricks sold, money received and dues to collect"
      className="relative mx-auto w-full max-w-[18rem]"
    >
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-orange-200/70 via-amber-100/50 to-slate-200/70 blur-2xl" />
      <div className="relative rounded-[2.5rem] bg-slate-900 p-2.5 shadow-2xl shadow-slate-400/60">
        <div className="overflow-hidden rounded-[2rem] bg-slate-50">
          <div className="flex justify-center pt-2"><span className="h-1.5 w-16 rounded-full bg-slate-300" /></div>
          <div className="bg-gradient-to-br from-orange-600 to-amber-500 px-4 pb-5 pt-3 text-white">
            <p className="text-[11px] font-medium text-orange-100">Today · Main kiln</p>
            <p className="mt-0.5 text-lg font-bold">{site.name}</p>
          </div>
          <div className="-mt-3 grid grid-cols-2 gap-2 px-3">
            {[['Bricks made', '14,500'], ['Bricks sold', '11,000'], ['Received', '₹62,400'], ['Dues', '₹1.8 L']].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-500">{k}</p>
                <p className="text-sm font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="mx-3 mt-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold text-slate-600">Recent entries</p>
            {[['Sale · Sharma Traders', '₹28,000'], ['Production · Red brick', '9,000'], ['Expense · Diesel', '₹4,200']].map(([k, v]) => (
              <div key={k} className="mt-2 flex justify-between text-[11px]">
                <span className="text-slate-600">{k}</span><span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="mx-3 mb-4 mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
            {['+ Production', '+ Sale', '+ Payment'].map(t => (
              <span key={t} className="rounded-lg bg-orange-100 py-2 text-orange-800">{t}</span>
            ))}
          </div>
          <p className="pb-3 text-center text-[9px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
        </div>
      </div>
    </figure>
  );
}

export default function BrickKilnAppPage() {
  usePageMeta(TITLE, DESCRIPTION, APP_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <JsonLd data={STRUCTURED_DATA} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:pb-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Management App</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                  <Smartphone size={14} /> Android &amp; iOS app
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Management App for{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Android &amp; iOS</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Run your brick kiln from your phone. The {site.name} app records production, stock, sales, payments
                  and expenses right at the kiln, and shows you today&apos;s numbers wherever you are.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#get-app" onClick={jumpTo('get-app')} className="btn-primary px-7 py-3.5 text-base">
                    Get the App <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">Request a Demo</Link>
                </div>
                <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 lg:justify-start">
                  {['Android phones & tablets', 'iPhone & iPad', 'Included in every plan'].map(t => (
                    <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600" />{t}</li>
                  ))}
                </ul>
              </div>
              <PhoneMock />
            </div>
          </div>
        </section>

        {/* Why an app */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Why a mobile app</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">The Kiln Doesn&apos;t Happen at a Desk</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Bricks are counted at the kiln, trucks are loaded in the yard and payments are collected on the road. When
              entries wait for someone to reach the office, they are written on paper, entered late or forgotten. A brick
              kiln app puts the register in your pocket: the supervisor enters production as it is made, the munshi makes
              the bill while the truck is loaded, and you see every entry from wherever you are.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              {site.name} is <Link to={ONLINE_PAGE} className="font-semibold text-primary-700 hover:text-primary-800">online brick kiln management software</Link>,
              so the app, the desktop software and the browser all share one account and the same up-to-date numbers.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="In the app" title="Everything Your Kiln Needs, on Your Phone" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to={FEATURES_PAGE} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                See every feature <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Devices */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/70 to-white px-5 py-10 ring-1 ring-orange-200/70 sm:px-10 sm:py-14">
            <BrickPattern className="fill-orange-900/[0.06]" />
            <div className="relative">
              <SectionHeading
                eyebrow="Android, iOS, desktop"
                title="One Account on Every Device"
                text="Use the phone at the kiln and the computer in the office. Every entry shows up everywhere."
              />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {DEVICES.map(({ icon: Icon, title, text }) => (
                  <article key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
                    <Icon size={24} className="text-orange-600" />
                    <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </article>
                ))}
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
                <Lock size={15} className="text-slate-500" /> Password-protected login, and each business sees only its own data.
              </p>
            </div>
          </div>
        </section>

        {/* Get the app */}
        <section id="get-app" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading eyebrow="Get started" title="How to Get the Brick Kiln App" />
            <ol className="mt-12 grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ title, text }, i) => (
                <li key={title} className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple kilns' : 'One kiln'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">The mobile app and desktop software are included in both plans.</p>
            <nav aria-label="Related pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: BHATTA_PAGE, label: 'Bhatta software' },
                { to: PRODUCTION_PAGE, label: 'Production management' },
                { to: PAYMENT_PAGE, label: 'Payment tracking' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-slate-200 transition hover:bg-primary-50">
                  {l.label} <ChevronRight size={14} />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln App FAQs" />
            <div className="mt-10 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-white ring-1 ring-slate-200 transition open:shadow-md open:ring-orange-200">
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

        {/* Call to action */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.06]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Put your brick kiln in your pocket</h2>
              <p className="mx-auto mt-4 max-w-xl text-orange-50">Get the {site.name} app for Android and iOS with any plan.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Get Started <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to get the ${site.name} brick kiln app for my phone.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/50 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  <WhatsAppIcon size={18} /> Chat on WhatsApp
                </a>
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
