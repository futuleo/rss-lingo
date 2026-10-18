# RSS Lingo

A mobile RSS reader that teaches you a language: read your feeds, translate articles with your own AI key (BYOK).

## Key features

- **Direct RSS feeds** — add any RSS URL and read the latest articles.
- **Local-first storage** — feeds, articles, and translations live in `expo-sqlite` on your device.
- **Comfortable reader** — article content rendered in a themed WebView for clean reading.
- **Save what matters** — save articles to keep them forever. Retention automatically prunes only the newest 50 non-saved articles per feed; saved articles are never pruned.
- **AI translation (planned)** — translate whole articles with your own AI provider API key; supports OpenAI, Anthropic, Gemini, and extensible adapters (Phase 3).
- **Multilingual UI** — interface available in English, Russian, and Finnish via `i18next`.

## Architecture

RSS Lingo is built with **React Native + Expo SDK 58** and **TypeScript strict**.

The codebase follows **Feature-Sliced Design** layered from top to bottom:

```
app → pages → widgets → features → entities → shared
```

> Note: the root `app/` directory is **not** an FSD layer. It is a thin `expo-router` file-based routing adapter at the repo root. All providers, initialization, and FSD app-layer code live in `src/app/providers`.

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm start     # Expo Dev Tools
npm run ios   # iOS simulator
npm run android # Android emulator
npm run web   # web preview
```

### Available scripts

| Script      | Description                                   |
| ----------- | --------------------------------------------- |
| `start`     | Start Expo Dev Tools                          |
| `ios`       | Start on iOS simulator                        |
| `android`   | Start on Android emulator                     |
| `web`       | Start web preview                             |
| `typecheck` | Run TypeScript with `--noEmit`                |
| `lint`      | Run ESLint                                    |
| `test`      | Run Jest test suite                           |
| `smoke`     | Run RSS smoke tests (`scripts/smoke-rss.mjs`) |
| `format`    | Format code with Prettier                     |

## Project structure

```
app/                         # expo-router route adapter (no app logic)
src/
  app/providers/             # FSD app layer: theme, i18n, DB init providers
  pages/                     # screens: feed list, article reader, settings
  widgets/                   # composition blocks: article card, reader view, translation panel
  features/                  # scenarios: add-feed, translate-article, manage-providers, refresh-feeds
  entities/                  # feed, article, translation, ai-provider (+ repositories + hooks)
  shared/                    # ui, theme, i18n, lib (rss parser, db, dates, hooks), api/ai (adapters)
docs/
  PLAN.md                    # product plan and roadmap
```

## Roadmap

See [`docs/PLAN.md`](docs/PLAN.md) for the full plan.

| Phase | Status     | Focus                                                 |
| ----- | ---------- | ----------------------------------------------------- |
| 0     | ✅ Done    | Foundation: Expo, TypeScript, FSD, theme, i18n        |
| 1     | ✅ Done    | Data: SQLite, RSS parser, refresh, retention          |
| 2     | ✅ Done    | Reading UI: feeds, reader, save/unsave                |
| 3     | 🚧 Next    | Translation with BYOK AI provider settings            |
| 4     | ⏳ Planned | Polish: dark theme, error/empty states, feed deletion |

## License

MIT. See [`LICENSE`](LICENSE) for details.
