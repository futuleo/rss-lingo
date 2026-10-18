# RSS Lingo — Product Plan

A mobile RSS reader with article translation via the user's own AI models (BYOK — bring your own key).

## Product essence

The user adds RSS feeds (by direct URL), reads fresh articles in a comfortable reader, and can translate an article into a selected language using an external AI provider connected with **their own API key**. All data (feeds, articles, translations) is stored locally on the device.

## Fixed decisions

| Area         | Decision                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| Stack        | React Native + Expo (SDK 58), TypeScript strict                               |
| Navigation   | expo-router (routes in root `app/`, providers in `src/app/providers`)         |
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

> Root `app/` is **not** an FSD layer. It is a thin expo-router file-based routing
> adapter at the repo root (expo-router requirement). It contains only route files
> that parse params and delegate to `@pages/*`. All providers/init live in the FSD
> `app` layer at `src/app/providers`.

- `app/` — expo-router route adapter (no app logic)
- `src/app/providers` — FSD app layer: providers (theme, i18n, DB init)
- `src/pages` — screens: feed list, article reader, settings
- `src/widgets` — composition blocks (article card, reader view, translation panel)
- `src/features` — scenarios: `add-feed` (fetch-first URL validation + persistence), `translate-article`, `manage-providers`, `refresh-feeds`
- `src/entities` — `feed`, `article`, `translation`, `ai-provider` (+ repositories + hooks)
- `src/shared` — `ui`, `theme`, `i18n`, `lib` (rss parser, db, dates, hooks), `api/ai` (adapters)

## Phases

### Phase 0 — Foundation ✅ (done)

Expo + TypeScript scaffold, ESLint/Prettier, FSD structure, design tokens and theme (light/dark), base UI primitives, i18n (ru/en/fi).

### Phase 1 — Data ✅ (done)

expo-sqlite migrations; feed/article repositories; RSS parser (fast-xml-parser); refresh logic; retention: newest 50 non-saved articles per feed, saved ones are never pruned.

### Phase 2 — Reading UI 🚧 (in progress)

Feed and article lists, add feed by URL, pull-to-refresh, article screen (content rendered via WebView styled to the theme), save/unsave article toggle.

### Phase 3 — Translation (BYOK) 🚧 (in progress)

Settings screen: provider, model, API key, translation language; three provider adapters; translation with paragraph-level chunking; translation cache in the DB; "Original / Translation" toggle.

### Phase 4 — Polish

System dark theme, error/empty states, feed deletion, complete fi/ru/en texts, saved articles. After MVP: designer skills / UI polish pass.

### Release requirements (stores)

- **Privacy policy**: a `PRIVACY.md` in this public repo served via GitHub (raw/Pages URL is accepted by both stores). Content: all user data (feeds, articles, translations, settings, API keys) stays on-device (expo-sqlite + expo-secure-store); when translating, article text is sent by the app directly to the user-chosen AI provider (OpenAI/Anthropic/Google); no servers, no accounts, no analytics, no tracking; contact email.
- **Google Play Data Safety form**: disclose that article text is shared with the user-configured third-party AI provider; no data collected by us.
- **Apple App Review notes**: explain the BYOK model (app is a client for the user's own AI provider account; no tokens/credits are sold by us).

## Product vision & roadmap### v1.0 — MVP (Phases 0–4)

Read your feeds, read articles comfortably, translate an article with your own AI key. Usable for a single owner on daily basis.

### v1.1 — Language value (already scaffolded by the data model)

- Per-paragraph tap-to-translate (read in original, tap what you don't understand)
- "Explain this phrase/grammar" via the same provider abstraction
- Translation language per user + per feed override

### v2 — Trainer (saved-flag → vocabulary)

- Saved articles become learning material: pick unknown words → personal dictionary
- SRS (spaced repetition) cards generated from saved words and phrases
- Translation cache keyed by language/provider makes re-practice offline-friendly

### v3 — Ecosystem

- Reading statistics and level estimation (which feeds stretch you)
- Source recommendations matched to your language level
- Anki export; optional cloud sync (explicit opt-in only)
- Local LLM support (OpenAI-compatible endpoint on device/LAN) for fully offline learning

## Backlog (post-MVP)

- Automatic RSS discovery from a site URL
- Background feed refresh
- Per-paragraph tap-to-translate
- "Saved articles" screen
- Reading statistics
- Designer skills / dedicated UI polish pass after MVP is functional
