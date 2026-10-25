---
name: Design System
description: The app's canonical visual language — how to apply theme tokens, typography, spacing, color, components, states, safe areas, touch targets, dark mode, and i18n when building or changing UI
---

# rss-lingo Design System

This is the single source of truth for how screens and components must look and behave. Apply it to every UI change. When in doubt, read the code, not your taste: tokens live in `src/shared/theme/tokens.ts`, primitives in `src/shared/ui/`.

> Repo rule: all code, comments, and user-facing strings are English in code; user-facing strings go through i18n (`src/shared/i18n`, locales ru/en/fi). Never hardcode a label in a component.

## Tokens (authoritative values)

Always consume tokens through the theme (`useTheme()` → `theme.spacing`, `theme.radii`, `theme.font`, `theme.weight`, `theme.colors`). Never hardcode raw numbers or hex colors in a screen/component.

- **spacing**: `xs=4` `s=8` `m=16` `l=24` `xl=32`
- **radii**: `s=8` `m=12` `l=16` `full=999`
- **font**: `title=24` `headline=18` `body=15` `caption=13`
- **weight**: `regular=400` `medium=500` `semibold=600` `bold=700`
- **colors** (semantic, light/dark pairs): `background` (screen), `surface` (card/raised), `text` (primary text), `textMuted` (secondary), `primary` (accent/CTA), `primaryText` (text on `primary`), `border` (dividers/outlines), `danger` (destructive).

If a genuinely new color is required, add it to BOTH palettes in `tokens.ts` and extend `ThemeColors` — never a one-off hex in a screen.

## Typography roles

- `title` — screen titles.
- `headline` — card titles, section headings, list item titles.
- `body` — primary content, article text, form values.
- `caption` — metadata (dates, authors, counts), always `textMuted`.

One primary heading per screen. Reading surfaces stay calm: body text on `background`, `textMuted` only for secondary info.

## Layout rules

- **Spacing rhythm**: use `s`/`m` for related items, `l`/`xl` for section boundaries. Consistent horizontal padding per screen (`m` or `l`), never mixed.
- **Cards** = `surface` background + `radius.m` + `border` outline, `spacing.m` inner padding.
- **Lists**: `spacing.s` between list items; card rows use `spacing.m` between content blocks inside the card.
- **Touch targets**: every tappable element ≥ 44pt on its smallest side. Icon buttons, chips, accordion headers, tab items all meet this.
- **Safe areas**: use `SafeAreaView` / `useSafeAreaInsets` for top/bottom inset. NEVER pad with a fixed `48pt` constant — that breaks on notched devices and landscape.
- **Keyboard**: inputs inside modals/screens use `KeyboardAvoidingView` (iOS) / `android:windowSoftInputMode` aware layout.

## Components (use these, don't reinvent)

- `Text` (`src/shared/ui/Text.tsx`) with a `variant` — no raw `<RNText>` with ad-hoc fontSize.
- `Button` (`src/shared/ui/Button.tsx`) `primary` (filled `primary`/`primaryText`) or `secondary` (transparent + border). Disabled = opacity 0.4, pressed = opacity 0.7.
- `EmptyState`, `SegmentedToggle` — reuse for their cases.

## States

Every async surface covers all four: **loading, error, empty, success**.
- Loading: non-janky placeholder or spinner, not a blank screen.
- Error: human-readable message + retry action; never expose raw tech error text.
- Empty: `EmptyState` with a clear next action.
- Destructive actions (delete feed, clear data) require confirmation.

## Dark mode

Every change must read correctly in BOTH palettes. Colors come only from `theme.colors` (which already switch by scheme). Verify contrast for text on `background`/`surface` and for `primaryText` on `primary`.

## Consistency checklist (run before finishing any UI change)

1. No hardcoded colors, sizes, or font values — all tokens via theme.
2. Touch targets ≥ 44pt.
3. Safe areas via insets, not fixed padding.
4. Loading/error/empty/success all present and human-readable.
5. Labels via i18n (ru/en/fi all natural); no hardcoded strings.
6. Dark and light both look correct.
7. Reuses existing primitives; new primitives go in `src/shared/ui/` and follow the same token rules.
