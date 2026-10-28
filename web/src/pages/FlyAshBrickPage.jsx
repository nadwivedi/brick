import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, ChevronDown, ChevronRight, Clock, FileText, Gauge, Grid3x3, Layers,
  ShieldAlert, Users,
} from 'lucide-react';
import JsonLd from '../components/JsonLd';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  CONTACT_PAGE, COST_GUIDE_PAGE, FACTORY_PAGE, FLY_ASH_PAGE, INVENTORY_PAGE, PRICE_PAGE, PRODUCTION_PAGE, scrollToSection,
} from '../lib/publicNav';
import { appLink, site, whatsappLink } from '../lib/site';

export const TITLE = `Fly Ash Brick Management Software | ${site.name}`;
export const DESCRIPTION = 'Fly ash brick management software: track fly ash, cement and sand per batch, check bricks per bag of cement, damaged bricks, stock, sales and dues.';

// The materials of a typical fly ash brick mix; owners add their own in the app
const MIX = ['Fly ash', 'Cement', 'Sand / stone dust', 'Lime', 'Gypsum'];

// The cement check's comparison periods, as the app shows them
const AVERAGES = [
  { label: 'Last 30 days avg', value: 214 },
  { label: 'Last 1 year avg', value: 211 },
  { label: 'Lifetime avg', value: 209 },
];

const FEATURES = [
  { icon: Grid3x3, title: 'Production by plates', text: 'Enter plates and bricks per plate, and the brick count is worked out for you. Or enter a straight count.' },
  { icon: Clock, title: 'Shift-wise entry', text: 'Full day, morning, evening or night shift, so you can compare output shift by shift.' },
  { icon: Boxes, title: 'Material used per batch', text: 'Fly ash, cement, sand and lime used in each batch come out of stock automatically.' },
  { icon: ShieldAlert, title: 'Damaged bricks', text: 'Broken bricks are recorded per batch and shown as a percentage, so a bad batch stands out.' },
  { icon: AlertTriangle, title: 'Low stock alerts', text: 'Set a minimum for fly ash and cement and get warned before the machines have to stop.' },
  { icon: Layers, title: 'Ready brick stock', text: 'Good bricks join stock for their brick type, and every sale takes them out.' },
  { icon: FileText, title: 'GST invoices', text: 'Bills with GST, discounts, transport and trip charges for every load.' },
  { icon: Users, title: 'Party ledgers & reminders', text: 'Who owes what, with balance-due reminders sent on WhatsApp.' },
  { icon: BarChart3, title: 'Profit & cost per brick', text: 'Profit & loss for any period, with the real cost of each brick.' },
];

const FAQS = [
  {
    q: 'What is fly ash brick management software?',
    a: `Fly ash brick management software records the daily work of a fly ash brick plant: bricks made per batch and shift, fly ash, cement and sand used, damaged bricks, stock, sales, dues and expenses. ${site.name} is built for fly ash and other brick plants in India.`,
  },
  {
    q: 'How does the software check cement consumption?',
    a: 'When you enter a batch, it works out the bricks made per bag of cement and compares it with your averages for that brick type over the last 30 days, the last year and all time. A batch that used more cement than usual is flagged straight away.',
  },
  {
    q: 'Can I enter production in plates?',
    a: 'Yes. Turn on plate entry, set the bricks per plate, and enter the number of plates. The brick count is worked out for you. You can also enter a straight brick count.',
  },
  {
    q: 'Which raw materials can I track?',
    a: 'Any you use. Add fly ash, cement, sand, stone dust, lime, gypsum or others with their own units, and stock moves with every purchase and production entry.',
  },
  {
    q: 'How much does fly ash brick management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple plants' : 'one plant'}`).join(' and ')}, with every feature, the mobile app and desktop software included.`,
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
        { '@type': 'ListItem', position: 2, name: 'Fly Ash Brick Management Software', item: site.url + FLY_ASH_PAGE },
      ],
    },
  ],
};

// Hero artwork: a fly ash batch entry with the live cement check
function BatchEntry() {
  return (
    <figure
      role="img"
      aria-label="Sample fly ash brick batch in BrickManager: 120 plates of 105 bricks, fly ash, cement and sand used, and a cement check showing 210 bricks per bag against a 30-day average of 214"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-slate-200/70 via-amber-100/50 to-orange-200/60 blur-2xl" />
      <div className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-900">New batch · Morning shift</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Fly ash brick</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Plates', '120'], ['Per plate', '105'], ['Bricks', '12,600']].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[10px] text-slate-500">{k}</p>
              <p className="text-sm font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-slate-100 p-3 text-xs">
          <p className="font-semibold text-slate-600">Material used</p>
          {[['Fly ash', '9.2 t'], ['Cement', '60 bags'], ['Sand', '3.1 t']].map(([k, v]) => (
            <div key={k} className="mt-1.5 flex justify-between"><span className="text-slate-600">{k}</span><span className="font-semibold text-slate-900">{v}</span></div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">1 bag → 210 bricks</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">More cement than usual</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-800">30-day average: 214 bricks per bag</p>
        </div>
        <p className="mt-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
      </div>
    </figure>
  );
}

export default function FlyAshBrickPage() {
  usePageMeta(TITLE, DESCRIPTION, FLY_ASH_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100/70 via-white to-slate-50 text-slate-900">
      <JsonLd data={STRUCTURED_DATA} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-slate-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:pb-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Fly Ash Brick Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  <Gauge size={14} /> Built for fly ash brick plants
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Fly Ash Brick Management Software to{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Control Every Batch</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Track the fly ash, cement and sand in every batch, see how many bricks each bag of cement gives you,
                  and catch wasteful batches the same day. {site.name} also runs your stock, sales, dues and expenses.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#cement" onClick={jumpTo('cement')} className="btn-primary px-7 py-3.5 text-base">
                    See the Cement Check <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">Request a Demo</Link>
                </div>
              </div>
              <BatchEntry />
            </div>
          </div>
        </section>

        {/* The mix */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Your mix, batch by batch</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Track Every Material in Your Fly Ash Mix</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                A fly ash brick is only as cheap as its mix. Add the materials you use with their own units, such as
                tonnes of fly ash or bags of cement, and record what each batch used. Stock goes down with every batch
                and up with every purchase, so you always know how many days of material are left.
              </p>
              <Link to={INVENTORY_PAGE} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                Raw material inventory <ChevronRight size={16} />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-3">
              {MIX.map(m => (
                <li key={m} className="rounded-2xl bg-slate-50 px-5 py-4 font-semibold text-slate-800 ring-1 ring-slate-200">{m}</li>
              ))}
              <li className="rounded-2xl border border-dashed border-orange-300 px-5 py-4 font-semibold text-orange-700">+ your own materials</li>
            </ul>
          </div>
        </section>

        {/* Cement check */}
        <section id="cement" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/70 to-white px-5 py-10 ring-1 ring-orange-200/70 sm:px-10 sm:py-14">
            <BrickPattern className="fill-orange-900/[0.06]" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Cement check</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Know Your Bricks per Bag of Cement</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Cement is the most expensive part of a fly ash brick. The moment a batch is entered, {site.name} works
                  out how many bricks each bag of cement gave and compares it with your own averages for that brick type.
                  A batch that used more cement than usual is flagged while the shift is still fresh in everyone&apos;s mind.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-slate-800">This batch: 1 bag → 210 bricks</p>
                <ul className="mt-3 divide-y divide-slate-100">
                  {AVERAGES.map(a => (
                    <li key={a.label} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-slate-600">{a.label}</span>
                      <span className="font-semibold text-slate-900">{a.value} bricks/bag</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                  Flagged: this batch used more cement than your averages
                </p>
                <p className="mt-2 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Features" title="Everything a Fly Ash Brick Plant Needs" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 text-white shadow-md">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Fly Ash Brick Software Plans</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Every feature, the mobile app and desktop software in both plans.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple plants' : 'One plant'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <nav aria-label="Related pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: FACTORY_PAGE, label: 'Bricks factory management' },
                { to: PRODUCTION_PAGE, label: 'Production management' },
                { to: COST_GUIDE_PAGE, label: 'How to calculate cost per brick' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-slate-200 transition hover:bg-primary-50">
                  {l.label} <ChevronRight size={14} />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Fly Ash Brick Management Software FAQs" />
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

        {/* Call to action */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-orange-700 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.05]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Stop guessing your cement use</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-200">See {site.name} on your own fly ash batches.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Get Started <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} fly ash brick management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
