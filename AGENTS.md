# Agent guidance

- **Language policy (strict): all code, comments, commit messages, README files, and docs in this repository must be written in English only.** The only exceptions are i18n translation resources (e.g. `src/shared/i18n/locales/ru.json`) which contain user-facing translations by design. Never introduce non-English text into code, comments, docs, or commit messages.
- **Commit discipline (strict): commit early and often. Never accumulate uncommitted work — a checkpoint commit every time ~10 files are touched, and always commit before finishing a task.** Never report a completed milestone without its commits landed. Use `wip(scope): ...` checkpoint commits for in-progress states; rewrite nothing, push nothing without the user's ask.
- Work on feature branches; commit each meaningful stage. Merge to `main` and push only when the user asks.
- This repository currently contains OpenCode configuration, not an application: there are no app sources, manifests, or test/build scripts. Check again before assuming commands or adding a framework just to run checks.
- `.opencode/opencode.jsonc` selects the `orchestrator`; agent roles and their workflow are defined in `.opencode/agents/`. Keep these as the source of truth for agent-specific behavior.
- The configured default model is `opencode-go/glm-5.3-flash`. Go usage is shared across agent profiles and tracked per model; do not switch providers/models or enable pay-as-you-go without user approval. Follow the configured one-time escalation limits in the agent profiles.
- Keep changes focused. Ask before destructive or hard-to-reverse actions, publishing/deploying, or changing credentials; do not commit or push unless explicitly asked.
