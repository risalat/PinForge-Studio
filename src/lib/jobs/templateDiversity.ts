export function buildTemplateDiverseOrder<T>(
  items: readonly T[],
  input: {
    getTemplateId: (item: T) => string;
    seed: string;
  },
) {
  if (items.length <= 1) {
    return [...items];
  }

  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const templateId = input.getTemplateId(item);
    const existing = buckets.get(templateId);
    if (existing) {
      existing.push(item);
      continue;
    }

    buckets.set(templateId, [item]);
  }

  const rankedTemplateIds = shuffleBySeed([...buckets.keys()], input.seed);
  const rankByTemplateId = new Map(rankedTemplateIds.map((templateId, index) => [templateId, index]));
  const ordered: T[] = [];
  let previousTemplateId: string | null = null;

  while (ordered.length < items.length) {
    const availableTemplateIds = rankedTemplateIds.filter(
      (templateId) => (buckets.get(templateId)?.length ?? 0) > 0,
    );

    if (availableTemplateIds.length === 0) {
      break;
    }

    const candidateTemplateIds =
      availableTemplateIds.length > 1
        ? availableTemplateIds.filter((templateId) => templateId !== previousTemplateId)
        : availableTemplateIds;

    candidateTemplateIds.sort((left, right) => {
      const remainingDelta =
        (buckets.get(right)?.length ?? 0) - (buckets.get(left)?.length ?? 0);

      if (remainingDelta !== 0) {
        return remainingDelta;
      }

      return (rankByTemplateId.get(left) ?? 0) - (rankByTemplateId.get(right) ?? 0);
    });

    const nextTemplateId = candidateTemplateIds[0] ?? availableTemplateIds[0];
    const nextItem = buckets.get(nextTemplateId)?.shift();
    if (!nextItem) {
      break;
    }

    ordered.push(nextItem);
    previousTemplateId = nextTemplateId;
  }

  return ordered;
}

function shuffleBySeed<T>(values: readonly T[], seed: string) {
  const result = [...values];
  let state = Math.max(1, hashString(seed));

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}
