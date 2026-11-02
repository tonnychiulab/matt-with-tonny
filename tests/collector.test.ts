import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectProjectContext } from '../src/collector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

describe('collectProjectContext', () => {
  it('gracefully handles non-existent directories without throwing', async () => {
    const fakePath = path.join(__dirname, 'fixtures/non-existent-xyz-987');
    const context = await collectProjectContext(fakePath);

    expect(context.targetPath).toBe(path.resolve(fakePath));
    expect(context.files).toEqual([]);
    expect(context.agentDoc.filename).toBeUndefined();
    expect(context.agentDoc.hasSkillsSection).toBe(false);
    expect(context.domain.hasGlossary).toBe(false);
    expect(context.domain.adrCount).toBe(0);
    expect(context.workflow.hasGitRemote).toBe(false);
  });

  it('scans real repository facts for current repo accurately', async () => {
    const context = await collectProjectContext(repoRoot);

    expect(context.targetPath).toBe(repoRoot);
    expect(context.agentDoc.filename).toBe('AGENTS.md');
    expect(context.agentDoc.hasSkillsSection).toBe(true);
    expect(context.domain.hasGlossary).toBe(true);
    expect(context.domain.adrCount).toBeGreaterThanOrEqual(1);
    expect(context.workflow.hasGitRemote).toBe(true);
    expect(context.workflow.remoteUrl).toMatch(/tonnychiulab\/matt-with-tonny/);
    expect(context.workflow.isGhAuthenticated).toBe(true);
    expect(context.workflow.triageLabels).toContain('ready-for-agent');
    expect(context.workflow.triageLabels).toContain('needs-triage');
  });
});
