"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewEntry() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", body: "" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.entry?.id) {
          router.replace(`/journal/${data.entry.id}/edit`);
        } else {
          router.replace("/journal");
        }
      });
  }, [router]);

  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Creating new entry…
    </div>
  );
}
