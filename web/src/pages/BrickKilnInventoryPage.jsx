import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, BellRing, BookOpen, Boxes, Building2, Check,
  CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Eye, FileText, Hammer, Layers, Minus, PackageCheck,
  PackageSearch, Plus, Ruler, ShoppingCart, SlidersHorizontal, TriangleAlert, Warehouse,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  CONTACT_PAGE, INVENTORY_PAGE, ONLINE_PAGE, PRICE_PAGE, PRODUCTION_PAGE, scrollToSection,
} from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Inventory Management Software | ${site.name}`;
const DESCRIPTION = `Brick kiln inventory management software by ${site.name}. Track brick and raw material stock, get low stock alerts, adjust stock and see every movement.`;

const STOCK_KINDS = [
  {
    icon: Layers,
    title: 'Finished-brick stock',
    tone: 'from-orange-50 to-white ring-orange-200',
    iconTone: 'bg-orange-600',
    points: [
      'Produced, damaged, sold and available for every brick type',
      'Good bricks added automatically from each production entry',
      'Bricks taken out automatically by sale invoices',
      'Stock viewed for one kiln or all kilns together',
    ],
  },
  {
    icon: Boxes,
    title: 'Raw material stock',
    tone: 'from-sky-50 to-white ring-sky-200',
    iconTone: 'bg-sky-600',
    points: [
      'Cement, fly ash, sand, coal or any material you add',
      'Each material counted in its own unit, such as bags or tonnes',
      'Purchases add stock and production use takes it away',
      'A minimum level for each material, with low stock alerts',
    ],
  },
];

// What each everyday activity does to stock.
const MOVEMENTS = [
  { icon: ShoppingCart, event: 'Purchase from a vendor', effect: 'Raw material stock goes up', dir: 'in' },
  { icon: Hammer, event: 'Production entry', effect: 'Good bricks go up, raw materials used go down', dir: 'both' },
  { icon: FileText, event: 'Sale invoice', effect: 'Brick stock goes down', dir: 'out' },
  { icon: SlidersHorizontal, event: 'Stock adjustment', effect: 'Raw material stock goes up or down, with a reason recorded', dir: 'both' },
  { icon: PackageCheck, event: 'Opening stock', effect: 'Your starting stock is set when you begin', dir: 'in' },
];

const LEDGER_ROWS = [
  { date: '20 Oct', what: 'Purchase · 200 bags', inQty: '+200', outQty: '', bal: '260' },
  { date: '21 Oct', what: 'Production use', inQty: '', outQty: '−58', bal: '202' },
  { date: '22 Oct', what: 'Production use', inQty: '', outQty: '−61', bal: '141' },
  { date: '23 Oct', what: 'Adjustment · Damaged / wastage', inQty: '', outQty: '−4', bal: '137' },
];

const ADJUST_REASONS = {
  increase: ['Physical count correction', 'Found extra stock', 'Returned from production', 'Opening stock'],
  decrease: ['Physical count correction', 'Damaged / wastage', 'Lost or theft', 'Used without entry'],
};

const BENEFITS = [
  { icon: Eye, title: 'No more guessing', text: 'Know what is in the yard and the store without walking out to count it.' },
  { icon: BellRing, title: 'Order before you run out', text: 'Low stock alerts give you time to buy cement or coal before production stops.' },
  { icon: PackageSearch, title: 'Find where stock went', text: 'Ledgers and adjustment reasons explain every change, which makes losses easier to spot.' },
  { icon: ClipboardCheck, title: 'Sell what you really have', text: 'Available brick stock reflects production, damage and sales, so you never promise bricks you do not have.' },
];

const FAQS = [
  {
    q: 'What is brick kiln inventory management software?',
    a: 'Brick kiln inventory management software keeps track of a kiln\'s finished-brick stock and raw material stock. It updates stock automatically from production, purchases and sales, and shows every movement in a ledger.',
  },
  {
    q: 'Does stock update automatically?',
    a: `Yes. In ${site.name}, purchases add raw material, production entries add good bricks and use up raw materials, and sale invoices reduce brick stock. You only make manual adjustments for corrections.`,
  },
  {
    q: 'How do low stock alerts work?',
    a: 'You set a minimum level for each raw material. When stock falls below it, the material is listed as low stock, and the inventory screen shows how many items need restocking.',
  },
  {
    q: 'Can I correct stock after a physical count?',
    a: 'Yes, for raw materials. A stock adjustment lets you add or remove material stock with a reason, such as physical count correction, damaged or wastage, or lost or theft, along with the date and notes.',
  },
  {
    q: 'Are damaged bricks counted in stock?',
    a: 'No. Damaged bricks are recorded with each production entry, and only good bricks are added to available stock. Brick stock is your opening stock plus good bricks produced, minus bricks sold.',
  },
  {
    q: 'Can I see inventory for each kiln separately?',
    a: 'Yes. With more than one plant, brick stock and brick ledgers can be viewed for a single kiln or for all kilns together.',
  },
  {
    q: 'How much does brick kiln inventory management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}, with inventory management included in both plans.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: brick and raw material stock side by side.
function StockBoard() {
  const bricks = [['Red brick 9"', '48,200'], ['Fly ash brick', '31,750'], ['Half brick', '6,400']];
  const materials = [
    { name: 'Cement', left: '137 bags', pct: 62, low: false },
    { name: 'Fly ash', left: '42 tonnes', pct: 70, low: false },
    { name: 'Coal', left: '3 tonnes', pct: 12, low: true },
  ];
  return (
    <figure
      role="img"
      aria-label="Sample inventory in BrickManager showing available stock of three brick types and raw material levels, with coal flagged as low stock"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-sky-100/70 via-white to-orange-200/60 blur-2xl" />
      <div className="relative grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-300/50 ring-1 ring-slate-200">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><Layers size={16} className="text-orange-600" /> Bricks available</p>
          <ul className="mt-4 space-y-2.5">
            {bricks.map(([n, q]) => (
              <li key={n} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-700">{n}</span>
                <span className="font-bold text-slate-900">{q}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 sm:mt-10">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><Boxes size={16} className="text-sky-600" /> Raw materials</p>
          <ul className="mt-4 space-y-3">
            {materials.map(m => (
              <li key={m.name} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{m.name}</span>
                  <span className={`font-bold ${m.low ? 'text-rose-600' : 'text-slate-900'}`}>{m.left}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${m.low ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${m.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
            <AlertTriangle size={13} /> Coal is below its minimum level
          </p>
        </div>
      </div>
      <p className="relative mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample view</p>
    </figure>
  );
}

function Direction({ dir }) {
  if (dir === 'in') return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-label="Stock in"><Plus size={16} strokeWidth={3} /></span>;
  if (dir === 'out') return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700" aria-label="Stock out"><Minus size={16} strokeWidth={3} /></span>;
  return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700" aria-label="Stock in and out">±</span>;
}

export default function BrickKilnInventoryPage() {
  usePageMeta(TITLE, DESCRIPTION, INVENTORY_PAGE);

  // Footer links open this page from the bottom of another page, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jumpTo = (id) => (e) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/50 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-slate-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Inventory Management Software</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-sky-800 shadow-sm">
                  <Warehouse size={14} /> Brick stock management software
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Brick Kiln Inventory Management Software{' '}
                  <span className="bg-gradient-to-r from-sky-600 to-primary-700 bg-clip-text text-transparent">That Keeps Count</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} tracks every brick in your yard and every bag of raw material in your store. Stock updates
                  itself from production, purchases and sales, low stock is flagged early, and a ledger explains
                  every change.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#stock-movement" onClick={jumpTo('stock-movement')} className="btn-primary px-7 py-3.5 text-base">
                    See How Stock Moves <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <StockBoard />
            </div>
          </div>
        </section>

        {/* Two kinds of stock */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Two kinds of stock"
              title="Brick and Raw Material Inventory in One Place"
              text="A brick kiln manages two very different inventories. BrickManager keeps both side by side."
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {STOCK_KINDS.map(({ icon: Icon, title, tone, iconTone, points }) => (
                <div key={title} className={`rounded-3xl bg-gradient-to-b p-7 ring-1 sm:p-8 ${tone}`}>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md ${iconTone}`}><Icon size={22} /></span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
                  <ul className="mt-5 space-y-3">
                    {points.map(p => (
                      <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stock movement */}
        <section id="stock-movement" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Automatic updates"
              title="How Stock Moves Without Extra Work"
              text="You record the day's normal activity. The inventory follows on its own."
            />
            <ul className="mt-12 divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200">
              {MOVEMENTS.map(({ icon: Icon, event, effect, dir }) => (
                <li key={event} className="flex items-center gap-4 p-5 sm:gap-6 sm:px-7">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon size={20} /></span>
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <h3 className="font-bold text-slate-900">{event}</h3>
                    <p className="mt-0.5 text-sm text-slate-600 sm:mt-0 sm:text-right">{effect}</p>
                  </div>
                  <Direction dir={dir} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ledger */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-700"><BookOpen size={16} /> Stock ledgers</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">A Ledger That Explains Every Number</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Every raw material has a stock ledger, and every brick type has a brick ledger. Each one shows the
                opening stock, everything that came in and went out, and the balance after each entry, for any date
                range you choose.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: ArrowDownToLine, t: 'Stock in', d: 'Purchases, production and increases', c: 'text-emerald-600' },
                  { icon: ArrowUpFromLine, t: 'Stock out', d: 'Sales, usage and decreases', c: 'text-rose-600' },
                ].map(({ icon: Icon, t, d, c }) => (
                  <div key={t} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <Icon size={18} className={c} />
                    <p className="mt-2 font-bold text-slate-900">{t}</p>
                    <p className="text-xs text-slate-500">{d}</p>
                  </div>
                ))}
              </div>
            </div>
            <figure
              role="img"
              aria-label="Sample cement stock ledger showing a purchase, production use and a wastage adjustment, with the balance after each"
              className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <p className="text-sm font-bold text-slate-900">Cement · Stock ledger</p>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Sample</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] sm:text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2.5 pl-4 pr-2 font-semibold sm:px-5">Date</th>
                      <th className="px-2 py-2.5 font-semibold">Entry</th>
                      <th className="px-2 py-2.5 text-right font-semibold">In</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Out</th>
                      <th className="py-2.5 pl-2 pr-4 text-right font-semibold sm:px-5">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEDGER_ROWS.map(r => (
                      <tr key={r.date + r.what} className="border-t border-slate-100">
                        <td className="whitespace-nowrap py-2.5 pl-4 pr-2 text-slate-500 sm:px-5">{r.date}</td>
                        <td className="px-2 py-2.5 font-medium text-slate-700">{r.what}</td>
                        <td className="px-2 py-2.5 text-right font-semibold text-emerald-600">{r.inQty}</td>
                        <td className="px-2 py-2.5 text-right font-semibold text-rose-600">{r.outQty}</td>
                        <td className="py-2.5 pl-2 pr-4 text-right font-bold text-slate-900 sm:px-5">{r.bal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          </div>
        </section>

        {/* Alerts + adjustments */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-5">
            <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-white p-7 ring-1 ring-rose-200 sm:p-9 lg:col-span-2">
              <BellRing size={30} className="text-rose-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Low Stock Alerts</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Set a minimum level for each raw material. Anything that falls below it appears on the low stock
                alerts page, and the inventory screen counts how many items need restocking.
              </p>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-rose-100">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                When recording production, you see how much of each material is left and get a warning if you enter more than is in stock.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-9 lg:col-span-3">
              <SlidersHorizontal size={30} className="text-sky-700" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Raw Material Adjustments With a Reason</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                When a physical count of a raw material does not match, add or remove stock and choose why. The reason, date and notes
                are saved in the ledger, so every correction can be explained later.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[['increase', 'Add stock', 'text-emerald-700 bg-emerald-50 ring-emerald-200'], ['decrease', 'Remove stock', 'text-rose-700 bg-rose-50 ring-rose-200']].map(([k, label, cls]) => (
                  <div key={k}>
                    <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls}`}>{label}</p>
                    <ul className="mt-3 space-y-2">
                      {ADJUST_REASONS[k].map(r => (
                        <li key={r} className="flex items-center gap-2 text-sm text-slate-700"><Check size={14} className="shrink-0 text-slate-400" strokeWidth={3} /> {r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Benefits" title="Why Brick Kiln Inventory Management Pays Off" />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border-t-4 border-sky-500 bg-slate-50 p-6">
                  <Icon size={26} className="text-sky-700" />
                  <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2"><Ruler size={16} className="text-sky-700" /> Your own units per material</span>
              <span className="flex items-center gap-2"><Building2 size={16} className="text-sky-700" /> Plant-wise brick stock</span>
              <span className="flex items-center gap-2"><Warehouse size={16} className="text-sky-700" /> Opening stock to start</span>
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Inventory Management Included in Every Plan</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Brick and raw material stock come with both plans at no extra cost.</p>
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
                { to: PRODUCTION_PAGE, label: 'Brick kiln production management' },
                { to: ONLINE_PAGE, label: 'Online brick kiln management' },
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
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Inventory Management FAQs" />
            <div className="mt-12 divide-y divide-slate-200 rounded-2xl bg-white ring-1 ring-slate-200">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 transition hover:bg-sky-50/50 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base">{q}</h3>
                    <ChevronDown size={20} className="shrink-0 text-sky-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-orange-50 px-6 py-14 text-center ring-1 ring-slate-200 sm:px-12">
            <BrickPattern className="fill-slate-900/[0.03]" />
            <div className="relative">
              <Warehouse size={36} className="mx-auto text-sky-700" />
              <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Know your stock without counting it</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600">See how {site.name} tracks your brick and raw material inventory.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="btn-primary px-7 py-3.5 text-base">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} brick kiln inventory management software.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary px-7 py-3.5 text-base">
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
