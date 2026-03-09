"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const nextPath = searchParams.get("next") || "/dashboard";
      router.replace(nextPath);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 text-base text-[#23160d] outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 text-base text-[#23160d] outline-none"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#e7b6a6] bg-[#fff1ed] px-4 py-3 text-sm text-[#9b4328]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0] disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
