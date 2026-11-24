import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import axios from 'axios';
import { BACKEND_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';

import {
  Layers3,
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BrainCircuit,
  ShieldCheck,
  CalendarClock,
  History,
  AlertCircle,
  LogIn,
} from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    text: 'Intelligent ticket triage',
  },
  {
    icon: ShieldCheck,
    text: 'Human-controlled decisions',
  },
  {
    icon: CalendarClock,
    text: 'Seamless resource scheduling',
  },
  {
    icon: History,
    text: 'Transparent audit history',
  },
];

export default function Login() {
  // Input references
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Component states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Login handler
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError('');

    const email = emailRef.current?.value.trim();
    const password = passwordRef.current?.value;

    // Validate empty fields
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (
        typeof token !== 'string' ||
        !token ||
        !user ||
        !['USER', 'ADMIN'].includes(user.role)
      ) {
        throw new Error('Invalid login response.');
      }

      localStorage.setItem('token', token);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid email or password.');
        } else if (!err.response) {
          setError('Unable to connect to the server. Please try again.');
        } else {
          const message = err.response?.data?.message;

          setError(
            typeof message === 'string'
              ? message
              : 'Login failed. Please try again.'
          );
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ============================= */}
      {/* LEFT BRANDING SECTION         */}
      {/* ============================= */}

      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-800 to-indigo-600 p-12 text-white lg:flex">
        {/* Background Decorations */}

        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />

        <div className="pointer-events-none absolute -bottom-40 -left-40 h-125 w-125 rounded-full bg-white/5" />

        <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full border border-white/10" />

        {/* Logo */}

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <Layers3 size={28} />
          </div>

          <span className="text-3xl font-bold tracking-tight">TriageSync</span>
        </Link>

        {/* Branding Content */}

        <div className="relative z-10 mx-auto max-w-lg py-16">
          <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-indigo-100">
            INTELLIGENT SUPPORT MANAGEMENT
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
            Welcome back
            <br />
            to smarter
            <br />
            support.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-indigo-200">
            Stay on top of your tickets, manage priorities and coordinate shared
            resources from a single workspace.
          </p>

          {/* Feature List */}

          <div className="mt-10 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.text} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <Icon size={23} className="text-indigo-100" />
                  </div>

                  <span className="font-medium text-indigo-50">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyright */}

        <p className="relative z-10 text-sm text-indigo-300">
          © {new Date().getFullYear()} TriageSync. All rights reserved.
        </p>
      </aside>

      {/* ============================= */}
      {/* RIGHT LOGIN SECTION           */}
      {/* ============================= */}

      <main className="relative flex w-full items-center justify-center px-6 py-24 sm:px-12 lg:w-[55%]">
        {/* Back to Home */}

        <Link
          to="/"
          className="absolute left-6 top-8 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 sm:left-12"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}

          <Link to="/" className="mb-8 flex w-fit items-center gap-2 lg:hidden">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <Layers3 size={25} />
            </div>

            <span className="text-2xl font-bold text-slate-900">
              Triage
              <span className="text-indigo-600">Sync</span>
            </span>
          </Link>

          {/* Login Icon */}

          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <LogIn size={28} />
          </div>

          {/* Heading */}

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back
            </h2>

            <p className="mt-3 text-sm text-slate-500 sm:text-base">
              Sign in to your TriageSync account.
            </p>
          </div>

          {/* Error Message */}

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
            >
              <AlertCircle size={20} className="shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}

          <form onSubmit={login} className="space-y-5">
            {/* Email */}

            <Input
              reference={emailRef}
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              startIcon={<Mail size={18} />}
              autoComplete="email"
              disabled={loading}
              required
            />

            {/* Password */}

            <Input
              reference={passwordRef}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              startIcon={<Lock size={18} />}
              autoComplete="current-password"
              disabled={loading}
              required
              endIcon={
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="cursor-pointer text-slate-400 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Submit Button */}

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="fullWidth"
                text="Sign In"
                loading={loading}
                endIcon={<ArrowRight size={18} />}
              />
            </div>
          </form>

          {/* Registration Navigation */}

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* Footer */}

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400">
            <ShieldCheck size={16} />

            <span>Authorized workspace access</span>
          </div>
        </div>
      </main>
    </div>
  );
}
