import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-zinc-950/80 to-transparent backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="md:hidden text-lg font-bold text-white">Musicy</Link>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-white hover:bg-zinc-700">Sign in</button>
        </div>
      </div>
    </header>
  );
}


