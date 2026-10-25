import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeIndianRupee, Banknote, BarChart3, Building2, CalendarDays, ChevronDown, ChevronRight,
  CircleDollarSign, Coins, CreditCard, Filter, Fuel, HardHat, Info, Landmark, LayoutDashboard, PiggyBank,
  Plus, ReceiptIndianRupee, Scale, Search, ShoppingCart, Smartphone, Tags, TrendingDown, Wallet, Wrench,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  EXPENSE_PAGE, INVENTORY_PAGE, PRICE_PAGE, PRODUCTION_PAGE, scrollToSection, useGoToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Expense Management Software | ${site.name}`;
const DESCRIPTION = `Brick kiln expense management software by ${site.name}. Record expenses by category, pay from cash or bank, track spending per kiln and see true profit.`;

const LEAKS = [
  { icon: Coins, title: 'Small spends go unrecorded', text: 'A little diesel here, a repair there. Each one seems too small to write down, but together they make a big hole.' },
  { icon: Wallet, title: 'Cash and bank get mixed up', text: 'Without knowing which account paid for what, the cash in hand and the bank balance never quite match.' },
  { icon: Tags, title: 'No view by type of cost', text: 'When expenses are not grouped, it is impossible to tell whether labour, fuel or maintenance is eating into profit.' },
  { icon: Building2, title: 'Costs not split by kiln', text: 'Businesses with more than one kiln cannot see which site is costing more to run.' },
  { icon: TrendingDown, title: 'Profit looks better than it is', text: 'Every missed expense makes the business look more profitable on paper than it really is.' },
];

// The fields of an expense entry, in the order they appear.
const ENTRY_STEPS = [
  { icon: CalendarDays, title: 'Date and amount', text: 'When it was spent and how much, in rupees.' },
  { icon: Tags, title: 'Category', text: 'Labour, Diesel, Maintenance, Miscellaneous or any category you add.' },
  { icon: ReceiptIndianRupee, title: 'Description', text: 'A short note on what the money was for.' },
  { icon: Landmark, title: 'Paid from', text: 'The cash or bank account the money came out of.' },
  { icon: CreditCard, title: 'Payment mode', text: 'Cash, UPI, bank transfer or cheque.' },
  { icon: Building2, title: 'Plant', text: 'The kiln it belongs to, or All Plants for shared costs.' },
];

const BUILT_IN = [
  { icon: HardHat, name: 'Labour' },
  { icon: Fuel, name: 'Diesel' },
  { icon: Wrench, name: 'Maintenance' },
  { icon: CircleDollarSign, name: 'Miscellaneous' },
];

const CUSTOM_EXAMPLES = ['Electricity', 'Coal transport', 'Rent', 'Staff food', 'Vehicle repairs', 'Office expenses'];

const PAY_MODES = [
  { icon: Banknote, name: 'Cash' },
  { icon: Smartphone, name: 'UPI' },
  { icon: Landmark, name: 'Bank transfer' },
  { icon: ReceiptIndianRupee, name: 'Cheque' },
];

const VIEWS = [
  { icon: Wallet, title: 'Totals by category', text: 'The expenses screen opens with category totals, so the biggest costs are obvious at once.' },
  { icon: Search, title: 'Search and filter', text: 'Search by description or category, filter to one category, and see the total for what is shown.' },
  { icon: LayoutDashboard, title: 'Expenses on the dashboard', text: 'See total spending for today, the last 7 or 30 days, this year or any dates you choose.' },
  { icon: Scale, title: 'Profit & loss', text: 'Expenses sit alongside sales, raw material and hired vehicle costs to show your real profit.' },
];

const BENEFITS = [
  { icon: PiggyBank, title: 'Spot where money goes', text: 'Category totals make it easy to see which costs are growing and where savings are possible.' },
  { icon: Landmark, title: 'Balances that match', text: 'Because every expense is paid from an account, cash in hand and bank balances stay accurate.' },
  { icon: BarChart3, title: 'Profit you can trust', text: 'With every expense recorded, the profit & loss report reflects what the business really earned.' },
  { icon: Building2, title: 'Cost per kiln', text: 'Expenses linked to a plant show what each kiln costs to run.' },
];

const FAQS = [
  {
    q: 'What is brick kiln expense management software?',
    a: 'Brick kiln expense management software records every rupee a kiln spends, such as labour, diesel and maintenance, grouped by category and linked to the cash or bank account that paid it, so spending and profit are always clear.',
  },
  {
    q: 'Which expense categories are included?',
    a: `${site.name} comes with Labour, Diesel, Maintenance and Miscellaneous built in. You can add as many of your own categories as you need, such as electricity or rent.`,
  },
  {
    q: 'Can I record whether an expense was paid in cash, UPI or by bank?',
    a: 'Yes. Each expense records the account it was paid from and the payment mode: cash, UPI, bank transfer or cheque. The account balance updates automatically.',
  },
  {
    q: 'Can I track expenses for each kiln separately?',
    a: 'Yes. Each expense can be linked to a plant, or marked as All Plants for costs shared across kilns.',
  },
  {
    q: 'How do expenses affect profit?',
    a: 'The profit & loss report adds your expenses to raw material and hired vehicle costs and sets them against sales, so recorded expenses are reflected in your profit.',
  },
  {
    q: 'Are raw material purchases recorded as expenses?',
    a: 'No. Raw material purchases are recorded as purchases, which add to stock and to the vendor\'s ledger. Expenses are for other costs like labour, fuel and maintenance.',
  },
  {
    q: 'How much does brick kiln expense management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with expense management included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: a month's spending by category, and a single expense entry.
function SpendingCard() {
  const cats = [
    { name: 'Labour', amount: '₹1,84,000', pct: 100, color: 'bg-rose-500' },
    { name: 'Diesel', amount: '₹72,500', pct: 40, color: 'bg-amber-500' },
    { name: 'Maintenance', amount: '₹38,200', pct: 21, color: 'bg-sky-500' },
    { name: 'Electricity', amount: '₹21,800', pct: 12, color: 'bg-violet-500' },
  ];
  return (
    <figure
      role="img"
      aria-label="Sample Brick Manager expense summary showing a month's spending on labour, diesel, maintenance and electricity, and a diesel expense paid by UPI"
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-rose-100/70 via-amber-100/60 to-emerald-100/60 blur-2xl" />
      <div className="relative rounded-2xl bg-white p-6 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Expenses · This month</p>
            <p className="text-2xl font-extrabold text-slate-900">₹3,16,500</p>
          </div>
          <span className="badge-gray">Sample view</span>
        </div>
        <ul className="mt-5 space-y-3.5">
          {cats.map(c => (
            <li key={c.name} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{c.name}</span>
                <span className="font-bold text-slate-900">{c.amount}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} /></div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Fuel size={18} /></span>
          <span className="min-w-0 flex-1 text-xs">
            <span className="block font-semibold text-slate-900">Diesel for generator</span>
            <span className="block text-slate-500">UPI · Paid from Bank account</span>
          </span>
          <span className="text-sm font-bold text-rose-600">−₹4,500</span>
        </div>
      </div>
    </figure>
  );
}

export default function BrickKilnExpensePage() {
  usePageMeta(TITLE, DESCRIPTION, EXPENSE_PAGE);
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-rose-50/40 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-rose-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Expense Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-rose-800 shadow-sm">
                  <BadgeIndianRupee size={14} /> Brick kiln expense tracking
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Expense Management Software to{' '}
                  <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">Control Every Rupee</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Labour, diesel, repairs and daily costs add up fast at a kiln. {site.name} records each expense by
                  category, links it to the cash or bank account that paid it, and shows what every kiln really
                  costs to run.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#record-expense" onClick={jumpTo('record-expense')} className="btn-primary px-7 py-3.5 text-base">
                    See How It Works <ArrowRight size={18} />
                  </a>
                  <a href="/#contact" onClick={goToSection('contact')} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </a>
                </div>
              </div>
              <SpendingCard />
            </div>
          </div>
        </section>

        {/* Where money leaks */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="The problem"
              title="Where Brick Kiln Money Quietly Leaks"
              text="Most kilns do not lose money in one big mistake. They lose it in many small expenses nobody tracked."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {LEAKS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-rose-50/50 p-5 ring-1 ring-rose-100">
                  <Icon size={24} className="text-rose-600" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Record an expense */}
        <section id="record-expense" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Daily expenses"
              title="Record a Kiln Expense in Under a Minute"
              text={`Tap New Expense on the dashboard and fill in six simple details. ${site.name} does the rest.`}
            />
            <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {ENTRY_STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex gap-4 bg-white p-6">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Icon size={20} />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{i + 1}</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-rose-700">Expense categories</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Categories That Fit Your Kiln</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Four categories that every brick kiln uses come built in. Add your own for anything else your
                business spends on, and every expense lands in the right group for reporting.
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Built in</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {BUILT_IN.map(({ icon: Icon, name }) => (
                    <span key={name} className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 font-semibold text-slate-800 ring-1 ring-rose-200">
                      <Icon size={20} className="text-rose-600" /> {name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Add your own, for example</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CUSTOM_EXAMPLES.map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-600">
                      <Plus size={14} /> {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Linked to cash & bank */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-8 ring-1 ring-emerald-200 sm:p-12">
            <BrickPattern className="fill-emerald-900/[0.03]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-700"><Landmark size={16} /> Cash & bank</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Every Expense Linked to Cash or Bank</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Choose which account paid for each expense. Its balance goes down straight away, so the cash in hand
                  and your bank balances in {site.name} always match what you really have. Each account has its own
                  ledger showing every rupee in and out.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment modes</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {PAY_MODES.map(({ icon: Icon, name }) => (
                    <span key={name} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Icon size={20} /></span>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Views */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Expense reports"
              title="See Your Kiln's Spending Clearly"
              text="Recording expenses is only half the job. Here is how you review them."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VIEWS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white"><Icon size={22} /></span>
                  <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-10 flex max-w-3xl gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
              <Info size={20} className="mt-0.5 shrink-0 text-slate-500" />
              <p>
                <span className="font-semibold text-slate-800">Expenses and purchases are kept apart. </span>
                Raw materials bought from vendors are recorded as <ShoppingCart size={14} className="inline align-[-2px]" /> purchases,
                which add to stock and the vendor&apos;s ledger. Expenses cover everything else, like labour, fuel and maintenance.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Benefits" title="Benefits of Brick Kiln Expense Management Software" />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20"><Icon size={24} /></span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Expense Management Included in Every Plan</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Track expenses, cash and bank in both plans at no extra cost.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-slate-50 px-8 py-5 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple kilns' : 'One kiln'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <nav aria-label="Related pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: PRODUCTION_PAGE, label: 'Brick kiln production management' },
                { to: INVENTORY_PAGE, label: 'Brick kiln inventory management' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-slate-200 transition hover:bg-primary-50">
                  {l.label} <ChevronRight size={14} />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Expense Management FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition open:ring-rose-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-rose-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#3a2433] to-[#9f1239] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <Filter size={34} className="mx-auto text-rose-200" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Stop the small leaks in your kiln&apos;s spending</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">See how {site.name} keeps every expense recorded and every balance right.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="/#contact" onClick={goToSection('contact')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-rose-50">
                  Contact Us <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln expense management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
