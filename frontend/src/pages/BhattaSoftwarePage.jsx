import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, BookOpen, Boxes, Building2, Calculator, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock, FileText, Hammer, HandCoins, HardHat, Landmark, Layers, MessageCircle,
  ShieldCheck, Smartphone, Sparkles, Truck, UserCog, Users, X,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, BrickStack, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import { PRICE_PAGE, scrollToSection, useGoToSection } from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Bhatta Software - Best Brick Bhatta Management Software | ${site.name}`;
const DESCRIPTION = `${site.name} is the bhatta software that makes brick kiln work easy. Manage production, stock, labour, sales, dues and accounts of your bhatta from one app. Plans from ₹7,999/year.`;

const PROBLEMS = [
  { before: 'Production written in registers that get lost or torn', after: 'Every day\'s production saved by brick type, safe and searchable' },
  { before: 'Guessing how much cement, fly ash or coal is left', after: 'Raw material stock updates with every purchase and production entry' },
  { before: 'Bills made by hand, transport charges calculated on paper', after: 'Sale invoices in seconds, with trip and transport charges added for you' },
  { before: 'Forgetting which customer still owes money', after: 'Party ledgers show every customer\'s and vendor\'s balance at a glance' },
  { before: 'No clear idea of the bhatta\'s real profit', after: 'Profit & loss report built from your sales, purchases and expenses' },
];

const STEPS = [
  { icon: Building2, title: 'Set up your bhatta once', text: 'Add your bhatta (plant), brick types, raw materials, labour, vehicles, customers and vendors. It takes a few minutes and you only do it once.' },
  { icon: Hammer, title: 'Record daily production', text: 'Enter how many bricks were made today and of which type. Brick stock goes up automatically.' },
  { icon: Boxes, title: 'Keep raw material in check', text: 'Purchases add to stock and production uses it up. Low stock alerts warn you before work has to stop.' },
  { icon: Truck, title: 'Sell and bill with transport', text: 'Make a sale invoice, add the vehicle and trip charges, and the brick stock goes down on its own.' },
  { icon: HandCoins, title: 'Collect dues and pay vendors', text: 'Record money received and money paid. Every party\'s ledger stays up to date without extra work.' },
  { icon: BarChart3, title: 'See profit and reports', text: 'Check the dashboard and the profit & loss report any time to know exactly how your bhatta is doing.' },
];

const FEATURES = [
  { icon: Hammer, title: 'Production management', text: 'Daily brick production by type and shift, with the raw material used and damaged bricks.' },
  { icon: Boxes, title: 'Raw material & brick stock', text: 'Live stock of every material and every brick type, with a full stock ledger.' },
  { icon: FileText, title: 'Sales & billing', text: 'Professional invoices with transport and trip charges included.' },
  { icon: Users, title: 'Customer & vendor ledgers', text: 'Who owes you, whom you owe, and every payment in between.' },
  { icon: Landmark, title: 'Expenses, cash & bank', text: 'Daily expenses by category and live balances for each account.' },
  { icon: HardHat, title: 'Labour records', text: 'Keep details of the workers at your bhatta in one place.' },
  { icon: Truck, title: 'Vehicles & trips', text: 'Your delivery vehicles and trip rates, ready when you make a sale.' },
  { icon: AlertTriangle, title: 'Low stock alerts', text: 'Know before cement, fly ash or any material runs out.' },
];

const REASONS = [
  { icon: Layers, title: 'Made only for bhattas', text: 'Not a general accounting tool. Brick types, raw materials, trips and parties work the way a bhatta does.' },
  { icon: Clock, title: 'Saves hours every week', text: 'No more adding up registers. Stock, dues and profit are worked out for you.' },
  { icon: Smartphone, title: 'Runs on your mobile', text: 'Open it in the browser on any phone, tablet or computer. Nothing to install.' },
  { icon: Calculator, title: 'Fewer mistakes', text: 'Totals, balances and stock are calculated automatically, so there are no adding errors.' },
  { icon: ShieldCheck, title: 'Your data stays safe', text: 'Password-protected login, and each business sees only its own records.' },
  { icon: Building2, title: 'Grows with you', text: 'Start with one bhatta and manage more from the same login when you expand.' },
];

const AUDIENCE = [
  { icon: Building2, title: 'Bhatta owners', text: 'See production, stock, dues and profit from your phone, even when you are not at the site.' },
  { icon: Layers, title: 'Multi-bhatta businesses', text: 'Run several bhattas from one login and see each one separately.' },
  { icon: UserCog, title: 'Managers & site clerks', text: 'Simple screens for daily entries, so the site team can keep records up to date.' },
  { icon: BookOpen, title: 'Accountants', text: 'Ledgers, expenses and profit & loss reports ready when they are needed.' },
];

const KEY_POINTS = [
  'Record daily brick production easily',
  'Always know your stock of raw materials like cement and fly ash',
  'Create bills with transport and trip charges included',
  "See every customer's and supplier's dues at a glance",
  "Check your kiln's accounts from anywhere on your mobile",
];

const FAQS = [
  {
    q: 'What is bhatta software?',
    a: `Bhatta software is management software for brick kilns, which are known as bhattas in India. It replaces paper registers by keeping production, raw material stock, sales, labour, dues and accounts in one place. ${site.name} is bhatta software built specially for brick businesses.`,
  },
  {
    q: 'Which is the best bhatta software for my business?',
    a: `The best bhatta software is one that is made for brick kilns, is easy for your team to use and keeps your stock and dues accurate. ${site.name} is built only for bhattas, works on mobile and covers production, stock, billing, ledgers, expenses and reports.`,
  },
  {
    q: 'How does bhatta software make my work easy?',
    a: 'You enter each day\'s work once (production, sales, purchases and payments) and the software updates brick stock, raw material stock, party balances and profit for you. No more adding up registers by hand.',
  },
  {
    q: 'How can I manage my bhatta work with this software?',
    a: 'Set up your bhatta, brick types and parties once. Then record daily production, purchases, sales and payments. Use the dashboard, stock ledgers and profit & loss report to see how the bhatta is doing at any time.',
  },
  {
    q: 'Can I manage more than one bhatta?',
    a: 'Yes. With the multi brick kiln plan you can manage several bhattas from one login, with production, stock, sales, purchases and expenses kept separately for each.',
  },
  {
    q: 'Can I use bhatta software on my mobile phone?',
    a: `Yes. ${site.name} works in the browser on mobile phones, tablets and computers, so there is nothing to install.`,
  },
  {
    q: 'What is the price of bhatta software?',
    a: `${site.name} costs ₹7,999 per year for one bhatta and ₹9,999 per year for multiple bhattas.`,
  },
  {
    q: 'Is my bhatta data safe?',
    a: 'Every account is protected by a password, and each business can see only its own records.',
  },
  {
    q: 'How do I start using the bhatta software?',
    a: `Call us on ${site.phone} or message us on WhatsApp. We will show you the software and help you get started.`,
  },
];

// Search engines read this to show the FAQs and plan prices in results.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: `${site.name} - Bhatta Software`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      offers: PLANS.map(p => ({ '@type': 'Offer', name: p.name, price: p.priceValue, priceCurrency: 'INR' })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

// Hero artwork: today's work at the bhatta, all ticked off.
function TodayCard() {
  const tasks = [
    { icon: Hammer, label: 'Production entered', detail: '12,500 bricks' },
    { icon: FileText, label: 'Sale invoice made', detail: '4,000 bricks · 2 trips' },
    { icon: Boxes, label: 'Cement stock updated', detail: '50 bags received' },
    { icon: HandCoins, label: 'Payment received', detail: 'Party ledger updated' },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-200/70 via-amber-100/50 to-primary-200/60 blur-2xl" />
      <BrickStack className="absolute -top-[46px] right-6 w-24 drop-shadow-lg sm:-top-[58px] sm:right-10 sm:w-[7.5rem]" />

      <div className="relative rounded-2xl bg-white p-6 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Your bhatta today</p>
            <p className="font-bold text-slate-900">All work recorded</p>
          </div>
          <span className="badge-gray">Sample view</span>
        </div>
        <ul className="mt-5 space-y-3">
          {tasks.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700"><Icon size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                <span className="block truncate text-xs text-slate-500">{detail}</span>
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={14} strokeWidth={3} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 sm:-left-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><Clock size={16} /></span>
        <span className="text-xs">
          <span className="block font-semibold text-slate-900">No registers to add up</span>
          <span className="block text-slate-500">Stock & dues worked out for you</span>
        </span>
      </div>
    </div>
  );
}

function IconCard({ icon: Icon, title, text, tone = 'orange' }) {
  const iconCls = tone === 'orange'
    ? 'bg-gradient-to-br from-orange-100 to-amber-50 text-orange-700 ring-1 ring-orange-200/60 group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white'
    : 'bg-primary-50 text-primary-700';
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${iconCls}`}><Icon size={22} /></span>
      <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

export default function BhattaSoftwarePage() {
  usePageMeta(TITLE, DESCRIPTION);
  const goToSection = useGoToSection();

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-28">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Bhatta Software</span>
            </nav>

            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                  <Sparkles size={14} /> Best bhatta software for brick businesses
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.2rem]">
                  Bhatta Software That Makes{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Your Work Easy</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} is bhatta software built for brick kiln owners. Manage production, raw material, sales,
                  labour, dues and accounts of your bhatta from one simple app, on your mobile or computer.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#how-it-works" onClick={jumpTo('how-it-works')} className="btn-primary px-7 py-3.5 text-base">
                    See How It Works <ArrowRight size={18} />
                  </a>
                  <a href="/#contact" onClick={goToSection('contact')} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </a>
                </div>
                <ul className="mt-8 flex flex-col items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 sm:flex-row sm:justify-center lg:justify-start">
                  {['Made for bhattas', 'Works on mobile', 'From ₹7,999/year'].map(t => (
                    <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600" /> {t}</li>
                  ))}
                </ul>
              </div>
              <TodayCard />
            </div>
          </div>
        </section>

        {/* What is bhatta software */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">About bhatta software</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">What Is Bhatta Software?</h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Bhatta software is a digital register for your brick kiln, or bhatta. Instead of writing production,
                stock, sales and payments in different notebooks, you record them once in the software, and it keeps
                everything connected and up to date.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                {site.name} is bhatta software made only for brick businesses. When you record a sale, brick stock
                goes down and the customer&apos;s ledger is updated. When you buy cement or fly ash, raw material stock
                goes up. That is how it saves time and stops mistakes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Hammer, label: 'Production' },
                { icon: Boxes, label: 'Stock' },
                { icon: FileText, label: 'Billing' },
                { icon: Users, label: 'Ledgers' },
                { icon: Landmark, label: 'Accounts' },
                { icon: BarChart3, label: 'Reports' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><Icon size={20} /></span>
                  <span className="font-semibold text-slate-800">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Make work easy"
              title="From Registers to Bhatta Software"
              text="Common problems every bhatta owner faces, and how the right bhatta software solves them."
            />
            <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden grid-cols-2 border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-wider md:grid">
                <p className="px-6 py-4 text-rose-700">Without bhatta software</p>
                <p className="border-l border-slate-200 px-6 py-4 text-emerald-700">With {site.name}</p>
              </div>
              {PROBLEMS.map(({ before, after }) => (
                <div key={before} className="grid border-b border-slate-100 last:border-b-0 md:grid-cols-2">
                  <p className="flex items-start gap-3 px-6 py-5 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600"><X size={12} strokeWidth={3} /></span>
                    {before}
                  </p>
                  <p className="flex items-start gap-3 bg-emerald-50/40 px-6 py-5 text-sm font-medium text-slate-800 md:border-l md:border-slate-100">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={12} strokeWidth={3} /></span>
                    {after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to manage work */}
        <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="How it works"
              title="How to Manage Your Bhatta Work with Bhatta Software"
              text="A simple daily routine that keeps your whole bhatta organised."
            />
            <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                  <span className="absolute right-5 top-4 text-4xl font-extrabold text-slate-100">{String(i + 1).padStart(2, '0')}</span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white shadow-md shadow-primary-700/20"><Icon size={22} /></span>
                  <p className="relative mt-5 text-xs font-bold uppercase tracking-wider text-primary-700">Step {i + 1}</p>
                  <h3 className="relative font-bold text-slate-900">{title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Features"
              title="Features of Our Bhatta Software"
              text="Everything you need to run a brick bhatta, in one place."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(f => <IconCard key={f.title} {...f} />)}
            </div>
          </div>
        </section>

        {/* Why best */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={`Why ${site.name}`}
              title="Why We Are the Best Bhatta Software for Your Business"
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REASONS.map(r => <IconCard key={r.title} {...r} tone="blue" />)}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Who it's for" title="Bhatta Software for Everyone at Your Kiln" />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><Icon size={26} /></span>
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Make work easier */}
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white p-8 sm:p-12">
            <BrickPattern className="fill-orange-900/[0.03]" />
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold text-orange-700">Brick kiln software</p>
                <h2 className="mt-2 text-3xl font-bold leading-snug text-slate-900">Make Your Work Easier with Bhatta Software</h2>
                <p className="mt-4 leading-relaxed text-slate-700">
                  {site.name} is bhatta software built for brick kiln owners. Instead of keeping registers, maintain a
                  complete record of production, stock, sales, labour, dues and expenses in one place.
                </p>
              </div>
              <ul className="space-y-3">
                {KEY_POINTS.map(p => (
                  <li key={p} className="flex items-start gap-3 rounded-xl bg-white/80 p-3.5 text-slate-800 shadow-sm ring-1 ring-orange-100">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Pricing"
              title="Bhatta Software Price"
              text="Simple yearly plans, with the full set of features in both."
            />
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              {PLANS.map(p => (
                <div key={p.name} className={`rounded-2xl p-6 ${p.featured ? 'bg-gradient-to-b from-white to-orange-50/70 ring-2 ring-orange-500' : 'bg-white ring-1 ring-slate-200'} shadow-lg shadow-slate-200/50`}>
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple bhattas' : 'One bhatta'}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{p.name}</h3>
                  <p className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">₹{p.price}</span>
                    <span className="mb-1 text-sm font-semibold text-slate-500">/year</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to={PRICE_PAGE} className="inline-flex items-center gap-2 font-semibold text-primary-700 transition hover:text-primary-900 hover:underline">
                Compare plans and features <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Bhatta Software: Frequently Asked Questions" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-slate-50/50 transition open:bg-white open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown size={20} className="shrink-0 text-orange-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#27374f] to-[#7c2d12] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Make your bhatta work easy, starting today</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Talk to us and see how {site.name} can manage your brick bhatta for you.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="/#contact" onClick={goToSection('contact')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  <MessageCircle size={18} /> Contact Us
                </a>
                <a href={whatsappLink(`Hi, I want to know more about ${site.name} bhatta software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
