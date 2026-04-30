"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function Privacy() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [vis, setVis] = useState<"private" | "link" | "public">("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entry) setVis(data.entry.visibility);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const onSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/entries/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: vis }),
      });
      router.push(`/journal/${params.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading…</div>;
  }

  return (
    <>
      <TopNav back={`/journal/${params.id}`} backLabel="Back" crumb="Privacy" />
      <div className="privacy">
        <div className="privacy-hero">
          <div className="ico">𝓅</div>
          <h2>Who can read this?</h2>
          <p>
            By default, nobody. Choose, entry by entry, what — if anything —
            ever leaves the notebook.
          </p>
        </div>

        <div className="vis-options">
          <div
            className={`vis-option ${vis === "private" ? "selected" : ""}`}
            onClick={() => setVis("private")}
          >
            <div className="row">
              <div className="radio" />
              <div className="copy">
                <h4>🔒 Private (default)</h4>
                <p>
                  Only you. The auth wall + per-account isolation keeps it away
                  from other users.
                </p>
              </div>
            </div>
          </div>
          <div
            className={`vis-option ${vis === "link" ? "selected" : ""}`}
            onClick={() => setVis("link")}
          >
            <div className="row">
              <div className="radio" />
              <div className="copy">
                <h4>🔗 Shared link</h4>
                <p>
                  Anyone with the secret link can read. Optional password &amp;
                  expiry. Revocable any time.
                </p>
              </div>
            </div>
          </div>
          <div
            className={`vis-option ${vis === "public" ? "selected" : ""}`}
            onClick={() => setVis("public")}
          >
            <div className="row">
              <div className="radio" />
              <div className="copy">
                <h4>● Public page</h4>
                <p>
                  Published to your author page. Anyone can find and read it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="info-box">
          ⚠ <b>Once published</b>, anyone who reads or screenshots the page may
          keep their copy. Unpublishing removes the public copy from the app,
          but cannot recall what others have already saved.
        </div>

        <button
          className="btn accent"
          style={{ marginTop: 14 }}
          onClick={onSave}
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : vis === "private"
              ? "Keep private"
              : vis === "link"
                ? "Generate shared link"
                : "Publish this entry"}
        </button>
      </div>
    </>
  );
}
