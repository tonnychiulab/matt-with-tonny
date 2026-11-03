import type { Rule, RuleResult, DeclarativeRuleConfig, ProjectContext } from '../types.js';

export function createDeclarativeRule(config: DeclarativeRuleConfig): Rule {
  const dimension = config.dimension || 'rule';
  const failureSeverity = config.severity || 'fail';

  return {
    id: config.id,
    dimension,
    title: config.title,
    check(context: ProjectContext): RuleResult {
      const fileExists = context.files.includes(config.path);

      if (config.pattern === 'file-exists') {
        if (fileExists) {
          return {
            ruleId: config.id,
            dimension,
            title: config.title,
            status: 'pass',
            message: `Required file '${config.path}' exists.`,
          };
        }
        return {
          ruleId: config.id,
          dimension,
          title: config.title,
          status: failureSeverity,
          message: `Required file '${config.path}' is missing.`,
          remediation: config.remediation || `Create ${config.path}`,
        };
      }

      if (config.pattern === 'file-not-exists') {
        if (!fileExists) {
          return {
            ruleId: config.id,
            dimension,
            title: config.title,
            status: 'pass',
            message: `Forbidden file '${config.path}' is not present.`,
          };
        }
        return {
          ruleId: config.id,
          dimension,
          title: config.title,
          status: failureSeverity,
          message: `Forbidden file '${config.path}' should not be present in the repository.`,
          remediation: config.remediation || `Remove ${config.path}`,
        };
      }

      if (config.pattern === 'content-matches') {
        if (!fileExists) {
          return {
            ruleId: config.id,
            dimension,
            title: config.title,
            status: failureSeverity,
            message: `Cannot verify content: file '${config.path}' does not exist.`,
            remediation: config.remediation || `Create ${config.path}`,
          };
        }

        const content = context.fileContents?.[config.path] ?? '';
        const pattern = config.match || '';

        let matched = false;
        try {
          const regex = new RegExp(pattern);
          matched = regex.test(content);
        } catch {
          matched = content.includes(pattern);
        }

        if (matched) {
          return {
            ruleId: config.id,
            dimension,
            title: config.title,
            status: 'pass',
            message: `File '${config.path}' matches required content pattern.`,
          };
        }

        return {
          ruleId: config.id,
          dimension,
          title: config.title,
          status: failureSeverity,
          message: `File '${config.path}' does not match pattern '${pattern}'.`,
          remediation: config.remediation,
        };
      }

      return {
        ruleId: config.id,
        dimension,
        title: config.title,
        status: 'warn',
        message: `Unknown declarative rule pattern '${config.pattern}'.`,
      };
    },
  };
}
