import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function Navbar({
  role,
  links,
}: {
  role: string;
  links: { href: string; label: string; badge?: number }[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-slate-900">
            Inovatek Academy
          </Link>
          <nav className="hidden gap-6 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {link.label}
                {!!link.badge && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-slate-100 text-slate-700 capitalize">{role}</span>
          <LogoutButton />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-6 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-600"
          >
            {link.label}
            {!!link.badge && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
