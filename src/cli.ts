import * as path from 'node:path';
import { collectProjectContext } from './collector.js';
import { runDiagnosis } from './index.js';
import { runFix } from './fixer.js';
import { renderTerminalReport, renderFixSummary } from './reporters/terminal-reporter.js';
import { renderJsonReport } from './reporters/json-reporter.js';

export { renderTerminalReport, renderFixSummary } from './reporters/terminal-reporter.js';
export { renderJsonReport } from './reporters/json-reporter.js';

export interface CliIo {
  stdout?: (msg: string) => void;
  stderr?: (msg: string) => void;
}

export async function runCli(argv: string[], io?: CliIo): Promise<number> {
  const stdout = io?.stdout ?? ((msg: string) => process.stdout.write(msg + '\n'));
  const stderr = io?.stderr ?? ((msg: string) => process.stderr.write(msg + '\n'));

  let targetPath = process.cwd();
  let jsonOutput = false;
  let strict = false;
  let autoFix = false;

  for (const arg of argv) {
    if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--fix') {
      autoFix = true;
    } else if (arg === '--help' || arg === '-h') {
      stdout(`Usage: agy-doctor [path] [options]

Antigravity Project Readiness & Health Check CLI

Options:
  --fix      Automatically fix missing files, skills sections, and labels
  --json     Output results in JSON format
  --strict   Exit with non-zero code if any check warns or fails
  -h, --help Show this help message
`);
      return 0;
    } else if (!arg.startsWith('-')) {
      targetPath = path.resolve(arg);
    }
  }

  try {
    let context = await collectProjectContext(targetPath);
    let report = runDiagnosis(context, { strict });

    if (autoFix && (report.summary.warn > 0 || report.summary.fail > 0)) {
      const fixResults = await runFix(targetPath, report);
      if (!jsonOutput) {
        stdout(renderFixSummary(fixResults));
      }

      // Re-collect and re-diagnose after fixing
      context = await collectProjectContext(targetPath);
      report = runDiagnosis(context, { strict });
    }

    if (jsonOutput) {
      stdout(renderJsonReport(report));
    } else {
      stdout(renderTerminalReport(report));
    }

    if (strict && (report.summary.fail > 0 || report.summary.warn > 0)) {
      return 1;
    }

    if (report.summary.fail > 0) {
      return 1;
    }

    return 0;
  } catch (error) {
    stderr(`Error running agy-doctor: ${(error as Error).message}`);
    return 1;
  }
}
