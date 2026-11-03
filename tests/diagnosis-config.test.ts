import { describe, it, expect } from 'vitest';
import type { ProjectContext } from '../src/types.js';
import { runDiagnosis } from '../src/index.js';

function createBaseContext(): ProjectContext {
  return {
    targetPath: '/mock/project',
    files: ['AGENTS.md', 'GLOSSARY.md'],
    fileContents: {
      'AGENTS.md': '# Title\n\n## Agent skills\n\nSkills here...',
      'GLOSSARY.md': '# Glossary',
    },
    agentDoc: {
      filename: 'AGENTS.md',
      content: '# Title\n\n## Agent skills\n\nSkills here...',
      hasSkillsSection: true,
    },
    domain: {
      hasGlossary: true,
      adrCount: 1,
    },
    workflow: {
      hasGitRemote: true,
      remoteUrl: 'https://github.com/tonnychiulab/matt-with-tonny.git',
      isGhAuthenticated: true,
      triageLabels: [
        'needs-triage',
        'needs-info',
        'ready-for-agent',
        'ready-for-human',
        'wontfix',
      ],
    },
  };
}

describe('Diagnosis Engine with Configuration', () => {
  it('runs all 7 built-in rules when no config or overrides are present', () => {
    const context = createBaseContext();
    const report = runDiagnosis(context);

    expect(report.results).toHaveLength(7);
    expect(report.score).toBe(100);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.warn).toBe(0);
    expect(report.summary.pass).toBe(7);
  });

  it('includes custom declarative rules defined in config.rules', () => {
    const context = createBaseContext();
    context.config = {
      rules: [
        {
          id: 'custom-contributing',
          title: 'Ensure CONTRIBUTING.md exists',
          pattern: 'file-exists',
          path: 'CONTRIBUTING.md',
          remediation: 'Create CONTRIBUTING.md',
        },
      ],
    };

    const report = runDiagnosis(context);
    expect(report.results).toHaveLength(8);
    const customResult = report.results.find((r) => r.ruleId === 'custom-contributing');
    expect(customResult).toBeDefined();
    expect(customResult?.status).toBe('fail');
    expect(customResult?.remediation).toBe('Create CONTRIBUTING.md');
    // Score should reflect 7 pass, 1 fail out of 8: (7/8) * 100 = 88%
    expect(report.score).toBe(88);
  });

  it('excludes disabled rules when overrides specify enabled: false', () => {
    const context = createBaseContext();
    context.config = {
      overrides: {
        'rule-agent-skills': {
          enabled: false,
        },
        'workflow-gh-auth': {
          enabled: false,
        },
      },
    };

    const report = runDiagnosis(context);
    expect(report.results).toHaveLength(5);
    expect(report.results.some((r) => r.ruleId === 'rule-agent-skills')).toBe(false);
    expect(report.results.some((r) => r.ruleId === 'workflow-gh-auth')).toBe(false);
    expect(report.score).toBe(100);
  });

  it('overrides rule failure severity to warn when specified in overrides', () => {
    const context = createBaseContext();
    // Intentionally break adrCount so domain-adr fails/warns
    context.domain.adrCount = 0;
    context.config = {
      overrides: {
        'domain-adr': {
          severity: 'warn',
        },
      },
    };

    const report = runDiagnosis(context);
    const adrResult = report.results.find((r) => r.ruleId === 'domain-adr');
    expect(adrResult).toBeDefined();
    expect(adrResult?.status).toBe('warn');
  });

  it('calculates aggregate readiness score uniformly across active rules', () => {
    const context = createBaseContext();
    // 7 passes initially
    // Add 1 passing custom rule, 1 failing custom rule
    context.files.push('CONTRIBUTING.md');
    context.config = {
      rules: [
        {
          id: 'rule-pass',
          title: 'Pass',
          pattern: 'file-exists',
          path: 'CONTRIBUTING.md',
        },
        {
          id: 'rule-fail',
          title: 'Fail',
          pattern: 'file-exists',
          path: 'NON_EXISTENT.md',
        },
      ],
    };

    // Total: 8 pass (1.0 each) + 1 fail (0.0) = 8.0 / 9 = 88.88% -> 89%
    const report = runDiagnosis(context);
    expect(report.results).toHaveLength(9);
    expect(report.summary.pass).toBe(8);
    expect(report.summary.fail).toBe(1);
    expect(report.score).toBe(89);
  });

  it('propagates configWarning to DiagnosisReport if present in context', () => {
    const context = createBaseContext();
    context.configWarning = 'Invalid syntax in .agydoctorrc.json';

    const report = runDiagnosis(context);
    expect(report.configWarning).toBe('Invalid syntax in .agydoctorrc.json');
  });
});
