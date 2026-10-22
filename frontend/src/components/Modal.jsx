import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Popup shell: gradient header, scrollable body, grey footer.
 * Props:
 * - title, subtitle: header text
 * - onClose: called by the header ✕ button
 * - footer: buttons shown in the bottom bar
 * - maxWidth: Tailwind max-width class for the panel
 */
export default function Modal({ title, subtitle, onClose, footer, maxWidth = 'max-w-2xl', children }) {
  // Freeze the page behind the popup so scrolling the popup never scrolls the page too
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Rendered on <body> so page spacing/animations can never offset the overlay
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overscroll-contain bg-black/60 p-2 md:p-4">
      <div className={`flex max-h-[95vh] w-full ${maxWidth} flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:rounded-2xl`} role="dialog" aria-modal="true">
        <div className="flex-shrink-0 bg-gradient-to-r from-primary-700 to-primary-500 p-3 text-white md:px-5 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold md:text-xl">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-primary-100 md:text-sm">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-white transition hover:bg-white/20 md:p-2">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-6">{children}</div>

        {footer && (
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 p-3 md:gap-3 md:p-4 [&>button]:flex-1 md:[&>button]:flex-none">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const SECTION_TONES = {
  blue: { box: 'from-blue-50 to-indigo-50 border-indigo-200', dot: 'bg-indigo-600' },
  emerald: { box: 'from-green-50 to-emerald-50 border-emerald-200', dot: 'bg-emerald-600' },
  purple: { box: 'from-purple-50 to-pink-50 border-purple-200', dot: 'bg-purple-600' },
  amber: { box: 'from-orange-50 to-amber-50 border-orange-200', dot: 'bg-orange-600' },
  slate: { box: 'from-slate-50 to-gray-50 border-slate-200', dot: 'bg-slate-600' },
};

/** Numbered, tinted block that groups related fields inside a Modal. */
export function ModalSection({ number, title, tone = 'blue', action, children }) {
  const t = SECTION_TONES[tone] || SECTION_TONES.blue;
  return (
    <div className={`mb-4 rounded-xl border-2 bg-gradient-to-r p-3 last:mb-0 md:mb-6 md:p-5 ${t.box}`}>
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 md:text-lg">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white md:h-8 md:w-8 md:text-sm ${t.dot}`}>{number}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
