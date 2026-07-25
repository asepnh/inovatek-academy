import QRCode from "qrcode";

/**
 * Generates a QR code (as a data: URL PNG) encoding just the student's
 * qr_token. The mentor-side scanner reads this token back out and looks the
 * student up by it — see /api/attendance/scan.
 */
export async function generateStudentQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}
