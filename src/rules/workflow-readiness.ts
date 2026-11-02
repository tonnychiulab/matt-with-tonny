import type { Rule, ProjectContext, RuleResult } from '../types.js';

const CANONICAL_TRIAGE_LABELS = [
  'needs-triage',
  'needs-info',
  'ready-for-agent',
  'ready-for-human',
  'wontfix',
];

export const ruleWorkflowGitRemote: Rule = {
  id: 'workflow-git-remote',
  dimension: 'workflow',
  title: 'Git Remote Configuration',
  check(context: ProjectContext): RuleResult {
    if (context.workflow.hasGitRemote) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: `Git remote origin is configured (${context.workflow.remoteUrl ?? 'origin'}).`,
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'fail',
      message: 'No git remote configured.',
      remediation: "Run 'git remote add origin <repo-url>' to link this repository with a remote tracker.",
    };
  },
};

export const ruleWorkflowGhAuth: Rule = {
  id: 'workflow-gh-auth',
  dimension: 'workflow',
  title: 'GitHub CLI Authentication',
  check(context: ProjectContext): RuleResult {
    if (context.workflow.isGhAuthenticated) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: 'GitHub CLI (gh) is authenticated and ready.',
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'fail',
      message: 'GitHub CLI (gh) is not authenticated.',
      remediation: "Run 'gh auth login' to authenticate with your GitHub account.",
    };
  },
};

export const ruleWorkflowTriageLabels: Rule = {
  id: 'workflow-triage-labels',
  dimension: 'workflow',
  title: 'Canonical Triage Labels',
  check(context: ProjectContext): RuleResult {
    const missing = CANONICAL_TRIAGE_LABELS.filter(
      (label) => !context.workflow.triageLabels.includes(label)
    );

    if (missing.length === 0) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: 'All 5 canonical triage labels are present on the tracker.',
      };
    }

    const remediationCmd = missing
      .map((l) => `gh label create ${l}`)
      .join(' && ');

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'warn',
      message: `Missing canonical triage label(s): ${missing.join(', ')}.`,
      remediation: `Create missing labels with: ${remediationCmd}`,
    };
  },
};

export const workflowReadinessRules: Rule[] = [
  ruleWorkflowGitRemote,
  ruleWorkflowGhAuth,
  ruleWorkflowTriageLabels,
];
