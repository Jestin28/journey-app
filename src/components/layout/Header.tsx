import Link from "next/link";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/parks", label: "Parks" },
  { href: "/map", label: "Map" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-slate-900">
          Journey
        </Link>

        <nav className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
