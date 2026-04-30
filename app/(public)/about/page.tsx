import PhoneShell from "@/components/PhoneShell";
import TopNav from "@/components/TopNav";
import Link from "next/link";

export default function About() {
  return (
    <PhoneShell>
      <TopNav back="/" backLabel="Back" crumb="About" />
      <div style={{ padding: "0 22px 40px" }}>
        <h2 className="h-display" style={{ fontSize: 30 }}>
          How <em style={{ color: "var(--accent)" }}>this app</em> works
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
          Two simple ideas. First: every entry starts private. You decide, one
          entry at a time, what (if anything) ever leaves your notebook.
          Second: getting in is two-factor — your phone number, plus a secret
          word you choose. Both must match. No SMS codes, no email reset
          links.
        </p>

        <div className="quote-block">
          <p>
            “Idle for 20 minutes? You are signed out automatically. Even if
            someone has your bookmark, they will hit the auth wall.”
          </p>
          <div className="src">— security model, plain language</div>
        </div>

        <h3
          style={{
            fontFamily: "Instrument Serif, serif",
            fontSize: 22,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          The pages
        </h3>
        <div className="info-box">
          <b>Landing</b> · public face, demo entry points
          <br />
          <b>Sign in / sign up</b> · phone + secret · the only way through
          <br />
          <b>Dashboard</b> · today at a glance, quick links
          <br />
          <b>Journal &amp; Editor</b> · write &amp; browse entries
          <br />
          <b>Privacy &amp; Publish</b> · per-entry visibility
          <br />
          <b>Export</b> · download as typeset PDF
          <br />
          <b>Settings</b> · account, secret rotation, sign-out
        </div>

        <h3
          style={{
            fontFamily: "Instrument Serif, serif",
            fontSize: 22,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Where your data lives
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Postgres on Neon (free tier, scale-to-zero, no inactivity wipe).
          Frontend on Vercel (free, generous limits). The combination means
          the site stays live and your data stays put — even if the app sits
          unused for months.
        </p>

        <Link className="btn accent" style={{ marginTop: 24 }} href="/">
          Back to landing
        </Link>
      </div>
    </PhoneShell>
  );
}
