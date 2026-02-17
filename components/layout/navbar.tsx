"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/staff-schedule", label: "Staff Schedule" },
  { href: "/staff-hours", label: "Staff Hours" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900 shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-white transition-colors hover:text-zinc-300"
        >
          Asian Le Staff
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                (
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                )
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => signOut(auth)}
            className="ml-4 rounded-lg bg-red-900/50 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-800/70 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
