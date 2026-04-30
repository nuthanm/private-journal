"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";

type Task = { id: string; title: string; done: boolean };

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks || []))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks([data.task, ...tasks]);
      setNewTitle("");
    }
  };

  const toggle = async (t: Task) => {
    // Optimistic
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
    );
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
  };

  const remove = async (t: Task) => {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
  };

  const remaining = tasks.filter((t) => !t.done).length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <TopNav back="/dashboard" backLabel="Back" crumb="Daily tasks" />
      <div style={{ padding: "0 22px 60px" }}>
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
          {today}
        </div>
        <h2 className="h-display" style={{ fontSize: 30, marginTop: 4 }}>
          Today&apos;s <em style={{ color: "var(--accent)" }}>small list</em>
        </h2>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--muted)",
            marginTop: 6,
            marginBottom: 18,
          }}
        >
          {loading
            ? "Loading…"
            : `${remaining} thing${remaining === 1 ? "" : "s"} left. Keep it small. Keep it kind.`}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <input
            className="input"
            placeholder="Add a task…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            style={{ flex: 1 }}
          />
          <button
            className="btn accent"
            style={{ width: "auto", padding: "0 18px" }}
            onClick={add}
          >
            +
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.length === 0 && !loading && (
            <div className="info-box">
              No tasks yet. Add one above and hit Enter.
            </div>
          )}
          {tasks.map((t) => (
            <div
              key={t.id}
              className="card tap"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
              }}
            >
              <div
                onClick={() => toggle(t)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${t.done ? "var(--green)" : "var(--rule)"}`,
                  background: t.done ? "var(--green)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                {t.done && "✓"}
              </div>
              <div
                onClick={() => toggle(t)}
                style={{
                  fontSize: 14,
                  textDecoration: t.done ? "line-through" : "none",
                  color: t.done ? "var(--muted)" : "var(--ink)",
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                {t.title}
              </div>
              <button
                onClick={() => remove(t)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted-2)",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
