"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1">
        <span className="font-medium text-neutral-800 mr-4">Job Tracker</span>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                active ? "bg-neutral-800 text-white" : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
