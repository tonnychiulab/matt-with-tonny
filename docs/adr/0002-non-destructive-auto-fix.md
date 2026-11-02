# Non-Destructive, Idempotent Automated Remediation

We decided that the `--fix` remediation engine must operate strictly under non-destructive and idempotent guarantees. Fixers will create missing required files (such as `AGENTS.md`, `GLOSSARY.md`, and initial ADR templates) and create missing GitHub triage labels, but will never overwrite existing user files.

This decision prioritizes developer trust and repository safety over aggressive mutation, ensuring that running `agy-doctor --fix` can never cause accidental data loss or clobber existing project configurations.
