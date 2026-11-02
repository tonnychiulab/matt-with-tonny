import type { ProjectContext, DiagnosisOptions, DiagnosisReport } from './types.js';

export * from './types.js';

export function runDiagnosis(
  context: ProjectContext,
  _options?: DiagnosisOptions
): DiagnosisReport {
  return {
    targetPath: context.targetPath,
    timestamp: new Date().toISOString(),
    score: 100,
    summary: {
      pass: 0,
      warn: 0,
      fail: 0,
      total: 0,
    },
    results: [],
  };
}
