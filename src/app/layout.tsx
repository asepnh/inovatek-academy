import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DESCRIPTION = "Enrollment, class registration, payments, and attendance for Inovatek Academy.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Inovatek Academy",
  description: DESCRIPTION,
  openGraph: {
    title: "Inovatek Academy",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Inovatek Academy",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Inovatek Academy",
    description: DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
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
