import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, CheckCircle2, ChevronDown, ChevronRight, Factory, FileText, Gauge,
  HandCoins, HardHat, Layers, ShieldAlert, Sun, Sunset, Truck, Users, Wallet,
} from 'lucide-react';
import JsonLd from '../components/JsonLd';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BILLING_PAGE, CONTACT_PAGE, FACTORY_PAGE, FEATURES_PAGE, FLY_ASH_PAGE, INVENTORY_PAGE, PLANT_PAGE, PRICE_PAGE, PRODUCTION_PAGE,
  scrollToSection,
} from '../lib/publicNav';
import { appLink, site, whatsappLink } from '../lib/site';

export const TITLE = `Bricks Factory Management Software | ${site.name}`;
export const DESCRIPTION = `Bricks factory management software for fly ash and clay brick factories. Track daily production, raw material, brick stock, dispatch, dues and expenses.`;

// One working day at a brick factory, and what gets recorded at each step
const DAY = [
  { icon: Sun, time: 'Morning', title: 'Raw material in', text: 'Cement, fly ash, sand or coal arrives. The purchase adds it to stock and to the vendor\'s ledger.' },
  { icon: Factory, time: 'Through the shift', title: 'Bricks made', text: 'Each batch is entered by brick type and shift. Material used comes out of stock, damaged bricks are noted.' },
  { icon: Layers, time: 'Yard', title: 'Ready stock', text: 'Good bricks join the ready stock for their brick type, so the yard count is always current.' },
  { icon: Truck, time: 'Afternoon', title: 'Trucks dispatched', text: 'Invoices go out with transport and trip charges, and brick stock goes down with every load.' },
  { icon: HandCoins, time: 'Any time', title: 'Money in and out', text: 'Payments received and paid update party ledgers and cash or bank balances straight away.' },
  { icon: Sunset, time: 'Evening', title: 'Day closed', text: 'The dashboard shows what was made, sold, collected and spent today, with no register to add up.' },
];

const MODULES = [
  { icon: Factory, title: 'Production by shift', text: 'Bricks made per brick type and shift, with damaged bricks recorded.', to: PRODUCTION_PAGE },
  { icon: Boxes, title: 'Raw material stock', text: 'Live stock of every material, moving with purchases and production.', to: INVENTORY_PAGE },
  { icon: FileText, title: 'GST invoices & dispatch', text: 'Bills with GST, discounts, transport and trip charges.', to: BILLING_PAGE },
  { icon: Users, title: 'Party ledgers', text: 'Every customer and vendor with bills, payments and balance due.' },
  { icon: HardHat, title: 'Labour & vehicles', text: 'Workers and delivery vehicles on record, with a ledger for each vehicle.' },
  { icon: Wallet, title: 'Expenses, cash & bank', text: 'Diesel, repairs, electricity and wages by category, from cash or bank.' },
  { icon: WhatsAppIcon, title: 'WhatsApp due reminders', text: 'Parties are reminded of their balance due on WhatsApp.' },
  { icon: BarChart3, title: 'Reports & profit', text: 'Production, sales, collections and profit & loss with cost per brick.' },
];

// The numbers a factory owner watches, and where the software shows them
const CONTROL = [
  { icon: ShieldAlert, title: 'Damaged bricks', text: 'Damage as a percentage of each batch, so a bad shift or batch stands out.' },
  { icon: Gauge, title: 'Bricks per bag of cement', text: 'Material efficiency tracked over time, so waste shows up early.' },
  { icon: AlertTriangle, title: 'Low raw material', text: 'An alert before cement or fly ash runs out and the machines stop.' },
];

const FACTORY_TYPES = [
  { title: 'Fly ash brick factories', text: 'Fly ash, cement, sand and lime stock, bricks per bag of cement, and output per shift.', to: FLY_ASH_PAGE },
  { title: 'Red clay brick factories', text: 'Clay and coal stock, production batches, damaged bricks and ready stock by brick type.' },
  { title: 'Multi-unit factories', text: 'Several factory units from one login, with production, stock, sales and expenses kept unit-wise.' },
];

const FAQS = [
  {
    q: 'What is bricks factory management software?',
    a: `Bricks factory management software runs the day-to-day work of a brick factory in one app: production by shift, raw material and brick stock, sales and dispatch, party dues, expenses and reports. ${site.name} is built specifically for brick factories in India.`,
  },
  {
    q: 'Does it work for fly ash brick factories?',
    a: 'Yes. You add your own raw materials such as fly ash, cement, sand and lime, and your own brick types. Stock moves with every purchase and production entry, and efficiency is tracked as bricks made per bag of cement.',
  },
  {
    q: 'Can I manage more than one factory unit?',
    a: 'Yes. With the multi brick kiln plan you run several factories or units from one login, and production, stock, sales and expenses are kept separately for each.',
  },
  {
    q: 'Does it track damaged bricks?',
    a: 'Yes. Each production entry records damaged bricks, shown as a percentage of the batch, so you can spot problem shifts or batches.',
  },
  {
    q: 'How much does bricks factory management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple factories' : 'one factory'}`).join(' and ')}, with every feature, the mobile app and desktop software included.`,
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
        { '@type': 'ListItem', position: 2, name: 'Bricks Factory Management Software', item: site.url + FACTORY_PAGE },
      ],
    },
  ],
};

// Hero artwork: today's factory board
function FactoryBoard() {
  const shifts = [['Morning shift', '6,200', '1.2%'], ['Evening shift', '5,800', '2.9%']];
  return (
    <figure
      role="img"
      aria-label="Sample BrickManager factory board for today: bricks made per shift with damaged percentage, trucks dispatched and fly ash stock"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-200/70 via-amber-100/50 to-primary-100/60 blur-2xl" />
      <div className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-900">Factory today</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">Live</span>
        </div>
        <div className="mt-4 space-y-2">
          {shifts.map(([s, made, dmg]) => (
            <div key={s} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <span className="text-sm font-medium text-slate-600">{s}</span>
              <span className="text-sm font-bold text-slate-900">{made} bricks</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${parseFloat(dmg) > 2 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{dmg} damaged</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-primary-50 p-3 ring-1 ring-primary-100">
            <p className="text-[11px] text-primary-700">Trucks dispatched</p>
            <p className="text-lg font-extrabold text-slate-900">7 <span className="text-xs font-semibold text-slate-500">· 10,500 bricks</span></p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-[11px] text-amber-800">Fly ash stock</p>
            <p className="text-lg font-extrabold text-slate-900">18 t <span className="text-xs font-semibold text-amber-700">· low</span></p>
          </div>
        </div>
        <p className="mt-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
      </div>
    </figure>
  );
}

export default function BricksFactoryPage() {
  usePageMeta(TITLE, DESCRIPTION, FACTORY_PAGE);

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
              <span className="text-slate-700" aria-current="page">Bricks Factory Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                  <Factory size={14} /> For fly ash & clay brick factories
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Bricks Factory Management Software to{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Run Every Shift</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  From raw material at the gate to trucks leaving the yard, {site.name} records your brick factory&apos;s
                  whole day: production by shift, stock, dispatch, dues and expenses, with no paper registers.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#day" onClick={jumpTo('day')} className="btn-primary px-7 py-3.5 text-base">
                    See a Factory Day <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">Request a Demo</Link>
                </div>
              </div>
              <FactoryBoard />
            </div>
          </div>
        </section>

        {/* A day at the factory */}
        <section id="day" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="A day at your factory"
              title="Every Step of the Factory Day, Recorded Once"
              text="Each entry updates stock, ledgers and reports on its own, so nothing is written twice."
            />
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DAY.map(({ icon: Icon, time, title, text }, i) => (
                <li key={title} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <span className="absolute right-5 top-5 text-3xl font-extrabold text-orange-100">{i + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-md">
                    <Icon size={20} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-orange-700">{time}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Modules */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="What's included" title="Everything a Brick Factory Needs in One App" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODULES.map(({ icon: Icon, title, text, to }) => (
                <div key={title} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <Icon size={24} className="text-orange-700" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  {to && (
                    <Link to={to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                      Learn more <ChevronRight size={15} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link to={FEATURES_PAGE} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                See all features <ChevronRight size={16} />
              </Link>
            </p>
          </div>
        </section>

        {/* Control */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/70 to-white px-5 py-10 ring-1 ring-orange-200/70 sm:px-10 sm:py-14">
            <BrickPattern className="fill-orange-900/[0.06]" />
            <div className="relative">
              <SectionHeading
                eyebrow="Factory control"
                title="Catch Problems Before They Cost You"
                text="Three numbers tell you how well your factory is running. They are worked out from the entries you already make."
              />
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {CONTROL.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-orange-100">
                    <Icon size={26} className="text-orange-700" />
                    <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Factory types */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Built for your factory" title="For Every Kind of Brick Factory" />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {FACTORY_TYPES.map(({ title, text, to }) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  {to && (
                    <Link to={to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                      Fly ash brick management software <ChevronRight size={15} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Brick Factory Software Plans</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Every feature, the mobile app and desktop software in both plans.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple factories' : 'One factory'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <nav aria-label="Related pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: PRODUCTION_PAGE, label: 'Production management' },
                { to: INVENTORY_PAGE, label: 'Inventory management' },
                { to: PLANT_PAGE, label: 'Brick plant management' },
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
            <SectionHeading eyebrow="FAQs" title="Bricks Factory Management Software FAQs" />
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.06]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Run your brick factory without paperwork</h2>
              <p className="mx-auto mt-4 max-w-xl text-orange-50">See how {site.name} fits your factory, shift by shift.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Get Started <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} bricks factory management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
