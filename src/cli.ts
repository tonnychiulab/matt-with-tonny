import * as path from 'node:path';
import { collectProjectContext } from './collector.js';
import { runDiagnosis } from './index.js';
import { renderTerminalReport } from './reporters/terminal-reporter.js';
import { renderJsonReport } from './reporters/json-reporter.js';

export { renderTerminalReport } from './reporters/terminal-reporter.js';
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

  for (const arg of argv) {
    if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--help' || arg === '-h') {
      stdout(`Usage: agy-doctor [path] [options]

Antigravity Project Readiness & Health Check CLI

Options:
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
    const context = await collectProjectContext(targetPath);
    const report = runDiagnosis(context, { strict });

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
