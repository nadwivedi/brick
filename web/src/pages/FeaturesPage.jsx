import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, Boxes, Building2, CheckCircle2, ChevronDown, ChevronRight,
  Coins, FileText, FileUp, Gauge, Hammer, ShieldAlert, HandCoins, HardHat, Landmark, LayoutDashboard, Layers, Lock, Package, Receipt, Scale,
  Monitor, RefreshCw, Send, ShoppingCart, Smartphone, Sparkles, Tags, Truck, Users, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import {
  BILLING_PAGE, CONTACT_PAGE, EXPENSE_PAGE, FEATURES_PAGE, PAYMENT_PAGE, PLANT_PAGE, PRICE_PAGE, PRODUCTION_PAGE, REPORTS_PAGE, scrollToSection,
} from '../lib/publicNav';
import { appLink, site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Management Software Features | ${site.name}`;
const DESCRIPTION = `Run your brick plant digitally with no paperwork. ${site.name} features: WhatsApp due reminders, low stock, quality and efficiency alerts, GST billing and reports.`;

// Headline features, shown first and named in the FAQs
const SMART = [
  { icon: WhatsAppIcon, title: 'WhatsApp payment reminders', text: 'Send any party their balance due with the latest entries on WhatsApp in one tap, so payments come in on time. Automatic scheduled reminders are coming soon.', tone: 'bg-[#25D366]' },
  { icon: FileUp, title: 'AI purchase entry from bill PDF', text: 'Upload a supplier bill as a PDF and AI fills in the purchase for you: vendor, items, quantities and amounts. Just check and save.', tone: 'bg-gradient-to-br from-violet-600 to-fuchsia-500', soon: true },
  { icon: AlertTriangle, title: 'Low stock alerts', text: 'Get warned when cement, fly ash, sand or any raw material falls below its minimum, before production has to stop.', tone: 'bg-gradient-to-br from-amber-500 to-orange-500' },
  { icon: ShieldAlert, title: 'Production quality alerts', text: 'Damaged bricks are tracked as a percentage of every production entry, so a bad batch or shift stands out straight away.', tone: 'bg-gradient-to-br from-rose-600 to-rose-500' },
  { icon: Gauge, title: 'Production efficiency tracking', text: 'See how many bricks you get from each bag of cement, so you know when material is being wasted.', tone: 'bg-gradient-to-br from-emerald-600 to-teal-500' },
];

// Every feature of the app, grouped the way its menu is. `more` links to the product page that covers the group in depth.
const GROUPS = [
  {
    id: 'production',
    title: 'Brick Production & Stock Management',
    short: 'Production',
    text: 'Know what was made, what was used and what is left, at every plant.',
    tone: 'from-orange-600 to-orange-500',
    soft: 'bg-orange-50 text-orange-700',
    more: { to: PRODUCTION_PAGE, label: 'Production management' },
    features: [
      { icon: Hammer, title: 'Daily production entry', text: 'Record bricks made by plant, brick type and shift, with damaged bricks noted separately.' },
      { icon: Boxes, title: 'Raw material used', text: 'Cement, fly ash, sand and other materials used in each batch come out of stock automatically.' },
      { icon: Package, title: 'Raw material stock', text: 'Purchases add stock and production uses it up, so the balance is always current.' },
      { icon: Layers, title: 'Ready brick stock', text: 'Live stock for every brick type, moving with each production and sale.' },
      { icon: BookOpen, title: 'Stock ledgers', text: 'Opening, in, out and closing stock for every material and brick type, for any dates.' },
      { icon: AlertTriangle, title: 'Low stock alerts', text: 'Set a minimum level per material and see what is running low before production stops.' },
    ],
  },
  {
    id: 'sales',
    title: 'Brick Sales, GST Billing & Purchases',
    short: 'Sales & GST',
    text: 'Bill customers and record what you buy, with transport worked in.',
    tone: 'from-primary-600 to-primary-500',
    soft: 'bg-primary-50 text-primary-700',
    more: { to: BILLING_PAGE, label: 'Billing software' },
    features: [
      { icon: FileText, title: 'Sales invoices with GST', text: 'Create invoices in seconds for any brick type and quantity, with GST and discounts.' },
      { icon: Truck, title: 'Transport & trip charges', text: 'Add delivery and trip charges to invoices, and track hired vehicles used for delivery.' },
      { icon: ShoppingCart, title: 'Purchases', text: 'Record raw material bought from each vendor, with transport costs on purchases.' },
      { icon: Receipt, title: 'Paid and due status', text: 'Every invoice and purchase shows whether it is paid, part paid or still due.' },
    ],
  },
  {
    id: 'money',
    title: 'Payment Tracking, Dues & Party Ledgers',
    short: 'Payments',
    text: 'See exactly who owes you, whom you owe, and since when.',
    tone: 'from-emerald-600 to-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
    more: { to: PAYMENT_PAGE, label: 'Payment tracking' },
    features: [
      { icon: HandCoins, title: 'Money received', text: 'Record payments from customers against their dues, in cash or to a bank account.' },
      { icon: Send, title: 'Money paid', text: 'Record payments to vendors and others, and their balance updates straight away.' },
      { icon: Users, title: 'Party ledgers', text: 'One ledger per customer and vendor with every bill and payment, and the running balance.' },
      { icon: Landmark, title: 'Cash & bank accounts', text: 'A live balance for each cash and bank account, with its own ledger.' },
    ],
  },
  {
    id: 'expenses',
    title: 'Brick Kiln Expense Management',
    short: 'Expenses',
    text: 'Log every rupee spent and see where the money goes.',
    tone: 'from-rose-600 to-rose-500',
    soft: 'bg-rose-50 text-rose-700',
    more: { to: EXPENSE_PAGE, label: 'Expense management' },
    features: [
      { icon: Wallet, title: 'Expense entries', text: 'Record expenses by plant and date, paid from cash or a bank account.' },
      { icon: Tags, title: 'Expense categories', text: 'Group spending into your own categories such as diesel, wages, repairs or electricity.' },
    ],
  },
  {
    id: 'reports',
    title: 'Dashboard & Brick Kiln Reports',
    short: 'Reports',
    text: 'Your numbers worked out for you, for any period you pick.',
    tone: 'from-violet-600 to-violet-500',
    soft: 'bg-violet-50 text-violet-700',
    more: { to: REPORTS_PAGE, label: 'Report management' },
    features: [
      { icon: LayoutDashboard, title: 'Dashboard', text: 'Production, sales, collections, purchases, expenses and dues at a glance, with a production trend.' },
      { icon: Activity, title: 'Activity center', text: 'Everything recorded across the business, filtered by date and plant.' },
      { icon: BarChart3, title: 'Production & sales reports', text: 'Daily production, sales trend and sales against money actually collected.' },
      { icon: Scale, title: 'Profit & loss', text: 'Income against expenses, net profit or loss and your cost per brick.' },
      { icon: Coins, title: 'Outstanding & party reports', text: 'Who still owes you, and what each party owes or is owed for the period.' },
    ],
  },
  {
    id: 'setup',
    title: 'Multi-Plant, Labour & Vehicle Management',
    short: 'Plants & Setup',
    text: 'Set up your business once and every entry fits into place.',
    tone: 'from-amber-500 to-amber-400',
    soft: 'bg-amber-50 text-amber-700',
    more: { to: PLANT_PAGE, label: 'Multi-plant management' },
    features: [
      { icon: Building2, title: 'Multiple plants', text: 'Run several kilns or plants from one login, with records kept plant-wise.' },
      { icon: Layers, title: 'Brick types', text: 'Your own brick types and sizes, each with its own stock and rates.' },
      { icon: Boxes, title: 'Raw materials & units', text: 'List the materials you use and the units you measure them in: bags, tonnes, trolleys and more.' },
      { icon: HardHat, title: 'Labour', text: 'Keep a record of your workers alongside the work they do.' },
      { icon: Truck, title: 'Vehicles', text: 'Your delivery vehicles, each with its own ledger of trips and costs.' },
      { icon: Users, title: 'Parties', text: 'Customers and vendors in one list, ready to pick on any invoice or payment.' },
    ],
  },
];

const FAQS = [
  {
    q: 'What features does brick kiln management software have?',
    a: `${site.name} covers daily brick production, raw material and brick stock, sales invoices with GST, purchases, payments received and paid, party ledgers, expenses, cash and bank accounts, reports with profit & loss, and management of multiple plants.`,
  },
  {
    q: `Can ${site.name} send WhatsApp reminders for due payments?`,
    a: 'Yes. From any party ledger you can send the party their balance due and latest entries on WhatsApp in one tap. Automatic scheduled reminders are coming soon.',
  },
  {
    q: 'Can I add a purchase by uploading the bill?',
    a: 'This is coming soon. You will upload the supplier bill as a PDF, AI will read it and fill in the purchase entry, and you check the details and save.',
  },
  {
    q: 'How does the software track production quality and efficiency?',
    a: 'Each production entry records damaged bricks, shown as a percentage so poor batches stand out. Efficiency is tracked as the number of bricks made per bag of cement.',
  },
  {
    q: 'Can I run my brick plant without paper registers?',
    a: `Yes. Production, stock, sales, purchases, payments and expenses are all recorded in ${site.name} on your phone or computer, and ledgers and reports are built automatically.`,
  },
  {
    q: `Is there a mobile app and desktop software for ${site.name}?`,
    a: 'Yes. After you buy a plan you get a dedicated mobile app for your phone or tablet and desktop software for your computer to install. You can use them together with the same account, and every entry shows up on all your devices.',
  },
  {
    q: 'Are all features included in every plan?',
    a: `Yes. Both plans include every feature: ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}.`,
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
        { '@type': 'ListItem', position: 2, name: 'Features', item: site.url + FEATURES_PAGE },
      ],
    },
  ],
};

const EVERYWHERE = [
  { icon: Smartphone, title: 'Dedicated mobile app', text: 'Install the mobile app on your phone or tablet and make entries right at the kiln.' },
  { icon: Monitor, title: 'Desktop software', text: 'Install the desktop software on your office computer for billing, ledgers and reports.' },
  { icon: RefreshCw, title: 'Multi-device support', text: 'Use phone, tablet, desktop and browser together. Every entry shows up on all of them.' },
  { icon: Lock, title: 'Secure login', text: 'Password-protected, and each business sees only its own data.' },
];

// The install steps after buying a plan
const INSTALL_STEPS = [
  { title: 'Buy your plan', text: 'Choose the plan for one kiln or for multiple kilns.' },
  { title: 'Get the apps', text: 'We share the mobile app and desktop software with you to install.' },
  { title: 'Log in everywhere', text: 'Sign in with the same account on every device and start working.' },
];

export default function FeaturesPage() {
  usePageMeta(TITLE, DESCRIPTION, FEATURES_PAGE);

  // Navbar and footer links open this page from further down another page, so start at the top
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
          <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:pb-16">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Features</span>
            </nav>
            <div className="mx-auto mt-10 max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                <Sparkles size={14} /> Run your brick plant digitally, no paperwork
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                Brick Kiln Management Software{' '}
                <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Features</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                Replace paper registers with one app. {site.name} records your production, stock, sales, purchases,
                payments and expenses, reminds parties of their dues on WhatsApp and warns you about low stock,
                quality and efficiency, from the first batch of the morning to the last payment collected.
              </p>
            </div>

            {/* Jump links to each group */}
            <nav aria-label="Feature groups" className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-1.5 sm:mt-10 sm:gap-2">
              {GROUPS.map(g => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  onClick={jumpTo(g.id)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-orange-700 hover:ring-orange-200 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {/* Short name on phones, full keyword name from tablet up */}
                  <span className="sm:hidden">{g.short}</span>
                  <span className="hidden sm:inline">{g.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* Smart features */}
        <section id="smart" aria-labelledby="smart-heading" className="scroll-mt-20 px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/70 to-white px-5 py-10 shadow-xl shadow-orange-100/60 ring-1 ring-orange-200/70 sm:px-10 sm:py-14">
            <BrickPattern className="fill-orange-900/[0.06]" />
            <div className="relative">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Smart features</p>
                <h2 id="smart-heading" className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Automation That Saves Hours Every Day</h2>
                <p className="mt-3 text-slate-600">Less typing, fewer follow-up calls and early warnings before small problems get expensive.</p>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SMART.map(({ icon: Icon, title, text, tone, soon }) => (
                  <article key={title} className="relative rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-orange-100 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-100">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg ${tone}`}>
                      <Icon size={20} />
                    </span>
                    {soon && <span className="absolute right-4 top-4 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">Coming soon</span>}
                    <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature groups */}
        {GROUPS.map((g, i) => (
          <section key={g.id} id={g.id} className={`scroll-mt-20 py-14 sm:py-20 ${i % 2 ? '' : 'bg-white'}`}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${g.soft}`}>
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{g.title}</h2>
                  <p className="mt-2 text-slate-600">{g.text}</p>
                </div>
                <Link to={g.more.to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                  {g.more.label} in detail <ChevronRight size={16} />
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.features.map(({ icon: Icon, title, text }) => (
                  <article key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${g.tone}`}>
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Works everywhere */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Mobile app & desktop software"
              title="Brick Kiln Software on Every Device"
              text="After you buy a plan, you get a dedicated mobile app and desktop software to install, all working from one account."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EVERYWHERE.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-gradient-to-b from-orange-50/70 to-white p-6 text-center ring-1 ring-orange-100">
                  <Icon size={26} className="mx-auto text-orange-700" />
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <ol className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
              {INSTALL_STEPS.map(({ title, text }, i) => (
                <li key={title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900">Every Feature, in Every Plan</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">No add-ons to buy. Pick a plan by how many kilns or plants you run.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple kilns' : 'One kiln'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/year</span></p>
                </div>
              ))}
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
              {['All features included', 'Mobile app & desktop software', 'Billed yearly'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600" /> {t}</li>
              ))}
            </ul>
            <Link to={PRICE_PAGE} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
              Compare plans <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Software Features: FAQs" />
            <div className="mt-10 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-white ring-1 ring-slate-200 transition open:shadow-md open:ring-orange-200">
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
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.06]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to run your kiln on {site.name}?</h2>
              <p className="mx-auto mt-4 max-w-xl text-orange-50">Start today, or talk to us and we&apos;ll show you how it fits your plant.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Get Started <ArrowRight size={18} />
                </a>
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  Request a Demo
                </Link>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} features.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  <WhatsAppIcon size={18} /> WhatsApp
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
