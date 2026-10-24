import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { site, telLink, whatsappLink } from '../lib/site';
import { WhatsAppIcon } from './WhatsAppButton';

const EMPTY = { name: '', email: '', phone: '', message: '' };
const FIELDS = ['name', 'email', 'phone', 'message'];

const validate = (f) => {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = 'Please enter a valid email address.';
  // Accepts 98765 43210, +91 98765 43210 or 098765 43210
  const mobile = f.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(mobile)) errors.phone = 'Please enter a valid 10-digit mobile number.';
  if (f.message.trim().length < 10) errors.message = 'Please write at least 10 characters.';
  return errors;
};

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label} <span className="text-rose-600">*</span></label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

const CONTACTS = [
  { icon: Phone, label: 'Mobile', value: site.phone, href: telLink },
  { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
  { icon: MapPin, label: 'Address', value: site.address },
];

export default function ContactSection() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const refs = useRef({});

  const update = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    // After the first submit, errors clear as soon as a field is fixed
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    const firstBad = FIELDS.find(k => found[k]);
    if (firstBad) {
      refs.current[firstBad]?.focus();
      return;
    }

    // No mail server here, so the enquiry goes to the business on WhatsApp, ready to send
    const text = [
      `New enquiry from the ${site.name} website`,
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Message: ${form.message.trim()}`,
    ].join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer');
    toast.success('Your enquiry is ready in WhatsApp. Tap send to reach us.');
    setForm(EMPTY);
    setErrors({});
    setSubmitted(false);
  };

  const inputProps = (key) => ({
    id: `contact-${key}`,
    ref: (el) => { refs.current[key] = el; },
    value: form[key],
    onChange: update(key),
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `contact-${key}-error` : undefined,
    className: `input py-2.5 text-[15px] ${errors[key] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`,
  });

  return (
    <section id="contact" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Contact Us</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Let's talk about your plant</h2>
          <p className="mt-4 text-slate-600">
            Want a demo, have a question, or need help getting started? Send us a message and we'll get back to you.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
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

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8 lg:col-span-3"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="contact-name" label="Name" error={errors.name}>
                <input type="text" autoComplete="name" maxLength={80} placeholder="Your full name" {...inputProps('name')} />
              </Field>
              <Field id="contact-phone" label="Phone" error={errors.phone}>
                <input type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile number" {...inputProps('phone')} />
              </Field>
              <div className="sm:col-span-2">
                <Field id="contact-email" label="Email" error={errors.email}>
                  <input type="email" autoComplete="email" maxLength={120} placeholder="you@example.com" {...inputProps('email')} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="contact-message" label="Message" error={errors.message}>
                  <textarea rows={5} maxLength={1000} placeholder="Tell us about your plant and what you need" {...inputProps('message')} />
                </Field>
              </div>
            </div>
            <button type="submit" className="btn-primary mt-6 w-full py-3 text-[15px] sm:w-auto sm:px-8">
              <Send size={18} /> Submit
            </button>
            <p className="mt-3 text-xs text-slate-500">Submitting opens WhatsApp with your message filled in, ready to send.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
