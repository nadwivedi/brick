import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, ChevronDown, ChevronRight, FileText, Hammer,
  HandCoins, Landmark, Smartphone, Users,
} from 'lucide-react';
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton';
import { BrickPattern, Footer, Navbar, SectionHeading } from '../components/PublicSite';
import usePageMeta from '../hooks/usePageMeta';
import { PLANS } from '../lib/plans';
import { BHATTA_PAGE, CONTACT_PAGE, FEATURES_PAGE, HINDI_PAGE } from '../lib/publicNav';
import { appLink, site, whatsappLink } from '../lib/site';

// Hindi landing page for buyers who search in Hindi (ईंट भट्ठा सॉफ्टवेयर, भट्ठा हिसाब ऐप).
const TITLE = `ईंट भट्ठा सॉफ्टवेयर - भट्ठा हिसाब ऐप | ${site.name}`;
const DESCRIPTION = `${site.name} ईंट भट्ठा मैनेजमेंट सॉफ्टवेयर है। ईंट उत्पादन, कच्चा माल स्टॉक, GST बिल, पार्टी का बकाया, खर्च और रिपोर्ट का पूरा हिसाब मोबाइल और कंप्यूटर पर। ₹7,999/साल से।`;

const FEATURES = [
  { icon: Hammer, title: 'रोज़ का ईंट उत्पादन', text: 'प्लांट, ईंट के प्रकार और शिफ्ट के हिसाब से रोज़ कितनी ईंट बनी, कितनी टूटी, सब दर्ज करें।' },
  { icon: Boxes, title: 'कच्चा माल और ईंट स्टॉक', text: 'सीमेंट, फ्लाई ऐश, रेत, कोयला और तैयार ईंटों का स्टॉक अपने आप अपडेट होता है।' },
  { icon: AlertTriangle, title: 'कम स्टॉक की चेतावनी', text: 'कोई भी कच्चा माल कम होने पर पहले ही पता चल जाता है, ताकि उत्पादन न रुके।' },
  { icon: FileText, title: 'GST बिल और बिक्री', text: 'सेकंडों में बिल बनाएं, जिसमें गाड़ी भाड़ा और ट्रिप चार्ज भी जुड़ जाते हैं।' },
  { icon: Users, title: 'पार्टी खाता (लेजर)', text: 'हर ग्राहक और सप्लायर का अलग खाता, जिसमें दिखता है किसका कितना बकाया है।' },
  { icon: WhatsAppIcon, title: 'WhatsApp पर बकाया याद दिलाएं', text: 'एक टैप में पार्टी को उसका बकाया और हाल की एंट्री WhatsApp पर भेजें।' },
  { icon: HandCoins, title: 'पैसा आया, पैसा गया', text: 'ग्राहकों से आई रकम और सप्लायरों को दिया भुगतान, नकद या बैंक से, सब दर्ज।' },
  { icon: Landmark, title: 'खर्च, नकद और बैंक', text: 'डीज़ल, मज़दूरी, मरम्मत जैसे हर खर्च को दर्ज करें और हर खाते का बैलेंस देखें।' },
  { icon: BarChart3, title: 'रिपोर्ट और मुनाफ़ा', text: 'उत्पादन, बिक्री, वसूली, खर्च और लाभ-हानि रिपोर्ट, साथ में प्रति ईंट लागत।' },
  { icon: Building2, title: 'एक से ज़्यादा भट्ठे', text: 'एक ही लॉगिन से कई भट्ठे या प्लांट चलाएं, हर एक का हिसाब अलग।' },
];

const BENEFITS = [
  'रजिस्टर और कॉपी का झंझट ख़त्म, पूरा हिसाब डिजिटल',
  'हर समय पता रहे कितनी ईंट और कितना माल बचा है',
  'बकाया समय पर वसूलें, किसी पार्टी का हिसाब न छूटे',
  'मोबाइल ऐप, डेस्कटॉप सॉफ्टवेयर और ब्राउज़र, तीनों पर चले',
  'मुनीम या मैनेजर एक दिन में सीख जाए, इतना आसान',
  'आपका डेटा सुरक्षित, हर बिज़नेस को सिर्फ़ अपना हिसाब दिखे',
];

const FAQS = [
  {
    q: 'ईंट भट्ठा सॉफ्टवेयर क्या है?',
    a: `ईंट भट्ठा सॉफ्टवेयर भट्ठे का पूरा हिसाब रखने वाला ऐप है। ${site.name} में रोज़ का उत्पादन, कच्चा माल, ईंट स्टॉक, बिक्री, खरीद, पार्टी का बकाया, खर्च और रिपोर्ट एक ही जगह रहते हैं।`,
  },
  {
    q: `${site.name} की क़ीमत कितनी है?`,
    a: `${PLANS.map(p => `${p.featured ? 'एक से ज़्यादा भट्ठों' : 'एक भट्ठे'} के लिए ₹${p.price} प्रति साल`).join(' और ')}। दोनों प्लान में सभी फ़ीचर शामिल हैं।`,
  },
  {
    q: 'क्या यह मोबाइल पर चलता है?',
    a: `हाँ। प्लान लेने के बाद ${site.name} का मोबाइल ऐप और डेस्कटॉप सॉफ्टवेयर मिलता है, और यह किसी भी फ़ोन या कंप्यूटर के ब्राउज़र में भी चलता है।`,
  },
  {
    q: 'क्या एक से ज़्यादा भट्ठों का हिसाब रख सकते हैं?',
    a: 'हाँ। मल्टी ब्रिक किल्न प्लान में एक ही लॉगिन से कई भट्ठे चलते हैं, और हर भट्ठे का उत्पादन, स्टॉक, बिक्री और खर्च अलग दिखता है।',
  },
  {
    q: 'डेमो कैसे देखें?',
    a: `हमें ${site.phone} पर कॉल या WhatsApp करें, या ${site.email} पर ईमेल करें। हम आपको दिखाएंगे कि ${site.name} आपके भट्ठे पर कैसे काम करेगा।`,
  },
];

// FAQ and breadcrumb data for Google; the FAQ text matches the visible FAQs word for word
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      inLanguage: 'hi',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'ईंट भट्ठा सॉफ्टवेयर', item: site.url + HINDI_PAGE },
      ],
    },
  ],
};

export default function HindiBhattaPage() {
  usePageMeta(TITLE, DESCRIPTION, HINDI_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Tell browsers and search engines this page is in Hindi, and put English back on the way out
    const html = document.documentElement;
    html.lang = 'hi';
    return () => { html.lang = 'en'; };
  }, []);

  return (
    <div lang="hi" className="min-h-[100dvh] bg-gradient-to-b from-orange-50/60 via-white to-slate-50 text-slate-900">
      <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <BrickPattern className="fill-orange-900/[0.035] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:pb-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="transition hover:text-orange-700">Home</Link>
              <ChevronRight size={14} />
              <span className="text-slate-700" aria-current="page">ईंट भट्ठा सॉफ्टवेयर</span>
            </nav>
            <div className="mx-auto mt-10 max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 shadow-sm">
                भट्ठा चलाएं डिजिटल तरीके से, बिना कागज़ के
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.3] tracking-tight text-slate-900 sm:text-5xl">
                ईंट भट्ठा सॉफ्टवेयर:{' '}
                <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">भट्ठे का पूरा हिसाब</span>{' '}
                एक ऐप में
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                {site.name} से ईंट उत्पादन, कच्चा माल, स्टॉक, बिक्री, बकाया और खर्च का हिसाब मोबाइल और कंप्यूटर पर रखें।
                हमेशा पता रहे कितनी ईंट बनी, कितनी बिकी और किसका पैसा बाकी है।
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="btn-primary px-7 py-3.5 text-base">
                  शुरू करें <ArrowRight size={18} />
                </a>
                <Link to={CONTACT_PAGE} className="btn-secondary px-7 py-3.5 text-base">डेमो देखें</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="फ़ीचर"
              title="भट्ठा हिसाब ऐप में क्या-क्या है"
              text="सुबह के पहले उत्पादन से लेकर आख़िरी भुगतान तक, हर एंट्री सही खाते में अपने आप पहुंचती है।"
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-md">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link to={FEATURES_PAGE} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
                सभी फ़ीचर देखें (English) <ChevronRight size={16} />
              </Link>
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading eyebrow="फ़ायदे" title={`भट्ठा मालिक ${site.name} क्यों चुनते हैं`} />
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map(b => (
                <li key={b} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Smartphone size={30} className="mx-auto text-orange-700" />
            <h2 className="mt-3 text-3xl font-bold text-slate-900">ईंट भट्ठा सॉफ्टवेयर की क़ीमत</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">दोनों प्लान में सभी फ़ीचर, मोबाइल ऐप और डेस्कटॉप सॉफ्टवेयर शामिल।</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {PLANS.map(p => (
                <div key={p.name} className="rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-500">{p.featured ? 'एक से ज़्यादा भट्ठे' : 'एक भट्ठा'}</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{p.price}<span className="text-sm font-semibold text-slate-500">/साल</span></p>
                </div>
              ))}
            </div>
            <Link to={BHATTA_PAGE} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
              Bhatta Software (English) <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="सवाल-जवाब" title="ईंट भट्ठा सॉफ्टवेयर: अक्सर पूछे जाने वाले सवाल" />
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
        <section className="px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
            <BrickPattern className="fill-white/[0.06]" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">आज ही अपना भट्ठा डिजिटल बनाएं</h2>
              <p className="mx-auto mt-4 max-w-xl text-orange-50">कॉल या WhatsApp करें: {site.phone}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={appLink('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-orange-50">
                  शुरू करें <ArrowRight size={18} />
                </a>
                <a href={whatsappLink(`नमस्ते, मुझे ${site.name} ईंट भट्ठा सॉफ्टवेयर के बारे में जानना है।`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  <WhatsAppIcon size={18} /> WhatsApp करें
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
