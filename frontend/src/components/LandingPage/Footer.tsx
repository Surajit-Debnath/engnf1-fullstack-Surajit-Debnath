import { Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <a href="#home" className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-600 p-2 text-white">
                <Layers3 size={24} />
              </div>

              <span className="text-2xl font-bold text-white">
                Triage<span className="text-indigo-400">Sync</span>
              </span>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              Intelligent support ticket triage and resource scheduling designed
              for efficient, transparent and accountable support operations.
            </p>
          </div>

          <div>
            <h3 className="mb-5 font-semibold text-white">Quick Links</h3>

            <div className="flex flex-col gap-3 text-sm">
              <a href="#home" className="hover:text-white">
                Home
              </a>
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#about" className="hover:text-white">
                About
              </a>
              <a href="#resources" className="hover:text-white">
                Resources
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-semibold text-white">Account</h3>

            <div className="flex flex-col gap-3 text-sm">
              <Link to="/login" className="hover:text-white">
                Login
              </Link>

              <Link to="/register" className="hover:text-white">
                Register
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm">
          © {new Date().getFullYear()} TriageSync. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
