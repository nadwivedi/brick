import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, BookOpen, Building2, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleCheck, Clock, Factory, Gauge, Hammer, HardHat, Layers, LineChart, NotebookPen, Package,
  Search, ShieldAlert, Sparkles, TriangleAlert, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  CONTACT_PAGE, INVENTORY_PAGE, MANUFACTURING_PAGE, PLANT_PAGE, PRICE_PAGE, PRODUCTION_PAGE, scrollToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Production Management Software | ${site.name}`;
const DESCRIPTION = `Brick kiln production management software by ${site.name}. Record daily production by shift, track damaged bricks, check cement use and see output trends.`;

// The parts of a production entry, as they appear in the software.
const ENTRY_FIELDS = [
  { icon: CalendarDays, title: 'Date and shift', text: 'Record when the bricks were made: morning, evening, night or a full day.' },
  { icon: Building2, title: 'Plant', text: 'If you run more than one kiln, choose which one the batch belongs to.' },
  { icon: Layers, title: 'Brick type', text: 'Pick the brick type. Its current stock is shown right beside it.' },
  { icon: Hammer, title: 'Count by plates or bricks', text: 'Enter the number of plates and bricks per plate and the total is worked out, or type the brick count directly.' },
  { icon: TriangleAlert, title: 'Damaged or broken', text: 'Record bricks lost in the batch. Only good bricks are added to stock.' },
  { icon: Package, title: 'Raw materials used', text: 'Add cement and other materials used. You see how much is left and get a warning if you enter more than you have.' },
  { icon: NotebookPen, title: 'Notes', text: 'Write anything worth remembering about the batch.' },
];

const CEMENT_STATES = [
  { tone: 'emerald', label: 'Normal', text: 'Within 10% of your usual bricks per bag.', icon: CircleCheck },
  { tone: 'rose', label: 'More cement', text: 'More than 10% extra cement used. A sign of possible leakage or theft.', icon: ShieldAlert },
  { tone: 'amber', label: 'Less cement', text: 'More than 10% less cement used. A sign of a possible brick quality issue.', icon: AlertTriangle },
];

const TONES = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
};

const NUMBERS = [
  { icon: Hammer, label: 'Today', text: 'Bricks produced today and the number of entries.' },
  { icon: CalendarDays, label: 'This month', text: 'The month\'s production so far.' },
  { icon: CircleCheck, label: 'Good bricks', text: 'All bricks produced, minus the damaged ones.' },
  { icon: TriangleAlert, label: 'Damaged', text: 'Total broken bricks and their share of all production.' },
];

const REVIEW_TOOLS = [
  { icon: LineChart, title: 'Production trend', text: 'The dashboard charts production over the period you choose, from today to the whole year.' },
  { icon: BookOpen, title: 'Brick ledger', text: 'For each brick type, every production and sale with the stock after each, plant by plant.' },
  { icon: BarChart3, title: 'Production report', text: 'Total production for any date range in the reports, alongside sales and expenses.' },
  { icon: Search, title: 'Search past entries', text: 'Find old production entries by brick type or plant in seconds.' },
];

const WHY = [
  { title: 'Wastage becomes visible', text: 'When damaged bricks are counted with every batch, you can see how much production is being lost and act on it.' },
  { title: 'Cement is accounted for', text: 'Cement is often a kiln\'s biggest raw material cost. Checking bricks per bag on every batch makes unusual use stand out.' },
  { title: 'Stock you can sell against', text: 'Good bricks go straight into stock, so sales are planned on what is really available.' },
  { title: 'A record that lasts', text: 'Production history stays searchable for years, instead of fading in old registers.' },
];

const FAQS = [
  {
    q: 'What is brick kiln production management software?',
    a: 'Brick kiln production management software records how many bricks a kiln makes each day, of which type, in which shift, with how many damaged and how much raw material used. It turns those entries into stock, trends and reports.',
  },
  {
    q: 'Can I record production by plates?',
    a: `Yes. In ${site.name} you can enter the number of plates and bricks per plate, and the total brick count is calculated for you. You can also enter the brick count directly.`,
  },
  {
    q: 'How are damaged bricks handled?',
    a: 'You enter damaged or broken bricks with each production entry. Only good bricks are added to stock, and the production screen shows the total damaged and its share of all production.',
  },
  {
    q: 'How does the cement check work?',
    a: 'For each batch, the software works out bricks made per bag of cement and compares it with your average. If a batch uses more than 10% more or less cement than usual, it is flagged so you can look into it.',
  },
  {
    q: 'Does the software record labour with each production entry?',
    a: 'No. Workers are kept in a labour list with their pay type and rate (per 1,000 bricks, daily wage or monthly), and labour payments are recorded as expenses under the built-in Labour category.',
  },
  {
    q: 'Can I track production for more than one kiln?',
    a: 'Yes. Each entry belongs to a plant, so production and brick stock can be viewed for one kiln or for all of them together.',
  },
  {
    q: 'How much does brick kiln production management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with production management included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: a filled-in production entry and its result.
function EntryCard() {
  const rows = [
    ['Date', '24 Oct · Morning shift'],
    ['Brick type', 'Red brick 9"'],
    ['Plates', '120 × 105 per plate'],
    ['Damaged', '150 pcs'],
    ['Cement used', '60 bags'],
  ];
  return (
    <figure
      role="img"
      aria-label="Sample production entry in Brick Manager: 120 plates of 105 bricks, 150 damaged, 60 bags of cement, adding 12,450 good bricks to stock"
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-200/70 via-amber-100/60 to-rose-100/60 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-700 to-orange-500 px-5 py-3 text-white">
          <p className="flex items-center gap-2 font-bold"><Hammer size={18} /> New Production</p>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">Sample</span>
        </div>
        <dl className="divide-y divide-slate-100 px-5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mx-5 mb-5 mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <span className="text-sm font-medium text-emerald-800">Good bricks added to stock</span>
            <span className="text-lg font-extrabold text-emerald-700">12,450</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs ring-1 ring-slate-200">
            <span className="flex items-center gap-1.5 text-slate-600"><Gauge size={14} /> 210 bricks per bag</span>
            <span className="badge-green">Normal</span>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function BrickKilnProductionPage() {
  usePageMeta(TITLE, DESCRIPTION, PRODUCTION_PAGE);

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
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Production Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                  <Factory size={14} /> Brick production tracking software
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Production Management Software for{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Every Batch</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Know exactly what your kiln produces. {site.name} records each batch by shift and brick type, counts
                  damaged bricks, tracks the cement and materials used, and adds only good bricks to your stock.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#production-entry" onClick={jumpTo('production-entry')} className="btn-primary px-7 py-3.5 text-base">
                    See How It Works <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <EntryCard />
            </div>
          </div>
        </section>

        {/* Why production management matters */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Why it matters"
              title="Why Your Kiln Needs Production Management Software"
              text="Production is where a brick kiln makes or loses money. Small gaps in counting add up over a season."
            />
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {WHY.map(({ title, text }, i) => (
                <div key={title} className="flex gap-5 rounded-2xl bg-gradient-to-br from-orange-50/70 to-white p-6 ring-1 ring-orange-100">
                  <span className="text-4xl font-extrabold leading-none text-orange-200">0{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Anatomy of an entry */}
        <section id="production-entry" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Daily production"
              title="What You Record in Every Production Entry"
              text="One short form per batch captures everything you need to know about it."
            />
            <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ENTRY_FIELDS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 ${i === ENTRY_FIELDS.length - 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><Icon size={20} /></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Field {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cement check spotlight */}
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-orange-50/70 p-8 ring-1 ring-slate-200 sm:p-12">
            <BrickPattern className="fill-orange-900/[0.03]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-orange-700"><Gauge size={16} /> Cement check</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Catch Unusual Cement Use on Every Batch</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  For each production entry, {site.name} works out how many bricks were made per bag of cement and
                  compares it with your own average from the last year, or from all time for a newer business. The production screen also shows your 30-day,
                  1-year and lifetime averages, so you can see the trend at a glance.
                </p>
              </div>
              <ul className="space-y-3">
                {CEMENT_STATES.map(({ tone, label, text, icon: Icon }) => (
                  <li key={label} className={`flex items-start gap-4 rounded-2xl border p-5 ${TONES[tone]}`}>
                    <Icon size={22} className="mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-bold">{label}</h3>
                      <p className="mt-0.5 text-sm text-slate-700">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Numbers + review tools */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Production reports"
              title="Your Production Numbers, Always Ready"
              text="The production screen keeps four numbers in front of you, and more detail is a click away."
            />
            <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {NUMBERS.map(({ icon: Icon, label, text }) => (
                <div key={label} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-700"><Icon size={22} /></span>
                  <h3 className="mt-3 font-bold text-slate-900">{label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {REVIEW_TOOLS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white"><Icon size={20} /></span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Labour + multi-kiln */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-7 ring-1 ring-slate-200 sm:p-9">
              <HardHat size={30} className="text-orange-700" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Labour at Your Kiln</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Keep every worker on record with their pay type and rate: per 1,000 bricks, daily wage or monthly.
                Labour payments are recorded as expenses under the built-in Labour category, so they count in your
                profit & loss.
              </p>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
                <Wallet size={15} className="mt-0.5 shrink-0" /> Labour is not attached to individual production entries.
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50/60 p-7 ring-1 ring-orange-200 sm:p-9">
              <Building2 size={30} className="text-orange-700" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Production Across Several Kilns</h2>
              <ul className="mt-4 space-y-2.5">
                {['Every entry belongs to a plant', 'Brick stock kept separately for each kiln', 'Dashboard production for one kiln or all', 'Brick ledgers plant by plant'].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Clock size={32} className="mx-auto text-orange-700" />
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Production Management Included in Every Plan</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">There is no extra charge for production features.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple kilns' : 'One kiln'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <nav aria-label="Related pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: INVENTORY_PAGE, label: 'Brick kiln inventory management' },
                { to: PLANT_PAGE, label: 'Brick plant management software' },
                { to: MANUFACTURING_PAGE, label: 'Bricks manufacturing software' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-slate-200 transition hover:bg-primary-50">
                  {l.label} <ChevronRight size={14} />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Production Management FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-orange-100 bg-orange-50/30 transition open:bg-white open:shadow-md">
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
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#3b2a20] to-[#9a3412] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <Sparkles size={34} className="mx-auto text-amber-300" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Start tracking every batch from your kiln</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">See how {site.name} records production, damaged bricks and cement use.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln production management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
