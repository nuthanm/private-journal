"use client";

import { Suspense } from "react";
import TopNav from "@/components/TopNav";

function ExportContent() {
  const onExportFull = () => {
    alert(
      "Full PDF export will be implemented in v1.1. For now, individual entries can be saved using your browser's print-to-PDF (Cmd/Ctrl + P) on the entry reader."
    );
  };

  return (
    <>
      <TopNav back="/journal" backLabel="Back" crumb="Export" />
      <div style={{ padding: "0 22px 32px" }}>
        <div style={{ textAlign: "center", padding: "14px 0 18px" }}>
          <h2
            className="h-display"
            style={{ fontSize: 26, letterSpacing: "-0.01em" }}
          >
            Keep your <em style={{ color: "var(--accent)" }}>journal</em>, beautifully.
          </h2>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--muted)",
              marginTop: 6,
              lineHeight: 1.5,
              padding: "0 12px",
            }}
          >
            Export as a typeset PDF — serif type, drop caps, ornaments, a cover,
            and a contents page.
          </p>
        </div>

        {/* Mini PDF preview */}
        <div
          style={{
            aspectRatio: "8.5 / 11",
            background: "#fefcf6",
            border: "1px solid var(--rule)",
            borderRadius: 6,
            padding: "24px 22px",
            margin: "0 auto 16px",
            boxShadow:
              "0 16px 32px -16px rgba(168,52,31,0.18), 0 6px 12px rgba(26,22,18,0.06)",
            display: "flex",
            flexDirection: "column",
            transform: "rotate(-0.5deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--ink)",
              paddingBottom: 5,
              marginBottom: 12,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 6,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--muted)",
            }}
          >
            <span>Vol. I · Spring</span>
            <span>
              page <b style={{ color: "var(--accent)" }}>14</b>
            </span>
          </div>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 6,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              marginBottom: 4,
            }}
          >
            Wednesday · 29 April
          </div>
          <h3
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginBottom: 8,
            }}
          >
            On the long{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>walk home</em>
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <div
              style={{ flex: 1, height: 0.5, background: "rgba(26,22,18,0.3)" }}
            />
            <span
              style={{
                fontFamily: "Instrument Serif",
                fontStyle: "italic",
                color: "var(--accent)",
                fontSize: 8,
              }}
            >
              ❦
            </span>
            <div
              style={{ flex: 1, height: 0.5, background: "rgba(26,22,18,0.3)" }}
            />
          </div>
          <div
            style={{
              fontSize: 7,
              lineHeight: 1.55,
              color: "var(--ink)",
            }}
          >
            <p style={{ marginBottom: 5 }}>
              <span
                style={{
                  fontFamily: "Instrument Serif",
                  fontSize: 22,
                  float: "left",
                  lineHeight: 0.85,
                  padding: "2px 4px 0 0",
                  color: "var(--accent)",
                  fontStyle: "italic",
                }}
              >
                T
              </span>
              he light through the jacaranda was the colour of stained paper, and
              I kept stopping to look up.
            </p>
            <p>
              I am trying to write more honestly. Not better, exactly — honestly.
              The two have a habit of being confused.
            </p>
          </div>
          <div
            style={{
              marginTop: "auto",
              paddingTop: 5,
              borderTop: "1px solid rgba(26,22,18,0.2)",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 5,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--muted)",
            }}
          >
            <span>— for J. —</span>
            <span>— 14 —</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn accent" onClick={onExportFull}>
            ⤓ Export full journal as PDF
          </button>
          <button className="btn ghost" onClick={onExportFull}>
            Export this entry only
          </button>
          <button className="btn ghost" onClick={onExportFull}>
            Export as Markdown / EPUB
          </button>
        </div>

        <div className="info-box" style={{ marginTop: 16 }}>
          <b>Note:</b> Server-side PDF generation will arrive in v1.1. For now,
          you can save any entry using your browser&apos;s built-in print to PDF
          (Cmd/Ctrl + P) on the entry reader page.
        </div>
      </div>
    </>
  );
}

export default function ExportPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <ExportContent />
    </Suspense>
  );
}
