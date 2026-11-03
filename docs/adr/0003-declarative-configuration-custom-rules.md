# Declarative Configuration and Custom Rules Over Executable Plugins

We decided to support custom diagnostic rules and rule overrides through a declarative JSON configuration file (`.agydoctorrc.json`) evaluated against `ProjectContext`, rather than loading external executable JavaScript/TypeScript plugin modules.

This decision trades the unrestricted logic of dynamic code plugins for total sandbox safety, deterministic pure execution without arbitrary code execution vulnerabilities, and seamless compatibility with ADR-0001's pure in-memory rule engine.
