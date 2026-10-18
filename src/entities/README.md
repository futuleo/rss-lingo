# Entities

The `entities` layer (FSD): domain data models and repositories.

Planned entities:

- `feed` — RSS feed (id, title, url, ...);
- `article` — article (guid, title, content, date, "saved" flag);
- `translation` — cached article translations (per article, language, provider, model);
- `ai-provider` — AI provider configuration (preset, baseUrl, model, API key).

Storage: expo-sqlite (on-device local database).
