import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
};

/**
 * Searchable dropdown drawn by hand (not the browser's <select>), so each option can show
 * extra details such as the stock left.
 * - options: [{ value, label, hint?, badge?: { text, tone: 'green' | 'amber' | 'red' | 'gray' } }]
 * - value, onChange(value)
 * - placeholder: shown when nothing is picked; searchPlaceholder: for the search box
 */
export default function OptionPicker({ options, value, onChange, placeholder = 'Select', searchPlaceholder = 'Search...', className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const q = query.trim().toLowerCase();
  const shown = options.filter(o => !q || `${o.label} ${o.hint || ''}`.toLowerCase().includes(q));

  // The list is drawn on <body> (so a popup's scrolling area can't cut it off), lined up under the button
  const place = () => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 280 && r.top > below;
    setPos({ left: r.left, width: Math.max(r.width, 240), ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!buttonRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const openList = () => {
    setQuery('');
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    setOpen(true);
  };

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active]); }
    else if (e.key === 'Escape') {
      // Close only the list, not the popup it sits in
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  // Keep the highlighted option in view while moving with the arrow keys
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={e => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); openList(); } }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input flex items-center justify-between gap-2 text-left ${open ? 'border-primary-600 ring-4 ring-primary-600/10' : ''} ${className}`}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-slate-800">{selected.label}</span>
            {selected.badge && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[selected.badge.tone] || TONES.gray}`}>{selected.badge.text}</span>}
          </span>
        ) : <span className="truncate text-slate-400">{placeholder}</span>}
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={listRef}
          className="fixed z-[90] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-2 text-sm outline-none ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-primary-500"
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
            {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">No match for "{query}"</li>}
            {shown.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={e => { e.preventDefault(); pick(o); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${i === active ? 'bg-primary-50' : ''}`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-primary-600">{isSelected && <Check size={16} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${isSelected ? 'font-semibold text-primary-700' : 'font-medium text-slate-800'}`}>{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-slate-400">{o.hint}</span>}
                  </span>
                  {o.badge && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[o.badge.tone] || TONES.gray}`}>{o.badge.text}</span>}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}
