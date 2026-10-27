import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, ClipboardList, FileText, Hammer,
  HandCoins, HardHat, Landmark, Layers, LogIn, ShieldCheck, Smartphone, Sparkles, TrendingUp, Truck, Users,
} from 'lucide-react';
import ContactSection from '../components/ContactSection';
import WhatsAppButton from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import { FEATURES_PAGE, scrollToSection } from '../lib/publicNav';
import { appLink, site } from '../lib/site';


const FEATURES = [
  { icon: Hammer, title: 'Production tracking', text: 'Record daily output by plant, brick type and shift, along with the raw material used and any damaged bricks.' },
  { icon: Boxes, title: 'Raw material stock', text: 'Cement, fly ash, sand and more. Stock moves with every purchase and production entry.' },
  { icon: FileText, title: 'Sales & invoices', text: 'Create invoices in seconds, with transport and trip charges worked in.' },
  { icon: Users, title: 'Party ledgers', text: 'One ledger per customer and vendor shows exactly who owes what, and since when.' },
  { icon: Landmark, title: 'Expenses, cash & bank', text: 'Log every expense and keep a live balance for each cash and bank account.' },
  { icon: HardHat, title: 'Labour & vehicles', text: 'Keep your workers and delivery vehicles on record, right next to the work they do.' },
  { icon: BarChart3, title: 'Reports & profit', text: 'Profit & loss and ledger reports, ready whenever you or your accountant need them.' },
  { icon: AlertTriangle, title: 'Low stock alerts', text: 'Get warned before a raw material runs out and production has to stop.' },
];

const BENEFITS = [
  'Replace paper registers and scattered spreadsheets',
  'Know your brick and material stock at any moment',
  'Collect dues on time with clear party ledgers',
  'Run several plants from a single login',
  'Works on phone, tablet and desktop',
  "Your business data stays private to your account",
];

const STEPS = [
  { icon: Building2, title: 'Set up your plant', text: 'Add your plants, brick types, raw materials and parties once.' },
  { icon: ClipboardList, title: 'Record the day', text: 'Enter production, sales, purchases and expenses as they happen.' },
  { icon: TrendingUp, title: 'See the full picture', text: 'Stock, dues and profit are worked out for you, always up to date.' },
];

const VALUES = [
  { icon: Layers, title: 'Made for brick plants', text: 'Built around how brick businesses actually work: plants, brick types, trips and parties.' },
  { icon: Smartphone, title: 'Simple to use', text: 'Clear screens your manager and staff can learn in a day, on any device.' },
  { icon: ShieldCheck, title: 'Safe & secure', text: 'Password-protected logins, with each business seeing only its own data.' },
];


// Illustrative preview of the dashboard, so visitors can picture the product.
function HeroPreview() {
  const bars = [55, 70, 48, 82, 66, 90, 74];
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-200/70 via-amber-100/50 to-primary-200/60 blur-2xl" />

      <div className="relative rounded-2xl bg-white p-[1.125rem] shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200 sm:p-[1.35rem] lg:p-[0.9rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Today at your plant</p>
            <p className="font-bold text-slate-900">Dashboard</p>
          </div>
          <span className="badge-gray">Sample view</span>
        </div>

        <div className="mt-[1.125rem] grid grid-cols-2 gap-[0.675rem] lg:mt-[0.675rem] lg:gap-[0.5625rem]">
          {[
            { icon: Hammer, label: 'Bricks made today', value: '12,500', note: '+8% vs yesterday', card: 'from-orange-50 ring-orange-100', chip: 'from-orange-600 to-orange-500 shadow-orange-200', noteCls: 'text-emerald-600' },
            { icon: Truck, label: 'Bricks sold today', value: '9,800', note: '6 trips delivered', card: 'from-primary-50 ring-primary-100', chip: 'from-primary-600 to-primary-500 shadow-primary-200', noteCls: 'text-slate-500' },
            { icon: Layers, label: 'Ready stock', value: '48,200', note: 'Across 3 brick types', card: 'from-amber-50 ring-amber-100', chip: 'from-amber-500 to-amber-400 shadow-amber-200', noteCls: 'text-slate-500' },
            { icon: HandCoins, label: 'Dues to collect', value: '₹1.8L', note: '₹42K received today', card: 'from-emerald-50 ring-emerald-100', chip: 'from-emerald-600 to-emerald-500 shadow-emerald-200', noteCls: 'text-emerald-600' },
          ].map(({ icon: Icon, label, value, note, card, chip, noteCls }) => (
            <div key={label} className={`rounded-xl bg-gradient-to-br to-white px-[0.675rem] py-[0.5rem] ring-1 lg:px-[0.5625rem] lg:py-[0.4rem] ${card}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md lg:h-6 lg:w-6 ${chip}`}><Icon size={14} /></span>
                <p className="text-[11px] font-semibold leading-tight text-slate-600">{label}</p>
              </div>
              <p className="mt-[0.3rem] text-xl font-extrabold leading-tight tracking-tight text-slate-900 lg:mt-[0.2rem] lg:text-lg">{value}</p>
              <p className={`text-[10.5px] font-medium leading-tight ${noteCls}`}>{note}</p>
            </div>
          ))}
        </div>

        <div className="mt-[0.9rem] rounded-xl border border-slate-100 p-[0.9rem] lg:mt-[0.675rem] lg:p-[0.675rem]">
          <p className="text-xs font-semibold text-slate-600">Production this week</p>
          <div className="mt-[0.675rem] flex h-24 items-end gap-[0.45rem] lg:mt-[0.45rem] lg:h-12">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-orange-600 to-orange-400" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="mt-[0.9rem] space-y-[0.45rem] lg:mt-[0.5625rem]">
          {[
            { label: 'Invoice #1042 · 4,000 bricks', status: 'Paid', cls: 'badge-green' },
            { label: 'Cement purchase · 50 bags', status: 'Due', cls: 'badge-orange' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-[0.675rem] py-[0.45rem] text-xs lg:py-[0.3375rem]">
              <span className="truncate font-medium text-slate-700">{r.label}</span>
              <span className={r.cls}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Arriving from another page via /#about, /#contact etc.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) scrollToSection(hash.slice(1));
  }, [hash]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <Navbar />

      <main>
        {/* Hero */}
        <section id="home" className="relative scroll-mt-20 overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-[3.15rem] px-4 pb-[1.35rem] pt-[1.35rem] sm:px-6 sm:pt-[1.8rem] lg:grid-cols-[1.1fr_1fr] lg:gap-[2.25rem] lg:pb-[1.575rem] lg:pt-[3.6rem]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                <Sparkles size={14} /> Software for brick manufacturers
              </span>
              <h1 className="mt-[1.35rem] text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:mt-[0.9rem] lg:text-[2.6rem]">
                Run your brick plant{' '}
                <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">smarter</span>,
                from one dashboard
              </h1>
              <p className="mx-auto mt-[1.35rem] max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0 lg:mt-[0.9rem] lg:text-base">
                {site.name} tracks production, raw material stock, sales, dues and expenses for your brick business,
                so you always know what was made, what was sold and who still has to pay.
              </p>
              <div className="mt-[1.8rem] flex flex-col justify-center gap-[0.675rem] sm:flex-row lg:mt-[1.125rem] lg:justify-start">
                <a href={appLink('/register')} className="btn-primary px-7 py-3.5 text-base">
                  Get Started <ArrowRight size={18} />
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                  className="btn-secondary px-7 py-3.5 text-base"
                >
                  Request a Demo
                </a>
              </div>
              <ul className="mt-[1.8rem] flex flex-wrap items-center justify-center gap-x-3 gap-y-[0.45rem] text-[11px] font-medium text-slate-600 sm:gap-x-[1.35rem] sm:text-sm lg:mt-[0.9rem] lg:justify-start">
                {['Works on any device', 'Multiple plants', 'Secure login'].map(t => (
                  <li key={t} className="flex items-center gap-1 whitespace-nowrap sm:gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" /> {t}</li>
                ))}
              </ul>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Features"
              title="Everything your plant tracks, in one place"
              text="From the first batch of the morning to the last truck out, every entry lands in the right register automatically."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 text-orange-700 ring-1 ring-orange-200/60 transition group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to={FEATURES_PAGE} className="btn-secondary px-6 py-3">
                See all features <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits + how it works */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Why {site.name}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Less paperwork. More control.</h2>
              <p className="mt-4 text-slate-600">
                Most brick plants run on registers, phone calls and memory. {site.name} turns that into clear numbers you can trust.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {BENEFITS.map(b => (
                  <li key={b} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <ol className="space-y-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-md shadow-primary-700/20">
                    <Icon size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Step {i + 1}</p>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 pb-20 pt-10 sm:pb-24 sm:pt-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="About Us"
              title={`About ${site.name}`}
              text={`${site.name} is management software built for brick manufacturing businesses, from a single kiln to several plants. It brings production, stock, sales, purchases, labour and accounts together, so owners and managers can make decisions on up-to-date numbers instead of guesswork.`}
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Icon size={26} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#27374f] to-[#7c2d12] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to run your plant digitally?</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Create your account and record your first production entry in minutes.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Create Your Account <ArrowRight size={18} />
                </a>
                <a href={appLink('/login')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  <LogIn size={18} /> Login
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-20 sm:pt-24" />
        <ContactSection />
      </main>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
