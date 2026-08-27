"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Sign-in for the internal staff tools. Deliberately restrained: this is a
// door, not a landing page. What earns its place here is correctness -
// every state the form can actually be in is designed, rather than the
// happy path plus a bare line of red text.
//
// A "not configured" response (no ADMIN_STAFF_PASSWORD set on the server) is
// shown as a warning rather than an error: nothing the person typed is wrong,
// and telling them to try another password would waste their time.
type FormError = { message: string; tone: "error" | "warning" };

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Caught here rather than at the server: an empty submit has no chance of
    // succeeding, and a round trip to be told so is just latency.
    if (!password) {
      setError({ message: "Enter the staff password to continue.", tone: "error" });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError({
          message: data?.error ?? "Something went wrong. Try again.",
          tone: res.status === 500 ? "warning" : "error",
        });
        setSubmitting(false);
        return;
      }
      router.push("/admin");
      router.refresh();
      // Intentionally stays in the submitting state: the button should read
      // "Signing in…" through the navigation rather than flicking back to
      // "Sign in" while the next page loads.
    } catch {
      setError({ message: "Could not reach the server. Check your connection.", tone: "error" });
      setSubmitting(false);
    }
  }

  const errorId = "login-error";
  const capsId = "login-caps";

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[13px] font-semibold text-neutral-slate">
          Staff password
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={error?.tone === "error" ? true : undefined}
            aria-describedby={[error ? errorId : null, capsLock ? capsId : null]
              .filter(Boolean)
              .join(" ") || undefined}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // A stale "Incorrect password" sitting under a field they are
              // actively fixing reads as though it applies to what they're
              // typing now.
              if (error) setError(null);
            }}
            onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
            onKeyDown={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
            onBlur={() => setCapsLock(false)}
            className={`w-full rounded-md border-[1.5px] bg-neutral-white py-3 pr-24 pl-4 text-[15px] text-neutral-ink transition-colors duration-150 ease-out-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-steel-teal ${
              error?.tone === "error"
                ? "border-red-400 focus:border-red-500"
                : "border-neutral-border focus:border-institutional-navy"
            }`}
          />
          {/* Useful precisely because this is a long shared password typed
              from a manager, where a silent typo is the likeliest failure. */}
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3.5 text-[12.5px] font-semibold text-neutral-slate transition-colors duration-150 ease-out-soft hover:text-institutional-navy focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel-teal"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        </div>

        {capsLock && (
          <p id={capsId} className="text-[12.5px] text-amber-800">
            Caps Lock is on.
          </p>
        )}
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className={`flex gap-2.5 rounded-md border p-3 text-[13px] leading-relaxed ${
            error.tone === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
            className="mt-px shrink-0"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 5v3.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          <span>{error.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-institutional-navy px-7 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out-soft hover:bg-navy-deep active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-teal disabled:cursor-wait disabled:opacity-70 disabled:hover:bg-institutional-navy"
      >
        {submitting && (
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          >
            <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path
              d="M13.5 7.5A6 6 0 007.5 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
