import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#011C43] px-6 text-center">
      <Image
        src="/icons/icon-512.png"
        alt="Inovatek Academy"
        width={512}
        height={512}
        priority
        className="h-24 w-24 animate-pulse rounded-2xl"
      />
      <p className="text-xs text-white/60">© 2026 Inovatek Solutions Sdn. Bhd.</p>
    </main>
  );
}
