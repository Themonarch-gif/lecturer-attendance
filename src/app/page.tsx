
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white">
          A
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Lecturer Administration
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Attendance Portal
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
          Manage your courses, start QR-based attendance sessions,
          and review attendance history from one place.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Admin Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-300 px-8 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Register New Admin
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Welcome. Select an option above to continue to the lecturer portal.
        </p>
      </section>
    </main>
  );
}
