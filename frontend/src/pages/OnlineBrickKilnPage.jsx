import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Boxes, Check, CheckCircle2, ChevronDown, ChevronRight, Cloud, Download, FileText, Globe,
  Hammer, HandCoins, Landmark, Laptop, Lock, Monitor, RefreshCw, Server, ShoppingCart, Smartphone, Sparkles,
  Sun, Sunrise, Sunset, Moon, Truck, Users, Wifi, X,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import { BHATTA_PAGE, MANUFACTURING_PAGE, ONLINE_PAGE, PLANT_PAGE, PRICE_PAGE, scrollToSection, useGoToSection } from '../lib/publicNav';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Online Brick Kiln Management Software | ${site.name}`;
const DESCRIPTION = `Online brick kiln management software by ${site.name}. Manage production, stock, sales, dues and expenses of your kiln from any phone or computer, anywhere.`;

// Installed (desktop) software compared with online software, in general terms.
const INSTALLED_VS_ONLINE = [
  { installed: 'Installed on one office computer', online: 'Opens in the browser on any phone, tablet or computer' },
  { installed: 'Records stay on that one machine', online: 'One central account, the same records on every device' },
  { installed: 'New versions installed by hand', online: 'Always the latest version when you open it' },
  { installed: 'You see the numbers only at the office', online: 'Check your kiln from home, the site or while travelling' },
];

const BENEFITS = [
  { icon: Globe, title: 'Access from anywhere', text: 'Log in from the kiln, the office or home. All you need is an internet connection.' },
  { icon: Download, title: 'Nothing to install', text: 'No setup CDs, no downloads, no installation. Open the website and log in.' },
  { icon: RefreshCw, title: 'Same data on every device', text: 'An entry saved on a phone at the kiln shows up on the office computer straight away.' },
  { icon: Sparkles, title: 'Always up to date', text: 'Improvements reach you the next time you open the software, with nothing to update yourself.' },
  { icon: Server, title: 'No server to buy', text: 'Your records live in your online account, so there is no special computer to buy or maintain at the kiln.' },
  { icon: Lock, title: 'Secure login', text: 'Every account is protected by a password, and each business sees only its own records.' },
];

const DAY = [
  { icon: Sunrise, time: 'Morning', device: 'Phone at the kiln', title: 'Production recorded', text: 'Yesterday\'s brick count goes in by brick type, with the raw material used and any damaged bricks.' },
  { icon: Sun, time: 'Midday', device: 'Phone at the kiln', title: 'Sale invoiced', text: 'A truck leaves with bricks. The invoice is made with transport charges and the stock goes down.' },
  { icon: Sunset, time: 'Afternoon', device: 'Office computer', title: 'Purchase and expenses entered', text: 'A coal or cement delivery and the day\'s expenses are recorded, and balances update.' },
  { icon: Moon, time: 'Evening', device: 'Owner\'s phone, at home', title: 'Business reviewed', text: 'The owner opens the dashboard to see production, sales, collections and dues for the day.' },
];

const MODULES = [
  { icon: Hammer, label: 'Daily production by brick type' },
  { icon: Boxes, label: 'Raw material and brick stock' },
  { icon: FileText, label: 'GST invoices with trip charges' },
  { icon: ShoppingCart, label: 'Purchases from vendors' },
  { icon: Users, label: 'Customer and vendor ledgers' },
  { icon: HandCoins, label: 'Money received and paid' },
  { icon: Landmark, label: 'Expenses, cash and bank' },
  { icon: Truck, label: 'Labour and vehicles' },
  { icon: BarChart3, label: 'Profit & loss and reports' },
];

const NEEDS = [
  { icon: Wifi, title: 'An internet connection', text: 'Mobile data or Wi-Fi. The software needs to be online to save and load your records.' },
  { icon: Monitor, title: 'A web browser', text: 'Any up-to-date browser, such as Chrome, on the devices you already use.' },
  { icon: Smartphone, title: 'A phone or computer', text: 'Use a phone at the kiln, a computer in the office, or both.' },
];

const FAQS = [
  {
    q: 'What is online brick kiln management software?',
    a: 'Online brick kiln management software runs in a web browser instead of being installed on one computer. Your kiln\'s production, stock, sales, purchases, expenses and dues are kept in one online account that you can open from any phone or computer.',
  },
  {
    q: 'Do I need to install anything?',
    a: `No. ${site.name} opens in the web browser, so there is nothing to download or install on your phone or computer.`,
  },
  {
    q: 'Can I manage my brick kiln from my mobile phone?',
    a: 'Yes. The software works on mobile phones, tablets and computers, so you can make entries at the kiln and check the dashboard from anywhere.',
  },
  {
    q: 'Does the software work without internet?',
    a: 'No. Because your records are kept online, the software needs a mobile data or Wi-Fi connection to save and load them.',
  },
  {
    q: 'Will I see the same records on my phone and computer?',
    a: 'Yes. Everything is stored in one central account, so an entry saved on one device shows up on every other device you log in from.',
  },
  {
    q: 'Is my brick kiln data safe online?',
    a: 'Your account is protected by a password, and each business can see only its own records.',
  },
  {
    q: 'Can I manage more than one brick kiln online?',
    a: 'Yes. With the multi brick kiln plan you can record work against each kiln, keep brick stock separate for each, and view one kiln or all of them together.',
  },
  {
    q: 'How much does online brick kiln management software cost?',
    a: `${site.name} costs ${PLANS.map(p => `₹${p.price} per year for ${p.featured ? 'multiple kilns' : 'one kiln'}`).join(' and ')}.`,
  },
];

// Matches the visible FAQs word for word.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

// Hero artwork: a laptop and a phone showing the same kiln records.
function DevicesVisual() {
  return (
    <figure
      role="img"
      aria-label="A laptop and a mobile phone showing the same brick kiln records in Brick Manager, synced online"
      className="relative mx-auto w-full max-w-lg pb-10"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-sky-200/60 via-primary-100/50 to-orange-200/50 blur-2xl" />

      {/* Laptop */}
      <div className="relative">
        <div className="rounded-t-2xl border-[10px] border-slate-800 bg-white shadow-2xl shadow-slate-400/40">
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-rose-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="ml-2 flex-1 truncate rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-400">Brick Manager · Dashboard</span>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold text-slate-500">Today at your kiln</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['Production', '12,500 pcs'], ['Sales', '₹48,000'], ['Dues', '₹1.1L']].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-100">
                  <p className="text-[9px] text-slate-500">{l}</p>
                  <p className="text-xs font-bold text-slate-900">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {['Production · 12,500 bricks', 'Invoice #1043 · 4,000 bricks'].map(r => (
                <div key={r} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">
                  {r}<span className="text-emerald-600"><Check size={11} strokeWidth={3} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto h-3 w-[110%] -translate-x-[4.5%] rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400" />
      </div>

      {/* Phone */}
      <div className="absolute -bottom-2 right-0 w-32 rounded-[1.6rem] border-[6px] border-slate-800 bg-white shadow-2xl sm:-right-4 sm:w-36">
        <div className="mx-auto mt-1.5 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="p-3">
          <p className="text-[9px] font-semibold text-slate-500">New Production</p>
          <p className="mt-1 text-sm font-bold text-slate-900">12,500</p>
          <p className="text-[9px] text-slate-500">bricks · Red brick</p>
          <span className="mt-2 flex items-center justify-center gap-1 rounded-md bg-emerald-500 py-1 text-[9px] font-bold text-white">
            <Check size={10} strokeWidth={3} /> Saved
          </span>
        </div>
      </div>

      {/* Sync badge */}
      <div className="absolute -top-5 left-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 sm:-left-6 sm:bottom-6 sm:top-auto">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Cloud size={16} /></span>
        <span className="text-xs">
          <span className="block font-semibold text-slate-900">Synced online</span>
          <span className="block text-slate-500">Same records everywhere</span>
        </span>
      </div>
    </figure>
  );
}

export default function OnlineBrickKilnPage() {
  usePageMeta(TITLE, DESCRIPTION, ONLINE_PAGE);
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50/70 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-sky-900/[0.03] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-24">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Online Brick Kiln Management Software</span>
            </nav>

            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-sky-800 shadow-sm">
                  <Cloud size={14} /> Cloud-based brick kiln software
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
                  Online Brick Kiln Management Software,{' '}
                  <span className="bg-gradient-to-r from-sky-600 to-primary-700 bg-clip-text text-transparent">Anywhere You Are</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} puts your whole brick kiln online. Record production at the kiln on your phone, make
                  invoices from the office, and check stock, sales and dues from home. There is nothing to install,
                  and every device shows the same up-to-date records.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#online" onClick={jumpTo('online')} className="btn-primary px-7 py-3.5 text-base">
                    Why Go Online <ArrowRight size={18} />
                  </a>
                  <a href="/#contact" onClick={goToSection('contact')} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </a>
                </div>
                <ul className="mt-8 flex flex-col items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 sm:flex-row sm:justify-center lg:justify-start">
                  {['No installation', 'Phone, tablet & computer', 'Secure login'].map(t => (
                    <li key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600" /> {t}</li>
                  ))}
                </ul>
              </div>
              <DevicesVisual />
            </div>
          </div>
        </section>

        {/* What is it + installed vs online */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">The basics</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">What Is Online Brick Kiln Management Software?</h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                It is software for running a brick kiln that lives on the internet instead of on a single computer.
                You open it in a web browser, log in, and work with the same records wherever you are. Web-based brick
                kiln software removes the biggest limit of installed software: being tied to one machine in one place.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-500"><Laptop size={20} /> Installed software</h3>
                <ul className="mt-5 space-y-3">
                  {INSTALLED_VS_ONLINE.map(r => (
                    <li key={r.installed} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500"><X size={12} strokeWidth={3} /></span>
                      {r.installed}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-primary-50/60 p-6 ring-2 ring-sky-400 sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-bold text-sky-800"><Cloud size={20} /> Online software, like {site.name}</h3>
                <ul className="mt-5 space-y-3">
                  {INSTALLED_VS_ONLINE.map(r => (
                    <li key={r.online} className="flex items-start gap-3 text-sm font-medium text-slate-800">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={12} strokeWidth={3} /></span>
                      {r.online}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits of online */}
        <section id="online" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Why go online"
              title="Benefits of Managing Your Brick Kiln Online"
              text="Running your kiln on online software changes where, when and how you can work."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group relative overflow-hidden rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-50 transition group-hover:bg-sky-100" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-primary-600 text-white shadow-md shadow-sky-600/20">
                    <Icon size={22} />
                  </span>
                  <h3 className="relative mt-5 font-bold text-slate-900">{title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* A day at the kiln */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="A day online"
              title="A Day at Your Brick Kiln, Managed Online"
              text="Different places, different devices, one set of records."
            />
            <ol className="relative mt-14 space-y-8 before:absolute before:bottom-2 before:left-6 before:top-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-300 before:via-orange-300 before:to-indigo-300 sm:before:left-1/2">
              {DAY.map(({ icon: Icon, time, device, title, text }, i) => (
                <li key={time} className={`relative flex gap-5 sm:w-1/2 ${i % 2 ? 'sm:ml-auto sm:pl-10' : 'sm:flex-row-reverse sm:pr-10 sm:text-right'}`}>
                  <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-orange-600 shadow-md ring-4 ring-orange-50 sm:absolute sm:top-0 ${i % 2 ? 'sm:-left-6' : 'sm:-right-6'}`}>
                    <Icon size={22} />
                  </span>
                  <div className="flex-1 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-700">{time} · <span className="text-slate-500">{device}</span></p>
                    <h3 className="mt-1 font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Modules */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">Features</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Your Whole Brick Kiln, Online</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Going online does not mean giving anything up. {site.name} covers the full daily work of a brick kiln,
                and every part of it is available from any device you log in from.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
              {MODULES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700"><Icon size={18} /></span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What you need */}
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-primary-50/60 p-8 ring-1 ring-sky-200 sm:p-12">
            <BrickPattern className="fill-sky-900/[0.03]" />
            <div className="relative">
              <h2 className="text-center text-3xl font-bold text-slate-900">What You Need to Get Started</h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">No special hardware. Just the things you already have.</p>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {NEEDS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl bg-white/90 p-6 text-center shadow-sm ring-1 ring-slate-200">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><Icon size={26} /></span>
                    <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing + related */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Pricing" title="Online Brick Kiln Software Plans" text="Yearly plans with every feature included and nothing to install." />
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              {PLANS.map(p => (
                <div key={p.name} className={`rounded-2xl p-6 shadow-lg shadow-slate-200/50 ${p.featured ? 'bg-gradient-to-b from-white to-sky-50 ring-2 ring-sky-500' : 'bg-white ring-1 ring-slate-200'}`}>
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'Multiple kilns' : 'One kiln'}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{p.name}</h3>
                  <p className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">₹{p.price}</span>
                    <span className="mb-1 text-sm font-semibold text-slate-500">/year</span>
                  </p>
                </div>
              ))}
            </div>
            <nav aria-label="Related pages" className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
              {[
                { to: PRICE_PAGE, label: 'Compare plans' },
                { to: PLANT_PAGE, label: 'Brick plant management software' },
                { to: MANUFACTURING_PAGE, label: 'Bricks manufacturing software' },
                { to: BHATTA_PAGE, label: 'Bhatta software' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-slate-200 transition hover:bg-primary-50 hover:ring-primary-200">
                  {l.label} <ChevronRight size={14} />
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Online Brick Kiln Management Software FAQs" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border-l-4 border-sky-200 bg-slate-50 transition open:border-sky-500 open:bg-white open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-sky-800 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <Cloud size={36} className="mx-auto text-sky-300" />
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Take your brick kiln online today</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Talk to us and see {site.name} running on your own phone.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="/#contact" onClick={goToSection('contact')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-sky-50">
                  Contact Us <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`Hi, I'd like to know more about ${site.name} online brick kiln management software.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
