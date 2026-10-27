// The Brick Manager logo image (web/public), which already includes the name.
export default function Logo({ name = 'Brick Manager', subtitle, size = 'md' }) {
  const large = size === 'lg';
  return (
    <span className="flex flex-col items-start">
      <img
        src="/brickmanager%20logo.png"
        alt={name}
        width="740"
        height="114"
        className={`w-auto ${large ? 'h-10' : 'h-9 sm:h-8'}`}
      />
      {subtitle && <span className="mt-1.5 block text-[11px] font-medium text-slate-500">{subtitle}</span>}
    </span>
  );
}
