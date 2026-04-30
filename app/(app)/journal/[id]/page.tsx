"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type Entry = {
  id: string;
  title: string;
  body: string;
  visibility: string;
  created_at: string;
  updated_at: string;
};

export default function EntryReader() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${params.id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.entry) setEntry(data.entry);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <>
        <TopNav back="/journal" backLabel="Journal" crumb="Read" />
        <div style={{ padding: "0 24px" }}>
          <div className="info-box">Entry not found.</div>
        </div>
      </>
    );
  }

  const date = new Date(entry.updated_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const paragraphs = entry.body.split(/\n\n+/);

  const onDelete = async () => {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) router.push("/journal");
  };

  return (
    <>
      <TopNav
        back="/journal"
        backLabel="Journal"
        crumb="Read"
        rightHref={`/journal/${entry.id}/privacy`}
        rightLabel="𝓅"
      />
      <div className="entry-reader" style={{ padding: "0 24px 40px" }}>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            fontWeight: 600,
          }}
        >
          {date}
        </div>
        <h1
          className="h-display"
          style={{ fontSize: 34, marginTop: 6, letterSpacing: "-0.01em" }}
        >
          {entry.title || "Untitled"}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "14px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          <span
            style={{
              fontFamily: "Instrument Serif",
              fontStyle: "italic",
              color: "var(--accent)",
              fontSize: 18,
            }}
          >
            ❦
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)" }}>
          {paragraphs.length === 0 ||
          (paragraphs.length === 1 && !paragraphs[0]) ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
              (This entry is empty.)
            </p>
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: 12 }}>
                {i === 0 && p.length > 0 && (
                  <span
                    style={{
                      fontFamily: "Instrument Serif",
                      fontStyle: "italic",
                      fontSize: 38,
                      float: "left",
                      lineHeight: 0.85,
                      padding: "4px 6px 0 0",
                      color: "var(--accent)",
                    }}
                  >
                    {p[0]}
                  </span>
                )}
                {i === 0 ? p.slice(1) : p}
              </p>
            ))
          )}
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Link className="btn ghost" href={`/journal/${entry.id}/edit`}>
            ✎ Edit this entry
          </Link>
          <Link className="btn ghost" href={`/journal/${entry.id}/privacy`}>
            𝓅 Privacy &amp; publish
          </Link>
          <Link className="btn accent" href={`/export?id=${entry.id}`}>
            ⤓ Export as PDF
          </Link>
          <button
            className="btn ghost"
            onClick={onDelete}
            style={{
              color: "var(--accent)",
              borderColor: "rgba(168,52,31,0.3)",
            }}
          >
            🗑 Delete entry
          </button>
        </div>
      </div>
    </>
  );
}
