"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_name: string;
  course_code: string;
};

type AttendanceRecordCount = {
  count: number;
};

type AttendanceSession = {
  id: string;
  attendance_code: string;
  started_at: string;
  expires_at: string;
  attendance_records?: AttendanceRecordCount[];
};

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // ----------------------------------------
      // Load course
      // ----------------------------------------

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select("id, course_name, course_code")
          .eq("id", courseId)
          .eq("lecturer_id", user.id)
          .single();

      if (courseError || !courseData) {
        setError("Course not found.");
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // ----------------------------------------
      // Load attendance sessions + record counts
      // ----------------------------------------

      const { data: sessionData, error: sessionError } =
        await supabase
          .from("attendance_sessions")
          .select(
            `
              id,
              attendance_code,
              started_at,
              expires_at,
              attendance_records(count)
            `
          )
          .eq("course_id", courseId)
          .eq("lecturer_id", user.id)
          .order("started_at", { ascending: false });

      if (sessionError) {
        console.error(sessionError);

        setError(
          "Unable to load attendance history."
        );

        setLoading(false);
        return;
      }

      setSessions(sessionData || []);
      setLoading(false);
    }

    loadHistory();
  }, [courseId, router]);

  // ----------------------------------------
  // Formatting helpers
  // ----------------------------------------

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString(
      "en-NG",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getSessionStatus(expiresAt: string) {
    return new Date(expiresAt).getTime() > Date.now()
      ? "Active"
      : "Expired";
  }

  function getPresentCount(session: AttendanceSession) {
    return (
      session.attendance_records?.[0]?.count ?? 0
    );
  }

  // ----------------------------------------
  // Loading
  // ----------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Loading attendance history...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // Error
  // ----------------------------------------

  if (error || !course) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-red-600">
              {error || "Course not found."}
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // Page
  // ----------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/courses/${courseId}/attendance`
              )
            }
            className="mb-4 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Attendance
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Attendance History
              </h1>

              <p className="mt-2 text-slate-500">
                {course.course_code} — {course.course_name}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/courses/${courseId}/attendance`
                )
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Attendance
            </button>
          </div>
        </div>

        {/* Empty state */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-2xl">✓</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              No Attendance Sessions Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Once you start an attendance session,
              it will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/courses/${courseId}/attendance`
                )
              }
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Attendance
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const status = getSessionStatus(
                session.expires_at
              );

              const presentCount =
                getPresentCount(session);

              return (
                <div
                  key={session.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Session information */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">
                          Attendance Code
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-lg font-bold tracking-widest text-slate-900">
                          {session.attendance_code}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                        <span>
                          Date:{" "}
                          <strong className="text-slate-700">
                            {formatDate(
                              session.started_at
                            )}
                          </strong>
                        </span>

                        <span>
                          Time:{" "}
                          <strong className="text-slate-700">
                            {formatTime(
                              session.started_at
                            )}
                          </strong>
                        </span>

                        <span>
                          Duration:{" "}
                          <strong className="text-slate-700">
                            90 seconds
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Present count */}
                    <div className="min-w-[150px] rounded-xl bg-green-50 px-5 py-4 text-center">
                      <p className="text-sm font-medium text-green-700">
                        Present
                      </p>

                      <p className="mt-1 text-3xl font-bold text-green-700">
                        {presentCount}
                      </p>

                      <p className="text-xs text-green-600">
                        student
                        {presentCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}