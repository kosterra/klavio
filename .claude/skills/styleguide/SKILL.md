---
name: styleguide
description: Klavio's style guide – how every screen, component, text, illustration and e-mail looks, reads and behaves (phone and tablet first, Kids and Classic, light and dark, WCAG AA, Swiss German and English copy, own comic artwork, Mantine + CSS modules + the --klavio-* tokens). Use whenever creating or changing anything learners, parents, visitors or admins see – pages, components, CSS, texts/translations, icons, illustrations, worlds, e-mails, the landing page – and check its checklist before committing such work.
---

# Klavio style guide

Klavio is used **on a phone or tablet standing on the piano's music stand, about
50 cm away, operated with one finger** – by children who may not read yet and by
adults. Everything below follows from that. When in doubt: bigger, calmer, clearer.

## 1. Principles

1. **Phone and tablet first.** Design for 390 × 844 (phone upright), 844 × 390
   (phone sideways) and 1180 × 820 (tablet on the stand) before desktop.
2. **One finger, from a distance.** Large type and targets, nothing that needs
   hovering, precise dragging or a keyboard.
3. **Playful for Kids, calm for Classic** – same content, two looks (section 3).
4. **No pressure, no dark patterns.** Rewards only add up (XP never drops); a missed
   day resets the streak and nothing else. No countdowns, no nagging, no ads.
5. **Privacy is visible.** Audio stays on the device – say so where the microphone
   is used. Nothing loads from other servers (fonts, images, scripts are bundled).
6. **Own artwork only.** Every illustration is drawn for Klavio. No third-party
   characters, logos, songs under copyright or stock images.

## 2. Building blocks

- **Mantine** components with the theme in `client/src/theme/theme.ts`; styles in
  **CSS modules** next to the component (`Foo.module.css`). Inline `style` only
  for computed values (positions, sizes, CSS variables).
- **Colours come from tokens, never hard-coded hex** in components:
  - Mantine palette variables (`var(--mantine-color-indigo-7)`), `primaryColor`
    (Kids: indigo, shade 7; Classic: blue, shade 8 – white text ≈ 5:1);
  - app tokens `--klavio-*` in `client/src/theme/global.css`, each with a light and
    a dark value (surface, bg, road, fog, locked, danger, comic line …). **A new
    colour that differs between light and dark becomes a new `--klavio-*` token
    with both values.**
  - Exceptions: fixed artwork colours inside illustrations (e.g. wood, skin) and
    e-mail HTML (mail clients know no variables).
- **Chapter colours**: `chapterVars(color)` sets `--chapter-color/-light/-dark`;
  world art and backgrounds use only those plus `--world-hill`, `--world-hill-2`.
- **Type**: Nunito Variable (bundled), headings weight 800. Font sizes are the
  theme's (`xs` 0.875rem … `xl` 1.6rem) – body text never below `sm` (1rem) for
  learners; `xs` only for meta information.
- **Sizes**: Buttons, inputs, switches default to `lg`, action icons `xl`. Keep the
  defaults in learner screens; `md` is fine in admin and settings forms.
- **Radius**: cards `lg`, hero/stage panels and the learning path `xl`, buttons and
  inputs `md` (theme default). Pills (badges, counters) `999px`.
- **Icons**: `@tabler/icons-react` only, `aria-hidden` when next to text, sizes
  18–24 in text, 26–40 in icon tiles.

## 3. Kids and Classic

| | Kids | Classic |
|---|---|---|
| Look | warm background with doodles, colourful worlds, comic stage | calm background (`--klavio-bg-classic`) with the colour fields at half strength and faint doodles (`--klavio-doodles-calm`), fewer decorations |
| Mascot | the profile's figure everywhere, speech bubbles | figure only for feedback, text beside it |
| Text | short sentences, one idea each, read aloud («Klavi liest vor») | complete but concise |
| Hints | next key always marked | marked after a mistake |

Content, routes and logic are the same – the mode only changes presentation. Check
every learner screen in both modes.

**Worlds** are separate from the mode: the colourful kids' worlds, or «Die Reise»
(chosen from the age admins set). New chapters need an entry in both sets
(`client/src/lesson/worlds.ts`, art in `WorldScenery.tsx`, `Landmarks.tsx`,
`journeyArt.tsx`).

## 4. Illustrations

- **Comic style**: flat colours, dark outline `var(--klavio-comic-line)` 3 px
  (2 px for details), round joins, one white highlight (`rgb(255 255 255 / 55%)`).
- Inline SVG in React, sized by `viewBox`; colours from chapter variables so a
  drawing fits every world and both colour schemes. `aria-hidden` unless it carries
  information – then `role="img"` with an `aria-label`.
- Landmarks: 180 × 150 viewBox, ground at y ≈ 126, name sign below. Scenery tiles:
  40 px high, repeating.
- Klavi (the mascot, `Mascot.tsx`) and the figures keep their proportions and
  moods (`happy`, `cheer`, `think`, `listen`); don't redraw them ad hoc.

## 5. Layout and responsiveness

- Breakpoints in use: `36em` (phones), `48em` (tablets), and **`max-height: 32em`
  for phones held sideways** – check that one too.
- Use `svh`/`dvh` for heights that depend on the screen (`100dvh` pages,
  `max(96px, min(…px, 36svh))` keyboards); never fixed heights that can push the
  main action off screen.
- **Main action visible without scrolling** on a phone in both orientations; when
  a page is long, the important part comes first.
- Containers: content max-width ~1100 px; reading text ≤ ~70 characters per line.
- **Touch targets ≥ 44 × 44 px**; playable piano keys ≥ 36 px wide (the keyboard
  scrolls sideways on phones, see `PianoKeyboard`).
- **Never block scrolling**: no `touch-action: none` on anything that can cover a
  phone screen. Touch input that also has to allow scrolling acts on a tap (lift
  without moving), not on touch-down – as the on-screen keyboard does.
- In lessons the keyboard is **docked** (`<VirtualKeyboard dock>`, sticky bottom);
  its parent must be the tall exercise container, not a wrapper of its own size.
- Dialogs are full-screen on phones (global rule); forms inside them scroll.
- Long labels wrap instead of being cut: segmented controls wrap (global rule);
  button groups with `grow` use `preventGrowOverflow={false}`; no `white-space:
  nowrap` on translatable text unless it is a single short word.
- A new step of a flow starts at the top of the page (scroll to top on change).

## 6. Text and translations

- Every visible text lives in **both** `client/src/i18n/de-CH.json` and `en.json`,
  same keys, same `{{placeholders}}`; plurals with `_one`/`_other`. Values are
  strings only – lists as numbered keys (`"1"`, `"2"` …), never arrays
  (`i18n.test.ts` checks this).
- **German is Swiss German spelling: never «ß»** (write «ss»), quotation marks
  «…», informal **du** for learners and parents. English: British spelling
  (colour, licence), quotation marks «…» or “…” as in the existing texts.
- Tone: warm, encouraging, concrete. Mistakes are hints («Das war D – versuch es
  nochmals»), never blame. No exclamation-mark cascades, no shouting in capitals
  (uppercase only via CSS for small kickers).
- Kids texts: short, one instruction per sentence, the action word first
  («Finde das C»). Anything a child must understand gets a `say` text for
  «Klavi liest vor».
- Numbers and dates with `Intl` in the app language; minus sign `−` for negative
  values in display text.
- Name the app only via `APP_CONFIG.name` (it may change).

## 7. Accessibility

- **WCAG 2.1 AA**: text contrast ≥ 4.5:1 (large text ≥ 3:1) in light **and** dark.
  Muted text uses `c="dimmed"` (overridden to gray-7 / dark-1 for contrast); check
  coloured badges and labels – orange and yellow fail easily on white.
- Every interactive element has an accessible name; icon-only buttons get
  `aria-label` (translated). Decorative elements are `aria-hidden`.
- Headings in order per page (one `h1`); landmarks (`header`, `nav`, `main`,
  `footer`); live regions (`aria-live="polite"`) for feedback that appears.
- Keyboard: everything reachable, visible focus (`:focus-visible` outline).
- Motion: every animation has a `@media (prefers-reduced-motion: reduce)` fallback;
  nothing flashes more than 3× per second.
- New screens or states get an `audit(page)` (axe) in an e2e test.

## 8. Colour schemes

Light and dark (and «automatic») are both first-class. Use tokens so dark mode
follows by itself; when adding `:global([data-mantine-color-scheme='dark'])`
overrides, keep specificity in mind (a dark rule can outrank a `.foggy`-style state
class – add the state to the dark rule too). Check every new screen in dark.

## 9. E-mails

E-mails come only from `shared/src/mail/templates.ts` (`renderMail`): table layout,
inline styles, Klavio header with the logo, Klavi beside the heading, the code in
the dashed box, footer with the instance address. Pictures are attached inline
(`cid:`) – never loaded from a server. Admins change only the words; the layout
stays. Test new mails in Mailpit at phone width.

## 10. Checklist before committing UI work

- [ ] Phone upright (390 × 844), phone sideways (844 × 390), tablet (1180 × 820):
      nothing cut off, main action reachable, no horizontal page scroll.
- [ ] Kids **and** Classic; light **and** dark.
- [ ] Touch: scrolling works everywhere, nothing reacts to a scroll gesture.
- [ ] Both languages complete (`npx vitest run --root client src/i18n`), no «ß».
- [ ] Colours from tokens; contrast AA; axe audit in an e2e test for new screens.
- [ ] Reduced motion respected; icons `aria-hidden` or labelled.
- [ ] «Was ist neu» line if learners, parents or admins notice it (whats-new skill).
