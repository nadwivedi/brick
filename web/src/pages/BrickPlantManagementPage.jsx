import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Boxes, Building2, CalendarRange, Check, ChevronDown, ChevronRight, DollarSign, FileText,
  Filter, Hammer, HandCoins, LayoutDashboard, Minus, MousePointerClick, Search, Send, ShoppingCart, Smartphone,
  Sparkles, TrendingUp, Users, X,
} from 'lucide-react';
import JsonLd from '../components/JsonLd';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, BrickStack, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BHATTA_PAGE, CONTACT_PAGE, MANUFACTURING_PAGE, PLANT_PAGE, PRICE_PAGE, scrollToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

export const TITLE = `Best Brick Plant Management Software | ${site.name}`;
export const DESCRIPTION = `${site.name} is brick plant management software that is easy to manage and helps you track production, stock, sales, expenses and dues of your business.`;

// Each tab: what you can track, and the everyday questions it answers. Only features the software has.
const TRACK_TABS = [
  {
    key: 'production',
    icon: Hammer,
    label: 'Production',
    title: 'Track every brick your plant makes',
    points: [
      'Daily production by plant and brick type',
      'Raw materials used and damaged bricks recorded with each entry',
      'Cement use per batch compared with your past averages',
      'Production totals for any date range on the dashboard',
    ],
    questions: ['How many bricks did we make this week?', 'Did today\'s batch use more cement than usual?'],
  },
  {
    key: 'stock',
    icon: Boxes,
    label: 'Stock',
    title: 'Know your stock without counting the yard',
    points: [
      'Live stock of every brick type and raw material',
      'Stock moves automatically with production, purchases and sales',
      'Ledgers that show every movement in and out',
      'Low stock alerts before a material runs out',
    ],
    questions: ['How many bricks are ready to sell?', 'Do we need to order cement this week?'],
  },
  {
    key: 'sales',
    icon: FileText,
    label: 'Sales',
    title: 'Follow every sale from invoice to payment',
    points: [
      'Sale invoices with GST, vehicle and transport or trip charges',
      'Invoice status: issued, partly paid, paid or cancelled',
      'Collections recorded against each customer',
      'Sales and collections totals on the dashboard',
    ],
    questions: ['How much did we sell this month?', 'Which invoices are still partly paid?'],
  },
  {
    key: 'money',
    icon: HandCoins,
    label: 'Money',
    title: 'See where the money comes from and goes',
    points: [
      'Customer and vendor ledgers with live balances',
      'Outstanding dues shown on the dashboard',
      'Expenses by category and purchases from vendors',
      'Cash and bank balances, with transfers between accounts',
    ],
    questions: ['Who owes us money right now?', 'How much cash is in hand today?'],
  },
  {
    key: 'reports',
    icon: BarChart3,
    label: 'Reports',
    title: 'Review the business in a few clicks',
    points: [
      'Overview of production, sales, expenses and outstanding amounts',
      'Profit & loss report',
      'Party ledger report for any customer or vendor',
      'Date presets including this month and this financial year',
    ],
    questions: ['Did we make a profit this financial year?', 'What has this customer bought and paid this year?'],
  },
];

const EASE = [
  { icon: MousePointerClick, title: 'One-tap daily entries', text: 'The dashboard has quick buttons for New Production, New Sale, New Purchase, New Expense, Money Received and Money Paid.' },
  { icon: CalendarRange, title: 'Pick a period in one click', text: 'Switch the dashboard between Today, Yesterday, Last 7 Days, Last 30 Days, This Year or any custom dates.' },
  { icon: Filter, title: 'Simple until you need more', text: 'Plant fields and plant filters only appear once you run more than one plant, so single-plant screens stay uncluttered.' },
  { icon: Search, title: 'Find anything fast', text: 'Search production entries, expenses, payments and parties instead of flipping through pages.' },
  { icon: Smartphone, title: 'Manage from your phone', text: 'Use the mobile app at the plant, the desktop software in the office, or any browser.' },
  { icon: LayoutDashboard, title: 'Everything on one screen', text: 'Production, sales, collections, purchases, expenses and outstanding dues sit together on the dashboard.' },
];

// yes / no / partly, for paper registers, spreadsheets and BrickManager.
const COMPARISON = [
  { label: 'Stock updates by itself after each entry', values: ['no', 'no', 'yes'] },
  { label: 'Customer dues always up to date', values: ['no', 'partly', 'yes'] },
  { label: 'Built around brick plants (brick types, trips, cement use)', values: ['no', 'no', 'yes'] },
  { label: 'Profit & loss without manual totalling', values: ['no', 'partly', 'yes'] },
  { label: 'Works on a phone from anywhere', values: ['no', 'partly', 'yes'] },
  { label: 'Several plants viewed separately and together', values: ['no', 'partly', 'yes'] },
];

const PLANT_POINTS = [
  'Production, sales, purchases and expenses recorded against each plant',
  'Brick stock kept separately for every plant',
  'Trip rates set plant by plant',
  'Dashboard and activity filtered to one plant or shown for all',
];

const START_STEPS = [
  { title: 'Talk to us', text: 'Call or message us on WhatsApp and tell us about your plant.' },
  { title: 'Add your basics', text: 'Enter your plants, brick types, raw materials, parties, labour and vehicles once.' },
  { title: 'Start tracking', text: 'Record the day\'s work from the dashboard and watch stock, dues and reports fill in.' },
];

const FAQS = [
  {
    q: 'What is brick plant management software?',
    a: 'Brick plant management software is a system for running a brick plant\'s daily work in one place: production, raw material and brick stock, sales, purchases, expenses, payments and reports, instead of separate registers and spreadsheets.',
  },
  {
    q: `Why is ${site.name} a good option for my brick business?`,
    a: `It is built specifically for brick plants, so brick types, raw materials, cement use, trips and parties work as you expect. Stock, dues and balances update automatically, and it works on any phone or computer.`,
  },
  {
    q: 'Is brick management software easy to use?',
    a: 'Yes. Daily entries start from quick buttons on the dashboard, periods can be changed in one click, and screens stay simple for single-plant businesses.',
  },
  {
    q: 'What can I track with brick plant management software?',
    a: 'You can track production, brick and raw material stock, sales and invoice status, collections, purchases, expenses, cash and bank balances, customer and vendor dues, and profit & loss.',
  },
  {
    q: 'Can I manage more than one brick plant?',
    a: 'Yes. With the multi-plant plan you can record work against each plant, keep brick stock separate for each, and view the dashboard for one plant or all plants together.',
  },
  {
    q: 'Is there a mobile app and desktop software?',
    a: `Yes. After you buy a plan you get the ${site.name} mobile app and desktop software to install, and you can also use it in the web browser on any device.`,
  },
  {
    q: 'How much does brick plant management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple plants' : 'one plant'}`).join(' and ')}.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork modelled on the real dashboard: period tabs, plant filter and the six headline figures.
function PlantDashboard() {
  const kpis = [
    { icon: Hammer, label: 'Production', value: '86,400 pcs', tone: 'bg-blue-50 text-blue-700' },
    { icon: FileText, label: 'Sales', value: '₹4.2L', tone: 'bg-emerald-50 text-emerald-700' },
    { icon: TrendingUp, label: 'Collections', value: '₹3.6L', tone: 'bg-teal-50 text-teal-700' },
    { icon: ShoppingCart, label: 'Purchases', value: '₹1.9L', tone: 'bg-indigo-50 text-indigo-700' },
    { icon: DollarSign, label: 'Expenses', value: '₹62K', tone: 'bg-amber-50 text-amber-700' },
    { icon: Users, label: 'Outstanding', value: '₹1.1L', tone: 'bg-rose-50 text-rose-700' },
  ];
  return (
    <figure
      role="img"
      aria-label="Sample BrickManager dashboard showing production, sales, collections, purchases, expenses and outstanding dues for the last 7 days"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary-200/60 via-sky-100/50 to-orange-200/60 blur-2xl" />
      <BrickStack className="absolute -top-[46px] left-8 w-24 drop-shadow-lg sm:-top-[58px] sm:w-[7.5rem]" />
      <div className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-slate-900">Plant overview</p>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Building2 size={13} /> All plants <ChevronDown size={13} />
          </span>
        </div>
        <div className="mt-4 flex gap-1.5 overflow-hidden text-[11px] font-semibold">
          {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'].map(r => (
            <span key={r} className={`shrink-0 rounded-full px-2.5 py-1 ${r === 'Last 7 Days' ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{r}</span>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kpis.map(({ icon: Icon, label, value, tone }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon size={16} /></span>
              <p className="mt-2 text-[11px] font-medium text-slate-500">{label}</p>
              <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
      </div>
    </figure>
  );
}

function TrackTabs() {
  const [active, setActive] = useState(TRACK_TABS[0].key);
  return (
    <div className="mt-12">
      <div role="tablist" aria-label="What you can track" className="flex flex-wrap justify-center gap-2">
        {TRACK_TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={active === key}
            aria-controls={`panel-${key}`}
            onClick={() => setActive(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5 ${active === key
              ? 'bg-primary-700 text-white shadow-md shadow-primary-700/20'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Every panel stays in the page for search engines; only the chosen one is shown */}
      {TRACK_TABS.map(({ key, title, points, questions }) => (
        <div
          key={key}
          role="tabpanel"
          id={`panel-${key}`}
          aria-labelledby={`tab-${key}`}
          hidden={active !== key}
          className="mt-8 gap-6 rounded-3xl [&:not([hidden])]:grid border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-5"
        >
          <div className="lg:col-span-3">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h3>
            <ul className="mt-5 space-y-3">
              {points.map(p => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={12} strokeWidth={3} /></span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-sky-50/60 p-5 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Questions it answers</p>
            <ul className="mt-3 space-y-2.5">
              {questions.map(q => (
                <li key={q} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-primary-100">“{q}”</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function Mark({ value }) {
  if (value === 'yes') return <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Yes"><Check size={15} strokeWidth={3} /></span>;
  if (value === 'partly') return <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-label="Partly, with manual work"><Minus size={15} strokeWidth={3} /></span>;
  return <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-label="No"><X size={15} strokeWidth={3} /></span>;
}

export default function BrickPlantManagementPage() {
  usePageMeta(TITLE, DESCRIPTION, PLANT_PAGE);

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/60 via-white to-slate-50 text-slate-900">
      <JsonLd data={STRUCTURED_DATA} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-slate-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Plant Management Software</span>
            </nav>

            <div className="mt-12 grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-primary-800 shadow-sm">
                  <Sparkles size={14} /> The best option to run your brick plant
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Plant Management Software That Is{' '}
                  <span className="bg-gradient-to-r from-primary-700 to-sky-600 bg-clip-text text-transparent">Easy to Manage</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} helps you track your whole brick business: what your plant produces, what is in stock,
                  what you sold, what you collected and what you spent. Simple daily entries, clear numbers, all in one place.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#track" onClick={jumpTo('track')} className="btn-primary px-7 py-3.5 text-base">
                    See What You Can Track <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <PlantDashboard />
            </div>
          </div>
        </section>

        {/* Definition */}
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">What Is Brick Plant Management Software?</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Brick plant management software brings the daily work of a brick plant into one system. Instead of
              keeping production, stock, sales and money in different places, you record each activity once, and the
              software keeps every related number in step. The result is a business that is easier to manage and much
              easier to track.
            </p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                { title: 'Manage', text: 'Record production, purchases, sales and expenses from one dashboard.' },
                { title: 'Track', text: 'Follow stock, collections, dues and balances as they change.' },
                { title: 'Decide', text: 'Use reports and profit figures to plan your next move.' },
              ].map(({ title, text }, i) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <p className="text-sm font-bold text-primary-700">0{i + 1}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Track tabs */}
        <section id="track" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Track your business"
              title="Everything You Can Track with Brick Management Software"
              text="Choose an area to see what BrickManager keeps track of, and the everyday questions it helps you answer."
            />
            <TrackTabs />
          </div>
        </section>

        {/* Easy to manage */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Easy to manage"
              title="Made So Anyone at Your Plant Can Use It"
              text="Good software should save effort, not add to it. These are the details that keep daily work quick."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {EASE.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-white p-7 transition hover:bg-sky-50/40">
                  <Icon size={26} className="text-primary-700" />
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 p-5">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-primary-700">Quick buttons on the dashboard</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { icon: Hammer, label: 'New Production' },
                  { icon: FileText, label: 'New Sale' },
                  { icon: ShoppingCart, label: 'New Purchase' },
                  { icon: DollarSign, label: 'New Expense' },
                  { icon: HandCoins, label: 'Money Received' },
                  { icon: Send, label: 'Money Paid' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Icon size={16} className="shrink-0 text-primary-700" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Best option"
              title="Why BrickManager Is the Best Option for Your Business"
              text="Most brick plants today run on paper registers or spreadsheets. Here is how they compare for everyday plant management."
            />
            {/* Phones: one card per row, so the BrickManager answer is never scrolled out of view */}
            <ul className="mt-12 space-y-3 sm:hidden">
              {COMPARISON.map(({ label, values }) => (
                <li key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-800">{label}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-500">
                    {['Paper', 'Spreadsheets', site.name].map((col, i) => (
                      <div key={col} className={`rounded-xl py-2 ${i === 2 ? 'bg-primary-50 font-bold text-primary-800' : 'bg-slate-50'}`}>
                        <Mark value={values[i]} />
                        <span className="mt-1.5 block">{col}</span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-12 hidden overflow-x-auto rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Comparison of paper registers, spreadsheets and BrickManager</caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th scope="col" className="px-5 py-4 text-left font-semibold text-slate-500">What you need</th>
                    <th scope="col" className="px-4 py-4 text-center font-semibold text-slate-500">Paper registers</th>
                    <th scope="col" className="px-4 py-4 text-center font-semibold text-slate-500">Spreadsheets</th>
                    <th scope="col" className="bg-primary-700 px-4 py-4 text-center font-bold text-white">{site.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ label, values }) => (
                    <tr key={label} className="border-b border-slate-100 last:border-b-0">
                      <th scope="row" className="px-5 py-4 text-left font-medium text-slate-700">{label}</th>
                      {values.map((v, i) => (
                        <td key={i} className={`px-4 py-4 ${i === 2 ? 'bg-primary-50/50' : ''}`}><Mark value={v} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mark value="yes" /> Yes</span>
              <span className="flex items-center gap-1.5"><Mark value="partly" /> Possible, with manual work</span>
              <span className="flex items-center gap-1.5"><Mark value="no" /> No</span>
            </p>
          </div>
        </section>

        {/* One plant or many */}
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-orange-50/70 p-8 ring-1 ring-slate-200 sm:p-12 lg:grid-cols-2 lg:items-center">
            <BrickPattern className="fill-slate-900/[0.025]" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">One plant or many</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Manage Every Brick Plant from One Login</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Start with your first plant. When the business grows, add more plants to the same account and track
                each one on its own or all of them together.
              </p>
            </div>
            <ul className="relative space-y-3">
              {PLANT_POINTS.map(p => (
                <li key={p} className="flex items-start gap-3 rounded-xl bg-white/90 p-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
                  <Building2 size={18} className="mt-0.5 shrink-0 text-orange-700" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Getting started + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Getting started</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Start Managing Your Plant in Three Steps</h2>
              <ol className="mt-8 space-y-4">
                {START_STEPS.map(({ title, text }, i) => (
                  <li key={title} className="flex gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-lg font-bold text-white shadow-md shadow-primary-700/20">{i + 1}</span>
                    <div className="pt-1">
                      <h3 className="font-bold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="self-start rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200">
              <h3 className="font-bold text-slate-900">Plans</h3>
              <ul className="mt-4 space-y-2">
                {PLANS.map(p => (
                  <li key={p.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-700">{p.featured ? 'Multiple plants' : 'One plant'}</span>
                    <span className="font-bold text-slate-900">₹{p.price}/yr</span>
                  </li>
                ))}
              </ul>
              <nav aria-label="Related pages" className="mt-5 space-y-1 border-t border-slate-200 pt-4 text-sm">
                {[
                  { to: PRICE_PAGE, label: 'Compare plans and pricing' },
                  { to: MANUFACTURING_PAGE, label: 'Bricks manufacturing software' },
                  { to: BHATTA_PAGE, label: 'Bhatta software' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="group flex items-center justify-between rounded-lg px-2 py-2 font-semibold text-primary-700 transition hover:bg-primary-50">
                    {l.label} <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Plant Management Software FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition open:bg-white open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-primary-700 ring-1 ring-slate-200 transition group-open:rotate-180">
                      <ChevronDown size={16} />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-sky-600 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.05]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Make your brick plant easy to manage</h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-100">
                See how {site.name} can track your production, stock, sales and money from day one.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-primary-800 shadow-lg transition hover:bg-sky-50">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick plant management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
