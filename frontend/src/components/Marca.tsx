import { Link } from 'react-router-dom';

export function Marca() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-md text-base font-bold tracking-tight">
      <span className="gradiente-marca flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-cartao">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
          <path d="M11 24V8h12M11 16h9" />
        </svg>
      </span>
      FreelaHub
    </Link>
  );
}
