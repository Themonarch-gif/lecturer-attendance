import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                Lecturer Attendance Portal
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Manage your lectures and attendance with ease.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
                Create your courses, start attendance sessions,
                generate secure attendance codes, and keep track
                of attendance records from one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {/* Lecturer Login */}
                <Link
                  href="/login"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                >
                  Lecturer Login
                </Link>

                {/* Dashboard */}
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="mb-3 text-2xl">📚</div>

                <h2 className="font-semibold text-slate-900">
                  Manage Courses
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create and manage the courses you teach.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="mb-3 text-2xl">🔐</div>

                <h2 className="font-semibold text-slate-900">
                  Secure Codes
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Generate temporary attendance codes for
                  your students.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="mb-3 text-2xl">📊</div>

                <h2 className="font-semibold text-slate-900">
                  Attendance History
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep track of attendance sessions and
                  student records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}