import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgePercent, Banknote, BookOpen, Boxes, Building2, Car, ChevronDown, ChevronRight, Clock,
  CreditCard, FileText, Hash, Landmark, MapPin, Receipt, Route, Scale, Search, Truck, UserRound, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BILLING_PAGE, CONTACT_PAGE, EXPENSE_PAGE, INVENTORY_PAGE, PRICE_PAGE, scrollToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Billing Software with GST | ${site.name}`;
const DESCRIPTION = `Brick kiln billing software by ${site.name}. Make GST invoices with transport and trip charges, take cash or credit sales and track what customers owe.`;

// Numbered call-outs that match the sample invoice in the hero.
const INVOICE_PARTS = [
  { icon: Hash, title: 'Automatic invoice numbers', text: 'Every bill gets the next number in your own series, INV-0001, INV-0002 and so on.' },
  { icon: UserRound, title: 'Customer, kiln and site', text: 'Choose the customer and the kiln selling the bricks, and add the delivery site and driver.' },
  { icon: Receipt, title: 'Brick lines with GST', text: 'Add as many brick types as needed, each with its own quantity, rate and GST %.' },
  { icon: Truck, title: 'Transport and trips', text: 'Add the vehicle, trips and transport charge to the party in the same bill.' },
  { icon: BadgePercent, title: 'Discount', text: 'Give a discount in rupees and the total updates instantly.' },
  { icon: Wallet, title: 'Payment at the time of sale', text: 'Record what the customer paid now, into which account. The rest goes to their ledger.' },
];

const TRANSPORT_MODES = [
  { icon: Car, title: 'Party vehicle', text: 'The customer collects the bricks in their own vehicle. No transport charge is added.' },
  { icon: Truck, title: 'My vehicle', text: 'You deliver in your own vehicle and charge the customer for transport on the bill.' },
  { icon: Route, title: 'Hired vehicle', text: 'You charge the customer for transport and record what you owe the transporter, per trip, ton, km, 1,000 bricks or a fixed amount.' },
];

const PAY_TYPES = [
  { label: 'Cash sale', text: 'Paid in full at the time of sale.', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { label: 'Partial sale', text: 'Part paid now, the balance added to the customer\'s ledger.', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  { label: 'Credit sale', text: 'Nothing paid yet. The full amount is owed by the customer.', cls: 'border-rose-200 bg-rose-50 text-rose-800' },
];

const SALES_STATS = [
  { label: 'This month', text: 'Sales value and number of invoices this month.' },
  { label: 'Total sales', text: 'All invoices raised so far.' },
  { label: 'Sold on credit', text: 'Amount not received at the time of sale.' },
  { label: 'To receive', text: 'What customers owe you now, after all payments.' },
];

const CONNECTED = [
  { icon: Boxes, title: 'Brick stock', text: 'Bricks on the invoice are taken out of stock.' },
  { icon: BookOpen, title: 'Customer ledger', text: 'The bill and any unpaid balance appear in the customer\'s ledger.' },
  { icon: Landmark, title: 'Cash or bank', text: 'Money received at the sale is added to the account you choose.' },
  { icon: Truck, title: 'Transporter', text: 'For hired vehicles, what you owe the transporter is recorded too.' },
  { icon: Scale, title: 'Profit & loss', text: 'Sales and hired vehicle costs flow into the profit & loss report.' },
];

const FAQS = [
  {
    q: 'What is brick kiln billing software?',
    a: 'Brick kiln billing software creates sale invoices for bricks, with brick types, quantities, rates, GST and transport charges, and keeps track of what each customer has paid and still owes.',
  },
  {
    q: 'Does the billing software support GST?',
    a: `Yes. In ${site.name} each brick line on an invoice can have its own GST %, and the GST amount and total are calculated automatically.`,
  },
  {
    q: 'Are invoice numbers generated automatically?',
    a: 'Yes. Each new invoice gets the next number in your business\'s own series, such as INV-0001, INV-0002 and so on.',
  },
  {
    q: 'Can I add transport and trip charges to a bill?',
    a: 'Yes. Choose whether the bricks go in the party\'s vehicle, your own vehicle or a hired vehicle, add the vehicle and trips, and enter the transport charge to the party. For hired vehicles, what you owe the transporter is recorded as well.',
  },
  {
    q: 'Can I make credit sales?',
    a: 'Yes. Enter the amount received at the time of sale, or zero for a full credit sale. The unpaid balance is added to the customer\'s ledger, and later payments are recorded as money received.',
  },
  {
    q: 'How do I see which customers still owe money?',
    a: 'The sales screen shows the total sold on credit and the amount still to receive from customers. You can filter invoices by cash, partial or credit, and each customer\'s ledger shows their balance.',
  },
  {
    q: 'How much does brick kiln billing software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with billing included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const num = (n) => n.toLocaleString('en-IN');

// Numbered dot on the sample invoice, matching the call-outs below it
function Marker({ n }) {
  return <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">{n}</span>;
}

// Hero artwork: a sample brick invoice, with markers matching INVOICE_PARTS.
function InvoiceMock() {
  const lines = [
    { name: 'Red brick 9"', qty: 4000, rate: 7, gst: 5 },
    { name: 'Fly ash brick', qty: 2000, rate: 6, gst: 5 },
  ];
  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const gst = lines.reduce((s, l) => s + (l.qty * l.rate * l.gst) / 100, 0);
  const transport = 3000;
  const discount = 500;
  const total = subtotal + gst + transport - discount;
  const paid = 25000;
  return (
    <figure
      role="img"
      aria-label={`Sample brick invoice INV-0042 for 6,000 bricks with 5% GST, transport and discount, totalling ₹${num(total)}, partly paid`}
      className="relative mx-auto w-full max-w-md"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-amber-100/80 via-orange-100/50 to-primary-100/60 blur-2xl" />
      <div className="relative rounded-2xl bg-white p-6 text-sm shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex items-start justify-between border-b border-dashed border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Invoice</p>
            <p className="flex items-center text-lg font-extrabold text-slate-900">INV-0042<Marker n={1} /></p>
          </div>
          <span className="badge-orange">Partial</span>
        </div>
        <div className="mt-4 text-xs text-slate-600">
          <p className="flex items-center font-semibold text-slate-900">Sharma Builders<Marker n={2} /></p>
          <p className="mt-0.5 flex items-center gap-1"><MapPin size={12} /> Site: Ring Road, Raipur</p>
        </div>
        <table className="mt-4 w-full text-xs">
          <thead><tr className="text-left text-slate-400"><th className="pb-1.5 font-semibold">Item<Marker n={3} /></th><th className="pb-1.5 text-right font-semibold">Qty × Rate</th><th className="pb-1.5 text-right font-semibold">GST</th></tr></thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.name} className="border-t border-slate-100">
                <td className="py-1.5 font-medium text-slate-800">{l.name}</td>
                <td className="py-1.5 text-right text-slate-600">{num(l.qty)} × ₹{l.rate}</td>
                <td className="py-1.5 text-right text-slate-600">{l.gst}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium">₹{num(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd className="font-medium">₹{num(gst)}</dd></div>
          <div className="flex justify-between"><dt className="flex items-center text-slate-500">Transport · 2 trips<Marker n={4} /></dt><dd className="font-medium">₹{num(transport)}</dd></div>
          <div className="flex justify-between"><dt className="flex items-center text-slate-500">Discount<Marker n={5} /></dt><dd className="font-medium text-emerald-600">−₹{num(discount)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm"><dt className="font-bold text-slate-900">Total</dt><dd className="font-extrabold text-slate-900">₹{num(total)}</dd></div>
          <div className="flex justify-between"><dt className="flex items-center text-slate-500">Received · UPI to Bank<Marker n={6} /></dt><dd className="font-semibold text-emerald-600">₹{num(paid)}</dd></div>
          <div className="flex justify-between"><dt className="font-semibold text-rose-600">Balance to ledger</dt><dd className="font-bold text-rose-600">₹{num(total - paid)}</dd></div>
        </dl>
        <p className="mt-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample</p>
      </div>
    </figure>
  );
}

export default function BrickKilnBillingPage() {
  usePageMeta(TITLE, DESCRIPTION, BILLING_PAGE);

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-amber-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-amber-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Billing Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm">
                  <FileText size={14} /> GST billing software for brick kilns
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Billing Software for{' '}
                  <span className="bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">Faster, Accurate Bills</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Bill every truckload of bricks in seconds. {site.name} makes GST invoices with brick lines, transport
                  and trip charges and discounts, records what the customer paid, and keeps the balance in their ledger
                  automatically.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#invoice" onClick={jumpTo('invoice')} className="btn-primary px-7 py-3.5 text-base">
                    See What a Bill Includes <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <InvoiceMock />
            </div>
          </div>
        </section>

        {/* Invoice anatomy */}
        <section id="invoice" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Brick invoices"
              title="Everything a Brick Kiln Bill Needs, in One Invoice"
              text="The numbers below match the markers on the sample invoice above."
            />
            <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {INVOICE_PARTS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative rounded-2xl bg-gradient-to-br from-amber-50/60 to-white p-6 ring-1 ring-amber-100">
                  <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">{i + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-200"><Icon size={20} /></span>
                  <h3 className="mt-4 pr-8 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Transport billing */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Transport billing"
              title="Bill Transport and Trips the Way Your Kiln Delivers"
              text="Brick deliveries are rarely simple. Pick how the bricks travel and the bill handles the rest."
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {TRANSPORT_MODES.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className={`rounded-3xl p-7 ${i === 2 ? 'bg-gradient-to-br from-primary-700 to-primary-600 text-white shadow-xl shadow-primary-700/20' : 'bg-white shadow-sm ring-1 ring-slate-200'}`}>
                  <Icon size={30} className={i === 2 ? 'text-primary-100' : 'text-orange-600'} />
                  <h3 className={`mt-4 text-lg font-bold ${i === 2 ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${i === 2 ? 'text-primary-100' : 'text-slate-600'}`}>{text}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-orange-600" />
              Save each vehicle&apos;s per-trip routes, from a kiln to a location, with what you pay and what you charge per trip.
            </p>
          </div>
        </section>

        {/* Cash, partial or credit */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">Payments on bills</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Cash, Partial or Credit: Every Sale Handled</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Enter what the customer pays at the time of sale and choose the cash or bank account it goes into. Any
                balance is added to the customer&apos;s ledger automatically. When they pay later, record it as money
                received and the ledger updates.
              </p>
            </div>
            <ul className="space-y-3">
              {PAY_TYPES.map(({ label, text, cls }) => (
                <li key={label} className={`flex items-center gap-4 rounded-2xl border p-5 ${cls}`}>
                  {label.startsWith('Cash') ? <Banknote size={22} /> : label.startsWith('Partial') ? <Clock size={22} /> : <CreditCard size={22} />}
                  <div>
                    <h3 className="font-bold">{label}</h3>
                    <p className="text-sm text-slate-700">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sales screen + connected */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Sales overview"
              title="Know Your Sales and Dues at a Glance"
              text="The sales screen keeps four numbers in front of you, with search and filters for the rest."
            />
            <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {SALES_STATS.map(({ label, text }) => (
                <div key={label} className="rounded-2xl border-l-4 border-amber-500 bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="font-bold text-slate-900">{label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Search size={15} className="text-amber-700" /> Search by party or invoice number</span>
              <span className="flex items-center gap-1.5"><CreditCard size={15} className="text-amber-700" /> Filter cash, partial and credit sales</span>
              <span className="flex items-center gap-1.5"><Building2 size={15} className="text-amber-700" /> Bill from any of your kilns</span>
            </p>

            <h3 className="mt-16 text-center text-2xl font-bold text-slate-900">One Bill Updates Everything</h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CONNECTED.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">
                  <Icon size={24} className="mx-auto text-primary-700" />
                  <p className="mt-3 font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Billing Included in Every Plan</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">GST and transport billing are built into both plans.</p>
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
                { to: INVENTORY_PAGE, label: 'Brick kiln inventory management' },
                { to: EXPENSE_PAGE, label: 'Brick kiln expense management' },
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
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Billing Software FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition open:ring-amber-300">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-amber-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#3d3020] to-[#b45309] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <Receipt size={34} className="mx-auto text-amber-200" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Bill your next truckload in seconds</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">See how {site.name} handles GST, transport and credit on every brick invoice.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-amber-50">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln billing software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
