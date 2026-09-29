"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CoursesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
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
        .eq("lecturer_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Something went wrong while loading your courses.");
        setLoading(false);
        return;
      }

      setCourses(data || []);
      setLoading(false);
    }

    loadCourses();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">Loading courses...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Lecturer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              My Courses
            </h1>

            <p className="mt-2 text-slate-500">
              Manage the courses you teach.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/courses/new")}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Course
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {courses.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      {course.course_code}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {course.course_name}
                    </h2>
                  </div>

                  <span className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {course.course_units} Units
                  </span>
                </div>

                <div className="mt-6 space-y-2 text-sm text-slate-500">
                  <p>
                    <span className="font-medium text-slate-700">
                      Department:
                    </span>{" "}
                    {course.department || "Not specified"}
                  </p>

                  <p>
                    <span className="font-medium text-slate-700">
                      Level:
                    </span>{" "}
                    {course.level
                      ? `${course.level} Level`
                      : "Not specified"}
                  </p>

                  <p>
                    <span className="font-medium text-slate-700">
                      Semester:
                    </span>{" "}
                    {course.semester || "Not specified"}
                  </p>

                  <p>
                    <span className="font-medium text-slate-700">
                      Session:
                    </span>{" "}
                    {course.session || "Not specified"}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/courses/${course.id}`)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Manage Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📚
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No courses yet
            </h2>

            <p className="mt-2 text-slate-500">
              Add your first course to start managing attendance.
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard/courses/new")}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              + Add Course
            </button>
          </div>
        )}
      </div>
    </main>
  );
}