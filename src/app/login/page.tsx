"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
const router = useRouter();
const supabase = createClient();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setError("");
setLoading(true);

const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  setError("Invalid email or password.");
  setLoading(false);
  return;
}

router.push("/dashboard");
router.refresh();

}
return ( <main className="min-h-screen bg-slate-100"> <div className="flex min-h-screen items-center justify-center px-6 py-12"> <div className="w-full max-w-md"> <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10"> <div className="mb-8 text-center"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
AP </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Lecturer Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your courses and attendance.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="lecturer@school.edu"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lecturer Attendance Portal
      </p>
    </div>
  </div>
</main>
);
}
