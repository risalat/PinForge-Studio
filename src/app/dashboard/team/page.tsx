import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";
import { getUserTeamRole } from "@/lib/team/teamAccess";
import { StudioTeamRole, StudioTeamMembershipStatus, StudioTeamInvitationStatus } from "@prisma/client";
import { TeamInviteForm } from "@/app/dashboard/team/TeamInviteForm";
import { TeamLeaderPanel } from "@/app/dashboard/team/TeamLeaderPanel";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardTeamPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const notice = Array.isArray(resolvedSearchParams.notice)
    ? resolvedSearchParams.notice[0]
    : resolvedSearchParams.notice ?? "";

  const user = await getOrCreateDashboardUser();
  const { role, teamId } = await getUserTeamRole(user.id);

  if (!role || !teamId) {
    return (
      <div className="space-y-5 text-[var(--dashboard-text)]">
        <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 shadow-[var(--dashboard-shadow-sm)]">
          <h2 className="text-lg font-bold">No team</h2>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
            You are not part of a team yet. A team should have been created automatically when you logged in.
          </p>
        </section>
      </div>
    );
  }

  const team = await prisma.studioTeam.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    return (
      <div className="space-y-5 text-[var(--dashboard-text)]">
        <p className="text-[var(--dashboard-subtle)]">Team not found.</p>
      </div>
    );
  }

  const members = await prisma.studioTeamMembership.findMany({
    where: {
      teamId,
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });

  const pendingInvitations = await prisma.studioTeamInvitation.findMany({
    where: {
      teamId,
      status: StudioTeamInvitationStatus.PENDING,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const isLeader = role === StudioTeamRole.OWNER || role === StudioTeamRole.ADMIN;

  const accessibleUsers = isLeader
    ? await prisma.studioTeamMembership.findMany({
        where: {
          teamId,
          status: StudioTeamMembershipStatus.ACTIVE,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      {notice === "invite-accepted" && (
        <div className="rounded-[20px] border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-success-ink)]">
          You have joined the team!
        </div>
      )}

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
        <h2 className="text-lg font-bold">{team.name}</h2>
        <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </section>

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
        <h3 className="text-base font-bold">Team members</h3>
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-[16px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{member.user.email}</p>
                <p className="text-xs text-[var(--dashboard-muted)]">
                  {member.role === StudioTeamRole.OWNER
                    ? "Owner"
                    : member.role === StudioTeamRole.ADMIN
                      ? "Admin"
                      : "Member"}
                </p>
              </div>
              {member.user.id === user.id && (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {isLeader && (
        <>
          <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <h3 className="text-base font-bold">Invite teammate</h3>
            <TeamInviteForm />
          </section>

          {pendingInvitations.length > 0 && (
            <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
              <h3 className="text-base font-bold">Pending invitations</h3>
              <div className="mt-3 space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-[16px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{invitation.email}</p>
                      <p className="text-xs text-[var(--dashboard-muted)]">
                        {invitation.role === StudioTeamRole.ADMIN ? "Admin" : "Member"} &middot; Expires{" "}
                        {invitation.expiresAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <TeamLeaderPanel
            currentUserId={user.id}
            members={accessibleUsers.map((m) => ({
              id: m.user.id,
              email: m.user.email,
            }))}
          />
        </>
      )}
    </div>
  );
}
