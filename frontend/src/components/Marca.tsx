import { Link } from 'react-router-dom';

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className={`inline-block px-2 py-1 font-display text-2xl uppercase leading-none tracking-tight ${claro ? 'text-white' : 'bg-neutro-suave text-black'}`}>
      FreelaHub
    </Link>
  );
}
