// Public business details shown on the homepage. Set them in frontend/.env (see .env.example);
// until then these placeholders show, so nothing made-up reaches visitors.
const env = import.meta.env;

export const site = {
  name: 'Brick Manager',
  // Public address of the website, e.g. https://www.example.com (used for canonical links)
  url: (env.VITE_SITE_URL || '').replace(/\/$/, ''),
  phone: env.VITE_CONTACT_PHONE || '+91 XXXXX XXXXX',
  email: env.VITE_CONTACT_EMAIL || 'contact@yourdomain.com',
  address: env.VITE_CONTACT_ADDRESS || 'Your business address, City, State - PIN',
  // Country code + number, digits only, e.g. 919876543210
  whatsapp: env.VITE_WHATSAPP_NUMBER || '91XXXXXXXXXX',
};

export const telLink = `tel:${site.phone.replace(/[^\d+]/g, '')}`;

// WhatsApp click-to-chat link, optionally with a message typed in for the visitor
export const whatsappLink = (text) => {
  const url = `https://wa.me/${site.whatsapp.replace(/[\s+-]/g, '')}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
};
