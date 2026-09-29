"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_name: string;
  course_code: string;
  course_units: number;
  department: string | null;
  level: string | null;
  semester: string | null;
  session: string | null;
};

export default function ManageCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseUnits, setCourseUnits] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [session, setSession] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCourse() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("courses")
        .select(
          "id, course_name, course_code, course_units, department, level, semester, session"
        )
        .eq("id", courseId)
        .eq("lecturer_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("Course not found or you do not have access to it.");
        setLoading(false);
        return;
      }

      setCourse(data);

      setCourseName(data.course_name);
      setCourseCode(data.course_code);
      setCourseUnits(String(data.course_units));
      setDepartment(data.department || "");
      setLevel(data.level || "");
      setSemester(data.semester || "");
      setSession(data.session || "");

      setLoading(false);
    }

    loadCourse();
  }, [courseId, router, supabase]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    const units = Number(courseUnits);

    if (!Number.isInteger(units) || units < 1) {
      setError("Course units must be a valid number greater than 0.");
      setSaving(false);
      return;
    }

    const { data: updatedCourse, error: updateError } = await supabase
      .from("courses")
      .update({
        course_name: courseName.trim(),
        course_code: courseCode.trim().toUpperCase(),
        course_units: units,
        department: department.trim() || null,
        level: level || null,
        semester: semester || null,
        session: session.trim() || null,
      })
      .eq("id", courseId)
      .select(
        "id, course_name, course_code, course_units, department, level, semester, session"
      )
      .single();

    if (updateError || !updatedCourse) {
      setError("Unable to update the course. Please try again.");
      setSaving(false);
      return;
    }

    setCourse(updatedCourse);
    setCourseName(updatedCourse.course_name);
    setCourseCode(updatedCourse.course_code);
    setCourseUnits(String(updatedCourse.course_units));
    setDepartment(updatedCourse.department || "");
    setLevel(updatedCourse.level || "");
    setSemester(updatedCourse.semester || "");
    setSession(updatedCourse.session || "");

    setSuccess("Course updated successfully.");
    setSaving(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (deleteError) {
      setError("Unable to delete the course. Please try again.");
      setDeleting(false);
      return;
    }

    router.push("/dashboard/courses");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">Loading course...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!course) {
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

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Course not found
            </h1>

            <p className="mt-3 text-slate-500">
              {error || "This course could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
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
              Manage Course
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {course.course_code}
            </h1>

            <p className="mt-2 text-slate-500">
              Update the details of this course.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
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
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

            {success && (
              <div
                role="status"
                className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <div className="border-t border-slate-100 pt-6">
  <div className="mb-4">
    <h2 className="text-lg font-bold text-slate-900">
      Attendance
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Start an attendance session and generate a temporary attendance code.
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting || saving}
      className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete Course"}
    </button>

    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => router.push("/dashboard/courses")}
        className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() =>
          router.push(`/dashboard/courses/${courseId}/attendance`)
        }
        className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
      >
        Start Attendance
      </button>

      <button
        type="submit"
        disabled={saving || deleting}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </div>
</div>
          </form>
        </div>
      </div>
    </main>
  );
}