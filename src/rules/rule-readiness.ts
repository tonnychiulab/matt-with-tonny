import type { Rule, ProjectContext, RuleResult } from '../types.js';

export const ruleAgentDoc: Rule = {
  id: 'rule-agent-doc',
  dimension: 'rule',
  title: 'Root Agent Instruction File',
  check(context: ProjectContext): RuleResult {
    if (context.agentDoc.filename) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: `Found root agent instruction file (${context.agentDoc.filename}).`,
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'fail',
      message: 'No AGENTS.md or CLAUDE.md found at repository root.',
      remediation: 'Create an AGENTS.md or CLAUDE.md file in the project root to provide agent guidance.',
    };
  },
};

export const ruleAgentSkills: Rule = {
  id: 'rule-agent-skills',
  dimension: 'rule',
  title: 'Agent Skills Configuration Block',
  check(context: ProjectContext): RuleResult {
    if (!context.agentDoc.filename) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'fail',
        message: 'Cannot verify skills section because no root agent doc exists.',
        remediation: 'Create an AGENTS.md file and include the "## Agent skills" section.',
      };
    }

    if (context.agentDoc.hasSkillsSection) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: `Found "## Agent skills" block in ${context.agentDoc.filename}.`,
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'warn',
      message: `Missing "## Agent skills" block in ${context.agentDoc.filename}.`,
      remediation: `Add '## Agent skills' section to ${context.agentDoc.filename} (run /setup-matt-pocock-skills).`,
    };
  },
};

export const ruleReadinessRules: Rule[] = [ruleAgentDoc, ruleAgentSkills];
