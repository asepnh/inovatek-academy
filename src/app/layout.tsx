import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inovatek Academy",
  description: "Enrollment, course registration, payments, and attendance for Inovatek Academy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
