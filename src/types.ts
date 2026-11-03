export type ReadinessDimension = 'rule' | 'domain' | 'workflow';

export type RuleStatus = 'pass' | 'warn' | 'fail';

export type BuiltinRuleId =
  | 'rule-agent-doc'
  | 'rule-agent-skills'
  | 'domain-glossary'
  | 'domain-adr'
  | 'workflow-git-remote'
  | 'workflow-gh-auth'
  | 'workflow-triage-labels';

export type RuleId = BuiltinRuleId | (string & {});

export type DeclarativePattern = 'file-exists' | 'content-matches' | 'file-not-exists';

export interface DeclarativeRuleConfig {
  id: RuleId;
  dimension?: ReadinessDimension;
  title: string;
  pattern: DeclarativePattern;
  path: string;
  match?: string;
  severity?: 'fail' | 'warn';
  remediation?: string;
}

export interface RuleOverrideConfig {
  enabled?: boolean;
  severity?: RuleStatus;
}

export interface ProjectConfig {
  rules?: DeclarativeRuleConfig[];
  overrides?: Partial<Record<BuiltinRuleId, RuleOverrideConfig>> & Record<string, RuleOverrideConfig>;
}

export interface ConfigLoadResult {
  config: ProjectConfig;
  source?: string;
  warning?: string;
}

export interface RuleResult {
  ruleId: RuleId;
  dimension: ReadinessDimension;
  title: string;
  status: RuleStatus;
  message: string;
  remediation?: string;
}

export interface Rule {
  id: RuleId;
  dimension: ReadinessDimension;
  title: string;
  check(context: ProjectContext): RuleResult;
}

export interface AgentDocContext {
  filename?: string;
  content?: string;
  hasSkillsSection: boolean;
}

export interface DomainContext {
  hasGlossary: boolean;
  adrCount: number;
}

export interface WorkflowContext {
  hasGitRemote: boolean;
  remoteUrl?: string;
  isGhAuthenticated: boolean;
  triageLabels: string[];
}

export interface ProjectContext {
  targetPath: string;
  files: string[];
  fileContents?: Record<string, string>;
  agentDoc: AgentDocContext;
  domain: DomainContext;
  workflow: WorkflowContext;
  config?: ProjectConfig;
  configWarning?: string;
}

export interface DiagnosisSummary {
  pass: number;
  warn: number;
  fail: number;
  total: number;
}

export interface DiagnosisReport {
  targetPath: string;
  timestamp: string;
  score: number;
  summary: DiagnosisSummary;
  results: RuleResult[];
  configWarning?: string;
}

export interface DiagnosisOptions {
  strict?: boolean;
}

export type FixStatus = 'applied' | 'skipped' | 'failed';

export interface FixResult {
  ruleId: RuleId;
  status: FixStatus;
  action: string;
  error?: string;
}

export interface FixOptions {
  dryRun?: boolean;
}
