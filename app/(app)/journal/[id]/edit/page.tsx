"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function Editor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load existing entry
  useEffect(() => {
    fetch(`/api/entries/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entry) {
          setTitle(data.entry.title || "");
          setBody(data.entry.body || "");
          setSavedAt(new Date(data.entry.updated_at));
        }
      })
      .finally(() => setLoaded(true));
  }, [params.id]);

  // Debounced autosave
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/entries/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body }),
        });
        if (res.ok) {
          setSavedAt(new Date());
        }
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, body, params.id, loaded]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const ago = savedAt ? secondsAgo(savedAt) : null;

  return (
    <>
      <div className="top-nav">
        <button className="back" onClick={() => router.push(`/journal/${params.id}`)}>
          ← Done
        </button>
        <span className={`save-pill ${saving ? "saving" : ""}`}>
          {saving ? "Saving…" : ago !== null ? `Saved · ${ago}` : "—"}
        </span>
        <button
          className="menu"
          onClick={() => router.push(`/journal/${params.id}/privacy`)}
        >
          𝓅
        </button>
      </div>

      <div className="editor">
        <div className="date-line">{today} · Morning</div>
        <input
          className="title-input"
          placeholder="Give this page a title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="body-input"
          placeholder="Begin where you are. The page is patient."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
    </>
  );
}

function secondsAgo(d: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
