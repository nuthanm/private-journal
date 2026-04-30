"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  back?: string | null;
  backLabel?: string;
  crumb?: string;
  rightHref?: string;
  rightLabel?: string;
};

export default function TopNav({
  back,
  backLabel = "Back",
  crumb,
  rightHref,
  rightLabel,
}: Props) {
  const router = useRouter();
  return (
    <div className="top-nav">
      {back === undefined ? (
        <button className="back" onClick={() => router.back()}>
          ← {backLabel}
        </button>
      ) : back ? (
        <Link className="back" href={back}>
          ← {backLabel}
        </Link>
      ) : (
        <span style={{ width: 60 }} />
      )}

      {crumb ? <span className="crumb">{crumb}</span> : <span />}

      {rightHref && rightLabel ? (
        <Link className="menu" href={rightHref}>
          {rightLabel}
        </Link>
      ) : (
        <span style={{ width: 24 }} />
      )}
    </div>
  );
}
