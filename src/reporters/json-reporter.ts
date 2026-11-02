import type { DiagnosisReport } from '../types.js';

export function renderJsonReport(report: DiagnosisReport): string {
  return JSON.stringify(report, null, 2);
}
