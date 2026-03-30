export type DashboardNavItem = {
  label: string;
  href: string;
  icon:
    | "overview"
    | "inbox"
    | "jobs"
    | "publishing"
    | "pulse"
    | "library"
    | "keys"
    | "integrations"
    | "housekeeping"
    | "admin";
};

export const dashboardNavigation = [
  {
    heading: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: "overview" },
      { label: "Inbox", href: "/dashboard/inbox", icon: "inbox" },
      { label: "Jobs", href: "/dashboard/jobs", icon: "jobs" },
      { label: "Publishing", href: "/dashboard/publishing", icon: "publishing" },
      { label: "Post Pulse", href: "/dashboard/post-pulse", icon: "pulse" },
    ],
  },
  {
    heading: "Assets",
    items: [
      { label: "Library", href: "/dashboard/library", icon: "library" },
      { label: "Templates", href: "/dashboard/templates", icon: "library" },
      { label: "API Keys", href: "/dashboard/api-keys", icon: "keys" },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Integrations", href: "/dashboard/integrations", icon: "integrations" },
      { label: "Housekeeping", href: "/dashboard/housekeeping", icon: "housekeeping" },
      { label: "Admin", href: "/dashboard/admin", icon: "admin" },
    ],
  },
] satisfies Array<{
  heading: string;
  items: DashboardNavItem[];
}>;

export function getDashboardPageTitle(pathname: string) {
  if (pathname === "/dashboard") {
    return {
      eyebrow: "Overview",
      title: "Studio command center",
      description: "Track intake, active jobs, and publishing readiness.",
      primaryActionLabel: "Open inbox",
      primaryActionHref: "/dashboard/inbox",
      secondaryActionLabel: "Jobs board",
      secondaryActionHref: "/dashboard/jobs",
    };
  }

  if (pathname === "/dashboard/inbox") {
    return {
      eyebrow: "Inbox",
      title: "Incoming intake queue",
      description: "Review new extension submissions and triage what needs attention.",
      primaryActionLabel: "Open jobs board",
      primaryActionHref: "/dashboard/jobs",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname === "/dashboard/jobs") {
    return {
      eyebrow: "Jobs",
      title: "Job operations board",
      description: "Review, plan, generate, and track active workflows.",
      primaryActionLabel: "Open inbox",
      primaryActionHref: "/dashboard/inbox",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname.startsWith("/dashboard/jobs/") && pathname.endsWith("/publish")) {
    return {
      eyebrow: "Publishing",
      title: "Job publishing workspace",
      description: "Upload media, finalize copy, and schedule pins.",
      primaryActionLabel: "Publishing queue",
      primaryActionHref: "/dashboard/publishing",
      secondaryActionLabel: "Back to job",
      secondaryActionHref: pathname.replace("/publish", ""),
    };
  }

  if (pathname.startsWith("/dashboard/jobs/")) {
    return {
      eyebrow: "Job detail",
      title: "Review, plans, and generated pins",
      description: "Manage review, plans, generated pins, and publishing handoff.",
      primaryActionLabel: "Open publishing flow",
      primaryActionHref: `${pathname}/publish`,
      secondaryActionLabel: "Open jobs board",
      secondaryActionHref: "/dashboard/jobs",
    };
  }

  if (pathname === "/dashboard/publishing") {
    return {
      eyebrow: "Publishing",
      title: "Publishing queue",
      description: "See ready, scheduled, and failed publishing work.",
      primaryActionLabel: "Open jobs board",
      primaryActionHref: "/dashboard/jobs",
      secondaryActionLabel: "Inbox",
      secondaryActionHref: "/dashboard/inbox",
    };
  }

  if (pathname === "/dashboard/post-pulse") {
    return {
      eyebrow: "Post Pulse",
      title: "Post freshness tracker",
      description: "Track which articles are fresh on Pinterest and which ones need new pins.",
      primaryActionLabel: "Open jobs board",
      primaryActionHref: "/dashboard/jobs",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname === "/dashboard/library") {
    return {
      eyebrow: "Library",
      title: "Template and preset library",
      description: "Browse templates, slot counts, and visual presets.",
      primaryActionLabel: "Open jobs board",
      primaryActionHref: "/dashboard/jobs",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname === "/dashboard/templates") {
    return {
      eyebrow: "Templates",
      title: "Custom runtime templates",
      description: "Create starter drafts and inspect versioned runtime-template records.",
      primaryActionLabel: "Library",
      primaryActionHref: "/dashboard/library",
      secondaryActionLabel: "Jobs board",
      secondaryActionHref: "/dashboard/jobs",
    };
  }

  if (pathname === "/dashboard/api-keys") {
    return {
      eyebrow: "Security",
      title: "Extension API keys",
      description: "Create and revoke Studio intake keys.",
      primaryActionLabel: "Create key",
      primaryActionHref: "/dashboard/api-keys#new-key",
      secondaryActionLabel: "Inbox",
      secondaryActionHref: "/dashboard/inbox",
    };
  }

  if (pathname === "/dashboard/integrations") {
    return {
      eyebrow: "Integrations",
      title: "Provider connections",
      description: "Manage Publer, AI, and other service connections.",
      primaryActionLabel: "Overview",
      primaryActionHref: "/dashboard",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname === "/dashboard/housekeeping") {
    return {
      eyebrow: "Housekeeping",
      title: "Storage and retention controls",
      description: "Run storage audits and clean stale temp assets from one place.",
      primaryActionLabel: "Integrations",
      primaryActionHref: "/dashboard/integrations",
      secondaryActionLabel: "Overview",
      secondaryActionHref: "/dashboard",
    };
  }

  if (pathname === "/dashboard/admin") {
    return {
      eyebrow: "Admin",
      title: "Operations control room",
      description: "Monitor runtime health, task pressure, and workflow performance from one internal dashboard.",
      primaryActionLabel: "Housekeeping",
      primaryActionHref: "/dashboard/housekeeping",
      secondaryActionLabel: "Publishing queue",
      secondaryActionHref: "/dashboard/publishing",
    };
  }

  if (pathname === "/dashboard/settings") {
    return {
      eyebrow: "Integrations",
      title: "Provider connections",
      description: "Manage Publer, AI, and other service connections.",
      primaryActionLabel: "Overview",
      primaryActionHref: "/dashboard",
      secondaryActionLabel: "Overview",
      secondaryActionHref: "/dashboard",
    };
  }

  return {
    eyebrow: "Dashboard",
    title: "PinForge Studio",
    description: "Operate the full intake-to-publish workflow from a unified workspace.",
    primaryActionLabel: "Overview",
    primaryActionHref: "/dashboard",
    secondaryActionLabel: "Jobs board",
    secondaryActionHref: "/dashboard/jobs",
  };
}
