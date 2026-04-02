import type {
  RuntimeTemplateValidationIgnoreRule,
  RuntimeTemplateValidationIssue,
} from "@/lib/runtime-templates/types";

export function buildValidationIgnoreRuleFromIssue(
  issue: RuntimeTemplateValidationIssue,
): RuntimeTemplateValidationIgnoreRule {
  return {
    code: issue.code,
    path: issue.path,
    bucket: issue.bucket,
    presetId: issue.context?.presetId,
    stressCaseId: issue.context?.stressCaseId,
    message: issue.message,
  };
}

export function doesValidationIgnoreRuleMatchIssue(
  rule: RuntimeTemplateValidationIgnoreRule,
  issue: RuntimeTemplateValidationIssue,
) {
  if (rule.code !== issue.code) {
    return false;
  }
  if (rule.bucket && rule.bucket !== issue.bucket) {
    return false;
  }
  if (rule.path && rule.path !== issue.path) {
    return false;
  }
  if (rule.presetId && rule.presetId !== issue.context?.presetId) {
    return false;
  }
  if (rule.stressCaseId && rule.stressCaseId !== issue.context?.stressCaseId) {
    return false;
  }
  return true;
}

export function areValidationIgnoreRulesEqual(
  left: RuntimeTemplateValidationIgnoreRule,
  right: RuntimeTemplateValidationIgnoreRule,
) {
  return (
    left.code === right.code &&
    (left.path ?? "") === (right.path ?? "") &&
    (left.bucket ?? "") === (right.bucket ?? "") &&
    (left.presetId ?? "") === (right.presetId ?? "") &&
    (left.stressCaseId ?? "") === (right.stressCaseId ?? "")
  );
}

export function addValidationIgnoreRule(
  current: RuntimeTemplateValidationIgnoreRule[],
  next: RuntimeTemplateValidationIgnoreRule,
) {
  if (current.some((rule) => areValidationIgnoreRulesEqual(rule, next))) {
    return current;
  }
  return [...current, next];
}

export function removeValidationIgnoreRule(
  current: RuntimeTemplateValidationIgnoreRule[],
  target: RuntimeTemplateValidationIgnoreRule,
) {
  return current.filter((rule) => !areValidationIgnoreRulesEqual(rule, target));
}

export function describeValidationIgnoreRule(
  rule: RuntimeTemplateValidationIgnoreRule,
) {
  const segments = [rule.message?.trim() || rule.code];
  if (rule.presetId) {
    segments.push(`preset ${rule.presetId}`);
  }
  if (rule.stressCaseId) {
    segments.push(`stress ${rule.stressCaseId}`);
  }
  if (rule.path) {
    segments.push(rule.path);
  }
  return segments.filter(Boolean).join(" • ");
}
