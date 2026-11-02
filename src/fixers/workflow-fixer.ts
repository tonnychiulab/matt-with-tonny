import { execSync } from 'node:child_process';
import type { DiagnosisReport, FixResult } from '../types.js';

export type LabelExecutor = (cmd: string, cwd: string) => { success: boolean; error?: string };

const defaultExecutor: LabelExecutor = (cmd: string, cwd: string) => {
  try {
    execSync(cmd, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 10000,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

const CANONICAL_LABELS_SPEC: Record<string, { desc: string; color: string }> = {
  'needs-triage': { desc: 'Maintainer needs to evaluate this issue', color: 'fbca04' },
  'needs-info': { desc: 'Waiting on reporter for more information', color: 'd93f0b' },
  'ready-for-agent': { desc: 'Fully specified, ready for an AFK agent', color: '0e8a16' },
  'ready-for-human': { desc: 'Requires human implementation', color: '1d76db' },
  wontfix: { desc: 'Will not be actioned', color: 'ffffff' },
};

export function fixWorkflowLabels(
  targetDir: string,
  report: DiagnosisReport,
  executor: LabelExecutor = defaultExecutor
): FixResult[] {
  const results: FixResult[] = [];

  const triageResult = report.results.find((r) => r.ruleId === 'workflow-triage-labels');
  if (!triageResult || triageResult.status === 'pass') {
    return results;
  }

  // Check if Git remote is configured
  const gitRemoteResult = report.results.find((r) => r.ruleId === 'workflow-git-remote');
  const hasGitRemote = gitRemoteResult?.status === 'pass';
  if (!hasGitRemote) {
    results.push({
      ruleId: 'workflow-triage-labels',
      status: 'skipped',
      action: 'No Git remote configured to create GitHub labels.',
    });
    return results;
  }

  // Check if gh is authenticated
  const ghAuthResult = report.results.find((r) => r.ruleId === 'workflow-gh-auth');
  const isGhAuth = ghAuthResult?.status === 'pass';

  if (!isGhAuth) {
    results.push({
      ruleId: 'workflow-triage-labels',
      status: 'skipped',
      action: 'GitHub CLI not authenticated to create missing labels.',
    });
    return results;
  }

  // Extract missing labels from message: "Missing canonical triage label(s): a, b, c."
  const match = triageResult.message.match(/Missing canonical triage label\(s\):\s*([^.]+)/);
  if (!match || !match[1]) {
    return results;
  }

  const missingLabels = match[1]
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const label of missingLabels) {
    const spec = CANONICAL_LABELS_SPEC[label] ?? {
      desc: 'Canonical triage label',
      color: 'ededed',
    };

    const cmd = `gh label create ${label} --description "${spec.desc}" --color ${spec.color}`;
    const execRes = executor(cmd, targetDir);

    if (execRes.success) {
      results.push({
        ruleId: 'workflow-triage-labels',
        status: 'applied',
        action: `Created GitHub label ${label}.`,
      });
    } else {
      results.push({
        ruleId: 'workflow-triage-labels',
        status: 'failed',
        action: `Failed to create label ${label}.`,
        error: execRes.error,
      });
    }
  }

  return results;
}
