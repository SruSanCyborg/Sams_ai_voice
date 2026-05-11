import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO-3D — Immersive Spatial Voice",
  description:
    "AI-powered 3D spatial voice calls with binaural HRTF rendering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-space-900 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
