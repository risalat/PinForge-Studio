import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { getAuthenticatedSupabaseUser } from "@/lib/auth/dashboardSession";
import { isSupabaseAuthConfigured } from "@/lib/env";

export default async function HomePage() {
  if (!isSupabaseAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4e3_0%,#f7f0e5_50%,#efe7da_100%)] px-6 py-10 text-[#24160a] sm:px-10">
        <div className="mx-auto max-w-2xl rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-[0_28px_80px_rgba(58,39,14,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8a572a]">
            Login unavailable
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em]">
            Supabase auth is not configured
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5f4530]">
            Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your
            environment before using the protected dashboard.
          </p>
        </div>
      </main>
    );
  }

  const user = await getAuthenticatedSupabaseUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4e3_0%,#f7f0e5_50%,#efe7da_100%)] px-6 py-10 text-[#24160a] sm:px-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8a572a]">
            PinForge Studio
          </p>
          <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl">
            Secure dashboard access for templates, API keys, and provider secrets.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[#5f4530]">
            Sign in with your Supabase email and password before managing API keys, Publer access,
            or AI provider credentials.
          </p>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-[0_28px_80px_rgba(58,39,14,0.12)] backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8a572a]">
            Dashboard login
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em]">Sign in</h2>
          <p className="mt-3 text-base leading-7 text-[#5f4530]">
            Create your first auth user in the Supabase dashboard if you have not done that yet.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
