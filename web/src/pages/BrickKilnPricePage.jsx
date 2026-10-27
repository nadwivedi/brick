import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeIndianRupee, BarChart3, Boxes, Building2, Check, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardCheck, Cloud, FileText, HandCoins, Headphones, Layers, MessageCircle, Settings2, ShieldCheck, Smartphone,
  Sparkles, Users, Wallet,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, BrickStack, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { CONTACT_PAGE, scrollToSection } from '../lib/publicNav';
import { PLANS } from '../lib/plans';
import { site, whatsappLink } from '../lib/site';

const TITLE = `Brick Kiln Software Price in India - From ₹7,999/Year | ${site.name}`;
const DESCRIPTION = `Brick kiln software price in India starts at ₹7,999/year with ${site.name}. Compare single and multi brick kiln management software plans, features and FAQs.`;

const BENEFITS = [
  { icon: Boxes, title: 'Accurate stock, always', text: 'Brick and raw material stock update with every production, sale and purchase entry, so you never guess what is in the yard.' },
  { icon: FileText, title: 'Faster billing', text: 'Make sales invoices in seconds, with transport and trip charges calculated for you.' },
  { icon: HandCoins, title: 'Dues under control', text: 'Customer and vendor ledgers show who owes what, so payments are followed up on time.' },
  { icon: BarChart3, title: 'Know your real profit', text: 'Profit & loss reports bring sales, purchases and expenses together without manual calculation.' },
  { icon: ClipboardCheck, title: 'Less paperwork', text: 'Replace registers and spreadsheets with one organised system your whole team can use.' },
  { icon: Smartphone, title: 'Access from anywhere', text: 'Check your kiln from your phone, tablet or computer, whether you are at the site or away.' },
];

const PRICE_FACTORS = [
  { icon: Building2, title: 'Number of kilns or plants', text: 'Software for one kiln usually costs less than software that manages several kilns, each with its own stock and production.' },
  { icon: Layers, title: 'Features included', text: 'Some products charge extra for modules like billing, inventory, ledgers or reports. Others include everything in one price.' },
  { icon: Users, title: 'Number of users', text: 'Many tools price by user, so costs grow as your manager, accountant and staff need access.' },
  { icon: Headphones, title: 'Setup, training & support', text: 'Help with setting up masters, training staff and answering questions can be part of the price or charged separately.' },
  { icon: Cloud, title: 'Hosting & access', text: 'Online software that works in the browser saves you buying and maintaining your own server.' },
  { icon: Settings2, title: 'Customisation', text: 'Changes made specially for one business add to the cost compared with ready-to-use software.' },
];

const REASONS = [
  { icon: Layers, title: 'Built for brick kilns', text: 'Plants, brick types, raw materials, trips and parties work the way a brick business already does.' },
  { icon: BadgeIndianRupee, title: 'Simple yearly pricing', text: 'Two clear plans with a flat yearly price. The only difference is how many kilns you run.' },
  { icon: CheckCircle2, title: 'Complete feature set', text: 'Production, stock, sales, purchases, ledgers, expenses and reports are included in both plans.' },
  { icon: Smartphone, title: 'Works on any device', text: 'Mobile app and desktop software included. Use it on a phone at the kiln or a computer in the office.' },
  { icon: ShieldCheck, title: 'Safe & private', text: 'Password-protected logins, with each business seeing only its own records.' },
  { icon: MessageCircle, title: 'Easy to reach', text: 'Call us or message us on WhatsApp whenever you have a question.' },
];

const FAQS = [
  {
    q: 'What is the brick kiln software price in India?',
    a: `Brick kiln software price in India depends on the number of kilns, the features included and the support offered. With ${site.name}, brick kiln management software starts at ₹7,999 per year for a single kiln, and ₹9,999 per year for businesses running multiple kilns.`,
  },
  {
    q: `How much does ${site.name} cost per year?`,
    a: `${site.name} has two plans: Brick Kiln Management Software at ₹7,999 per year, and Multi Brick Kiln Management Software at ₹9,999 per year.`,
  },
  {
    q: 'What is the difference between the two plans?',
    a: 'Both plans include production, stock, sales, purchases, ledgers, expenses and reports. The multi brick kiln plan adds management of several kilns or plants from one login, with production, stock, sales, purchases, expenses and trip rates kept plant-wise.',
  },
  {
    q: 'Which plan is right for my brick kiln?',
    a: 'If you run one kiln or plant, the ₹7,999 Brick Kiln Management Software plan covers everything you need. If you run two or more kilns and want to see each one separately as well as together, choose the ₹9,999 Multi Brick Kiln Management Software plan.',
  },
  {
    q: 'What features are included in the brick kiln management software?',
    a: 'Daily production tracking, raw material stock with low stock alerts, sales invoices with transport charges, purchases, customer and vendor ledgers, expenses, cash and bank accounts, labour and vehicle records, and profit & loss reports.',
  },
  {
    q: 'Can I use the brick kiln software on my mobile phone?',
    a: `Yes. Every plan includes the ${site.name} mobile app and desktop software, and it also works in the web browser on phones, tablets and computers.`,
  },
  {
    q: 'Is my brick kiln data safe?',
    a: 'Every account is protected by a password, and each business can see only its own records.',
  },
  {
    q: 'How do I buy the software or get a demo?',
    a: `Call us on ${site.phone} or message us on WhatsApp, and we will help you choose the right plan and get started.`,
  },
];

// Search engines read this to show the FAQs and the plan prices in results.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: site.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      offers: PLANS.map(p => ({ '@type': 'Offer', name: p.name, price: p.priceValue, priceCurrency: 'INR' })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

const planEnquiry = (plan) => whatsappLink(`Hi, I'm interested in ${plan.name} (₹${plan.price}/year). Please share the details.`);

function PricingCard({ plan }) {
  const featured = plan.featured;
  return (
    <div className={`relative flex flex-col rounded-3xl p-7 sm:p-8 ${featured
      ? 'bg-gradient-to-b from-white to-orange-50/70 shadow-2xl shadow-orange-200/50 ring-2 ring-orange-500'
      : 'bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200'}`}
    >
      {featured && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-700 to-orange-500 px-4 py-1 text-xs font-bold text-white shadow-md">
          For multiple kilns
        </span>
      )}
      {/* Room for two lines keeps both cards' prices level when one name wraps */}
      <h3 className="text-xl font-bold text-slate-900 md:min-h-[3.5rem]">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{plan.audience}</p>
      <p className="mt-6 flex items-end gap-1">
        <span className="text-5xl font-extrabold tracking-tight text-slate-900">₹{plan.price}</span>
        <span className="mb-1.5 text-base font-semibold text-slate-500">/year</span>
      </p>
      <a
        href={planEnquiry(plan)}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-6 py-3 text-[15px] ${featured ? 'btn-primary' : 'btn-secondary'}`}
      >
        <WhatsAppIcon size={18} /> Choose This Plan
      </a>
      <ul className="mt-7 space-y-3 border-t border-slate-200 pt-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${featured ? 'bg-orange-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              <Check size={13} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hero artwork: both prices on a card, with bricks stacked behind it.
function PriceVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-orange-200/70 via-amber-100/50 to-primary-200/60 blur-2xl" />
      <BrickStack className="absolute -top-[46px] right-6 w-24 drop-shadow-lg sm:-top-[58px] sm:right-10 sm:w-[7.5rem]" />

      <div className="relative rounded-2xl bg-white p-6 shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-md shadow-orange-600/30">
            <Wallet size={22} />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500">{site.name} plans</p>
            <p className="font-bold text-slate-900">Simple yearly pricing</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {PLANS.map(p => (
            <div key={p.name} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${p.featured ? 'border-orange-200 bg-orange-50/60' : 'border-slate-200 bg-slate-50/60'}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{p.featured ? 'Multiple kilns' : 'Single kiln'}</p>
                <p className="truncate text-xs text-slate-500">{p.name}</p>
              </div>
              <p className="shrink-0 text-right">
                <span className="block text-lg font-extrabold text-slate-900">₹{p.price}</span>
                <span className="block text-[11px] font-medium text-slate-500">per year</span>
              </p>
            </div>
          ))}
        </div>

        <ul className="mt-5 space-y-2 text-xs font-medium text-slate-600">
          {['All core features in both plans', 'Works on phone, tablet & desktop'].map(t => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function BrickKilnPricePage() {
  usePageMeta(TITLE, DESCRIPTION);

  // Footer links open this page from the bottom of the homepage, so start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const viewPricing = (e) => {
    e.preventDefault();
    scrollToSection('pricing');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:pb-28">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span>Products</span>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">Brick Kiln Software Price in India</span>
            </nav>

            <div className="mt-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                  <Sparkles size={14} /> Brick Kiln Management Software
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.2rem]">
                  Brick Kiln Software{' '}
                  <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Price in India</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                  {site.name} is brick kiln management software that brings production, raw material stock, sales,
                  dues and expenses into one simple system. Get clear, affordable yearly pricing made for brick
                  manufacturers across India.
                </p>

                <div className="mx-auto mt-8 inline-flex items-center gap-4 rounded-2xl border border-orange-200 bg-white px-5 py-4 text-left shadow-lg shadow-orange-100/70 lg:mx-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <BadgeIndianRupee size={26} />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Starting at</span>
                    <span className="block text-3xl font-extrabold text-slate-900">
                      ₹7,999<span className="text-base font-semibold text-slate-500">/year</span>
                    </span>
                  </span>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#pricing" onClick={viewPricing} className="btn-primary px-7 py-3.5 text-base">
                    View Pricing <ArrowRight size={18} />
                  </a>
                  <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">
                    Contact Us
                  </Link>
                </div>
              </div>
              <PriceVisual />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Pricing"
              title="Brick Kiln Management Software Plans"
              text="Two straightforward yearly plans. Pick the one that matches the number of kilns you run."
            />
            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2 md:items-start">
              {PLANS.map(p => <PricingCard key={p.name} plan={p} />)}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">Prices are per year, in Indian Rupees.</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Benefits"
              title="Why Use Brick Kiln Management Software?"
              text="Running a kiln on registers and memory costs you time and money. The right software pays for itself in better control."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 text-orange-700 ring-1 ring-orange-200/60 transition group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing factors */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Pricing factors"
              title="What Affects Brick Kiln Software Price in India?"
              text="When you compare brick kiln software, these are the things that usually change the price."
            />
            <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {PRICE_FACTORS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-14 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/60 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900">How {site.name} keeps it simple</h3>
              <p className="mt-2 text-slate-700">
                Both plans include the full set of features: production, stock, sales, purchases, ledgers, expenses and
                reports. You only choose between one kiln at <strong>₹7,999/year</strong> or multiple kilns at <strong>₹9,999/year</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Why choose */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={`Why ${site.name}`} title={`Why Choose ${site.name}?`} />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REASONS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Brick Kiln Software Price: Frequently Asked Questions" />
            <div className="mt-12 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-slate-50/50 transition open:bg-white open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {q}
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f2a3c] via-[#27374f] to-[#7c2d12] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.04]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Get the right plan for your brick kiln</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Talk to us about your kilns and we will help you choose between the ₹7,999 and ₹9,999 plans.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={CONTACT_PAGE} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  Contact Us <ArrowRight size={18} />
                </Link>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
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
