import type { DiagnosisReport, FixResult, FixOptions } from './types.js';
import { fixFilesystemIssues } from './fixers/filesystem-fixer.js';
import { fixWorkflowLabels } from './fixers/workflow-fixer.js';

export async function runFix(
  targetDir: string,
  report: DiagnosisReport,
  _options?: FixOptions
): Promise<FixResult[]> {
  const fsResults = fixFilesystemIssues(targetDir, report);
  const wfResults = fixWorkflowLabels(targetDir, report);

  return [...fsResults, ...wfResults];
}
