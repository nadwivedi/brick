import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeIndianRupee, BarChart3, Boxes, Building2, Check, CheckCircle2, ChevronDown, ChevronRight,
  Eye, Factory, FileSpreadsheet, FileText, Hammer, Info, Lightbulb, Package, ReceiptIndianRupee,
  Settings, ShoppingCart, Sparkles, Store, Timer, TrendingUp, Truck, Users, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import { BHATTA_PAGE, CONTACT_PAGE, MANUFACTURING_PAGE, PRICE_PAGE, scrollToSection } from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Bricks Manufacturing Software for Brick Businesses | ${site.name}`;
const DESCRIPTION = `Bricks manufacturing software by ${site.name}: record production, track raw material and brick stock, make GST invoices and review reports in one place.`;

const CHALLENGES = [
  { title: 'Records scattered everywhere', text: 'Production in one notebook, purchases in another, sales on loose bills and payments in someone\'s memory. Finding one number means searching through all of them.' },
  { title: 'Stock that never adds up', text: 'When raw material and finished bricks are counted by hand, the register and the yard rarely agree. You find out about a shortage only when work stops or an order can\'t be filled.' },
  { title: 'Sales that are hard to follow', text: 'Without one place for invoices and receipts, it is easy to lose track of which customer has paid, who paid only part, and how much is still outstanding.' },
  { title: 'Expenses that slip through', text: 'Small daily costs like diesel, repairs and wages are easy to forget. Missed entries make the business look more profitable on paper than it really is.' },
  { title: 'No clear view of performance', text: 'Answering simple questions like "How much did we produce this month?" or "Did we make a profit last year?" takes hours of adding up instead of a few seconds.' },
];

// What the software actually does in each area, kept apart from the general benefit.
const AREAS = [
  {
    icon: Hammer,
    eyebrow: 'Brick production management software',
    title: 'Production & manufacturing records',
    features: [
      'Daily production entries by plant and brick type',
      'Raw materials used and damaged bricks recorded with each entry',
      'Cement check: bricks per bag compared with your 30-day, 1-year and lifetime averages',
      'Production trend on the dashboard',
    ],
    benefit: 'You can see exactly what was made, when and at what material cost, and spot a batch that used more cement than usual.',
  },
  {
    icon: Boxes,
    eyebrow: 'Brick inventory management software',
    title: 'Raw material & finished-brick inventory',
    features: [
      'Separate stock for every raw material and every brick type',
      'Opening stock and manual stock adjustments',
      'Your own units for each material',
      'Low stock alerts for raw materials',
    ],
    benefit: 'Purchasing becomes planned instead of last-minute, because you know what is running low before it runs out.',
  },
  {
    icon: Package,
    eyebrow: 'Stock availability & movement',
    title: 'Stock movement you can trace',
    features: [
      'Stock goes up with purchases and production, and down with sales and material use, automatically',
      'Stock ledger for each raw material',
      'Brick ledger for each brick type, plant by plant',
    ],
    benefit: 'When the count looks wrong, the ledger shows every entry that changed it, so differences can be found and fixed.',
  },
  {
    icon: FileText,
    eyebrow: 'Brick sales and stock management software',
    title: 'Sales, orders & customer records',
    features: [
      'Sale invoices with GST, vehicle, and transport or trip charges',
      'Invoice status: issued, partly paid, paid or cancelled',
      'Customer and vendor records with their full ledger',
      'Money received recorded against each party',
    ],
    note: 'Orders are recorded as sale invoices. There is no separate advance order-booking screen.',
    benefit: 'Every customer\'s balance stays current, so following up on payments takes a glance instead of a search.',
  },
  {
    icon: Wallet,
    eyebrow: 'Expenses & payments',
    title: 'Business expenses & payment records',
    features: [
      'Expenses by category, linked to a plant where needed',
      'Purchases and payments to vendors',
      'Cash and bank accounts with live balances and transfers between them',
    ],
    benefit: 'Every rupee that goes out has a record, which keeps your profit figures honest.',
  },
  {
    icon: BarChart3,
    eyebrow: 'Reports & performance',
    title: 'Reports & business performance',
    features: [
      'Overview of production, sales, expenses and outstanding amounts',
      'Profit & loss report',
      'Party ledger report',
      'Date presets including today, this month and this financial year',
    ],
    benefit: 'Monthly and yearly reviews take minutes, and decisions rest on figures instead of guesses.',
  },
];

const BENEFITS = [
  { icon: FileSpreadsheet, title: 'Less manual paperwork', text: 'Each activity is entered once, and the related stock, ledger and account balances follow from it. There is no copying figures from one register into another.' },
  { icon: Eye, title: 'Better visibility', text: 'The owner, the manager and the accountant see the same up-to-date numbers, wherever they are.' },
  { icon: Timer, title: 'Time saved every day', text: 'Totals, balances and stock are calculated for you, so the time spent adding up columns goes back into running the business.' },
  { icon: Lightbulb, title: 'Better business decisions', text: 'With reliable records of production, costs and sales, it becomes easier to decide what to buy, what to charge and where to cut costs.' },
];

const WORKFLOW = [
  { icon: Settings, title: 'Set up your business', text: 'Add your plants, brick types, raw materials, units, customers, vendors, labour and vehicles.' },
  { icon: Hammer, title: 'Record daily activity', text: 'Enter production, purchases, sales, expenses and payments from the dashboard as they happen.' },
  { icon: Package, title: 'Stock & ledgers update', text: 'Inventory, customer balances and cash or bank balances update on their own with each entry.' },
  { icon: TrendingUp, title: 'Review and decide', text: 'Open the reports for any date range to review production, sales, expenses and profit.' },
];

const AUDIENCE = [
  { icon: Factory, title: 'Brick manufacturers', text: 'Businesses that produce bricks and want production, stock and sales records in one system.' },
  { icon: Building2, title: 'Brick factories', text: 'Brick factory management software for sites with regular production and a steady flow of purchases and sales.' },
  { icon: Hammer, title: 'Brick production businesses', text: 'Units of any size that need a dependable record of what they produce and what it costs.' },
  { icon: Store, title: 'Owners going digital', text: 'Owners who want to move from paper registers to organised digital records without a complicated system.' },
];

const REASONS = [
  { title: 'Focused on brick businesses', text: 'Plants, brick types, raw materials, cement use, vehicles and trip charges are part of the software, not add-ons you have to set up yourself.' },
  { title: 'The core of an ERP, without the complexity', text: 'Owners searching for brick manufacturing ERP software usually need production, inventory, sales, purchases and accounts working together. Brick Manager covers those areas in one place.' },
  { title: 'Made for brick manufacturing in India', text: 'Amounts in rupees, GST on invoices, mobile-number login and reports that follow the financial year.' },
  { title: 'Grows from one plant to several', text: 'Start with a single plant and add more later. Production, stock and sales can then be viewed plant by plant.' },
  { title: 'Clear yearly pricing', text: `${PLANS.map(p => `₹${p.price}/year`).join(' or ')}, depending on whether you run one plant or several.` },
  { title: 'Works on the devices you already have', text: 'It runs in the browser on phones, tablets and computers, with nothing to install.' },
];

const FAQS = [
  {
    q: 'What is bricks manufacturing software?',
    a: 'Bricks manufacturing software is a business tool that keeps a brick manufacturer\'s production, raw material and brick stock, sales, purchases, expenses and payments in one connected system, so records stay accurate and reports are ready when needed.',
  },
  {
    q: 'How does brick manufacturing software help manage daily operations?',
    a: `You record each day's production, purchases, sales, expenses and payments once. ${site.name} then updates stock, customer and vendor balances and account balances automatically, so there is no repeated entry or manual totalling.`,
  },
  {
    q: 'Can brick manufacturing software help track production and stock?',
    a: `Yes. In ${site.name}, every production entry adds finished bricks to stock and records the raw materials used. Purchases add raw material, sales reduce brick stock, and stock and brick ledgers show every movement.`,
  },
  {
    q: 'How can brick manufacturers manage sales and expenses digitally?',
    a: 'Sales are recorded as invoices with GST and transport charges, and payments received are recorded against the customer. Expenses are entered by category and paid from a cash or bank account. Profit & loss and ledger reports bring these together.',
  },
  {
    q: 'Is bricks manufacturing software suitable for small businesses?',
    a: `Yes. ${site.name} works for a single plant as well as for businesses with several plants. It runs in a web browser, so a small business does not need its own server or special hardware.`,
  },
  {
    q: 'Does Brick Manager handle advance orders?',
    a: 'Sales are recorded as invoices when bricks are sold. There is no separate screen for booking advance orders.',
  },
  {
    q: `How can I get started with ${site.name}?`,
    a: `Call ${site.phone} or message us on WhatsApp. We can show you the software, help you choose a plan and get your business set up.`,
  },
];

// Matches the FAQs shown on the page word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const FLOW = [
  { icon: ShoppingCart, label: 'Raw material purchased', detail: 'Material stock goes up' },
  { icon: Hammer, label: 'Bricks produced', detail: 'Materials used, brick stock goes up' },
  { icon: Truck, label: 'Sale invoiced', detail: 'Brick stock down, customer ledger updated' },
  { icon: ReceiptIndianRupee, label: 'Payment received', detail: 'Cash or bank balance updated' },
  { icon: BarChart3, label: 'Reports ready', detail: 'Production, sales, expenses, profit' },
];

// Hero diagram: one activity flowing into the next.
function FlowDiagram() {
  return (
    <figure
      role="img"
      aria-label="Diagram showing how Brick Manager connects raw material purchases, brick production, sales, payments and reports"
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-amber-100/70 via-orange-100/50 to-primary-100/70 blur-2xl" />
      <div className="relative rounded-3xl bg-white/90 p-6 shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">One entry, everything updated</p>
        <ol className="mt-5">
          {FLOW.map(({ icon: Icon, label, detail }, i) => (
            <li key={label} className="relative flex gap-4 pb-5 last:pb-0">
              {i < FLOW.length - 1 && <span className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px border-l-2 border-dashed border-orange-200" aria-hidden="true" />}
              <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${i === FLOW.length - 1 ? 'bg-primary-700 text-white' : 'bg-orange-100 text-orange-700'}`}>
                <Icon size={19} />
              </span>
              <span className="pt-0.5">
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                <span className="block text-xs text-slate-500">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

function AreaRow({ area, index }) {
  const { icon: Icon, eyebrow, title, features, note, benefit } = area;
  const flip = index % 2 === 1;
  return (
    <article className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-5 lg:gap-10">
      <div className={`lg:col-span-2 ${flip ? 'lg:order-2' : ''}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
          <Icon size={22} />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-orange-700">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">{title}</h3>
        <div className="mt-4 flex gap-3 rounded-xl bg-primary-50/70 p-4 text-sm text-slate-700">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary-700" />
          <p><span className="font-semibold text-primary-800">Why it helps: </span>{benefit}</p>
        </div>
      </div>
      <div className={`lg:col-span-3 ${flip ? 'lg:order-1' : ''}`}>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 size={14} /> Available in {site.name}
        </p>
        <ul className="mt-4 space-y-3">
          {features.map(f => (
            <li key={f} className="flex items-start gap-3 text-[15px] text-slate-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={12} strokeWidth={3} /></span>
              {f}
            </li>
          ))}
        </ul>
        {note && (
          <p className="mt-5 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-500" /> {note}
          </p>
        )}
      </div>
    </article>
  );
}

export default function BricksManufacturingPage() {
  usePageMeta(TITLE, DESCRIPTION, MANUFACTURING_PAGE);

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const exploreFeatures = (e) => {
    e.preventDefault();
    scrollToSection('features');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/50 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Bricks Manufacturing Software</span>
            </nav>

            <div className="mt-10 grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm">
                  <Sparkles size={14} /> Brick manufacturing software in India
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Bricks Manufacturing Software to{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Simplify Your Business</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} gives brick manufacturers one organised place for daily operations. Record production,
                  keep raw material and finished-brick stock accurate, follow every sale and payment, and keep expenses
                  and reports together instead of across registers and loose bills.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#features" onClick={exploreFeatures} className="btn-primary px-7 py-3.5 text-base">
                    Explore Features <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <FlowDiagram />
            </div>
          </div>
        </section>

        {/* Why important */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">The challenge</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Why Bricks Manufacturing Software Is Important</h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                A brick manufacturing business handles raw material, production, stock, customers, vendors and money
                every single day. When all of it is managed by hand, small gaps add up into lost stock, missed payments
                and unclear profit. These are the problems manufacturers run into most often.
              </p>
            </div>
            <ol className="space-y-4">
              {CHALLENGES.map(({ title, text }, i) => (
                <li key={title} className="flex gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-orange-200 text-sm font-bold text-orange-700">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features by area */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Features"
              title="Manage Your Brick Manufacturing Operations"
              text={`Each area below lists what you can do in ${site.name} today, along with how it helps your business.`}
            />
            <div className="mt-14 space-y-6">
              {AREAS.map((a, i) => <AreaRow key={a.title} area={a} index={i} />)}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-amber-50/60 p-8 ring-1 ring-slate-200 sm:p-12">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Benefits</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Benefits for Brick Manufacturers</h2>
                <p className="mt-4 text-slate-600">
                  Good brick manufacturing business software is not just about storing data. Organised digital records
                  change how a business is run day to day.
                </p>
              </div>
              <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
                {BENEFITS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-700 shadow-sm ring-1 ring-slate-200">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Workflow"
              title={`How ${site.name} Works`}
              text="A practical routine that keeps production, inventory, sales and accounts in step."
            />
            <ol className="mt-14 grid gap-8 md:grid-cols-4 md:gap-4">
              {WORKFLOW.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative text-center">
                  {i < WORKFLOW.length - 1 && (
                    <span className="absolute left-[calc(50%+2.25rem)] top-7 hidden h-0.5 w-[calc(100%-4.5rem)] bg-gradient-to-r from-orange-300 to-orange-100 md:block" aria-hidden="true" />
                  )}
                  <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-orange-700 shadow-md ring-4 ring-orange-100">
                    <Icon size={24} />
                  </span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-orange-700">Step {i + 1}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Who can use */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Who it's for"
              title="Who Can Use This Software?"
              text="If your business makes and sells bricks, and you want your operations organised digitally, it is built for you."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-gradient-to-b from-amber-50/50 to-white p-6">
                  <Icon size={28} className="text-orange-700" />
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose + related links */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Why {site.name}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Why Choose {site.name}?</h2>
              <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                {REASONS.map(({ title, text }) => (
                  <div key={title} className="border-l-2 border-orange-300 pl-4">
                    <dt className="font-bold text-slate-900">{title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-600">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <aside className="self-start rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7">
              <h3 className="flex items-center gap-2 font-bold text-slate-900"><BadgeIndianRupee size={20} className="text-orange-700" /> Plans & next steps</h3>
              <ul className="mt-5 space-y-2">
                {PLANS.map(p => (
                  <li key={p.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-700">{p.featured ? 'Several plants' : 'One plant'}</span>
                    <span className="font-bold text-slate-900">₹{p.price}/yr</span>
                  </li>
                ))}
              </ul>
              <nav aria-label="Related pages" className="mt-6 space-y-1 border-t border-slate-200 pt-5 text-sm">
                {[
                  { to: PRICE_PAGE, label: 'Compare plans and pricing' },
                  { to: BHATTA_PAGE, label: 'Bhatta software for brick kilns' },
                  { to: '/', label: `${site.name} home` },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="group flex items-center justify-between rounded-lg px-2 py-2 font-semibold text-primary-700 transition hover:bg-primary-50">
                    {l.label} <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
                <Link to={CONTACT_PAGE} className="group flex items-center justify-between rounded-lg px-2 py-2 font-semibold text-primary-700 transition hover:bg-primary-50">
                  Contact Us <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                </Link>
              </nav>
            </aside>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Bricks Manufacturing Software FAQs" />
            <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
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
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-6 py-14 text-center ring-1 ring-orange-200 sm:px-12">
            <BrickPattern className="fill-orange-900/[0.04]" />
            <div className="relative">
              <Users size={36} className="mx-auto text-orange-700" />
              <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Bring your brick business into one place</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600">
                Tell us how your manufacturing runs today, and we will show you how {site.name} can organise it.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="btn-primary px-7 py-3.5 text-base">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} bricks manufacturing software.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary px-7 py-3.5 text-base">
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
