"use client";

import { useEffect, useState } from "react";

export default function PhoneShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="stage">
      <div className="shell">
        <div className="screen">
          <div className="status-bar">
            <span>{time}</span>
            <div className="right">
              <span>●●●</span>
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>
          <div className="page-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
