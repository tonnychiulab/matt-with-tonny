import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ConfigLoadResult, ProjectConfig } from './types.js';

export function loadConfig(configPath?: string, projectRoot?: string): ConfigLoadResult {
  const root = projectRoot ? path.resolve(projectRoot) : process.cwd();

  let resolvedConfigPath: string | undefined;

  if (configPath) {
    resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath);
    if (!fs.existsSync(resolvedConfigPath)) {
      return {
        config: {},
        warning: `Configuration file not found: ${resolvedConfigPath}`,
      };
    }
  } else {
    const defaultCandidates = ['.agydoctorrc.json', '.agydoctorrc'];
    for (const candidate of defaultCandidates) {
      const p = path.join(root, candidate);
      if (fs.existsSync(p)) {
        resolvedConfigPath = p;
        break;
      }
    }
  }

  if (!resolvedConfigPath) {
    return {
      config: {},
    };
  }

  try {
    const raw = fs.readFileSync(resolvedConfigPath, 'utf-8');
    const parsed = JSON.parse(raw) as ProjectConfig;

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        config: {},
        source: resolvedConfigPath,
        warning: `Invalid configuration: expected an object at ${resolvedConfigPath}`,
      };
    }

    return {
      config: parsed,
      source: resolvedConfigPath,
    };
  } catch (err: any) {
    return {
      config: {},
      source: resolvedConfigPath,
      warning: `Failed to parse configuration: ${err?.message || String(err)}`,
    };
  }
}
