import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCli } from '../src/cli.js';

describe('CLI Configuration Integration (--config and .agydoctorrc.json)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-doctor-cli-config-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('automatically discovers .agydoctorrc.json and enforces custom rules', async () => {
    const configData = {
      rules: [
        {
          id: 'require-contributing',
          title: 'Ensure CONTRIBUTING.md exists',
          pattern: 'file-exists',
          path: 'CONTRIBUTING.md',
          severity: 'fail',
          remediation: 'Please create CONTRIBUTING.md',
        },
      ],
    };
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), JSON.stringify(configData), 'utf-8');

    let output = '';
    const exitCode = await runCli([tmpDir], {
      stdout: (msg) => {
        output += msg + '\n';
      },
    });

    // Should fail because CONTRIBUTING.md is missing
    expect(exitCode).toBe(1);
    expect(output).toContain('Ensure CONTRIBUTING.md exists');
    expect(output).toContain('Please create CONTRIBUTING.md');
  });

  it('supports explicit --config <path> flag', async () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\n\n## Agent skills\n');
    fs.writeFileSync(path.join(tmpDir, 'GLOSSARY.md'), '# Glossary\n');
    fs.mkdirSync(path.join(tmpDir, 'docs/adr'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs/adr/0001.md'), '# ADR\n');

    const customConfigData = {
      rules: [
        {
          id: 'require-team-doc',
          title: 'Ensure TEAM.md exists',
          pattern: 'file-exists',
          path: 'TEAM.md',
          severity: 'warn',
        },
      ],
      overrides: {
        'workflow-git-remote': { enabled: false },
        'workflow-gh-auth': { enabled: false },
        'workflow-triage-labels': { enabled: false },
      },
    };
    const customConfigPath = path.join(tmpDir, 'custom-rules.json');
    fs.writeFileSync(customConfigPath, JSON.stringify(customConfigData), 'utf-8');

    let output = '';
    const exitCode = await runCli([tmpDir, '--config', customConfigPath, '--json'], {
      stdout: (msg) => {
        output += msg + '\n';
      },
    });

    // severity is warn, and disabled git rules won't fail, so exit code should be 0 without --strict
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    const customRes = parsed.results.find((r: any) => r.ruleId === 'require-team-doc');
    expect(customRes).toBeDefined();
    expect(customRes.status).toBe('warn');
  });

  it('displays configuration warning in terminal when config is malformed', async () => {
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), '{ brokenJson: ', 'utf-8');

    let output = '';
    await runCli([tmpDir], {
      stdout: (msg) => {
        output += msg + '\n';
      },
    });

    expect(output).toContain('Configuration Warning');
    expect(output).toContain('Failed to parse configuration');
  });

  it('includes configWarning in --json report when config is malformed', async () => {
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), '{ brokenJson: ', 'utf-8');

    let output = '';
    await runCli([tmpDir, '--json'], {
      stdout: (msg) => {
        output += msg + '\n';
      },
    });

    const parsed = JSON.parse(output);
    expect(parsed.configWarning).toBeDefined();
    expect(parsed.configWarning).toContain('Failed to parse configuration');
  });
});
