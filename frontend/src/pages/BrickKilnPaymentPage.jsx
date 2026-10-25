import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, BookOpen, Building2, CalendarDays, ChevronDown, ChevronRight,
  CircleDollarSign, FileText, Hash, HandCoins, Landmark, NotebookPen, Repeat, Scale, Search, Send, Smartphone,
  UserRound, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BILLING_PAGE, PAYMENT_PAGE, PRICE_PAGE, REPORTS_PAGE, scrollToSection, useGoToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Payment Tracking Software | ${site.name}`;
const DESCRIPTION = `Brick kiln payment tracking software by ${site.name}. Record money received and paid, track customer and vendor dues, and keep cash and bank balances right.`;

const SIDES = [
  {
    icon: ArrowDownLeft,
    title: 'Money received',
    who: 'From customers',
    tone: 'emerald',
    points: [
      'Payments taken at the time of sale are recorded with the invoice',
      'Later payments recorded against the customer',
      'The customer\'s balance goes down straight away',
      'Money added to the cash or bank account you choose',
    ],
  },
  {
    icon: ArrowUpRight,
    title: 'Money paid',
    who: 'To vendors and suppliers',
    tone: 'rose',
    points: [
      'Payments to raw material vendors and other suppliers',
      'What you owe each vendor goes down straight away',
      'Money taken from the cash or bank account you choose',
      'Purchases and payments together in the vendor\'s ledger',
    ],
  },
];

const SIDE_TONES = {
  emerald: { box: 'from-emerald-50 to-white ring-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-700' },
  rose: { box: 'from-rose-50 to-white ring-rose-200', icon: 'bg-rose-600', text: 'text-rose-700' },
};

// How a customer's balance moves through a credit sale and a later payment.
const DUE_FLOW = [
  { icon: FileText, title: 'Bricks sold on credit', text: 'An invoice of ₹50,000 is made, with ₹20,000 paid at the time of sale.', balance: '₹30,000 due' },
  { icon: BookOpen, title: 'Balance in the ledger', text: 'The unpaid ₹30,000 is added to the customer\'s ledger automatically.', balance: '₹30,000 due' },
  { icon: HandCoins, title: 'Payment comes in', text: 'A week later the customer pays ₹30,000 by UPI. You record it as money received.', balance: '₹0 due' },
];

const FIELDS = [
  { icon: UserRound, title: 'Party', text: 'The customer who paid you, or the vendor you paid.' },
  { icon: CalendarDays, title: 'Date', text: 'When the money changed hands.' },
  { icon: CircleDollarSign, title: 'Amount', text: 'How much was received or paid, in rupees.' },
  { icon: Landmark, title: 'Account and mode', text: 'The cash or bank account, and whether it was cash, UPI, bank transfer or cheque.' },
  { icon: Hash, title: 'Cheque or UTR number', text: 'An optional reference so the payment can be traced later.' },
  { icon: NotebookPen, title: 'Notes', text: 'Anything worth remembering about the payment.' },
];

const MODES = [
  { icon: Banknote, name: 'Cash' },
  { icon: Smartphone, name: 'UPI' },
  { icon: Landmark, name: 'Bank transfer' },
  { icon: FileText, name: 'Cheque' },
];

const TRACKING = [
  { icon: Scale, title: 'To receive and to pay', text: 'The party ledger report shows what each customer owes you and what you owe each vendor.' },
  { icon: BookOpen, title: 'Full party ledgers', text: 'Every sale, purchase and payment for a party, with the running balance.' },
  { icon: CalendarDays, title: 'Payment totals', text: 'The payment screens show totals for today and this month, split into cash and bank.' },
  { icon: Search, title: 'Search payments', text: 'Find any past payment quickly instead of searching through receipt books.' },
];

const FAQS = [
  {
    q: 'What is brick kiln payment tracking software?',
    a: 'Brick kiln payment tracking software records the money a kiln receives from customers and pays to vendors, and keeps every party\'s balance and every cash and bank account up to date automatically.',
  },
  {
    q: 'How do I track which customers owe money?',
    a: `Unpaid amounts from sales are added to each customer's ledger. In ${site.name}, the party ledger report shows what every customer owes, and the dashboard shows total outstanding dues.`,
  },
  {
    q: 'Can I record payments made to vendors?',
    a: 'Yes. Payments to vendors are recorded as money paid. They reduce what you owe the vendor and come out of the cash or bank account you choose.',
  },
  {
    q: 'Which payment modes are supported?',
    a: 'Cash, UPI, bank transfer and cheque. You can also add a cheque number or UTR reference and notes to any payment.',
  },
  {
    q: 'Are payments taken at the time of sale recorded automatically?',
    a: 'Yes. When you enter the amount received while making a sale invoice, that payment is recorded against the customer along with the invoice.',
  },
  {
    q: 'Do payments update my cash and bank balances?',
    a: 'Yes. Every payment is linked to a cash or bank account, so money received adds to its balance and money paid takes away from it.',
  },
  {
    q: 'How much does brick kiln payment tracking software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with payment tracking included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: a received payment and the customer's balance before and after.
function PaymentVisual() {
  return (
    <figure
      role="img"
      aria-label="Sample payment of ₹30,000 received by UPI from a customer in Brick Manager, bringing their balance from ₹30,000 due to zero"
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/60 via-teal-100/50 to-primary-100/60 blur-2xl" />
      <div className="relative space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-bold text-slate-900"><HandCoins size={18} className="text-emerald-600" /> Money Received</p>
            <span className="badge-gray">Sample</span>
          </div>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            {[['Customer', 'Sharma Builders'], ['Date', '25 Oct'], ['Mode', 'UPI · to Bank account'], ['UTR', '4312 8890 1123']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <span className="text-sm font-medium text-emerald-800">Amount</span>
            <span className="text-xl font-extrabold text-emerald-700">₹30,000</span>
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <div className="flex-1 text-center">
            <p className="text-[11px] text-slate-500">Balance before</p>
            <p className="font-bold text-rose-600">₹30,000 due</p>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
          <div className="flex-1 text-center">
            <p className="text-[11px] text-slate-500">Balance after</p>
            <p className="font-bold text-emerald-600">Settled</p>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function BrickKilnPaymentPage() {
  usePageMeta(TITLE, DESCRIPTION, PAYMENT_PAGE);
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-emerald-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Payment Tracking Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                  <Wallet size={14} /> Customer & vendor payment tracking
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Payment Tracking Software That{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Keeps Every Rupee Accounted For</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Know who has paid, who still owes and what you owe your suppliers. {site.name} records every payment
                  in and out, updates each party&apos;s balance automatically and keeps your cash and bank accounts
                  accurate.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#dues" onClick={jumpTo('dues')} className="btn-primary px-7 py-3.5 text-base">
                    See How Dues Are Tracked <ArrowRight size={18} />
                  </a>
                  <a href="/#contact" onClick={goToSection('contact')} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </a>
                </div>
              </div>
              <PaymentVisual />
            </div>
          </div>
        </section>

        {/* Money in / money out */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Both directions"
              title="Track Money Coming In and Going Out"
              text="A brick kiln collects from customers and pays its suppliers every day. Both sides are tracked the same simple way."
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {SIDES.map(({ icon: Icon, title, who, tone, points }) => {
                const t = SIDE_TONES[tone];
                return (
                  <div key={title} className={`rounded-3xl bg-gradient-to-b p-7 ring-1 sm:p-8 ${t.box}`}>
                    <div className="flex items-center gap-4">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md ${t.icon}`}><Icon size={24} /></span>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                        <p className={`text-sm font-semibold ${t.text}`}>{who}</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {points.map(p => (
                        <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.icon}`} /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dues flow */}
        <section id="dues" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Customer dues"
              title="Dues That Track Themselves"
              text="Here is what happens to a customer's balance, from a credit sale to the final payment."
            />
            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {DUE_FLOW.map(({ icon: Icon, title, text, balance }, i) => (
                <li key={title} className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  {i < DUE_FLOW.length - 1 && <ArrowRight size={22} className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-slate-300 md:block" aria-hidden="true" />}
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><Icon size={22} /></span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-700">Step {i + 1}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                  <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${balance === '₹0 due' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{balance}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-center text-xs text-slate-400">Example amounts</p>
          </div>
        </section>

        {/* Payment form */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Recording a payment</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Every Payment, Fully Traceable</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Open Money Received or Money Paid from the dashboard and fill in a few details. Each payment keeps
                enough information to trace it months later.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"><Icon size={18} /></span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cash & bank */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-8 ring-1 ring-teal-200 sm:p-12">
            <BrickPattern className="fill-teal-900/[0.03]" />
            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-teal-700"><Landmark size={16} /> Cash & bank</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Cash and Bank Balances That Always Match</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Every payment is linked to an account, so each cash box and bank account in {site.name} shows a live
                  balance and its own ledger. Moving money between accounts, like depositing cash in the bank, is
                  recorded as a transfer.
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700"><Repeat size={16} className="text-teal-700" /> Transfers between cash and bank accounts</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MODES.map(({ icon: Icon, name }) => (
                  <span key={name} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><Icon size={20} /></span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tracking views */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Stay on top" title="See Every Balance at a Glance" />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TRACKING.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border-t-4 border-emerald-500 bg-slate-50 p-6">
                  <Icon size={26} className="text-emerald-700" />
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Building2 size={16} className="text-emerald-700" /> Running several kilns? Payments can be linked to a plant too.
            </p>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Send size={30} className="mx-auto text-emerald-700" />
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Payment Tracking Included in Every Plan</h2>
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
                { to: REPORTS_PAGE, label: 'Brick kiln report management' },
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
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Payment Tracking FAQs" />
            <div className="mt-12 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 transition hover:bg-emerald-50/50 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-emerald-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2f2a] via-[#134e4a] to-emerald-700 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <HandCoins size={34} className="mx-auto text-emerald-200" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Know exactly who owes what</h2>
              <p className="mx-auto mt-4 max-w-xl text-emerald-100">See how {site.name} tracks every payment and every balance at your kiln.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="/#contact" onClick={goToSection('contact')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-emerald-50">
                  Contact Us <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln payment tracking software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
