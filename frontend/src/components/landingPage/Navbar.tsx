import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers3, Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Features', href: '#features' },
  { name: 'About', href: '#about' },
  { name: 'Resources', href: '#resources' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Layers3 size={25} />
          </div>

          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Triage<span className="text-indigo-600">Sync</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Authentication Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/login"
            className="font-medium text-slate-700 hover:text-indigo-600"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-700 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="flex flex-col gap-5 border-t border-slate-200 bg-white px-6 py-6 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              {link.name}
            </a>
          ))}

          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700"
          >
            Login
          </Link>

          <Link
            to="/register"
            onClick={() => setIsOpen(false)}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-center text-white"
          >
            Register
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
