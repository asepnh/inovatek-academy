import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#011C43] px-6 py-16 text-center">
      <div className="flex flex-1 items-center">
        <Image
          src="/icons/icon-512.png"
          alt="Inovatek Academy"
          width={512}
          height={512}
          priority
          className="h-28 w-28 rounded-2xl shadow-sm sm:h-36 sm:w-36"
        />
      </div>
      <p className="text-xs text-white/60">© 2026 Inovatek Solutions Sdn. Bhd.</p>
    </main>
  );
}
