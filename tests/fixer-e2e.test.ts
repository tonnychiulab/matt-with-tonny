import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCli } from '../src/cli.js';
import { runFix } from '../src/fixer.js';
import { collectProjectContext } from '../src/collector.js';
import { runDiagnosis } from '../src/index.js';

describe('Fixer E2E & CLI Integration (Ticket #10)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-cli-fix-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('runFix coordinates both filesystem and workflow fixers', async () => {
    const initialContext = await collectProjectContext(tempDir);
    const initialReport = runDiagnosis(initialContext);

    expect(initialReport.score).toBeLessThan(100);

    const fixResults = await runFix(tempDir, initialReport);
    expect(fixResults.length).toBeGreaterThanOrEqual(2);
    expect(fixResults.some((r) => r.ruleId === 'rule-agent-doc' && r.status === 'applied')).toBe(true);
    expect(fixResults.some((r) => r.ruleId === 'domain-glossary' && r.status === 'applied')).toBe(true);

    // Verify files created on disk
    expect(fs.existsSync(path.join(tempDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'GLOSSARY.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'docs/adr/0001-initial-architecture.md'))).toBe(true);
  });

  it('runCli with --fix automatically repairs missing files and prints summary', async () => {
    const captured: string[] = [];
    const exitCode = await runCli([tempDir, '--fix', '--json'], {
      stdout: (msg) => captured.push(msg),
    });

    // Files should now exist
    expect(fs.existsSync(path.join(tempDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'GLOSSARY.md'))).toBe(true);

    const output = captured.join('\n');
    const parsed = JSON.parse(output);

    // Rule & domain dimension checks should now be passing
    const agentDoc = parsed.results.find((r: any) => r.ruleId === 'rule-agent-doc');
    const glossary = parsed.results.find((r: any) => r.ruleId === 'domain-glossary');
    const adr = parsed.results.find((r: any) => r.ruleId === 'domain-adr');

    expect(agentDoc?.status).toBe('pass');
    expect(glossary?.status).toBe('pass');
    expect(adr?.status).toBe('pass');
  });
});
