
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyRecoverySession() {
      // Supabase processes the recovery link and establishes
      // a session in the browser when the link is valid.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !session) {
        setError(
          "This reset link is invalid, expired, or already used. Request a new reset link from the login page."
        );
        setReady(false);
      } else {
        setReady(true);
      }

      setChecking(false);
    }

    verifyRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError("");
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage(
        "Your password has been changed successfully. You can now sign in using your new password."
      );

      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();
      setReady(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your password. Request a new reset link and try again."
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
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Choose a new password for your account.
          </p>
        </div>

        {checking ? (
          <p className="text-center text-sm text-slate-500">
            Verifying your reset link...
          </p>
        ) : message ? (
          <div className="space-y-5">
            <p
              role="status"
              className="rounded-xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-800"
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        ) : !ready ? (
          <div className="space-y-5">
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error ||
                "A valid password-reset session is required."}
            </p>

            <Link
              href="/forgot-password"
              className="block text-center text-sm font-semibold text-blue-600 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter the new password again"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

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
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Updating Password..." : "Save New Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-blue-600 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
