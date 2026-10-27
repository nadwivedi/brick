import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calculator, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import WhatsAppButton from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { COST_GUIDE_PAGE, EXPENSE_PAGE, PRODUCTION_PAGE, REPORTS_PAGE } from '../lib/publicNav';
import { appLink, site } from '../lib/site';

const TITLE = `How to Calculate Cost per Brick (Formula & Example) | ${site.name}`;
const DESCRIPTION = 'Learn how to calculate the cost per brick for a brick kiln: the formula, every cost to include, a worked example in rupees and ways to bring the cost down.';
const PUBLISHED = '2026-10-27';

// The costs that go into one month's bricks, with the worked example's amounts
const COSTS = [
  { head: 'Raw material', what: 'Soil, fly ash, cement, sand and any other material used', amount: 320000 },
  { head: 'Fuel', what: 'Coal, wood or other fuel used to fire the kiln', amount: 180000 },
  { head: 'Labour', what: 'Wages for moulders, loaders, firemen and other workers', amount: 150000 },
  { head: 'Diesel & transport', what: 'Diesel for machines and vehicles, transport on purchases', amount: 40000 },
  { head: 'Power & repairs', what: 'Electricity, machine and kiln maintenance', amount: 30000 },
  { head: 'Other expenses', what: 'Office, staff food, small purchases and the rest', amount: 20000 },
];
const TOTAL = COSTS.reduce((t, c) => t + c.amount, 0);
const PRODUCED = 306000;
const DAMAGED = 6000;
const GOOD = PRODUCED - DAMAGED;

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
const perBrick = (n) => `₹${(TOTAL / n).toFixed(2)}`;

const TIPS = [
  { title: 'Cut damaged bricks', text: 'Every broken brick still used material, fuel and labour. Track damage per batch and shift to find where it happens.' },
  { title: 'Watch material per brick', text: 'Compare bricks made per bag of cement or tonne of fly ash month to month. A drop usually means waste.' },
  { title: 'Buy raw material at the right time', text: 'Low stock forces rushed, costly purchases. Reorder before material runs out.' },
  { title: 'Know where every rupee goes', text: 'Record expenses by category so small, regular costs like diesel and repairs do not go unnoticed.' },
];

const FAQS = [
  {
    q: 'What is the formula for cost per brick?',
    a: 'Cost per brick = total cost of production for a period ÷ number of good bricks produced in that period. Include raw material, fuel, labour, transport, power, repairs and other expenses.',
  },
  {
    q: 'Should damaged bricks be counted when calculating cost per brick?',
    a: `No. Divide by good bricks only, because damaged bricks cannot be sold. In the example on this page, dividing by all ${PRODUCED.toLocaleString('en-IN')} bricks gives ${perBrick(PRODUCED)}, but the true cost per sellable brick is ${perBrick(GOOD)}.`,
  },
  {
    q: 'How often should a brick kiln calculate cost per brick?',
    a: 'Every month at least, and for the full season or financial year. Monthly figures show problems early, such as rising fuel or more damaged bricks.',
  },
  {
    q: 'Can software calculate cost per brick automatically?',
    a: `Yes. ${site.name} brick kiln management software builds a profit & loss report from your production, purchase and expense entries, and shows the cost per brick for any period you choose.`,
  },
];

// Article, FAQ and breadcrumb data for Google and AI answers; the FAQ text matches the visible FAQs word for word
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'How to Calculate Cost per Brick for a Brick Kiln',
      description: DESCRIPTION,
      datePublished: PUBLISHED,
      dateModified: PUBLISHED,
      inLanguage: 'en-IN',
      mainEntityOfPage: site.url + COST_GUIDE_PAGE,
      image: `${site.url}/og-image.png`,
      author: { '@type': 'Organization', name: site.name, url: `${site.url}/` },
      publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: `${site.url}/brickmanager%20logo.png` } },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides' },
        { '@type': 'ListItem', position: 3, name: 'How to Calculate Cost per Brick', item: site.url + COST_GUIDE_PAGE },
      ],
    },
  ],
};

export default function CostPerBrickGuidePage() {
  usePageMeta(TITLE, DESCRIPTION, COST_GUIDE_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        <article>
          {/* Header */}
          <header className="relative overflow-hidden">
            <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
            <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                <Link to="/" className="transition hover:text-orange-700">Home</Link>
                <ChevronRight size={14} />
                <span>Guides</span>
                <ChevronRight size={14} />
                <span className="text-slate-700" aria-current="page">Cost per Brick</span>
              </nav>
              <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                <BookOpen size={14} /> Brick kiln guide
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                How to Calculate Cost per Brick for a Brick Kiln
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Knowing what one brick really costs you to make is the first step to pricing right and protecting your
                profit. Here is the formula, every cost to include and a worked example in rupees.
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500">
                By {site.name} · <time dateTime={PUBLISHED}>27 October 2026</time>
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
            {/* Formula */}
            <section aria-labelledby="formula" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-orange-200 sm:p-8">
              <h2 id="formula" className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Calculator size={24} className="text-orange-700" /> The Cost per Brick Formula
              </h2>
              <p className="mt-5 rounded-xl bg-orange-50 px-5 py-4 text-center text-lg font-bold text-orange-900 ring-1 ring-orange-200">
                Cost per brick = Total production cost ÷ Good bricks produced
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                Work it out for a fixed period, such as a month or a season. Add up every cost of making bricks in that
                period, then divide by the number of <strong>good</strong> bricks, not counting damaged ones, because only
                good bricks can be sold.
              </p>
            </section>

            {/* Costs to include */}
            <section aria-labelledby="costs" className="mt-12">
              <h2 id="costs" className="text-2xl font-bold text-slate-900">Costs to Include</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Missing even one regular cost makes bricks look cheaper than they are. Include all of these, with the
                amounts from our example month:
              </p>
              <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <caption className="sr-only">Brick kiln production costs for one example month</caption>
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr><th className="px-4 py-3">Cost</th><th className="px-4 py-3">What it covers</th><th className="px-4 py-3 text-right">Example month</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COSTS.map(c => (
                      <tr key={c.head}>
                        <th scope="row" className="px-4 py-3 font-semibold text-slate-900">{c.head}</th>
                        <td className="px-4 py-3 text-slate-600">{c.what}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{inr(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-orange-50">
                    <tr>
                      <th scope="row" colSpan={2} className="px-4 py-3 font-bold text-slate-900">Total production cost</th>
                      <td className="px-4 py-3 text-right font-extrabold text-orange-800">{inr(TOTAL)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Worked example */}
            <section aria-labelledby="example" className="mt-12">
              <h2 id="example" className="text-2xl font-bold text-slate-900">Worked Example</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                In the example month the kiln made {PRODUCED.toLocaleString('en-IN')} bricks, of which{' '}
                {DAMAGED.toLocaleString('en-IN')} were damaged, leaving {GOOD.toLocaleString('en-IN')} good bricks.
              </p>
              <ol className="mt-6 space-y-3">
                {[
                  ['Total production cost', inr(TOTAL)],
                  ['Good bricks produced', GOOD.toLocaleString('en-IN')],
                  ['Cost per brick', `${inr(TOTAL)} ÷ ${GOOD.toLocaleString('en-IN')} = ${perBrick(GOOD)}`],
                ].map(([k, v], i) => (
                  <li key={k} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{i + 1}</span>
                    <span className="flex-1 text-slate-600">{k}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
                <strong>Why good bricks only?</strong> Dividing by all {PRODUCED.toLocaleString('en-IN')} bricks gives{' '}
                {perBrick(PRODUCED)}, which hides the cost of the damaged ones. The true cost of a brick you can sell is{' '}
                {perBrick(GOOD)}. Sell below that and you lose money on every brick.
              </p>
            </section>

            {/* Tips */}
            <section aria-labelledby="tips" className="mt-12">
              <h2 id="tips" className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Lightbulb size={24} className="text-orange-700" /> How to Lower Your Cost per Brick
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {TIPS.map(t => (
                  <div key={t.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <h3 className="font-bold text-slate-900">{t.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Software */}
            <section aria-labelledby="software" className="mt-12 rounded-2xl bg-gradient-to-br from-orange-50 to-white p-6 ring-1 ring-orange-200 sm:p-8">
              <h2 id="software" className="text-2xl font-bold text-slate-900">Get Your Cost per Brick Automatically</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Adding all this up by hand every month takes hours. {site.name} brick kiln management software takes
                your daily <Link to={PRODUCTION_PAGE} className="font-semibold text-primary-700 hover:underline">production entries</Link>,
                purchases and <Link to={EXPENSE_PAGE} className="font-semibold text-primary-700 hover:underline">expenses</Link>, and its{' '}
                <Link to={REPORTS_PAGE} className="font-semibold text-primary-700 hover:underline">profit & loss report</Link> shows
                your cost per brick for any period. The production screen also tracks damaged bricks and bricks made per
                bag of cement, the two numbers that move your cost the most.
              </p>
              <a href={appLink('/register')} className="btn-primary mt-6 px-6 py-3">
                Try {site.name} <ArrowRight size={18} />
              </a>
            </section>
          </div>
        </article>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQs" title="Cost per Brick: FAQs" />
            <div className="mt-10 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition open:bg-white open:shadow-md open:ring-orange-200">
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
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
