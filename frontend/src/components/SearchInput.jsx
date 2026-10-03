import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <Search size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-rose-500"
        >
          <X size={16} />
        </button>
      )}
    </label>
  );
}
