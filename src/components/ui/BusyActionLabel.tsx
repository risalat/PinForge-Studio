"use client";

export function BusyActionLabel({
  busy,
  label,
  busyLabel,
  inverse = false,
}: {
  busy?: boolean;
  label: string;
  busyLabel?: string;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {busy ? (
        <span
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 ${
            inverse ? "border-white/30 border-t-white" : "border-current/25 border-t-current"
          }`}
        />
      ) : null}
      <span className={busy ? "translate-y-[0.5px]" : ""}>{busy ? busyLabel ?? label : label}</span>
    </span>
  );
}
