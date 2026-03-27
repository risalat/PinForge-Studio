export const adminNavigation = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    description: "At-a-glance system health",
  },
  {
    label: "Runtime",
    href: "/dashboard/admin/runtime",
    description: "Web, worker, and scheduler heartbeats",
  },
  {
    label: "Workspaces",
    href: "/dashboard/admin/workspaces",
    description: "Workspace diagnostics and sync health",
  },
  {
    label: "Tasks",
    href: "/dashboard/admin/tasks",
    description: "Queue pressure and failed tasks",
  },
  {
    label: "Performance",
    href: "/dashboard/admin/performance",
    description: "Persisted workflow timings",
  },
  {
    label: "Publer",
    href: "/dashboard/admin/publer",
    description: "Locks, syncs, and cache warmth",
  },
  {
    label: "Storage",
    href: "/dashboard/admin/storage",
    description: "Temp cleanup and retention",
  },
  {
    label: "Actions",
    href: "/dashboard/admin/actions",
    description: "Safe admin actions only",
  },
] as const;

export function getAdminPageMeta(pathname: string) {
  const match = adminNavigation.find((item) => item.href === pathname);
  if (match) {
    return {
      title: match.label,
      description: match.description,
    };
  }

  return {
    title: "Admin",
    description: "Internal operations dashboard",
  };
}
