import { describe, it, expect } from 'vitest';
import { runDiagnosis } from '../src/index.js';
import type { ProjectContext } from '../src/types.js';

function createBaseContext(): ProjectContext {
  return {
    targetPath: '/test/repo',
    files: [],
    agentDoc: {
      hasSkillsSection: false,
    },
    domain: {
      hasGlossary: false,
      adrCount: 0,
    },
    workflow: {
      hasGitRemote: false,
      isGhAuthenticated: false,
      triageLabels: [],
    },
  };
}

describe('Rule Readiness dimension', () => {
  it('fails rule-agent-doc when neither AGENTS.md nor CLAUDE.md exists', () => {
    const context = createBaseContext();
    const report = runDiagnosis(context);

    const docResult = report.results.find((r) => r.ruleId === 'rule-agent-doc');
    expect(docResult).toBeDefined();
    expect(docResult?.status).toBe('fail');
    expect(docResult?.dimension).toBe('rule');
    expect(docResult?.remediation).toMatch(/Create an AGENTS\.md/);
  });

  it('passes rule-agent-doc when AGENTS.md exists', () => {
    const context = createBaseContext();
    context.agentDoc = {
      filename: 'AGENTS.md',
      content: '# AGENTS.md',
      hasSkillsSection: false,
    };

    const report = runDiagnosis(context);
    const docResult = report.results.find((r) => r.ruleId === 'rule-agent-doc');
    expect(docResult?.status).toBe('pass');
  });

  it('warns rule-agent-skills when root doc exists but lacks ## Agent skills section', () => {
    const context = createBaseContext();
    context.agentDoc = {
      filename: 'AGENTS.md',
      content: '# AGENTS.md\nNo skills here',
      hasSkillsSection: false,
    };

    const report = runDiagnosis(context);
    const skillsResult = report.results.find((r) => r.ruleId === 'rule-agent-skills');
    expect(skillsResult).toBeDefined();
    expect(skillsResult?.status).toBe('warn');
    expect(skillsResult?.remediation).toMatch(/## Agent skills/);
  });

  it('passes rule-agent-skills when ## Agent skills section is present', () => {
    const context = createBaseContext();
    context.agentDoc = {
      filename: 'AGENTS.md',
      content: '# AGENTS.md\n\n## Agent skills\n',
      hasSkillsSection: true,
    };

    const report = runDiagnosis(context);
    const skillsResult = report.results.find((r) => r.ruleId === 'rule-agent-skills');
    expect(skillsResult?.status).toBe('pass');
  });
});
