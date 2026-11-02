# agy-doctor

A diagnostic tool and readiness checker for projects collaborating with Antigravity AI agents and engineering skills.

## Language

**Project Context**:
An in-memory snapshot of a target workspace's files, configuration, git remote, and environment facts collected for inspection.
_Avoid_: Environment, State, Target info

**Readiness Dimension**:
A high-level category evaluating a distinct aspect of agent readiness (Rule, Domain, or Workflow).
_Avoid_: Category, Dimension group, Metric

**Rule**:
An isolated, deterministic check that evaluates the Project Context against a single readiness criterion.
_Avoid_: Check, Test, Validator, Inspection

**Rule Result**:
The outcome of a single Rule evaluation, expressing a status (`pass`, `warn`, or `fail`), an explanation, and optional remediation guidance.
_Avoid_: Check result, Report item, Diagnostic

**Remediation**:
Actionable guidance or shell commands provided to help the user resolve a warning or failure.
_Avoid_: Fix, Solution, Advice

**Readiness Score**:
The aggregate summary representing how prepared a project is for autonomous AI Agent collaboration.
_Avoid_: Health score, Compliance score, Grade
