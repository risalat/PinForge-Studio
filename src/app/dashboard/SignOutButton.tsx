"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={
        className ??
        "rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-subtle)] disabled:opacity-60"
      }
    >
      <BusyActionLabel
        busy={isPending}
        label="Sign out"
        busyLabel="Signing out..."
      />
    </button>
  );
}
