import type { DiagnosisReport, RuleResult } from '../types.js';

export function renderTerminalReport(report: DiagnosisReport): string {
  const lines: string[] = [];

  const dimColor = (text: string) => `\x1b[2m${text}\x1b[0m`;
  const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
  const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
  const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
  const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
  const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;

  lines.push('');
  lines.push(bold(cyan('╭─────────────────────────────────────────────────────────────╮')));
  lines.push(bold(cyan('│            Antigravity Project Doctor (agy-doctor)          │')));
  lines.push(bold(cyan('╰─────────────────────────────────────────────────────────────╯')));
  lines.push('');
  lines.push(`Target: ${report.targetPath}`);
  lines.push(
    `Readiness Score: ${bold(
      report.score >= 80 ? green(`${report.score}/100`) : report.score >= 50 ? yellow(`${report.score}/100`) : red(`${report.score}/100`)
    )}`
  );
  lines.push(
    `Summary: ${green(`Pass: ${report.summary.pass}`)} | ${yellow(
      `Warn: ${report.summary.warn}`
    )} | ${red(`Fail: ${report.summary.fail}`)} (Total: ${report.summary.total})`
  );
  lines.push('');
  lines.push(bold('── Diagnostic Checks ─────────────────────────────────────────'));

  const dimensions = ['rule', 'domain', 'workflow'] as const;
  const dimensionTitles = {
    rule: 'Rule Readiness (Instructions & Skills)',
    domain: 'Domain Readiness (Glossary & ADRs)',
    workflow: 'Workflow Readiness (Git, CLI, Labels)',
  };

  for (const dim of dimensions) {
    const dimResults = report.results.filter((r) => r.dimension === dim);
    if (dimResults.length === 0) continue;

    lines.push('');
    lines.push(dimColor(`[${dimensionTitles[dim]}]`));

    for (const r of dimResults) {
      let icon = green('✓');
      if (r.status === 'warn') icon = yellow('▲');
      if (r.status === 'fail') icon = red('✖');

      lines.push(`  ${icon} ${bold(r.title)}: ${r.message}`);
    }
  }

  const issues = report.results.filter(
    (r): r is RuleResult & { remediation: string } =>
      (r.status === 'warn' || r.status === 'fail') && Boolean(r.remediation)
  );

  if (issues.length > 0) {
    lines.push('');
    lines.push(bold('── Actionable Remediations ───────────────────────────────────'));
    for (const issue of issues) {
      lines.push(`  • ${bold(issue.title)}:`);
      lines.push(`    ${yellow(issue.remediation)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
