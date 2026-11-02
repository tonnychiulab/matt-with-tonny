import { describe, it, expect } from 'vitest';
import { runDiagnosis } from '../src/index.js';
import type { ProjectContext } from '../src/types.js';

describe('runDiagnosis (highest seam)', () => {
  it('should accept an in-memory ProjectContext and return a DiagnosisReport', () => {
    const mockContext: ProjectContext = {
      targetPath: '/mock/project',
      files: ['AGENTS.md', 'GLOSSARY.md'],
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
        remoteUrl: 'https://github.com/example/repo.git',
        isGhAuthenticated: true,
        triageLabels: ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix'],
      },
    };

    const report = runDiagnosis(mockContext);

    expect(report.targetPath).toBe('/mock/project');
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(report.results)).toBe(true);
    expect(report.summary).toHaveProperty('pass');
    expect(report.summary).toHaveProperty('warn');
    expect(report.summary).toHaveProperty('fail');
  });
});
