import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inovatek Academy",
  description: "Enrollment, class registration, payments, and attendance for Inovatek Academy.",
  appleWebApp: {
    // Lets iOS treat an "Add to Home Screen" shortcut as a standalone app
    // window (no Safari address bar) using apple-icon.png as its icon and a
    // basic auto-generated splash built from that icon + the theme color.
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inovatek Academy",
  },
};

export const viewport: Viewport = {
  themeColor: "#011C43",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
