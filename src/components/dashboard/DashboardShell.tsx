"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { DashboardNavigationProgress } from "@/components/dashboard/DashboardNavigationProgress";
import { DashboardNotificationCenter } from "@/components/dashboard/DashboardNotificationCenter";
import { DashboardWorkspaceSwitcher } from "@/components/dashboard/DashboardWorkspaceSwitcher";
import { dashboardNavigation, getDashboardPageTitle } from "@/lib/dashboard/navigation";
import type { DashboardCalendarNotification } from "@/lib/dashboard/pinterestCalendar";
import type { WorkspaceProfileSummary } from "@/lib/types";

export function DashboardShell({
  activeWorkspaceId,
  workspaceProfiles,
  calendarNotifications,
  children,
}: {
  activeWorkspaceId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
  calendarNotifications: DashboardCalendarNotification[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const header = getDashboardPageTitle(pathname);
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  // The runtime template editor route currently lives at:
  // /dashboard/templates/[templateId]/edit
  // Phase 0 keeps it inside DashboardShell but isolates editor-specific shell rules here
  // so later phases can simplify the global chrome without touching other dashboard pages.
  const isTemplateEditorRoute =
    pathname.startsWith("/dashboard/templates/") && pathname.endsWith("/edit");

  if (isAdminRoute) {
    return (
      <div className="dashboard-shell min-h-screen bg-[var(--dashboard-canvas)] text-[var(--dashboard-text)]">
        <DashboardNavigationProgress />
        <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-shell min-h-screen bg-[var(--dashboard-canvas)] text-[var(--dashboard-text)] ${
        isTemplateEditorRoute ? "lg:h-screen lg:overflow-hidden" : ""
      }`}
      data-dashboard-mode={isTemplateEditorRoute ? "template-editor" : "default"}
    >
      <DashboardNavigationProgress />
      <div
        className={`grid min-h-screen grid-cols-1 ${
          isTemplateEditorRoute
            ? "lg:grid-cols-[84px_minmax(0,1fr)]"
            : "lg:grid-cols-[280px_minmax(0,1fr)]"
        } ${
          isTemplateEditorRoute ? "lg:h-screen lg:overflow-hidden" : ""
        }`}
      >
        {isTemplateEditorRoute ? (
          <EditorRouteSidebar pathname={pathname} />
        ) : (
          <DefaultDashboardSidebar
            pathname={pathname}
            activeWorkspaceId={activeWorkspaceId}
            workspaceProfiles={workspaceProfiles}
          />
        )}

        <div className={`min-w-0 ${isTemplateEditorRoute ? "lg:h-screen lg:overflow-hidden" : ""}`}>
          {isTemplateEditorRoute ? null : (
            <header className="sticky top-0 z-20 border-b border-[var(--dashboard-line)] bg-[color:var(--dashboard-canvas)]/92 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)] lg:text-4xl">
                  {header.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <DashboardNotificationCenter calendarNotifications={calendarNotifications} />
                  {header.secondaryActionHref && header.secondaryActionLabel ? (
                    <Link
                      href={header.secondaryActionHref}
                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
                    >
                      {header.secondaryActionLabel}
                    </Link>
                  ) : null}
                  <Link
                    href={header.primaryActionHref}
                    className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                  >
                    {header.primaryActionLabel}
                  </Link>
                </div>
              </div>
            </header>
          )}

          <main
            className={
              isTemplateEditorRoute
                ? "h-full overflow-hidden px-4 py-4 lg:px-4 lg:py-4"
                : "px-5 py-6 lg:px-8 lg:py-8"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function DefaultDashboardSidebar({
  pathname,
  activeWorkspaceId,
  workspaceProfiles,
}: {
  pathname: string;
  activeWorkspaceId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
}) {
  return (
    <aside className="border-r border-[var(--dashboard-line)] bg-[var(--dashboard-sidebar)] px-5 py-6 lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-full flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-4 shadow-[var(--dashboard-shadow-sm)]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0d5fff_0%,#3fd0ff_100%)] text-lg font-black text-white">
            PF
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-muted)]">
              Studio
            </p>
            <p className="text-lg font-bold">PinForge</p>
          </div>
        </Link>

        <DashboardWorkspaceSwitcher
          initialWorkspaceId={activeWorkspaceId}
          workspaceProfiles={workspaceProfiles}
        />

        <nav className="mt-6 space-y-6">
          {dashboardNavigation.map((group) => (
            <div key={group.heading}>
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-muted)]">
                {group.heading}
              </p>
              <div className="mt-3 space-y-1">
                {group.items.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
                          : "text-[var(--dashboard-subtle)] hover:bg-[var(--dashboard-panel)] hover:text-[var(--dashboard-text)]"
                      }`}
                    >
                      <NavIcon icon={item.icon} active={isActive} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-[24px] bg-[linear-gradient(145deg,#0d5fff_0%,#0f3bb5_60%,#152042_100%)] p-4 text-white shadow-[var(--dashboard-shadow-accent)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Workflow
            </p>
            <h2 className="mt-2 text-lg font-bold">Operate the pipeline</h2>
            <div className="mt-4 flex gap-3">
              <Link
                href="/dashboard/publishing"
                className="rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white"
              >
                Open queue
              </Link>
              <Link
                href="/dashboard/jobs"
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
              >
                Jobs
              </Link>
            </div>
          </div>

          <SignOutButton className="w-full justify-center rounded-2xl border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-[var(--dashboard-subtle)] hover:text-[var(--dashboard-text)]" />
        </div>
      </div>
    </aside>
  );
}

function EditorRouteSidebar({ pathname }: { pathname: string }) {
  const items: DashboardNavItem[] = [
    { label: "Overview", href: "/dashboard", icon: "overview" },
    { label: "Jobs", href: "/dashboard/jobs", icon: "jobs" },
    { label: "Publishing", href: "/dashboard/publishing", icon: "publishing" },
    { label: "Templates", href: "/dashboard/templates", icon: "library" },
    { label: "Library", href: "/dashboard/library", icon: "library" },
  ];

  return (
    <aside className="border-r border-[var(--dashboard-line)] bg-[var(--dashboard-sidebar)] px-3 py-4 lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-full flex-col items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] shadow-[var(--dashboard-shadow-sm)]"
          title="PinForge overview"
          aria-label="PinForge overview"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0d5fff_0%,#3fd0ff_100%)] text-sm font-black text-white">
            PF
          </div>
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {items.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  isActive
                    ? "dashboard-accent-action border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
                    : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)] hover:text-[var(--dashboard-text)]"
                }`}
              >
                <NavIcon icon={item.icon} active={isActive} />
              </Link>
            );
          })}
        </nav>

        <SignOutButton className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2 py-2 text-[11px] font-semibold text-[var(--dashboard-subtle)] hover:text-[var(--dashboard-text)]" />
      </div>
    </aside>
  );
}

function isNavItemActive(pathname: string, href: string) {
  const isJobPublishWorkspace =
    pathname.startsWith("/dashboard/jobs/") && pathname.endsWith("/publish");

  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/publishing") {
    return pathname === href || pathname.startsWith(`${href}/`) || isJobPublishWorkspace;
  }

  if (href === "/dashboard/jobs") {
    if (isJobPublishWorkspace) {
      return false;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({
  icon,
  active,
}: {
  icon: DashboardNavItem["icon"];
  active: boolean;
}) {
  const className = `h-4 w-4 ${active ? "text-white" : "text-current"}`;

  switch (icon) {
    case "overview":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h7v6H4zM13 5h7v10h-7zM4 13h7v6H4zM13 17h7v2h-7z" />
        </svg>
      );
    case "inbox":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16v10H4z" />
          <path d="M4 13h4l2 3h4l2-3h4" />
        </svg>
      );
    case "jobs":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 6h14M5 12h14M5 18h14" />
        </svg>
      );
    case "publishing":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );
    case "pulse":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 13h4l2-5 4 9 2-4h4" />
        </svg>
      );
    case "library":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 5h6v14H5zM13 5h6v14h-6z" />
        </svg>
      );
    case "keys":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="8" cy="12" r="3" />
          <path d="M11 12h9M17 12v3M20 12v2" />
        </svg>
      );
    case "integrations":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 4v4M16 16v4M4 8h4M16 8h4M7 7l10 10" />
        </svg>
      );
    case "housekeeping":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16" />
          <path d="M6 7V5h12v2" />
          <path d="M7 7l1 12h8l1-12" />
          <path d="M10 11v4M14 11v4" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12h16" />
          <path d="M12 4v16" />
          <path d="M6.5 6.5h11v11h-11z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.4-2-3.5-2.3.8a7 7 0 0 0-1.7-1L14.5 3h-5L9 5.9a7 7 0 0 0-1.7 1L5 6.1l-2 3.5L5 11a7 7 0 0 0 0 2l-2 1.4 2 3.5 2.3-.8a7 7 0 0 0 1.7 1l.5 2.9h5l.5-2.9a7 7 0 0 0 1.7-1l2.3.8 2-3.5L18.9 13c.1-.3.1-.7.1-1Z" />
        </svg>
      );
  }
}

type DashboardNavItem = (typeof dashboardNavigation)[number]["items"][number];

