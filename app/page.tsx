import Link from "next/link";
import PhoneShell from "@/components/PhoneShell";

export default function Landing() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PhoneShell>
      <div className="landing">
        <div className="landing-hero">
          <div className="ornament">𝓘</div>
          <h1>
            <em>Quiet pages</em>, kept just for you.
          </h1>
          <p className="tagline">
            A journaling &amp; daily-tasks app where everything is private by default.
            Open it from any device, sign in with your phone &amp; secret word, and the
            page is yours alone.
          </p>
        </div>

        <div className="cta-stack">
          <Link className="btn accent" href="/signin?next=/journal">
            Open my Journal →
          </Link>
          <Link className="btn ghost" href="/signin?next=/tasks">
            Open Daily Tasks →
          </Link>
        </div>

        <div className="landing-section-label">Why this app</div>
        <div className="feature-grid">
          <div className="feature-tile">
            <div className="ico">𝓅</div>
            <h4>Private by default</h4>
            <p>Your words stay yours. Only published if you say so.</p>
          </div>
          <div className="feature-tile">
            <div className="ico">𝓈</div>
            <h4>2-factor login</h4>
            <p>Phone number plus a secret only you know.</p>
          </div>
          <div className="feature-tile">
            <div className="ico">𝓉</div>
            <h4>Auto sign-out</h4>
            <p>20 minutes idle and the session ends — even on a bookmarked URL.</p>
          </div>
          <div className="feature-tile">
            <div className="ico">𝓅</div>
            <h4>Beautiful PDF export</h4>
            <p>Typeset journals, drop caps, ornaments. Yours to keep, forever.</p>
          </div>
        </div>

        <div className="landing-section-label">A note from the maker</div>
        <div className="quote-block">
          <p>
            “A journal is a small act of trust between a person and a page. The
            job of the app is to be worthy of that trust — and then to get out
            of the way.”
          </p>
          <div className="src">— design principle №1</div>
        </div>

        <div className="landing-section-label">Get started</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link className="btn accent" href="/signup">
            Create an account →
          </Link>
          <Link className="btn ghost" href="/about">
            Learn how it works →
          </Link>
        </div>

        <div className="landing-foot">
          <span>
            <b>v 0.1</b>
          </span>
          <span>{today}</span>
        </div>
      </div>
    </PhoneShell>
  );
}
