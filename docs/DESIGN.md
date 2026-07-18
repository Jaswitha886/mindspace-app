# MindSpace — Design System ("Dusk")

Warm without earth-tones, soft without going clinical.

**The Visily export is gone, and is not the spec.** It was the authority until
2026-07-15, when the palette sampled from it (orange `#F09E54` / `#B85D0E`,
Nunito Sans) was rejected for reading as the warm-earthy wellness cliché. The 23
PNGs lived in `design folder/` and were deleted in the commit following
`2065cfd` — recover them from that commit's history if you ever need to look,
but do not re-derive the design from them.

Reference by token name, never raw hex (`src/app/globals.css`).

## The idea

Two directions are ruled out, and both rulings are load-bearing:

- **Warm earth** — terracotta, sage, apricot, and the old sampled orange.
- **Cool grey + a blue/indigo accent** — that is the uniform of clinical
  software, and this app must not feel like a patient portal.

That looks like a contradiction (no warm, no cool) and the resolution is the
whole system: **put the warmth in the neutrals, not the accent.** The off-white
page carries a faint plum wash instead of a beige or blue one, and the "black"
is a deep aubergine. Every surface inherits that warmth quietly, so the accent
is free to stay a rich plum rather than a product-blue. Gold is dusk's
counterpoint — sunset, not terracotta.

Generous rounding (16px cards) and plum-tinted shadows do most of the remaining
"soft" work: a grey shadow over a warm off-white is what makes a soft palette
look dirty, and without the rounding plum reads gothic.

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--brand` / `--brand-hover` | `#6D2E5B` / `#58254A` | primary button fill, white label (9.6:1) |
| `--brand-light` | `#B96AA0` | orchid — fills that carry no text |
| `--brand-ink` | `#7B3466` | plum as AA text: links, figures (7.4:1) |
| `--brand-tint` / `--brand-tint-2` | `#F7EDF4` / `#FCF7FA` | plum-wash cards, journal entries, active nav |
| `--brand-disabled` | `#D9BDD0` | disabled primary |
| `--teal` | `#8FB8BF` | the counsellor "check-ins" block (ink type) |
| `--success` / `--success-tint` / `--success-ink` | `#2E6B50` / `#E6F2EB` / `#1F4A37` | Active pill, success |
| `--gold` / `--gold-strong` / `--gold-ink` | `#F5E6C8` / `#E0A93F` / `#6B4E0A` | upcoming-appointment card, Pending chip |
| `--red` / `--red-light` / `--red-tint` / `--red-ink` | `#B3243F` / `#D9435F` / `#FBEBEE` / `#A81E38` | destructive, errors |
| `--ink` / `--ink-strong` / `--ink-secondary` / `--ink-muted` | `#3A2B3D` / `#241826` / `#5F4E63` / `#716275` | text neutrals (aubergine, never grey) |
| `--page` / `--surface` / `--sunken` / `--sunken-2` | `#FBF9FB` / `#FFFFFF` / `#F5F1F5` / `#FAF7FA` | page, cards, wells |
| `--border` / `--border-strong` | `#EBE3EC` / `#D3C6D4` | hairlines |
| severity (pill, white label) | mild `#2E6B50` · moderate `#8A5A00` · critical `#B3243F` | counsellor/admin only, always with a word |
| severity (`-fill`: bars, dots) | mild `#5FA37F` · moderate `#E0A93F` · critical `#D9435F` | marks carrying no text |
| charts | `#6D2E5B` `#B96AA0` `#4A4478` `#E0A93F` `#8FB8BF` | non-severity charts only |

`--ink-muted` is tuned to clear 4.5:1 on the **plum card** (4.9:1), not just on
white (5.7:1) — meta text lands on tinted cards constantly. A contrast audit
against real computed styles is the check that matters; re-run it after touching
tokens.

`--teal` is deliberately blue-leaning. A sage green here lands straight back in
the rejected palette.

## Dark mode

Every themed token is `light-dark(light, dark)` in one declaration, so the two
palettes sit on the same line and cannot drift apart. **Reference tokens by
name and both themes come free; hard-code a hex and you break one of them.**

Dark is a re-picked palette, not an inversion — plum stays plum and the
neutrals stay aubergine rather than sliding to grey. Two values have to move:

| Token | Why it moves |
|---|---|
| `--brand` `#6D2E5B` → `#9B4482` | a 9.6:1 deep plum is invisible on a dark page. The lighter mid-plum still carries a **white** label (5.9:1) and clears 3:1 against the page — which is why no button needed an `--on-brand` token. |
| `--chart-1`, `--chart-3` | a deep plum and a dark indigo both vanish on the dark page. |

**Severity is deliberately NOT themed.** `--sev-*` are fixed hexes in both
modes: it is clinical data, and "critical" must be the same red for a counsellor
in dark as for an admin in light. They already clear white-label AA and 3:1
against both pages.

Two more things that stay light on purpose:
- **The QR plate** (`bg-white`, `margin: 3`). A QR must be dark-modules-on-light
  with a light quiet zone — many readers won't decode an inverted one.
- **Shadows.** `box-shadow` isn't a `<color>`, so `light-dark()` can't reach
  inside it. It doesn't need to: in dark, elevation comes from `--surface`
  sitting lighter than `--page` plus the hairline border. A heavy drop shadow on
  near-black just reads as grime.

**Preference:** a `mindspace-theme` cookie, read in the root layout so
`data-theme` is in the first byte — no flash. *No cookie means no attribute*,
leaving `color-scheme: light dark` to follow the OS; that absence is what
"System" means, so the OS switching at sunset is followed rather than frozen.
`:root[data-theme]` only sets `color-scheme`, which is what every `light-dark()`
resolves from — and it steers the browser's own scrollbars and form controls too.

Hard rules:
- Severity never appears in student UI and is never conveyed by colour alone.
- **Severity has exactly one colour language app-wide — green/amber/red.**
  Import `SEVERITY_META` (`src/features/notes/severity-meta.ts`); never
  re-declare colours per view. Doing so once already put "critical" in red on
  one admin card and yellow on the next, which is worse than useless on clinical
  data. The generic `--chart-*` set is for non-severity charts only.
- The page is tinted, so any panel that isn't white (`tone="sunken"`) needs a
  border to exist at all.
- **One filled primary button per view.** The accent means "this is the action";
  it stops meaning that if everything wears it.

## Typography

**Figtree, and nothing else** — one family throughout, including figures. Weight
carries the hierarchy. Figtree's soft terminals keep it friendly at the size a
student reads a mood prompt, without undercutting counsellor tables. Its 600 is
the workhorse; 800 (the old system's default) reads shouty here.

| Class | Weight / size | Use |
|---|---|---|
| `.t-display` | 700, clamp 1.75–2.5rem | page greeting ("Hello, Ananya") |
| `.t-h1` | 700, clamp 1.5–1.9rem | page titles |
| `.t-h2` | 600, 1.25rem | card titles |
| `.t-h3` | 600, 1.0625rem | sub-headings, entry titles |
| `.t-body` | 400, 0.9375rem | supporting copy |
| `.t-meta` | 400, 0.8125rem | dates, counts |
| `.t-figure` | 700, clamp 1.75–2.25rem | stat numbers |

## Components (`src/components/ui/`)

- **`button.tsx`** — `primary` (plum), `secondary` (quiet), `destructive` (red),
  `outline` (plum hairline), `link`, plus `IconButton` (circular plum FAB).
- **`card.tsx`** — white panel at `--radius-card`; `tone` = `paper | plum | gold
  | teal | sunken`. `ActionTile` is the square shortcut tile.
- **`field.tsx`** — label above a white field; the error state turns label,
  border, and helper text red *together*, and the helper states the problem in
  words so colour is never the only cue.
- **`status-chip.tsx`** — `StatusChip`, `AvailabilityChip`, `SeverityChip`.
- **`appointment-card.tsx`** — the "Upcoming Counselling" card.
- **`states.tsx`** — `EmptyState` and `SkeletonList`.

## Layout

`AppShell` (`src/components/app-shell.tsx`) serves **all three roles** —
counsellor and admin wear the same chrome as the student, only the tabs differ.

- **Mobile:** slim top bar + bottom tab bar.
- **Desktop:** that tab bar promoted to a 248px sidebar rather than stranded at
  the bottom of a 1440px window. Same items, same active treatment.

Nav lists **only routes that exist** — a tab that 404s is worse than no tab.

**Back, top-left, on every page except each role's home.** `BackButton` lives in
the shell rather than per-page, so it sits in the same place on all three roles'
screens. Home is the root of a role's area: there is nowhere up from it, the nav
already puts every top-level page one tap away, and a Back button there could
only walk you out of the app — which is what the browser's own control is for.

It is `router.back()`, which means it goes wherever you actually came from and
so can't name its destination. That is the deliberate trade: an earlier version
used labelled per-page "up" links to a fixed parent, but only two screens in the
app are sub-pages (`/student/appointments/new`, `/counsellor/notes/[id]`), which
left every other page — the dashboards included — with no back affordance at
all. A consistent control everywhere beat a better-labelled one almost nowhere.

It renders **nothing** when `history.length <= 1`. A Back button that doesn't
move is worse than no button: you press it, nothing happens, and you stop
trusting the control.

**Hierarchy over uniformity.** The student dashboard is the pattern: one wide
focal card carrying the single daily action, everything else demoted to a
supporting grid and a rail. A page of same-weight cards all shouting equally is
the failure mode to avoid.

## Accessibility (non-negotiable)

WCAG AA verified per token above, by auditing **computed styles in a real
browser**, not by arithmetic. Visible focus ring everywhere; labels above
fields; severity always colour **+ label**; mood buttons always carry an emoji
and a text label so the colour is decoration only; the mood chart keeps a y-axis
of mood words and the history list is the text alternative; journal privacy is
structural (student-scoped queries, student-only routes).

Gotcha: `.next` serves a **stale `globals.css`** after a token rewrite — styles
silently fall back to old values. `rm -rf .next` before trusting a screenshot.
