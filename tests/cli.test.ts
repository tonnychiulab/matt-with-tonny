import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTerminalReport, renderJsonReport, runCli } from '../src/cli.js';
import type { DiagnosisReport } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const mockReport: DiagnosisReport = {
  targetPath: '/mock/project',
  timestamp: '2026-11-02T10:00:00.000Z',
  score: 86,
  summary: {
    pass: 6,
    warn: 1,
    fail: 0,
    total: 7,
  },
  results: [
    {
      ruleId: 'rule-agent-doc',
      dimension: 'rule',
      title: 'Root Agent Instruction File',
      status: 'pass',
      message: 'Found AGENTS.md.',
    },
    {
      ruleId: 'domain-adr',
      dimension: 'domain',
      title: 'Architecture Decision Records (ADRs)',
      status: 'warn',
      message: 'No ADRs found.',
      remediation: 'Create docs/adr/ and document decisions.',
    },
  ],
};

describe('CLI & Reporters', () => {
  it('renderJsonReport outputs valid JSON with report data', () => {
    const jsonStr = renderJsonReport(mockReport);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.targetPath).toBe('/mock/project');
    expect(parsed.score).toBe(86);
    expect(parsed.summary.pass).toBe(6);
    expect(parsed.results.length).toBe(2);
  });

  it('renderTerminalReport includes summary score and remediation hints', () => {
    const text = renderTerminalReport(mockReport);

    expect(text).toMatch(/Antigravity Project Doctor/i);
    expect(text).toMatch(/Readiness Score:.*86/);
    expect(text).toMatch(/Create docs\/adr\//);
    expect(text).toMatch(/Root Agent Instruction File/);
  });

  it('runCli executes on current repository and returns 0 exit code', async () => {
    const captured: string[] = [];
    const exitCode = await runCli([repoRoot, '--json'], {
      stdout: (msg) => captured.push(msg),
    });

    expect(exitCode).toBe(0);
    const output = captured.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed.score).toBe(100);
    expect(parsed.summary.pass).toBe(7);
  });

  it('runCli returns 1 with --strict when warnings exist', async () => {
    // Diagnosing an empty non-existent directory triggers failures
    const fakeDir = path.join(__dirname, 'fixtures/non-existent-strict-check');
    const captured: string[] = [];
    const exitCode = await runCli([fakeDir, '--strict', '--json'], {
      stdout: (msg) => captured.push(msg),
    });

    expect(exitCode).toBe(1);
    const parsed = JSON.parse(captured.join('\n'));
    expect(parsed.summary.fail).toBeGreaterThan(0);
  });
});
