import { describe, it, expect } from 'vitest';
import type { ProjectContext, DeclarativeRuleConfig } from '../src/types.js';
import { createDeclarativeRule } from '../src/rules/declarative.js';

function createMockContext(files: string[] = [], fileContents: Record<string, string> = {}): ProjectContext {
  return {
    targetPath: '/mock/project',
    files,
    fileContents,
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

describe('Declarative Rules Evaluator', () => {
  describe('pattern: file-exists', () => {
    it('passes when file exists in context.files', () => {
      const config: DeclarativeRuleConfig = {
        id: 'require-contributing',
        title: 'Check CONTRIBUTING.md',
        pattern: 'file-exists',
        path: 'CONTRIBUTING.md',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['CONTRIBUTING.md', 'README.md']);

      const res = rule.check(context);
      expect(res.status).toBe('pass');
      expect(res.ruleId).toBe('require-contributing');
      expect(res.dimension).toBe('rule');
    });

    it('fails with custom remediation when file does not exist', () => {
      const config: DeclarativeRuleConfig = {
        id: 'require-contributing',
        title: 'Check CONTRIBUTING.md',
        pattern: 'file-exists',
        path: 'CONTRIBUTING.md',
        remediation: 'Please create CONTRIBUTING.md with team rules.',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['README.md']);

      const res = rule.check(context);
      expect(res.status).toBe('fail');
      expect(res.remediation).toBe('Please create CONTRIBUTING.md with team rules.');
    });

    it('uses configured severity warn when specified', () => {
      const config: DeclarativeRuleConfig = {
        id: 'warn-readme',
        title: 'Check README.md',
        pattern: 'file-exists',
        path: 'README.md',
        severity: 'warn',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext([]);

      const res = rule.check(context);
      expect(res.status).toBe('warn');
    });
  });

  describe('pattern: file-not-exists', () => {
    it('passes when forbidden file is absent', () => {
      const config: DeclarativeRuleConfig = {
        id: 'disallow-env-local',
        title: 'Disallow .env.local',
        pattern: 'file-not-exists',
        path: '.env.local',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['package.json']);

      const res = rule.check(context);
      expect(res.status).toBe('pass');
    });

    it('fails when forbidden file is present', () => {
      const config: DeclarativeRuleConfig = {
        id: 'disallow-env-local',
        title: 'Disallow .env.local',
        pattern: 'file-not-exists',
        path: '.env.local',
        remediation: 'Remove .env.local and add it to .gitignore',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['package.json', '.env.local']);

      const res = rule.check(context);
      expect(res.status).toBe('fail');
      expect(res.remediation).toBe('Remove .env.local and add it to .gitignore');
    });
  });

  describe('pattern: content-matches', () => {
    it('passes when file content matches regex or string pattern', () => {
      const config: DeclarativeRuleConfig = {
        id: 'check-security-contact',
        title: 'Verify security email',
        pattern: 'content-matches',
        path: 'SECURITY.md',
        match: 'security@\\w+\\.com',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['SECURITY.md'], {
        'SECURITY.md': 'Please report vulnerabilities to security@example.com.',
      });

      const res = rule.check(context);
      expect(res.status).toBe('pass');
    });

    it('fails when pattern does not match content', () => {
      const config: DeclarativeRuleConfig = {
        id: 'check-security-contact',
        title: 'Verify security email',
        pattern: 'content-matches',
        path: 'SECURITY.md',
        match: 'security@company.com',
        remediation: 'Add security@company.com to SECURITY.md',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['SECURITY.md'], {
        'SECURITY.md': 'No contacts listed.',
      });

      const res = rule.check(context);
      expect(res.status).toBe('fail');
      expect(res.remediation).toBe('Add security@company.com to SECURITY.md');
    });

    it('fails when file does not exist', () => {
      const config: DeclarativeRuleConfig = {
        id: 'check-security-contact',
        title: 'Verify security email',
        pattern: 'content-matches',
        path: 'SECURITY.md',
        match: 'security@company.com',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext([]);

      const res = rule.check(context);
      expect(res.status).toBe('fail');
    });
  });

  describe('custom dimension assignment', () => {
    it('respects configured dimension when provided', () => {
      const config: DeclarativeRuleConfig = {
        id: 'domain-check',
        dimension: 'domain',
        title: 'Domain file check',
        pattern: 'file-exists',
        path: 'SCHEMA.md',
      };
      const rule = createDeclarativeRule(config);
      const context = createMockContext(['SCHEMA.md']);

      const res = rule.check(context);
      expect(res.dimension).toBe('domain');
    });
  });
});
