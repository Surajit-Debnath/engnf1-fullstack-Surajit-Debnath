import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

import axios from "axios";
import { BACKEND_URL } from "../config";
import { Link, useNavigate } from "react-router-dom";

import {
    Layers3,
    ArrowLeft,
    ArrowRight,
    User,
    Mail,
    Lock,
    LockKeyhole,
    Eye,
    EyeOff,
    BrainCircuit,
    ListFilter,
    ShieldCheck,
    CalendarClock,
    AlertCircle
} from "lucide-react";

const features = [
    {
        icon: BrainCircuit,
        text: "Automated ticket triage"
    },
    {
        icon: ListFilter,
        text: "Intelligent prioritization"
    },
    {
        icon: ShieldCheck,
        text: "Human override protection"
    },
    {
        icon: CalendarClock,
        text: "Conflict-free scheduling"
    }
];

export default function Register() {

    // Input references
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    // Component states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    // Registration handler
    async function register(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();

        if (loading) return;

        setError("");

        const name = nameRef.current?.value.trim();
        const email = emailRef.current?.value.trim();
        const password = passwordRef.current?.value;
        const confirmPassword = confirmPasswordRef.current?.value;

        // Validate empty fields
        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        // Validate password length
        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        // Confirm password
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);

            await axios.post(`${BACKEND_URL}/auth/register`, {
                name,
                email,
                password
            });

            navigate("/login", { replace: true });

        } catch (err) {

            if (axios.isAxiosError(err)) {

                const message = err.response?.data?.message;

                setError(
                    typeof message === "string"
                        ? message
                        : "Registration failed. Please try again."
                );

            } else {
                setError("Something went wrong. Please try again.");
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

                <Link
                    to="/"
                    className="relative z-10 flex w-fit items-center gap-3"
                >
                    <div className="rounded-xl bg-white/15 p-3">
                        <Layers3 size={28} />
                    </div>

                    <span className="text-3xl font-bold tracking-tight">
                        TriageSync
                    </span>
                </Link>

                {/* Branding Content */}

                <div className="relative z-10 mx-auto max-w-lg py-16">

                    <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-indigo-100">
                        INTELLIGENT SUPPORT MANAGEMENT
                    </div>

                    <h1 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
                        Better support
                        <br />
                        starts here.
                    </h1>

                    <p className="mt-6 text-lg leading-relaxed text-indigo-200">
                        One unified workspace for your support tickets,
                        teams and shared resources.
                    </p>

                    {/* Feature List */}

                    <div className="mt-10 space-y-5">

                        {features.map((feature) => {

                            const Icon = feature.icon;

                            return (
                                <div
                                    key={feature.text}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">

                                        <Icon
                                            size={23}
                                            className="text-indigo-100"
                                        />

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
                    © {new Date().getFullYear()} TriageSync.
                    All rights reserved.
                </p>

            </aside>

            {/* ============================= */}
            {/* RIGHT REGISTRATION SECTION    */}
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

                    <Link
                        to="/"
                        className="mb-8 flex w-fit items-center gap-2 lg:hidden"
                    >
                        <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
                            <Layers3 size={25} />
                        </div>

                        <span className="text-2xl font-bold text-slate-900">
                            Triage
                            <span className="text-indigo-600">
                                Sync
                            </span>
                        </span>
                    </Link>

                    {/* Heading */}

                    <div className="mb-8">

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Create your account
                        </h2>

                        <p className="mt-3 text-sm text-slate-500 sm:text-base">
                            Start your journey with TriageSync.
                        </p>

                    </div>

                    {/* Error Message */}

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
                        >
                            <AlertCircle
                                size={20}
                                className="shrink-0"
                            />

                            <span>{error}</span>
                        </div>
                    )}

                    {/* Registration Form */}

                    <form
                        onSubmit={register}
                        className="space-y-5"
                    >

                        {/* Full Name */}

                        <Input
                            reference={nameRef}
                            type="text"
                            label="Full Name"
                            placeholder="Enter your full name"
                            startIcon={<User size={18} />}
                            autoComplete="name"
                            disabled={loading}
                            required
                        />

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

                        <div>

                            <Input
                                reference={passwordRef}
                                type={showPassword ? "text" : "password"}
                                label="Password"
                                placeholder="Create a password"
                                startIcon={<Lock size={18} />}
                                autoComplete="new-password"
                                disabled={loading}
                                required
                                endIcon={
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            setShowPassword(prev => !prev)
                                        }
                                        className="cursor-pointer text-slate-400 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword
                                            ? <EyeOff size={18} />
                                            : <Eye size={18} />
                                        }
                                    </button>
                                }
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Must contain at least 8 characters.
                            </p>

                        </div>

                        {/* Confirm Password */}

                        <Input
                            reference={confirmPasswordRef}
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            startIcon={<LockKeyhole size={18} />}
                            autoComplete="new-password"
                            disabled={loading}
                            required
                            endIcon={
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                        setShowConfirmPassword(prev => !prev)
                                    }
                                    className="cursor-pointer text-slate-400 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide confirm password"
                                            : "Show confirm password"
                                    }
                                >
                                    {showConfirmPassword
                                        ? <EyeOff size={18} />
                                        : <Eye size={18} />
                                    }
                                </button>
                            }
                        />

                        {/* Submit Button */}

                        <div className="pt-2">

                            <Button
                                type="submit"
                                variant="primary"
                                size="fullWidth"
                                text="Create Account"
                                loading={loading}
                                endIcon={<ArrowRight size={18} />}
                            />

                        </div>

                    </form>

                    {/* Login Navigation */}

                    <p className="mt-8 text-center text-sm text-slate-500">

                        Already have an account?{" "}

                        <Link
                            to="/login"
                            className="font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
                        >
                            Sign in
                        </Link>

                    </p>

                </div>
            </main>
        </div>
    );
}