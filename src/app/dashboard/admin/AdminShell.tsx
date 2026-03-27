"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { adminNavigation, getAdminPageMeta } from "@/lib/admin/navigation";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = getAdminPageMeta(pathname);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="space-y-4 rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Studio Dashboard</span>
          </Link>

          <div className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-muted)]">
              Admin
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
              Control room
            </h1>
            <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
              Internal operations only. Single-user mode for now.
            </p>
          </div>

          <nav className="space-y-2">
            {adminNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
                      : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-text)]"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className={`mt-1 text-xs ${active ? "text-white/80" : "text-[var(--dashboard-muted)]"}`}>
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 shadow-[var(--dashboard-shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-muted)]">
            {meta.title}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
            {meta.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{meta.description}</p>
        </section>

        {children}
      </div>
    </div>
  );
}
