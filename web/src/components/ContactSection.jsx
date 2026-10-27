import { Mail, MapPin, Phone } from 'lucide-react';
import { site, telLink, whatsappLink } from '../lib/site';
import { WhatsAppIcon } from './WhatsAppButton';

const CONTACTS = [
  { icon: Phone, label: 'Mobile', value: site.phone, href: telLink },
  { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
  { icon: MapPin, label: 'Address', value: site.address },
];

export default function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Contact Us</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Let's talk about your plant</h2>
          <p className="mt-4 text-slate-600">
            Want a demo, have a question, or need help getting started? Call, email or WhatsApp us and we'll get back to you.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACTS.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                {href
                  ? <a href={href} className="mt-0.5 block break-words font-semibold text-slate-900 hover:text-primary-700">{value}</a>
                  : <p className="mt-0.5 font-semibold text-slate-900">{value}</p>}
              </div>
            </div>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white shadow-md shadow-emerald-700/20 transition hover:from-emerald-700 hover:to-emerald-600"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <WhatsAppIcon size={22} />
            </span>
            <span>
              <span className="block font-semibold">Chat on WhatsApp</span>
              <span className="block text-sm text-emerald-50">Quickest way to reach us</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
