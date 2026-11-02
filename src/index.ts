import type {
  ProjectContext,
  DiagnosisOptions,
  DiagnosisReport,
  DiagnosisSummary,
  Rule,
} from './types.js';
import { ruleReadinessRules } from './rules/rule-readiness.js';

export * from './types.js';
export { ruleAgentDoc, ruleAgentSkills, ruleReadinessRules } from './rules/rule-readiness.js';

const allRules: Rule[] = [
  ...ruleReadinessRules,
];

export function runDiagnosis(
  context: ProjectContext,
  _options?: DiagnosisOptions
): DiagnosisReport {
  const results = allRules.map((rule) => rule.check(context));

  const summary: DiagnosisSummary = {
    pass: results.filter((r) => r.status === 'pass').length,
    warn: results.filter((r) => r.status === 'warn').length,
    fail: results.filter((r) => r.status === 'fail').length,
    total: results.length,
  };

  // Score calculation: pass = 100%, warn = 50%, fail = 0%
  const score =
    summary.total > 0
      ? Math.round(((summary.pass * 1.0 + summary.warn * 0.5) / summary.total) * 100)
      : 100;

  return {
    targetPath: context.targetPath,
    timestamp: new Date().toISOString(),
    score,
    summary,
    results,
  };
}
