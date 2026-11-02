import type { Rule, ProjectContext, RuleResult } from '../types.js';

export const ruleDomainGlossary: Rule = {
  id: 'domain-glossary',
  dimension: 'domain',
  title: 'Domain Glossary',
  check(context: ProjectContext): RuleResult {
    if (context.domain.hasGlossary) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: 'Found GLOSSARY.md defining domain concepts.',
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'warn',
      message: 'Missing GLOSSARY.md at project root.',
      remediation: 'Create a GLOSSARY.md in the project root to prevent domain vocabulary drift (or run /domain-modeling).',
    };
  },
};

export const ruleDomainAdr: Rule = {
  id: 'domain-adr',
  dimension: 'domain',
  title: 'Architecture Decision Records (ADRs)',
  check(context: ProjectContext): RuleResult {
    if (context.domain.adrCount > 0) {
      return {
        ruleId: this.id,
        dimension: this.dimension,
        title: this.title,
        status: 'pass',
        message: `Found ${context.domain.adrCount} Architecture Decision Record(s) in docs/adr/.`,
      };
    }

    return {
      ruleId: this.id,
      dimension: this.dimension,
      title: this.title,
      status: 'warn',
      message: 'No Architecture Decision Records found in docs/adr/.',
      remediation: 'Create docs/adr/ and record significant architectural choices (e.g. docs/adr/0001-slug.md).',
    };
  },
};

export const domainReadinessRules: Rule[] = [ruleDomainGlossary, ruleDomainAdr];
