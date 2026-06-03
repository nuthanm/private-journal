"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";

type Task = {
  id: string;
  title: string;
  done: boolean;
  pinned: boolean;
  sort_order: number;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const dragId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);

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
      setTasks((prev) => [data.task, ...prev]);
      setNewTitle("");
    }
  };

  const toggle = async (t: Task) => {
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

  const togglePin = async (t: Task) => {
    const next = !t.pinned;
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, pinned: next } : x))
    );
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: next }),
    });
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveEdit = async (t: Task) => {
    const trimmed = editTitle.trim();
    setEditingId(null);
    if (!trimmed || trimmed === t.title) return;
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, title: trimmed } : x))
    );
    await fetch(`/api/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
  };

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (id: string) => {
    dragId.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };

  const handleDrop = async (group: Task[], isPinned: boolean) => {
    const fromId = dragId.current;
    const toId = dragOverId.current;
    dragId.current = null;
    dragOverId.current = null;
    if (!fromId || !toId || fromId === toId) return;

    // Reorder within this group
    const fromIdx = group.findIndex((t) => t.id === fromId);
    const toIdx = group.findIndex((t) => t.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...group];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Globally-unique sort_order: pinned group = 0…N, pending group = 10000…
    const offset = isPinned ? 0 : 10000;

    // Merge reordered group back into full task list preserving other groups
    setTasks((prev) => {
      const groupIds = new Set(group.map((t) => t.id));
      const rest = prev.filter((t) => !groupIds.has(t.id));
      const updated = reordered.map((t, i) => ({ ...t, sort_order: offset + i }));
      return [...updated, ...rest];
    });

    // Persist new order
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((t) => t.id), pinned: isPinned }),
    });
  };

  // ── Derived groups ─────────────────────────────────────────────────────────

  const pinned = tasks.filter((t) => t.pinned && !t.done);
  const pending = tasks.filter((t) => !t.pinned && !t.done);
  const done = tasks.filter((t) => t.done);

  const remaining = pending.length + pinned.length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Task row renderer ──────────────────────────────────────────────────────

  const renderTask = (t: Task, draggable: boolean, group: Task[], isGroupPinned: boolean) => (
    <div
      key={t.id}
      draggable={draggable && editingId !== t.id}
      onDragStart={() => handleDragStart(t.id)}
      onDragOver={(e) => handleDragOver(e, t.id)}
      onDrop={() => handleDrop(group, isGroupPinned)}
      className="card tap"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 14,
        cursor: draggable ? "grab" : "default",
        borderLeft: t.pinned ? "3px solid var(--gold)" : undefined,
        opacity: t.done ? 0.65 : 1,
      }}
    >
      {/* Drag handle */}
      {draggable && (
        <span
          title="Drag to reorder"
          style={{
            color: "var(--rule)",
            fontSize: 16,
            cursor: "grab",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          ⠿
        </span>
      )}

      {/* Done toggle */}
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

      {/* Title / edit input */}
      {editingId === t.id ? (
        <input
          ref={editInputRef}
          className="input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => saveEdit(t)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit(t);
            if (e.key === "Escape") setEditingId(null);
          }}
          style={{ flex: 1, fontSize: 14, padding: "4px 8px" }}
        />
      ) : (
        <div
          onClick={() => startEdit(t)}
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
      )}

      {/* Pin button */}
      {editingId !== t.id && !t.done && (
        <button
          onClick={() => togglePin(t)}
          title={t.pinned ? "Unpin task" : "Pin task to top"}
          style={{
            background: "none",
            border: "none",
            color: t.pinned ? "var(--gold)" : "var(--muted-2)",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          📌
        </button>
      )}

      {/* Edit button */}
      {editingId !== t.id && (
        <button
          onClick={() => startEdit(t)}
          title="Edit task"
          style={{
            background: "none",
            border: "none",
            color: "var(--muted-2)",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ✏
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={() => remove(t)}
        title="Delete task"
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
  );

  // ── Render ─────────────────────────────────────────────────────────────────

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

        {/* Add task input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
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

        {/* Empty state */}
        {tasks.length === 0 && !loading && (
          <div className="info-box">
            No tasks yet. Add one above and hit Enter.
          </div>
        )}

        {/* Pinned section */}
        {pinned.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 600,
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: 8,
              }}
            >
              📌 Pinned
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {pinned.map((t) => renderTask(t, true, pinned, true))}
            </div>
          </>
        )}

        {/* Pending section */}
        {pending.length > 0 && (
          <>
            {pinned.length > 0 && (
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  marginBottom: 8,
                }}
              >
                To do
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {pending.map((t) => renderTask(t, true, pending, false))}
            </div>
          </>
        )}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                fontWeight: 600,
                color: "var(--green)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: 8,
              }}
            >
              ✓ Done ({done.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {done.map((t) => renderTask(t, false, done, false))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

