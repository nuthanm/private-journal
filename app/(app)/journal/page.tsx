"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";

type Entry = {
  id: string;
  title: string;
  body: string;
  visibility: "private" | "link" | "public";
  updated_at: string;
};

export default function JournalList() {
  const [filter, setFilter] = useState<"all" | "private" | "link" | "public">("all");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === "all" ? "/api/entries" : `/api/entries?visibility=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <>
      <TopNav
        back="/dashboard"
        backLabel="Back"
        crumb={`Journal · ${entries.length}`}
        rightHref="/export"
        rightLabel="⤓"
      />
      <div className="journal-list">
        <h2 className="h-display" style={{ fontSize: 30, marginBottom: 4 }}>
          Your <em style={{ color: "var(--accent)" }}>shelf</em>
        </h2>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          Every page you&apos;ve written. Tap one to read.
        </p>

        <div className="filter-bar">
          <div className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            All
          </div>
          <div className={`chip ${filter === "private" ? "active" : ""}`} onClick={() => setFilter("private")}>
            Private
          </div>
          <div className={`chip ${filter === "public" ? "active" : ""}`} onClick={() => setFilter("public")}>
            Published
          </div>
          <div className={`chip ${filter === "link" ? "active" : ""}`} onClick={() => setFilter("link")}>
            Shared
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            Loading…
          </div>
        )}
        {!loading && entries.length === 0 && (
          <div className="info-box">
            Nothing here yet. Tap the <b>+</b> button to write your first entry.
          </div>
        )}

        {entries.map((e) => (
          <Link key={e.id} href={`/journal/${e.id}`} className="entry-card">
            <div className="meta">
              <span className="date">
                {new Date(e.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="vis">
                {e.visibility === "private" && "🔒 Private"}
                {e.visibility === "public" && "● Published"}
                {e.visibility === "link" && "🔗 Shared"}
              </span>
            </div>
            <h3>{e.title || "Untitled"}</h3>
            <p className="preview">{e.body || "—"}</p>
          </Link>
        ))}

        <Link className="fab" href="/journal/new">
          +
        </Link>
      </div>
    </>
  );
}
