"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseUnits, setCourseUnits] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [session, setSession] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const units = Number(courseUnits);

    if (!Number.isInteger(units) || units < 1) {
      setError("Course units must be a valid number greater than 0.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("courses").insert({
      lecturer_id: user.id,
      course_name: courseName.trim(),
      course_code: courseCode.trim().toUpperCase(),
      course_units: units,
      department: department.trim() || null,
      level: level || null,
      semester: semester || null,
      session: session.trim() || null,
    });

    if (insertError) {
      setError("Unable to create the course. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/courses");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard/courses")}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to My Courses
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600">
              Lecturer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Add Course
            </h1>

            <p className="mt-2 text-slate-500">
              Enter the details of the course you teach.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="courseName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Course Name
              </label>

              <input
                id="courseName"
                type="text"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                placeholder="Introduction to Computer Science"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="courseCode"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Course Code
                </label>

                <input
                  id="courseCode"
                  type="text"
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value)}
                  placeholder="CSC 101"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 uppercase outline-none transition placeholder:text-slate-400 placeholder:normal-case focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="courseUnits"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Course Units
                </label>

                <input
                  id="courseUnits"
                  type="number"
                  min="1"
                  max="20"
                  value={courseUnits}
                  onChange={(event) => setCourseUnits(event.target.value)}
                  placeholder="3"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department
              </label>

              <input
                id="department"
                type="text"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Computer Science"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="level"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Level
                </label>

                <select
                  id="level"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="600">600 Level</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="semester"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Semester
                </label>

                <select
                  id="semester"
                  value={semester}
                  onChange={(event) => setSemester(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select semester</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="session"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Academic Session
              </label>

              <input
                id="session"
                type="text"
                value={session}
                onChange={(event) => setSession(event.target.value)}
                placeholder="2026/2027"
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard/courses")}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Course..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}