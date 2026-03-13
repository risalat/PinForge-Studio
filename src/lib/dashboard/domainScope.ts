import { normalizeDomain } from "@/lib/types";

export function matchesAllowedDomain(domain: string, allowedDomains: string[]) {
  const normalizedAllowedDomains = Array.from(
    new Set(allowedDomains.map((value) => normalizeDomain(value)).filter(Boolean)),
  );

  if (normalizedAllowedDomains.length === 0) {
    return true;
  }

  return normalizedAllowedDomains.includes(normalizeDomain(domain));
}

export function filterByAllowedDomains<T>(
  items: T[],
  getDomain: (item: T) => string,
  allowedDomains: string[],
) {
  return items.filter((item) => matchesAllowedDomain(getDomain(item), allowedDomains));
}
