import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: lecturer } = await supabase
    .from("lecturers")
    .select("full_name, email, department")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Lecturer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome back,{" "}
              {lecturer?.full_name || "Lecturer"}
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your courses and attendance sessions.
            </p>
          </div>

          <Link
            href="/dashboard/courses"
            className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            View Courses
          </Link>
        </div>

        {/* Lecturer information */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Email
            </p>

            <p className="mt-2 break-words font-semibold text-slate-900">
              {lecturer?.email || user.email}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Department
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {lecturer?.department || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Account
            </p>

            <p className="mt-2 font-semibold text-green-600">
              Authenticated
            </p>
          </div>
        </div>

        {/* Main actions */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Courses */}
          <Link
            href="/dashboard/courses"
            className="group rounded-2xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📚
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              My Courses
            </h2>

            <p className="mt-2 leading-6 text-slate-500">
              Create, edit, and manage the courses you teach.
            </p>

            <div className="mt-5 font-semibold text-blue-600">
              Manage Courses →
            </div>
          </Link>

          {/* Attendance */}
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Attendance
            </h2>

            <p className="mt-2 leading-6 text-slate-500">
              Start an attendance session from any of your
              courses and generate a temporary code.
            </p>

            <Link
              href="/dashboard/courses"
              className="mt-5 inline-block font-semibold text-green-600"
            >
              Start from a Course →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}