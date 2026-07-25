import type { PaymentStatus } from "@/lib/types";

const STYLES: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge ${STYLES[status]} capitalize`}>{status}</span>;
}
