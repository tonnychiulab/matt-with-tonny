import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadConfig } from '../src/config.js';
import { collectProjectContext } from '../src/collector.js';

describe('Configuration Loader (loadConfig)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-doctor-config-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('returns empty config when no config file is present', () => {
    const res = loadConfig(undefined, tmpDir);
    expect(res.config).toEqual({});
    expect(res.source).toBeUndefined();
    expect(res.warning).toBeUndefined();
  });

  it('automatically discovers and parses .agydoctorrc.json in project root', () => {
    const configData = {
      rules: [
        {
          id: 'custom-contributing',
          title: 'Ensure CONTRIBUTING.md exists',
          pattern: 'file-exists',
          path: 'CONTRIBUTING.md',
          severity: 'fail',
          remediation: 'Create CONTRIBUTING.md',
        },
      ],
      overrides: {
        'rule-skills-section': {
          enabled: false,
        },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), JSON.stringify(configData), 'utf-8');

    const res = loadConfig(undefined, tmpDir);
    expect(res.config).toEqual(configData);
    expect(res.source).toBe(path.join(tmpDir, '.agydoctorrc.json'));
    expect(res.warning).toBeUndefined();
  });

  it('loads explicit config path specified by user', () => {
    const customConfigData = {
      rules: [
        {
          id: 'custom-license',
          title: 'Ensure LICENSE exists',
          pattern: 'file-exists',
          path: 'LICENSE',
        },
      ],
    };
    const customPath = path.join(tmpDir, 'shared-config.json');
    fs.writeFileSync(customPath, JSON.stringify(customConfigData), 'utf-8');

    const res = loadConfig(customPath, tmpDir);
    expect(res.config.rules).toHaveLength(1);
    expect(res.config.rules?.[0].id).toBe('custom-license');
    expect(res.source).toBe(customPath);
    expect(res.warning).toBeUndefined();
  });

  it('gracefully handles non-existent explicit config path with warning', () => {
    const missingPath = path.join(tmpDir, 'does-not-exist.json');
    const res = loadConfig(missingPath, tmpDir);

    expect(res.config).toEqual({});
    expect(res.warning).toContain('Configuration file not found');
  });

  it('gracefully handles malformed JSON with warning and fallback', () => {
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), '{ "invalidJson": true, ', 'utf-8');

    const res = loadConfig(undefined, tmpDir);
    expect(res.config).toEqual({});
    expect(res.warning).toContain('Failed to parse configuration');
  });

  it('integrates configuration into collectProjectContext', async () => {
    const configData = {
      rules: [
        {
          id: 'test-rule',
          title: 'Test Rule',
          pattern: 'file-exists',
          path: 'TEST.md',
        },
      ],
    };
    fs.writeFileSync(path.join(tmpDir, '.agydoctorrc.json'), JSON.stringify(configData), 'utf-8');

    const context = await collectProjectContext(tmpDir);
    expect(context.config).toEqual(configData);
    expect(context.configWarning).toBeUndefined();
  });
});
