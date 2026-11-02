import { describe, it, expect } from 'vitest';
import { runDiagnosis } from '../src/index.js';
import type { ProjectContext } from '../src/types.js';

function createHealthyContext(): ProjectContext {
  return {
    targetPath: '/test/repo',
    files: ['AGENTS.md', 'GLOSSARY.md', 'docs/adr/0001-init.md'],
    agentDoc: {
      filename: 'AGENTS.md',
      content: '# AGENTS.md\n\n## Agent skills\n',
      hasSkillsSection: true,
    },
    domain: {
      hasGlossary: true,
      adrCount: 1,
    },
    workflow: {
      hasGitRemote: true,
      remoteUrl: 'https://github.com/tonnychiulab/test.git',
      isGhAuthenticated: true,
      triageLabels: ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix'],
    },
  };
}

describe('Domain & Workflow Readiness dimensions', () => {
  it('checks domain-glossary correctly', () => {
    const ctx = createHealthyContext();
    ctx.domain.hasGlossary = false;
    const report = runDiagnosis(ctx);

    const result = report.results.find((r) => r.ruleId === 'domain-glossary');
    expect(result).toBeDefined();
    expect(result?.status).toBe('warn');
    expect(result?.remediation).toMatch(/GLOSSARY\.md/);

    ctx.domain.hasGlossary = true;
    const passReport = runDiagnosis(ctx);
    expect(passReport.results.find((r) => r.ruleId === 'domain-glossary')?.status).toBe('pass');
  });

  it('checks domain-adr correctly', () => {
    const ctx = createHealthyContext();
    ctx.domain.adrCount = 0;
    const report = runDiagnosis(ctx);

    const result = report.results.find((r) => r.ruleId === 'domain-adr');
    expect(result).toBeDefined();
    expect(result?.status).toBe('warn');
    expect(result?.remediation).toMatch(/docs\/adr\//);

    ctx.domain.adrCount = 2;
    const passReport = runDiagnosis(ctx);
    expect(passReport.results.find((r) => r.ruleId === 'domain-adr')?.status).toBe('pass');
  });

  it('checks workflow-git-remote correctly', () => {
    const ctx = createHealthyContext();
    ctx.workflow.hasGitRemote = false;
    const report = runDiagnosis(ctx);

    const result = report.results.find((r) => r.ruleId === 'workflow-git-remote');
    expect(result).toBeDefined();
    expect(result?.status).toBe('fail');
    expect(result?.remediation).toMatch(/git remote add origin/);

    ctx.workflow.hasGitRemote = true;
    const passReport = runDiagnosis(ctx);
    expect(passReport.results.find((r) => r.ruleId === 'workflow-git-remote')?.status).toBe('pass');
  });

  it('checks workflow-gh-auth correctly', () => {
    const ctx = createHealthyContext();
    ctx.workflow.isGhAuthenticated = false;
    const report = runDiagnosis(ctx);

    const result = report.results.find((r) => r.ruleId === 'workflow-gh-auth');
    expect(result).toBeDefined();
    expect(result?.status).toBe('fail');
    expect(result?.remediation).toMatch(/gh auth login/);

    ctx.workflow.isGhAuthenticated = true;
    const passReport = runDiagnosis(ctx);
    expect(passReport.results.find((r) => r.ruleId === 'workflow-gh-auth')?.status).toBe('pass');
  });

  it('checks workflow-triage-labels correctly', () => {
    const ctx = createHealthyContext();
    // Missing 'ready-for-agent' and 'needs-info'
    ctx.workflow.triageLabels = ['needs-triage', 'ready-for-human', 'wontfix'];
    const report = runDiagnosis(ctx);

    const result = report.results.find((r) => r.ruleId === 'workflow-triage-labels');
    expect(result).toBeDefined();
    expect(result?.status).toBe('warn');
    expect(result?.remediation).toMatch(/gh label create/);
    expect(result?.message).toMatch(/ready-for-agent/);

    ctx.workflow.triageLabels = [
      'needs-triage',
      'needs-info',
      'ready-for-agent',
      'ready-for-human',
      'wontfix',
    ];
    const passReport = runDiagnosis(ctx);
    expect(passReport.results.find((r) => r.ruleId === 'workflow-triage-labels')?.status).toBe('pass');
  });

  it('computes 100% readiness score when all checks pass', () => {
    const ctx = createHealthyContext();
    const report = runDiagnosis(ctx);

    expect(report.score).toBe(100);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.warn).toBe(0);
    expect(report.summary.pass).toBe(7); // 2 rule + 2 domain + 3 workflow
  });
});
