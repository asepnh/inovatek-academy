import type { MetadataRoute } from "next";

// Served automatically by Next.js at /manifest.webmanifest. This is what
// lets a phone browser offer "Add to Home Screen" and turns that shortcut
// into a standalone, browser-chrome-free window using the icon/colors below
// — a lightweight installable shortcut, not a native app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inovatek Academy",
    short_name: "Inovatek",
    description: "Enrollment, course registration, payments, and attendance for Inovatek Academy.",
    start_url: "/",
    display: "standalone",
    background_color: "#011C43",
    theme_color: "#011C43",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
