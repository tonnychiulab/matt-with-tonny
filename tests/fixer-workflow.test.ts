import { describe, it, expect } from 'vitest';
import { fixWorkflowLabels } from '../src/fixers/workflow-fixer.js';
import type { DiagnosisReport } from '../src/types.js';

describe('Workflow Label Fixer (Ticket #9)', () => {
  function createReportWithMissingLabels(missingLabels: string[], isGhAuth = true): DiagnosisReport {
    return {
      targetPath: '/mock/project',
      timestamp: new Date().toISOString(),
      score: 70,
      summary: { pass: 5, warn: 1, fail: 0, total: 6 },
      results: [
        {
          ruleId: 'workflow-gh-auth',
          dimension: 'workflow',
          title: 'GitHub CLI Authentication',
          status: isGhAuth ? 'pass' : 'fail',
          message: isGhAuth ? 'Authenticated' : 'Not authenticated',
        },
        {
          ruleId: 'workflow-triage-labels',
          dimension: 'workflow',
          title: 'Canonical Triage Labels',
          status: 'warn',
          message: `Missing canonical triage label(s): ${missingLabels.join(', ')}.`,
          remediation: 'gh label create ...',
        },
      ],
    };
  }

  it('calls gh label create for each missing label when authenticated', () => {
    const executedCommands: string[] = [];
    const mockExecutor = (cmd: string) => {
      executedCommands.push(cmd);
      return { success: true };
    };

    const report = createReportWithMissingLabels(['needs-triage', 'ready-for-agent']);
    const results = fixWorkflowLabels('/mock/project', report, mockExecutor);

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe('applied');
    expect(results[0]?.action).toContain('needs-triage');
    expect(results[1]?.status).toBe('applied');
    expect(results[1]?.action).toContain('ready-for-agent');

    expect(executedCommands).toHaveLength(2);
    expect(executedCommands[0]).toContain('gh label create needs-triage');
    expect(executedCommands[1]).toContain('gh label create ready-for-agent');
  });

  it('skips label creation when GitHub CLI is not authenticated', () => {
    const executedCommands: string[] = [];
    const mockExecutor = (cmd: string) => {
      executedCommands.push(cmd);
      return { success: true };
    };

    const report = createReportWithMissingLabels(['needs-triage'], false);
    const results = fixWorkflowLabels('/mock/project', report, mockExecutor);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('skipped');
    expect(results[0]?.action).toMatch(/not authenticated/i);
    expect(executedCommands).toHaveLength(0);
  });

  it('records failed status when gh label create returns failure', () => {
    const mockExecutor = () => ({ success: false, error: 'Network error or 404' });

    const report = createReportWithMissingLabels(['needs-triage']);
    const results = fixWorkflowLabels('/mock/project', report, mockExecutor);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('failed');
    expect(results[0]?.error).toBe('Network error or 404');
  });
});
