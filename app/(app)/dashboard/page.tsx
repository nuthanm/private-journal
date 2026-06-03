"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { useSessionTimer } from "@/components/SessionGuard";

type Entry = { id: string; title: string; visibility: string; updated_at: string };
type Task = { id: string; title: string; done: boolean; pinned: boolean };

export default function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { remaining } = useSessionTimer();

  useEffect(() => {
    Promise.all([
      fetch("/api/entries").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ])
      .then(([e, t]) => {
        setEntries(e.entries || []);
        setTasks(t.tasks || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const warn = remaining < 120;

  const wordCount = entries.reduce(
    (acc, e) => acc + ((e as Entry & { body?: string }).body?.split(/\s+/).filter(Boolean).length || 0),
    0
  );

  // Cached task groups for Today's tasks section
  const pinnedActiveTasks = tasks.filter((t) => t.pinned && !t.done);
  const pendingTasks = tasks.filter((t) => !t.pinned && !t.done).slice(0, Math.max(0, 3 - pinnedActiveTasks.length));
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <>
      <TopNav back={null} crumb="Dashboard" rightHref="/settings" rightLabel="☰" />
      <div className="dash">
        <div className="dash-greeting">
          <div className="date">{today}</div>
          <h2>
            Welcome back, <em>friend.</em>
          </h2>
        </div>

        <div className="session-bar">
          <div className="l">
            <div className="pulse" />
            <span className="lbl">Session active</span>
          </div>
          <div className={`timer ${warn ? "warn" : ""}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} left
          </div>
        </div>

        <div className="quick-actions">
          <Link className="qa-tile journal" href="/journal">
            <div className="num">i.</div>
            <h3>Journal</h3>
            <p>Write &amp; browse entries</p>
            <span className="arrow">↗</span>
          </Link>
          <Link className="qa-tile tasks" href="/tasks">
            <div className="num">ii.</div>
            <h3>Daily tasks</h3>
            <p>Today&apos;s small list</p>
            <span className="arrow">↗</span>
          </Link>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="v">{loading ? "—" : entries.length}</div>
            <div className="l">Entries</div>
          </div>
          <div className="stat">
            <div className="v">{loading ? "—" : tasks.filter((t) => t.done).length}</div>
            <div className="l">Done today</div>
          </div>
          <div className="stat">
            <div className="v">{loading ? "—" : wordCount.toLocaleString()}</div>
            <div className="l">Words</div>
          </div>
        </div>

        <div className="section-h">
          Recent entries
          <Link className="more" href="/journal">
            see all →
          </Link>
        </div>
        <div className="recent-list">
          {entries.length === 0 && !loading && (
            <div className="info-box">
              No entries yet. Tap <b>Journal</b> above to write your first one.
            </div>
          )}
          {entries.slice(0, 3).map((e) => (
            <Link key={e.id} className="recent-item" href={`/journal/${e.id}`}>
              <div className={`dot ${e.visibility}`} />
              <div className="info">
                <h5>{e.title || "Untitled"}</h5>
                <div className="when">
                  {new Date(e.updated_at).toLocaleDateString()} · {e.visibility}
                </div>
              </div>
              <span style={{ color: "var(--muted-2)" }}>›</span>
            </Link>
          ))}
        </div>

        <div className="section-h" style={{ marginTop: 24 }}>
          Today&apos;s tasks
          <Link className="more" href="/tasks">
            open →
          </Link>
        </div>
        <div className="recent-list">
          {tasks.length === 0 && !loading && (
            <div className="info-box">
              No tasks today. Open <b>Daily tasks</b> to add some.
            </div>
          )}
          {/* Pinned tasks always shown first */}
          {pinnedActiveTasks.map((t) => (
              <div key={t.id} className="recent-item">
                <div style={{ color: "var(--gold)", fontSize: 13, flexShrink: 0 }}>📌</div>
                <div className="info">
                  <h5 style={{ color: "var(--ink)" }}>{t.title}</h5>
                </div>
              </div>
            ))}
          {/* Non-pinned pending tasks (up to 3 total shown) */}
          {pendingTasks.map((t) => (
              <div key={t.id} className="recent-item">
                <div className="dot draft" />
                <div className="info">
                  <h5 style={{ color: "var(--ink)" }}>{t.title}</h5>
                </div>
              </div>
            ))}
          {/* Done tasks count */}
          {doneTasks.length > 0 && (
            <div className="recent-item" style={{ opacity: 0.6 }}>
              <div className="dot published" />
              <div className="info">
                <h5 style={{ color: "var(--muted)" }}>
                  {doneTasks.length} task
                  {doneTasks.length === 1 ? "" : "s"} completed
                </h5>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
