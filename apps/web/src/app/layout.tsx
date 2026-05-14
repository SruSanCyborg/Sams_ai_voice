import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO-3D — Immersive Spatial Voice",
  description: "AI-powered 3D spatial voice calls with binaural HRTF rendering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('echo-theme');if(t==='light')document.documentElement.classList.add('light');})()`
        }} />
      </head>
      <body style={{ background: "var(--bg)", color: "var(--text)" }}>{children}</body>
    </html>
  );
}
