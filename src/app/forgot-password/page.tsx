
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "If an account exists for that email, a password-reset link will be sent. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            AP
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Forgot Password?
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the email address linked to your account. We will
            send instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Registered email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@school.edu"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {message && (
            <p
              role="status"
              className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
