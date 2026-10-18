# RSS Lingo — Product Plan

A mobile RSS reader with article translation via the user's own AI models (BYOK — bring your own key).

## Product essence

The user adds RSS feeds (by direct URL), reads fresh articles in a comfortable reader, and can translate an article into a selected language using an external AI provider connected with **their own API key**. All data (feeds, articles, translations) is stored locally on the device.

## Fixed decisions

| Area         | Decision                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| Stack        | React Native + Expo (SDK 58), TypeScript strict                               |
| Navigation   | expo-router (routes in `src/app`)                                             |
| Architecture | Feature-Sliced Design: `app → pages → widgets → features → entities → shared` |
| DB           | expo-sqlite — feeds, articles, translations                                   |
| API keys     | expo-secure-store (secure storage)                                            |
| AI           | Presets: OpenAI, Anthropic, Gemini + extensible provider abstraction          |
| Translation  | Whole-article "Original / Translation" toggle; translations cached in the DB  |
| Sources      | Direct RSS URL only                                                           |
| UI language  | i18next: Russian, English, Finnish (easy to add more)                         |
| Retention    | Last 50 articles per feed; articles marked as "saved" are never pruned        |

## AI abstraction

A single provider interface + registry:

```ts
interface AiProvider {
  id: string;
  translate(params: {
    text: string;
    targetLang: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    signal?: AbortSignal;
  }): Promise<string>;
}
```

MVP adapters: OpenAI (Chat Completions), Anthropic (Messages), Google Gemini (generateContent). Adding a new provider = one adapter file + a registry entry; UI and features stay untouched.

## Structure (FSD)

- `src/app` — expo-router routes, providers (theme, i18n, DB init)
- `src/pages` — screens: feed list, article reader, settings
- `src/widgets` — composition blocks (article card, translation panel)
- `src/features` — scenarios: `add-feed`, `translate-article`, `manage-providers`, `refresh-feeds`
- `src/entities` — `feed`, `article`, `translation`, `ai-provider` (+ repositories)
- `src/shared` — `ui`, `theme`, `i18n`, `lib` (rss parser, db, dates), `api/ai` (adapters)

## Phases

### Phase 0 — Foundation ✅ (done)

Expo + TypeScript scaffold, ESLint/Prettier, FSD structure, design tokens and theme (light/dark), base UI primitives, i18n (ru/en/fi).

### Phase 1 — Data ✅ (done)

expo-sqlite migrations; feed/article repositories; RSS parser (fast-xml-parser); refresh logic; retention: newest 50 non-saved articles per feed, saved ones are never pruned.

### Phase 2 — Reading UI ✅ (done)

Feed and article lists, add feed by URL, pull-to-refresh, article screen (content rendered via WebView styled to the theme), save/unsave article toggle.

### Phase 3 — Translation (BYOK)

Settings screen: provider, model, API key, translation language; three provider adapters; translation with paragraph-level chunking; translation cache in the DB; "Original / Translation" toggle.

### Phase 4 — Polish

System dark theme, error/empty states, feed deletion, complete fi/ru/en texts, saved articles.

## Backlog (post-MVP)

- Automatic RSS discovery from a site URL
- Background feed refresh
- Per-paragraph tap-to-translate
- "Saved articles" screen
- Reading statistics
