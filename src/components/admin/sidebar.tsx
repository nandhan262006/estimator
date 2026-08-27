"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  LogOut,
  Menu,
  X,
  ReceiptIndianRupee,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/templates", label: "Estimator Editor", icon: FileText },
  { href: "/admin/estimates", label: "Estimates", icon: ReceiptIndianRupee },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex size-10 items-center justify-center rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-sm lg:hidden transition-all duration-200 hover:shadow-md active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="Mamatha Raj Photography" width={36} height={36} />
            <span className="text-sm font-semibold">Mamatha Raj</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
