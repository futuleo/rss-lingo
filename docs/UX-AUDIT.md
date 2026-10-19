# UX audit (senior-reviewer, pre-navigation-redesign)

Verdict: not yet convenient for daily use. Screens are straightforward, but navigation is hidden and the path from adding a feed to reading takes guesswork.

## Recommended navigation (core decision)

- Bottom tabs: **Feeds | Saved | Settings**. Each tab gets its own stack: Feeds → feed articles → reader; Saved → reader; Settings → FAQ.
- Native stack headers and system back behavior for pushed screens. Reader pushes over the active tab's stack; hide the tab bar while reading.
- **Add feed stays a modal.**
- Settings as a TAB (not only a header gear): it is a dedicated setup page and must stay one tap away.

## Findings

- **HIGH — Navigation:** root stack hides all system headers; feeds offers only small saved/settings shortcuts; feed-article and reader screens have no visible back action; saved/settings/faq implement separate custom back buttons. Inconsistent navigation, no obvious exit from reading.
- **MEDIUM — First read:** adding a feed closes the modal and reloads the list, but does not take the user to the feed or an article. Add a clear "Open feed" next step.
- **MEDIUM — Feed articles error state:** `error` from useAsyncData is unused; after a load failure the screen can show "No articles yet" instead of error + retry.
- **MEDIUM — Reader/translation:** translation requires switching to the Translation tab before the Translate action appears; first-time setup then sends the user to Settings (provider, model, key, target language). Language options show EN/RU/FI — use full language names.
- **MEDIUM — Touch targets / safe areas / keyboard:** feeds icon buttons ~38pt (< 44pt); settings language chips too short; FAQ accordion headers under 44pt; several screens use fixed 48pt top padding instead of safe-area insets; add-feed modal has no keyboard-avoiding container.
- **LOW — Misc:** saved/settings/faq states are mostly covered; Finnish FAQ retains English technical terms ("Feed", "Base URL") — improve later; theme tokens support light/dark.

## Do this first

1. Add the three tabs + consistent native stack headers/back behavior.
2. After adding a feed, offer a clear "Open feed" next step; show real load errors on feed-article screens.
3. Fix safe-area and minimum touch-target sizing; test the add-feed modal with the keyboard open.
