import { generateStudentQrDataUrl } from "@/lib/qr";

export async function QrCodeCard({ studentName, qrToken }: { studentName: string; qrToken: string }) {
  const dataUrl = await generateStudentQrDataUrl(qrToken);

  return (
    <div className="card flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code for ${studentName}`} width={220} height={220} className="rounded-lg" />
      <p className="mt-3 font-semibold text-slate-900">{studentName}</p>
      <p className="text-xs text-slate-500">Show this QR code to the mentor for attendance scanning.</p>
      <a
        href={dataUrl}
        download={`${studentName.replace(/\s+/g, "_")}_qr.png`}
        className="btn-secondary mt-4 text-sm"
      >
        Download QR code
      </a>
    </div>
  );
}
