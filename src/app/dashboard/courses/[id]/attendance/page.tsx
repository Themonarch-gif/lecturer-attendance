"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_name: string;
  course_code: string;
  course_units: number;
};

type AttendanceSession = {
  id: string;
  attendance_code: string;
  started_at: string;
  expires_at: string;
};

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load course and active attendance session
  // --------------------------------------------------

  useEffect(() => {
    async function loadAttendancePage() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, course_name, course_code, course_units")
        .eq("id", courseId)
        .eq("lecturer_id", user.id)
        .single();

      if (courseError || !courseData) {
        setError("Course not found.");
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Look for an active attendance session
      const now = new Date().toISOString();

      const { data: activeSession, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("id, attendance_code, started_at, expires_at")
        .eq("course_id", courseId)
        .eq("lecturer_id", user.id)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error(sessionError);
        setError("Unable to load attendance session.");
        setLoading(false);
        return;
      }

      if (activeSession) {
        setSession(activeSession);

        const remaining = Math.max(
          0,
          Math.ceil(
            (new Date(activeSession.expires_at).getTime() -
              Date.now()) /
              1000
          )
        );

        setTimeLeft(remaining);
      } else {
        // Important:
        // No active session means the lecturer should see
        // the Start Attendance button.
        setSession(null);
        setTimeLeft(0);
      }

      setLoading(false);
    }

    loadAttendancePage();
  }, [courseId, router]);

  // --------------------------------------------------
  // Countdown timer
  // --------------------------------------------------

  useEffect(() => {
    if (!session) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(session.expires_at).getTime() - Date.now()) /
            1000
        )
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [session]);

  // --------------------------------------------------
  // Generate random 4-digit attendance code
  // --------------------------------------------------

  function generateAttendanceCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // --------------------------------------------------
  // Start attendance
  // --------------------------------------------------

  async function handleStartAttendance() {
    if (!course) return;

    setStarting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check whether an active session already exists
    const now = new Date();

    const { data: existingSession, error: existingError } =
      await supabase
        .from("attendance_sessions")
        .select("id, attendance_code, started_at, expires_at")
        .eq("course_id", course.id)
        .eq("lecturer_id", user.id)
        .gt("expires_at", now.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingError) {
      console.error(existingError);
      setError("Unable to check for an active session.");
      setStarting(false);
      return;
    }

    // If an active session already exists, reuse it
    if (existingSession) {
      setSession(existingSession);

      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(existingSession.expires_at).getTime() -
            Date.now()) /
            1000
        )
      );

      setTimeLeft(remaining);
      setStarting(false);
      return;
    }

    // Create a new session
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + 90 * 1000
    );

    const attendanceCode = generateAttendanceCode();

    const { data: newSession, error: insertError } =
      await supabase
        .from("attendance_sessions")
        .insert({
          course_id: course.id,
          lecturer_id: user.id,
          attendance_code: attendanceCode,
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select(
          "id, attendance_code, started_at, expires_at"
        )
        .single();

    if (insertError || !newSession) {
      console.error(insertError);
      setError("Unable to start attendance. Please try again.");
      setStarting(false);
      return;
    }

    setSession(newSession);

    setTimeLeft(
      Math.ceil(
        (new Date(newSession.expires_at).getTime() -
          Date.now()) /
          1000
      )
    );

    setStarting(false);
  }

  // --------------------------------------------------
  // Format countdown
  // --------------------------------------------------

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-500">
              Loading attendance...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error && !course) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-red-600">{error}</p>

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

  // --------------------------------------------------
  // Determine whether attendance is currently active
  // --------------------------------------------------

  const attendanceActive =
    session !== null && timeLeft > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/courses/${courseId}`)
            }
            className="mb-4 text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Course
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Attendance
          </h1>

          {course && (
            <p className="mt-2 text-slate-500">
              {course.course_code} — {course.course_name}
            </p>
          )}
        </div>

        {/* Main Attendance Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {!attendanceActive ? (
            <>
              {/* No active session */}
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                  <span className="text-3xl">✓</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Ready to take attendance?
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-slate-500">
                  Start an attendance session to generate a
                  unique 4-digit code. Students will use this
                  code to mark their attendance.
                </p>

                {/* Error when starting */}
                {error && (
                  <div className="mx-auto mt-6 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* START BUTTON */}
                <button
                  type="button"
                  onClick={handleStartAttendance}
                  disabled={starting}
                  className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting
                    ? "Starting..."
                    : "Start Attendance"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Active Session */}
              <div className="text-center">
                <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  Attendance Active
                </div>

                <h2 className="text-xl font-semibold text-slate-900">
                  Attendance Code
                </h2>

                <div className="mt-5 text-6xl font-bold tracking-[0.3em] text-slate-900">
                  {session.attendance_code}
                </div>

                <p className="mt-6 text-sm text-slate-500">
                  Students should enter this code in the
                  student app.
                </p>

                {/* Countdown */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500">
                    Code expires in
                  </p>

                  <p className="mt-1 text-4xl font-bold text-blue-600">
                    {formatTime(timeLeft)}
                  </p>
                </div>

                <div className="mx-auto mt-8 max-w-xl rounded-xl bg-blue-50 px-5 py-4 text-sm text-blue-700">
                  Keep this code visible while students are
                  marking attendance. The code will expire
                  automatically after 90 seconds.
                </div>

                {/* Error */}
                {error && (
                  <div className="mx-auto mt-6 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* ACTIVE SESSION BUTTONS */}
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleStartAttendance}
                    disabled={starting}
                    className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {starting
                      ? "Starting..."
                      : "Start New Session"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/dashboard/courses/${courseId}/attendance/history`
                      )
                    }
                    className="rounded-xl border border-blue-200 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    View Attendance History
                  </button>
                </div>
              </div>
            </>
          )}

          {/* HISTORY BUTTON WHEN THERE IS NO ACTIVE SESSION */}
          {!attendanceActive && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/courses/${courseId}/attendance/history`
                  )
                }
                className="rounded-xl border border-blue-200 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                View Attendance History
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}