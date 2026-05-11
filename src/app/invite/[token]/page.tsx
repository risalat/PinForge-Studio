import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { getAuthenticatedSupabaseUser } from "@/lib/auth/dashboardSession";
import { isSupabaseAuthConfigured } from "@/lib/env";
import { acceptTeamInvitation, getInvitationByToken } from "@/lib/team/invitations";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  if (!token?.trim()) {
    return <StatusPage title="Invalid invite link" message="This invite link is missing a token." />;
  }

  const invitation = await getInvitationByToken(token.trim()).catch(() => null);

  if (!invitation) {
    return <StatusPage title="Invitation not found" message="This invite link is invalid or has expired." />;
  }

  if (invitation.status !== "PENDING") {
    const statusMessages: Record<string, { title: string; message: string }> = {
      ACCEPTED: { title: "Already accepted", message: "This invitation has already been accepted." },
      REVOKED: { title: "Invitation revoked", message: "This invitation has been revoked by the team leader." },
      EXPIRED: { title: "Invitation expired", message: "This invitation has expired. Ask the team leader for a new one." },
    };
    const info = statusMessages[invitation.status] ?? {
      title: "Invitation unavailable",
      message: "This invitation is no longer valid.",
    };
    return <StatusPage title={info.title} message={info.message} />;
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <StatusPage
        title="Invitation expired"
        message="This invitation has expired. Ask the team leader for a new one."
      />
    );
  }

  const authUser = await getAuthenticatedSupabaseUser();

  if (!authUser) {
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const loginUrl = appUrl
      ? `${appUrl.replace(/\/+$/, "")}/login?next=/invite/${encodeURIComponent(token.trim())}`
      : `/login?next=/invite/${encodeURIComponent(token.trim())}`;
    const isAuth = isSupabaseAuthConfigured();

    if (!isAuth) {
      return (
        <StatusPage
          title="Authentication required"
          message={`You need to sign in to accept this invitation to ${invitation.team.name}.`}
        />
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Team invitation</h1>
          <p className="mt-3 text-gray-600">
            You have been invited to join <strong>{invitation.team.name}</strong>.
          </p>
          <p className="mt-1 text-sm text-gray-500">Invited email: {invitation.email}</p>
          <Link
            href={loginUrl}
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Sign in to accept
          </Link>
        </div>
      </div>
    );
  }

  const userEmail = authUser.email?.trim().toLowerCase() ?? "";
  const inviteEmail = invitation.email.trim().toLowerCase();

  if (userEmail !== inviteEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Wrong account</h1>
          <p className="mt-3 text-gray-600">
            This invitation was sent to <strong>{invitation.email}</strong>.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            You are signed in as {authUser.email}. Please sign in with the invited email address.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    );
  }

  const user = await getOrCreateDashboardUser();

  try {
    await acceptTeamInvitation({
      token: token.trim(),
      userId: user.id,
      email: user.email ?? userEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invitation.";
    return <StatusPage title="Could not accept" message={message} />;
  }

  redirect("/dashboard/team?notice=invite-accepted");
}

function StatusPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">{title}</h1>
        <p className="mt-3 text-gray-600">{message}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
