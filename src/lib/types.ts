export type UserRole = "admin" | "mentor" | "parent";
export type EnrollmentStatus = "pending" | "active" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "overdue" | "failed" | "cancelled";
export type AttendanceStatus = "present" | "late";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  full_name: string;
  grade: string;
  qr_token: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  grade_level: string;
  monthly_fee_cents: number;
  mentor_id: string | null;
  schedule: string;
  is_active: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  student_id: string;
  class_id: string;
  period_month: number;
  period_year: number;
  amount_cents: number;
  status: PaymentStatus;
  due_date: string;
  billplz_bill_id: string | null;
  billplz_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  mentor_id: string;
  status: AttendanceStatus;
  scanned_at: string;
}

export interface Notification {
  id: string;
  parent_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
