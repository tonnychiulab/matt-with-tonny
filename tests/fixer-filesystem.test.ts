import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fixFilesystemIssues } from '../src/fixers/filesystem-fixer.js';
import type { DiagnosisReport } from '../src/types.js';

describe('Filesystem Fixer (Ticket #8)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-fixer-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createReport(ruleIds: string[]): DiagnosisReport {
    return {
      targetPath: tempDir,
      timestamp: new Date().toISOString(),
      score: 50,
      summary: { pass: 0, warn: ruleIds.length, fail: 0, total: ruleIds.length },
      results: ruleIds.map((id) => ({
        ruleId: id,
        dimension: 'rule',
        title: id,
        status: id.startsWith('rule-agent-doc') ? 'fail' : 'warn',
        message: 'Mock issue',
      })),
    };
  }

  it('safely scaffolds AGENTS.md when rule-agent-doc fails', () => {
    const report = createReport(['rule-agent-doc']);
    const results = fixFilesystemIssues(tempDir, report);

    expect(results).toHaveLength(1);
    expect(results[0]?.ruleId).toBe('rule-agent-doc');
    expect(results[0]?.status).toBe('applied');

    const createdFile = path.join(tempDir, 'AGENTS.md');
    expect(fs.existsSync(createdFile)).toBe(true);
    const content = fs.readFileSync(createdFile, 'utf-8');
    expect(content).toContain('## Agent skills');

    // Idempotent: running again skips modification
    const secondResults = fixFilesystemIssues(tempDir, report);
    expect(secondResults[0]?.status).toBe('skipped');
  });

  it('appends ## Agent skills to existing AGENTS.md when rule-agent-skills warns', () => {
    const agentsPath = path.join(tempDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, '# Existing AGENTS.md\n\nCustom instructions.\n', 'utf-8');

    const report = createReport(['rule-agent-skills']);
    const results = fixFilesystemIssues(tempDir, report);

    expect(results[0]?.ruleId).toBe('rule-agent-skills');
    expect(results[0]?.status).toBe('applied');

    const updated = fs.readFileSync(agentsPath, 'utf-8');
    expect(updated).toContain('Custom instructions.');
    expect(updated).toContain('## Agent skills');
  });

  it('scaffolds GLOSSARY.md when domain-glossary warns', () => {
    const report = createReport(['domain-glossary']);
    const results = fixFilesystemIssues(tempDir, report);

    expect(results[0]?.ruleId).toBe('domain-glossary');
    expect(results[0]?.status).toBe('applied');

    const glossaryPath = path.join(tempDir, 'GLOSSARY.md');
    expect(fs.existsSync(glossaryPath)).toBe(true);
    expect(fs.readFileSync(glossaryPath, 'utf-8')).toContain('## Language');
  });

  it('scaffolds docs/adr/0001-initial-architecture.md when domain-adr warns', () => {
    const report = createReport(['domain-adr']);
    const results = fixFilesystemIssues(tempDir, report);

    expect(results[0]?.ruleId).toBe('domain-adr');
    expect(results[0]?.status).toBe('applied');

    const adrPath = path.join(tempDir, 'docs/adr/0001-initial-architecture.md');
    expect(fs.existsSync(adrPath)).toBe(true);
  });
});
