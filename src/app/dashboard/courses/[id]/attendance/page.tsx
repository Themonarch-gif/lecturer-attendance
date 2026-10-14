
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_name: string;
  course_code: string;
  course_units: number;
};

type AttendanceSession = {
  id: string;
  session_token: string;
  started_at: string;
  expires_at: string;
};

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const supabase = useMemo(() => createClient(), []);

  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] =
    useState<AttendanceSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Load the course and any active QR attendance session.
  useEffect(() => {
    let cancelled = false;

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

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select("id, course_name, course_code, course_units")
          .eq("id", courseId)
          .eq("lecturer_id", user.id)
          .single();

      if (cancelled) return;

      if (courseError || !courseData) {
        setError("Course not found or you do not have access.");
        setLoading(false);
        return;
      }

      setCourse(courseData);

      const { data: activeSession, error: sessionError } =
        await supabase
          .from("attendance_sessions")
          .select("id, session_token, started_at, expires_at")
          .eq("course_id", courseId)
          .eq("lecturer_id", user.id)
          .not("session_token", "is", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (cancelled) return;

      if (sessionError) {
        console.error(sessionError);
        setError("Unable to load the attendance session.");
        setLoading(false);
        return;
      }

      if (activeSession) {
        setSession(activeSession);
        setTimeLeft(
          Math.max(
            0,
            Math.ceil(
              (new Date(activeSession.expires_at).getTime() -
                Date.now()) /
                1000
            )
          )
        );
      } else {
        setSession(null);
        setTimeLeft(0);
      }

      setLoading(false);
    }

    loadAttendancePage();

    return () => {
      cancelled = true;
    };
  }, [courseId, router, supabase]);

  // Countdown: the database expiry time is the source of truth.
  useEffect(() => {
    if (!session) {
      setTimeLeft(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(session.expires_at).getTime() - Date.now()) /
            1000
        )
      );

      setTimeLeft(remaining);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Create a new QR session.
  async function handleStartAttendance() {
    if (!course || starting) return;

    setStarting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Reuse an active QR session rather than creating duplicates.
      const { data: existingSession, error: lookupError } =
        await supabase
          .from("attendance_sessions")
          .select("id, session_token, started_at, expires_at")
          .eq("course_id", course.id)
          .eq("lecturer_id", user.id)
          .not("session_token", "is", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      if (existingSession) {
        setSession(existingSession);
        return;
      }

      // Generate an unpredictable token using the browser's
      // cryptographically secure UUID generator.
      const sessionToken = crypto.randomUUID();
      const startedAt = new Date();
      const expiresAt = new Date(
        startedAt.getTime() + 90 * 1000
      );

      const { data: newSession, error: insertError } =
        await supabase
          .from("attendance_sessions")
          .insert({
            course_id: course.id,
            lecturer_id: user.id,
            session_token: sessionToken,
            attendance_code: null,
            started_at: startedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .select("id, session_token, started_at, expires_at")
          .single();

      if (insertError || !newSession) {
        throw insertError ?? new Error("Session creation failed.");
      }

      setSession(newSession);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to start attendance. Please check your connection and try again."
      );
    } finally {
      setStarting(false);
    }
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  function viewHistory() {
    router.push(
      `/dashboard/courses/${courseId}/attendance/history`
    );
  }

  const attendanceActive =
    session !== null && timeLeft > 0;

  // This is the agreed placeholder payload for integration.
  // The student scanner must be updated to read this format.
  const qrPayload = session
    ? JSON.stringify({
        type: "attendance_session",
        token: session.session_token,
      })
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-500">
            Loading attendance...
          </p>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
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
            QR Attendance
          </h1>

          <p className="mt-2 text-slate-500">
            {course.course_code} — {course.course_name}
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {!attendanceActive ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl">
                QR
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Ready to take attendance?
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-slate-500">
                Start a session to display a unique QR code.
                The session expires automatically after 90 seconds.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mx-auto mt-5 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleStartAttendance}
                disabled={starting}
                className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? "Starting..." : "Start Attendance"}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Attendance Active
              </span>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Scan to identify this session
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                Keep this QR code visible while the session is active.
              </p>

              <div className="mx-auto mt-6 inline-flex rounded-2xl border border-slate-200 bg-white p-4">
                <QRCodeSVG
                  value={qrPayload}
                  size={240}
                  level="H"
                  includeMargin
                  title="Attendance session QR code"
                />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Session expires in
              </p>

              <p className="mt-1 text-4xl font-bold text-blue-600">
                {formatTime(timeLeft)}
              </p>

              <p className="mx-auto mt-5 max-w-xl rounded-xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
                Integration pending: the student portal must
                recognize this QR payload and submit the token
                to the backend before attendance can be recorded.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleStartAttendance}
                  disabled={starting}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {starting ? "Checking..." : "Start New Session"}
                </button>

                <button
                  type="button"
                  onClick={viewHistory}
                  className="rounded-xl border border-blue-200 px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                >
                  View Attendance History
                </button>
              </div>
            </div>
          )}

          {!attendanceActive && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={viewHistory}
                className="rounded-xl border border-blue-200 px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
              >
                View Attendance History
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
