"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("An unexpected authentication error occurred.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-amber-400" />
        <span>Sign in to your account</span>
      </h2>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Failed</p>
            <p className="mt-0.5 text-red-300/80">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Institutional Email
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="faculty@nie.ac.in"
              disabled={isLoading}
              required
              className="block w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-10 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              required
              className="block w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials Panel for Evaluators */}
      <div className="mt-6 border-t border-slate-800 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <BookOpenCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Demo Quick-Select Accounts</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@nie.ac.in")}
            className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-left transition-all hover:bg-amber-500/20"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>ADMIN</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">admin@nie.ac.in</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("srsharma@nie.ac.in")}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-left transition-all hover:border-slate-600 hover:bg-slate-800"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>USER (Faculty)</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">srsharma@nie.ac.in</p>
            </div>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Default password for all test accounts: <code className="text-amber-400">password123</code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-center bg-slate-950 px-4 py-12 font-sans antialiased sm:px-6 lg:px-8">
      {/* Dynamic Ambient Background Pattern */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Institutional Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 ring-1 ring-amber-400/40">
            <GraduationCap className="h-9 w-9 font-extrabold" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            NIE Mysuru
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Research Publication Management System
          </p>
          <p className="mt-2 text-xs text-slate-400 max-w-sm">
            Autonomous Institute affiliated to VTU, Belagavi • Established 1946
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading form...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          The National Institute of Engineering, Mysuru • NIRF Research Tracking System
        </p>
      </div>
    </div>
  );
}
