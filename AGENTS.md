# Agent guidance

- This repository currently contains OpenCode configuration, not an application: there are no app sources, manifests, or test/build scripts. Check again before assuming commands or adding a framework just to run checks.
- `.opencode/opencode.jsonc` selects the `orchestrator`; agent roles and their workflow are defined in `.opencode/agents/`. Keep these as the source of truth for agent-specific behavior.
- The configured default model is `opencode-go/glm-5.3-flash`. Go usage is shared across agent profiles and tracked per model; do not switch providers/models or enable pay-as-you-go without user approval. Follow the configured one-time escalation limits in the agent profiles.
- Keep changes focused. Ask before destructive or hard-to-reverse actions, publishing/deploying, or changing credentials; do not commit or push unless explicitly asked.
