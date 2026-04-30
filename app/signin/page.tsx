"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PhoneShell from "@/components/PhoneShell";
import TopNav from "@/components/TopNav";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const reason = params.get("reason");

  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setErr("");
    if (phone.length < 7) {
      setErr("Please enter a valid phone number.");
      return;
    }
    if (secret.length < 3) {
      setErr("Your secret word must be at least 3 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, secret }),
      });
      if (res.ok) {
        router.push(next);
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Sign-in failed. Please try again.");
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav back="/" backLabel="Back" crumb="Sign in" />
      <div className="auth">
        <div className="auth-hero">
          <div className="auth-lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 1 1 8 0v4" />
            </svg>
          </div>
          <h2>
            The page is <em>locked</em>.
          </h2>
          <p className="sub">
            Enter your phone number and your secret word. Both must match — even
            if you bookmarked the page.
          </p>
        </div>

        {reason === "idle" && (
          <div className="info-box" style={{ marginBottom: 14 }}>
            You were <b>signed out for safety</b> after 20 minutes of inactivity.
            Sign in again to continue.
          </div>
        )}
        {reason === "expired" && (
          <div className="info-box" style={{ marginBottom: 14 }}>
            Your <b>session expired</b>. Please sign in again.
          </div>
        )}

        <div className="auth-form">
          <div className="field-group">
            <label>Phone number</label>
            <input
              className="input"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
            <div className="field-hint">Numbers only · the same one each time</div>
          </div>

          <div className="field-group">
            <label>Secret word</label>
            <input
              className="input"
              type="password"
              placeholder="something only you know"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
            <div className="field-hint">Case-insensitive · pick a word, not a sentence</div>
          </div>

          {err && <div className="err">{err}</div>}

          <button className="btn accent" onClick={onSubmit} disabled={loading}>
            {loading ? "Checking…" : "Sign in →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link
              href="/signup"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--muted)",
                textDecoration: "none",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              No account yet? <b style={{ color: "var(--accent)" }}>Create one →</b>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <SignInForm />
      </Suspense>
    </PhoneShell>
  );
}
