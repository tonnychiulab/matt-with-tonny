import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DiagnosisReport, FixResult } from '../types.js';

const SEED_SKILLS_BLOCK = `
## Agent skills

### Issue tracker
Issues tracked via configured tracker. See \`docs/agents/issue-tracker.md\`.

### Triage labels
Canonical five-role triage labels. See \`docs/agents/triage-labels.md\`.

### Domain docs
Domain documentation rules. See \`docs/agents/domain.md\`.
`;

const SEED_AGENTS_MD = `# AGENTS.md
${SEED_SKILLS_BLOCK}`;

const SEED_GLOSSARY_MD = `# Project Glossary

Define core domain terms here to eliminate ambiguity across agent workflows.

## Language
`;

const SEED_ADR_MD = `# Initial Architecture Baseline

Recorded initial system design decisions, conventions, and trade-offs.
`;

export function fixFilesystemIssues(targetDir: string, report: DiagnosisReport): FixResult[] {
  const results: FixResult[] = [];
  const resolvedDir = path.resolve(targetDir);

  for (const issue of report.results) {
    if (issue.status === 'pass') continue;

    // 1. Fix missing AGENTS.md / CLAUDE.md
    if (issue.ruleId === 'rule-agent-doc') {
      const agentsPath = path.join(resolvedDir, 'AGENTS.md');
      const claudePath = path.join(resolvedDir, 'CLAUDE.md');

      if (fs.existsSync(agentsPath) || fs.existsSync(claudePath)) {
        results.push({
          ruleId: issue.ruleId,
          status: 'skipped',
          action: 'Agent instruction file already exists.',
        });
      } else {
        try {
          fs.writeFileSync(agentsPath, SEED_AGENTS_MD, 'utf-8');
          results.push({
            ruleId: issue.ruleId,
            status: 'applied',
            action: 'Created AGENTS.md with ## Agent skills block.',
          });
        } catch (error) {
          results.push({
            ruleId: issue.ruleId,
            status: 'failed',
            action: 'Failed to create AGENTS.md.',
            error: (error as Error).message,
          });
        }
      }
    }

    // 2. Fix missing ## Agent skills block
    if (issue.ruleId === 'rule-agent-skills') {
      const agentsPath = path.join(resolvedDir, 'AGENTS.md');
      const claudePath = path.join(resolvedDir, 'CLAUDE.md');
      const targetFile = fs.existsSync(agentsPath)
        ? agentsPath
        : fs.existsSync(claudePath)
          ? claudePath
          : null;

      if (!targetFile) {
        results.push({
          ruleId: issue.ruleId,
          status: 'skipped',
          action: 'No agent instruction file found to append skills block.',
        });
      } else {
        try {
          const content = fs.readFileSync(targetFile, 'utf-8');
          if (/^##\s+Agent skills/m.test(content)) {
            results.push({
              ruleId: issue.ruleId,
              status: 'skipped',
              action: '## Agent skills block already present.',
            });
          } else {
            fs.appendFileSync(targetFile, `\n${SEED_SKILLS_BLOCK}\n`, 'utf-8');
            results.push({
              ruleId: issue.ruleId,
              status: 'applied',
              action: `Appended ## Agent skills block to ${path.basename(targetFile)}.`,
            });
          }
        } catch (error) {
          results.push({
            ruleId: issue.ruleId,
            status: 'failed',
            action: `Failed to update ${path.basename(targetFile)}.`,
            error: (error as Error).message,
          });
        }
      }
    }

    // 3. Fix missing GLOSSARY.md
    if (issue.ruleId === 'domain-glossary') {
      const glossaryPath = path.join(resolvedDir, 'GLOSSARY.md');
      if (fs.existsSync(glossaryPath)) {
        results.push({
          ruleId: issue.ruleId,
          status: 'skipped',
          action: 'GLOSSARY.md already exists.',
        });
      } else {
        try {
          fs.writeFileSync(glossaryPath, SEED_GLOSSARY_MD, 'utf-8');
          results.push({
            ruleId: issue.ruleId,
            status: 'applied',
            action: 'Created GLOSSARY.md.',
          });
        } catch (error) {
          results.push({
            ruleId: issue.ruleId,
            status: 'failed',
            action: 'Failed to create GLOSSARY.md.',
            error: (error as Error).message,
          });
        }
      }
    }

    // 4. Fix missing docs/adr/
    if (issue.ruleId === 'domain-adr') {
      const adrDir = path.join(resolvedDir, 'docs', 'adr');
      let hasAdrs = false;
      if (fs.existsSync(adrDir)) {
        hasAdrs = fs.readdirSync(adrDir).some((f) => f.endsWith('.md'));
      }

      if (hasAdrs) {
        results.push({
          ruleId: issue.ruleId,
          status: 'skipped',
          action: 'docs/adr/ already contains ADR files.',
        });
      } else {
        try {
          if (!fs.existsSync(adrDir)) {
            fs.mkdirSync(adrDir, { recursive: true });
          }
          const adrPath = path.join(adrDir, '0001-initial-architecture.md');
          fs.writeFileSync(adrPath, SEED_ADR_MD, 'utf-8');
          results.push({
            ruleId: issue.ruleId,
            status: 'applied',
            action: 'Created docs/adr/0001-initial-architecture.md.',
          });
        } catch (error) {
          results.push({
            ruleId: issue.ruleId,
            status: 'failed',
            action: 'Failed to scaffold docs/adr/0001-initial-architecture.md.',
            error: (error as Error).message,
          });
        }
      }
    }
  }

  return results;
}
