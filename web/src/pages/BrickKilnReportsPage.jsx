import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, CalendarRange, ChevronDown, ChevronRight, Coins,
  FileBarChart, Hammer, HandCoins, LayoutDashboard, LineChart, PieChart, Scale, TrendingUp, Users, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BILLING_PAGE, CONTACT_PAGE, COST_GUIDE_PAGE, EXPENSE_PAGE, PAYMENT_PAGE, PRICE_PAGE, REPORTS_PAGE, scrollToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Report Management Software | ${site.name}`;
const DESCRIPTION = `Brick kiln report management software by ${site.name}. See production, sales, collections, expenses, profit & loss and party ledgers for any period.`;

// The reports in the Reports section, with the question each one answers.
const REPORTS = [
  { icon: BarChart3, title: 'Daily production trend', question: 'How many bricks did we make each day?', text: 'A chart of bricks produced per day, with totals for the period.' },
  { icon: TrendingUp, title: 'Sales trend', question: 'How did sales move this month?', text: 'The invoiced amount over the selected period.' },
  { icon: HandCoins, title: 'Sales vs collections', question: 'How much of what we billed has come in?', text: 'Compares the amount invoiced with the money actually collected.' },
  { icon: Wallet, title: 'Expense summary', question: 'Where is our money going?', text: 'Spending for the period, broken down by expense category.' },
  { icon: Users, title: 'Customer outstanding', question: 'Who still owes us?', text: 'The customers with money due and how much each owes.' },
  { icon: Scale, title: 'Profit & loss', question: 'Did we make a profit, and what does a brick cost us?', text: 'Income against expenses, net profit or loss, and cost per brick.' },
  { icon: BookOpen, title: 'Party ledger report', question: 'What does each party owe or are we owed?', text: 'To receive, to pay, sold and bought in the period for every party.' },
];

const PRESETS = ['Today', 'This Week', 'This Month', 'Last Month', 'This Financial Year'];

const PL_INCOME = [['Brick sales, by brick type', '₹9,84,000'], ['Transport charged', '₹62,000'], ['Discount given', '−₹8,500']];
const PL_EXPENSE = [['Raw material bought', '₹4,96,000'], ['Transport on purchases', '₹38,000'], ['Hired vehicles for delivery', '₹41,000'], ['Other expenses, by category', '₹2,12,000']];

const EVERYDAY = [
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Production, sales, collections, purchases, expenses and outstanding dues for any period, with a production trend chart.' },
  { icon: Activity, title: 'Activity center', text: 'Everything recorded across the business, filtered by date and plant.' },
  { icon: FileBarChart, title: 'Stock and brick ledgers', text: 'Opening, in, out and closing stock for every material and brick type.' },
  { icon: Coins, title: 'Cash and bank ledgers', text: 'Every rupee in and out of each account, with its balance.' },
  { icon: AlertTriangle, title: 'Low stock alerts', text: 'Raw materials that have fallen below their minimum level.' },
];

const BENEFITS = [
  { title: 'Decide on facts', text: 'Pricing, buying and hiring decisions rest on real production, cost and sales figures.' },
  { title: 'Know your cost per brick', text: 'The profit & loss report shows what each brick really costs you to make and deliver.' },
  { title: 'Chase dues on time', text: 'Outstanding and party ledger reports make it clear who to follow up with.' },
  { title: 'Ready for your accountant', text: 'Financial-year reports and ledgers mean year-end work starts from organised numbers.' },
];

const FAQS = [
  {
    q: 'What is brick kiln report management software?',
    a: 'Brick kiln report management software turns a kiln\'s daily records into reports: production, sales, collections, expenses, outstanding dues, party ledgers and profit & loss, for any period you choose.',
  },
  {
    q: `Which reports does ${site.name} include?`,
    a: 'Daily production trend, sales trend, sales vs collections, expense summary, customer outstanding, profit & loss with cost per brick, and a party ledger report. The dashboard, ledgers and low stock alerts add day-to-day views.',
  },
  {
    q: 'Can I see reports for a financial year?',
    a: 'Yes. Reports can be run for any dates, with quick presets for today, this week, this month, last month and this financial year.',
  },
  {
    q: 'Does the profit & loss report show cost per brick?',
    a: 'Yes. Along with total income, total expense and net profit or loss, the profit & loss report shows the cost per brick for the period.',
  },
  {
    q: 'Do I need to prepare reports myself?',
    a: 'No. Reports are built automatically from the production, sales, purchases, expenses and payments you already record.',
  },
  {
    q: 'How much does brick kiln report management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with all reports included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: a report screen with period presets, headline totals and a small chart.
function ReportViewer() {
  const bars = [62, 74, 58, 81, 69, 88, 77, 92, 70, 84];
  return (
    <figure
      role="img"
      aria-label="Sample BrickManager reports screen for this month showing production, sales, collections and expenses, a daily production chart and net profit"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-200/60 via-primary-100/50 to-emerald-100/60 blur-2xl" />
      <div className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-slate-900">Reports</p>
          <div className="flex gap-1 text-[10px] font-semibold">
            {['Overview', 'Profit & Loss', 'Party Ledger'].map((t, i) => (
              <span key={t} className={`rounded-full px-2.5 py-1 ${i === 0 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
            ))}
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
          <CalendarRange size={12} /> This Month
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[['Production', '3.4L pcs'], ['Sales', '₹10.4L'], ['Collection', '₹8.9L'], ['Expenses', '₹2.1L']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[10px] text-slate-500">{l}</p>
              <p className="text-sm font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-600">Daily Production Trend</p>
          <div className="mt-2 flex h-20 items-end gap-1.5">
            {bars.map((h, i) => <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-violet-400" style={{ height: `${h}%` }} />)}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          <span className="text-xs font-semibold text-emerald-800">Net Profit</span>
          <span className="text-lg font-extrabold text-emerald-700">₹2.5L</span>
        </div>
        <p className="mt-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
      </div>
    </figure>
  );
}

export default function BrickKilnReportsPage() {
  usePageMeta(TITLE, DESCRIPTION, REPORTS_PAGE);

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-violet-50/50 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-violet-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Report Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-violet-800 shadow-sm">
                  <PieChart size={14} /> Brick kiln reports & analytics
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Report Management Software for{' '}
                  <span className="bg-gradient-to-r from-violet-600 to-primary-700 bg-clip-text text-transparent">Clear Decisions</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Stop adding up registers at month end. {site.name} builds your kiln&apos;s reports automatically:
                  production, sales, collections, expenses, outstanding dues and profit & loss, for any period you pick.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#reports" onClick={jumpTo('reports')} className="btn-primary px-7 py-3.5 text-base">
                    Explore the Reports <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <ReportViewer />
            </div>
          </div>
        </section>

        {/* Report catalogue */}
        <section id="reports" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Report library"
              title="Every Report Your Brick Kiln Needs"
              text="Each report answers a question owners ask every week. All of them are built from the entries you already make."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REPORTS.map(({ icon: Icon, title, question, text }) => (
                <article key={title} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon size={20} /></span>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                  </div>
                  <p className="mt-4 rounded-xl bg-violet-50/70 px-3.5 py-2.5 text-sm font-medium italic text-violet-900">“{question}”</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Any period */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-white to-primary-50 p-8 text-center ring-1 ring-violet-200 sm:p-12">
            <BrickPattern className="fill-violet-900/[0.03]" />
            <div className="relative">
              <CalendarRange size={34} className="mx-auto text-violet-700" />
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Reports for Any Period, in One Click</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">Choose a preset or pick your own from and to dates. Every report on the page follows the period you choose.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {PRESETS.map(p => (
                  <span key={p} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">{p}</span>
                ))}
                <span className="rounded-full border border-dashed border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700">Custom dates</span>
              </div>
            </div>
          </div>
        </section>

        {/* P&L statement */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-700">Profit & loss</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">A Profit & Loss Report Built for Brick Kilns</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Income from brick sales and transport is set against raw material, transport, hired vehicles and
                other expenses. The report shows total income, total expense, net profit or loss and, most usefully,
                your <strong>cost per brick</strong> for the period.
              </p>
            </div>
            <figure
              role="img"
              aria-label="Sample profit and loss statement for a brick kiln, listing income and expense lines with net profit"
              className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200"
            >
              <div className="grid sm:grid-cols-2">
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Income</p>
                  <dl className="mt-3 space-y-2 text-xs">
                    {PL_INCOME.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-slate-600">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>)}
                  </dl>
                </div>
                <div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Expense</p>
                  <dl className="mt-3 space-y-2 text-xs">
                    {PL_EXPENSE.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-slate-600">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>)}
                  </dl>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-50 text-center">
                <div className="p-4"><p className="text-[11px] text-slate-500">Net Profit</p><p className="text-lg font-extrabold text-emerald-700">₹2,50,500</p></div>
                <div className="border-l border-slate-200 p-4"><p className="text-[11px] text-slate-500">Cost per Brick</p><p className="text-lg font-extrabold text-slate-900">₹2.31</p></div>
              </div>
              <p className="bg-slate-50 pb-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample</p>
            </figure>
          </div>
        </section>

        {/* Everyday views */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Day to day"
              title="Live Views Between Your Monthly Reports"
              text="Reports cover the big picture. These screens keep you informed every day."
            />
            <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {EVERYDAY.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <Icon size={24} className="text-primary-700" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Benefits" title="Why Brick Kiln Report Management Matters" />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ title, text }, i) => (
                <div key={title} className="rounded-2xl bg-gradient-to-b from-violet-50/70 to-white p-6 ring-1 ring-violet-100">
                  <LineChart size={24} className={i % 2 ? 'text-primary-700' : 'text-violet-700'} />
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Hammer size={30} className="mx-auto text-violet-700" />
            <h2 className="mt-3 text-3xl font-bold text-slate-900">All Reports Included in Every Plan</h2>
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
                { to: BILLING_PAGE, label: 'Brick kiln billing software' },
                { to: PAYMENT_PAGE, label: 'Brick kiln payment tracking' },
                { to: EXPENSE_PAGE, label: 'Brick kiln expense management' },
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
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Report Management FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition open:bg-white open:shadow-md open:ring-violet-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-violet-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-primary-700 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <PieChart size={34} className="mx-auto text-violet-200" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">See your kiln&apos;s numbers clearly</h2>
              <p className="mx-auto mt-4 max-w-xl text-violet-100">Let us show you the reports {site.name} builds from your daily entries.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-violet-50">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln report management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
