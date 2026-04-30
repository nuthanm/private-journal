"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function Settings() {
  const router = useRouter();
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.account?.created_at) {
          setCreated(new Date(data.account.created_at).toLocaleDateString());
        }
      });
  }, []);

  const signOut = async () => {
    await fetch("/api/signout", { method: "POST" });
    router.replace("/");
  };

  return (
    <>
      <TopNav back="/dashboard" backLabel="Back" crumb="Settings" />
      <div style={{ padding: "0 22px 60px" }}>
        <div style={{ textAlign: "center", padding: "14px 0 22px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), var(--gold))",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Instrument Serif, serif",
              fontSize: 30,
              color: "#fff",
              fontStyle: "italic",
              boxShadow: "var(--shadow-card)",
            }}
          >
            𝓘
          </div>
          <h3
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: 22,
              fontWeight: 400,
              marginTop: 10,
              letterSpacing: "-0.01em",
            }}
          >
            Hello, friend.
          </h3>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            Account created {created || "—"}
          </div>
        </div>

        {[
          {
            label: "Account",
            rows: [
              { l: "Phone number", r: "•••• →" },
              { l: "Secret word", r: "change →" },
              { l: "Recovery code", r: "view →" },
            ],
          },
          {
            label: "Security",
            rows: [
              { l: "Auto sign-out (idle)", r: "20 minutes →" },
              { l: "Active sessions", r: "1 device →" },
            ],
          },
          {
            label: "Data",
            rows: [
              { l: "Export full journal", r: "PDF →", href: "/export" },
              { l: "Backup", r: "cloud · on →" },
            ],
          },
        ].map((sec) => (
          <div key={sec.label} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              {sec.label}
            </div>
            {sec.rows.map((row) => {
              const inner = (
                <>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{row.l}</span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {row.r}
                  </span>
                </>
              );
              const baseStyle = {
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "var(--shadow-soft)",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              } as const;
              return row.href ? (
                <Link key={row.l} href={row.href} style={baseStyle}>
                  {inner}
                </Link>
              ) : (
                <div key={row.l} style={baseStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Session
          </div>
          <div
            onClick={signOut}
            style={{
              background: "var(--paper)",
              border: "1px solid rgba(168,52,31,0.3)",
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "var(--shadow-soft)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>
              Sign out now
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "var(--accent)",
                letterSpacing: "0.15em",
              }}
            >
              →
            </span>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          v 0.1 · made with care
        </div>
      </div>
    </>
  );
}
