"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5_000; // check session every 5s
const WARN_AT_SECONDS = 60;     // show modal when 1 min remains

type Props = {
  children: React.ReactNode;
};

export default function SessionGuard({ children }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(20 * 60);
  const [showWarn, setShowWarn] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const lastActivity = useRef(Date.now());
  const idleSeconds = useRef(20 * 60);

  // Verify session on mount and learn idle timeout from server
  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) router.replace("/signin");
          return;
        }
        const data = await res.json();
        if (!cancelled && typeof data.idleTimeoutSeconds === "number") {
          idleSeconds.current = data.idleTimeoutSeconds;
          setRemaining(data.idleTimeoutSeconds);
        }
      } catch {
        if (!cancelled) router.replace("/signin");
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Reset timer on user interaction
  const onActivity = useCallback(() => {
    lastActivity.current = Date.now();
    setRemaining(idleSeconds.current);
    setShowWarn(false);
  }, []);

  useEffect(() => {
    const events = ["click", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => document.addEventListener(ev, onActivity, { passive: true }));
    return () => events.forEach((ev) => document.removeEventListener(ev, onActivity));
  }, [onActivity]);

  // Tick every second
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivity.current) / 1000);
      const left = Math.max(0, idleSeconds.current - elapsed);
      setRemaining(left);
      if (left === 0 && !signedOut) {
        setSignedOut(true);
        // Sign out and redirect
        fetch("/api/signout", { method: "POST" }).finally(() => {
          router.replace("/signin?reason=idle");
        });
      } else if (left <= WARN_AT_SECONDS && left > 0) {
        setShowWarn(true);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [router, signedOut]);

  // Periodic /api/me ping to keep server-side session fresh while user is active
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/signin?reason=expired");
        }
      } catch {
        // ignore network errors
      }
    }, POLL_INTERVAL_MS * 12); // every minute
    return () => clearInterval(id);
  }, [router]);

  const stay = async () => {
    onActivity();
    // Hit /api/me to refresh server cookie
    try {
      await fetch("/api/me", { cache: "no-store" });
    } catch {}
  };

  const signOutNow = async () => {
    await fetch("/api/signout", { method: "POST" });
    router.replace("/signin");
  };

  // Expose remaining via context-style hook? Simpler: set a CSS variable
  // and let the dashboard read it via DOM. For now we just render children.
  return (
    <>
      <SessionTimerProvider value={{ remaining, idleSeconds: idleSeconds.current }}>
        {children}
      </SessionTimerProvider>

      {showWarn && remaining > 0 && (
        <div className="modal-bg" onClick={(e) => e.stopPropagation()}>
          <div className="modal">
            <div className="ico">⏱</div>
            <h3>Are you still there?</h3>
            <p>For your security, we&apos;ll sign you out automatically when you&apos;re idle.</p>
            <div className="countdown">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </div>
            <div className="actions">
              <button className="btn accent" onClick={stay}>
                Stay signed in
              </button>
              <button className="btn ghost" onClick={signOutNow}>
                Sign out now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---- tiny context to expose timer to children that want it (Dashboard) ----

type SessionTimerCtx = { remaining: number; idleSeconds: number };
const Ctx = createContext<SessionTimerCtx>({ remaining: 0, idleSeconds: 1200 });

function SessionTimerProvider({
  value,
  children,
}: {
  value: SessionTimerCtx;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSessionTimer() {
  return useContext(Ctx);
}
