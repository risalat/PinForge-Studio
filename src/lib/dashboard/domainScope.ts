import { normalizeDomain } from "@/lib/types";

export function filterByAllowedDomains<T>(
  items: T[],
  getDomain: (item: T) => string,
  allowedDomains: string[],
) {
  const normalizedAllowedDomains = Array.from(
    new Set(allowedDomains.map((domain) => normalizeDomain(domain)).filter(Boolean)),
  );

  if (normalizedAllowedDomains.length === 0) {
    return items;
  }

  return items.filter((item) => normalizedAllowedDomains.includes(normalizeDomain(getDomain(item))));
}
