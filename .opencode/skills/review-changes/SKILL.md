---
name: Review Changes
description: Review the current repository changes for bugs and regressions without modifying files
---

Review the current changes without editing files. Prefer a read-only `reviewer` subagent when available; otherwise inspect the diff and affected code yourself. Prioritize correctness, security, data loss, compatibility, and missing tests. Report actionable findings first, in severity order, with file and line references. If there are no findings, say so and mention important checks that could not be run. Do not fix findings unless the user separately asks for implementation.
