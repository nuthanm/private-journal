"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneShell from "@/components/PhoneShell";
import TopNav from "@/components/TopNav";

export default function SignUpPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setErr("");
    if (phone.replace(/\D/g, "").length < 7) {
      setErr("Phone must be at least 7 digits.");
      return;
    }
    if (secret.length < 6) {
      setErr("Secret should be at least 6 characters. Pick something memorable.");
      return;
    }
    if (secret !== confirm) {
      setErr("The two secrets don't match. Try again.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, secret }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Sign-up failed. Please try again.");
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneShell>
      <TopNav back="/" backLabel="Back" crumb="Create account" />
      <div className="auth">
        <div className="auth-hero">
          <div className="auth-lock">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h2>
            Create an <em>account</em>.
          </h2>
          <p className="sub">
            Pick a phone number and a secret word you&apos;ll remember. Both
            together are your only key — there is no email recovery.
          </p>
        </div>

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
            <div className="field-hint">Numbers only · pick something you&apos;ll always remember</div>
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
            <div className="field-hint">
              At least 6 characters · case-insensitive
            </div>
          </div>

          <div className="field-group">
            <label>Confirm secret</label>
            <input
              className="input"
              type="password"
              placeholder="repeat it"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>

          {err && <div className="err">{err}</div>}

          <div className="info-box">
            ⚠ <b>Important:</b> if you forget your secret, your journal cannot
            be recovered. Pick something you&apos;ll remember in five years.
          </div>

          <button className="btn accent" onClick={onSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create account →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link
              href="/signin"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--muted)",
                textDecoration: "none",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Have an account? <b style={{ color: "var(--accent)" }}>Sign in →</b>
            </Link>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
