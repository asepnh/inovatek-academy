import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";

const LINKS = [
  { href: "/parent", label: "My Students" },
  { href: "/parent/courses", label: "Browse Classes" },
  { href: "/parent/payments", label: "Payments" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "mentor") redirect("/mentor");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="parent" links={LINKS} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
