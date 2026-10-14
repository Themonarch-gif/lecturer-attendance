
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  course_name: string;
  course_code: string;
};

type DecodedField = {
  key: string;
  value: string;
};

export default function ScanStudentQRPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const scannerRef = useRef<any>(null);
  const mountedRef = useRef(false);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [rawQR, setRawQR] = useState("");
  const [fields, setFields] = useState<DecodedField[]>([]);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    async function loadCourse() {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
  setMessage(
    `Login session could not be verified. ${
      authError?.message ?? "No authenticated user was returned."
    } Please return to the dashboard and try again.`
  );
  setLoading(false);
  return;
}

      const { data, error } = await supabase
        .from("courses")
        .select("id, course_name, course_code")
        .eq("id", String(courseId))
        .eq("lecturer_id", authData.user.id)
        .single();

      if (error || !data) {
        setMessage("Course not found, or you do not have access to it.");
      } else {
        setCourse(data);
      }

      setLoading(false);
    }

    loadCourse();

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch {}
            scannerRef.current = null;
          });
      }
    };
  }, [courseId, router]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // The camera may already have stopped.
    }

    try {
      scanner.clear();
    } catch {
      // The scanner may already have been cleared.
    }

    scannerRef.current = null;
    setScanning(false);
  }, []);

  function decodeQRContent(decodedText: string) {
    setRawQR(decodedText);
    setReviewed(false);

    try {
      const parsed: unknown = JSON.parse(decodedText);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        const entries = Object.entries(
          parsed as Record<string, unknown>
        );

        const decodedFields = entries.map(([key, value]) => ({
          key,
          value:
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value),
        }));

        setFields(decodedFields);
      } else {
        setFields([{ key: "QR content", value: decodedText }]);
      }
    } catch {
      setFields([{ key: "QR content", value: decodedText }]);
    }
  }

  async function startScanner() {
    setMessage("");
    setRawQR("");
    setFields([]);
    setReviewed(false);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode("student-qr-reader");
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        scannerRef.current = null;
        setMessage("No camera was found on this device.");
        return;
      }

      const preferredCamera =
        cameras.find((camera) =>
          /back|rear|environment/i.test(camera.label)
        ) ?? cameras[0];

      await scanner.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          if (!mountedRef.current) return;

          decodeQRContent(decodedText);
          setMessage("QR code scanned. Review the decoded information below.");

          await stopScanner();
        },
        () => {
          // No QR found in this frame. Keep scanning.
        }
      );

      setScanning(true);
    } catch (error) {
      scannerRef.current = null;
      setScanning(false);

      const detail =
        error instanceof Error ? error.message : String(error);

      setMessage(
        `Could not start the camera. Check browser camera permission and try again. ${detail}`
      );
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p>Loading course...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-white p-6 text-gray-900">
      <button
        type="button"
        onClick={() =>
          router.push(`/dashboard/courses/${courseId}/attendance`)
        }
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Back to attendance session
      </button>

      <header>
        <h1 className="text-2xl font-bold">Scan Student QR</h1>
        {course && (
          <p className="mt-2 text-gray-700">
            {course.course_name} ({course.course_code})
          </p>
        )}
      </header>

      {message && (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"
          role="status"
        >
          {message}
        </div>
      )}

      {!course && (
        <p className="text-sm text-red-600">
          Return to your courses and select a course you manage.
        </p>
      )}

      {course && (
        <>
          <section className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-gray-900">
            <h2 className="text-lg font-semibold">Camera scanner</h2>
            <p className="text-sm text-gray-600">
              Ask the student to display their QR code in front of your
              camera. The scan only reads the QR content; it does not
              record attendance.
            </p>

            <div
              id="student-qr-reader"
              className="w-full overflow-hidden rounded-lg"
            />

            {!scanning ? (
              <button
                type="button"
                onClick={startScanner}
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Open Camera and Scan
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="rounded-lg border border-gray-400 bg-white px-5 py-3 font-semibold text-gray-900 hover:bg-gray-100"
              >
                Stop Scanner
              </button>
            )}
          </section>

          {rawQR && (
            <section className="space-y-4 rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Review scanned QR</h2>

              <p className="text-sm font-medium text-amber-900">
                This is decoded QR content, not verified student identity.
                Confirm the details with the student before proceeding.
              </p>

              <dl className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={`${field.key}-${index}`}
                    className="grid gap-1 border-b pb-3 sm:grid-cols-[160px_1fr]"
                  >
                    <dt className="break-words text-sm font-medium text-gray-700">
                      {field.key.replace(/[_-]/g, " ")}
                    </dt>
                    <dd className="break-words text-sm">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(event) => setReviewed(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have reviewed the displayed information with the
                  student.
                </span>
              </label>

              <button
                type="button"
                disabled={!reviewed}
                onClick={() =>
                  setMessage(
                    "Review confirmed locally. No attendance record has been created. Student verification and secure attendance submission still need to be connected."
                  )
                }
                className="rounded-lg bg-gray-800 px-5 py-3 font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Details for Review
              </button>

              <button
                type="button"
                onClick={() => {
                  setRawQR("");
                  setFields([]);
                  setReviewed(false);
                  setMessage("");
                }}
                className="ml-3 rounded-lg border px-5 py-3 font-medium hover:bg-gray-50"
              >
                Scan Another Student
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
