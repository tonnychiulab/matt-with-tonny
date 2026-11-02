export type ReadinessDimension = 'rule' | 'domain' | 'workflow';

export type RuleStatus = 'pass' | 'warn' | 'fail';

export interface RuleResult {
  ruleId: string;
  dimension: ReadinessDimension;
  title: string;
  status: RuleStatus;
  message: string;
  remediation?: string;
}

export interface Rule {
  id: string;
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
  agentDoc: AgentDocContext;
  domain: DomainContext;
  workflow: WorkflowContext;
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
}

export interface DiagnosisOptions {
  strict?: boolean;
}
