import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Journal — quiet pages, kept just for you",
  description:
    "A privacy-first journaling and daily-tasks app. Two-factor sign-in, 20-minute idle timeout, beautiful PDF export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
