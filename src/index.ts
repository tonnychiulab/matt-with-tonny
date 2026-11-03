import type {
  ProjectContext,
  DiagnosisOptions,
  DiagnosisReport,
  DiagnosisSummary,
  Rule,
} from './types.js';
import { ruleReadinessRules } from './rules/rule-readiness.js';
import { domainReadinessRules } from './rules/domain-readiness.js';
import { workflowReadinessRules } from './rules/workflow-readiness.js';
import { createDeclarativeRule } from './rules/declarative.js';

export * from './types.js';
export { collectProjectContext } from './collector.js';
export { loadConfig } from './config.js';
export { runFix } from './fixer.js';
export { createDeclarativeRule } from './rules/declarative.js';
export { fixFilesystemIssues } from './fixers/filesystem-fixer.js';
export { fixWorkflowLabels } from './fixers/workflow-fixer.js';
export { ruleAgentDoc, ruleAgentSkills, ruleReadinessRules } from './rules/rule-readiness.js';
export { ruleDomainGlossary, ruleDomainAdr, domainReadinessRules } from './rules/domain-readiness.js';
export {
  ruleWorkflowGitRemote,
  ruleWorkflowGhAuth,
  ruleWorkflowTriageLabels,
  workflowReadinessRules,
} from './rules/workflow-readiness.js';

export const allRules: Rule[] = [
  ...ruleReadinessRules,
  ...domainReadinessRules,
  ...workflowReadinessRules,
];

export function runDiagnosis(
  context: ProjectContext,
  _options?: DiagnosisOptions
): DiagnosisReport {
  const overrides = context.config?.overrides ?? {};

  // 1. Base rules + custom declarative rules
  const customRules: Rule[] = (context.config?.rules ?? []).map((r) =>
    createDeclarativeRule(r)
  );

  const candidateRules = [...allRules, ...customRules];

  // 2. Filter out disabled rules
  const activeRules = candidateRules.filter((rule) => {
    const override = overrides[rule.id];
    return override?.enabled !== false;
  });

  // 3. Execute active rules & apply severity overrides
  const results = activeRules.map((rule) => {
    const result = rule.check(context);
    const override = overrides[rule.id];
    if (override?.severity && result.status !== 'pass') {
      return {
        ...result,
        status: override.severity,
      };
    }
    return result;
  });

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
    configWarning: context.configWarning,
  };
}
