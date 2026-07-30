# Zelp v2 — consumer + business

One file, no build step. Open `index.html`.

## What's new

**Splash.** Flag line, logo, tagline, city list, indeterminate loader. 2.1s then dissolves. It exists to make the first paint feel deliberate rather than empty — not to delay anyone.

**The flag line.** A 3px bar carrying the national stripe sequence (green, yellow, red, black, red, yellow, green). It appears in exactly four places: splash, under the Explore header, above the footer, and at the top of each legal page. The national colours are locked to that component and used nowhere else — that's what stops the identity turning into a flag.

**Business side.** Four screens:
- *For business* — pitch page and claim flow, with phone verification explained up front
- *Dashboard* — views/calls/directions/saves with sparklines and deltas, a 7-day bar chart, and a "needs your attention" queue that links straight to the fix
- *Reviews* — owner replies, nested under the review with an Owner badge
- *Listing* — hours grid, the good-to-know toggles, photo tiles, sticky save

The sidebar swaps nav sets by mode, and the mobile tab bar re-flows to match.

**Pictures.** Ten layered scene illustrations (café, fire, plate, glass, bread, storefront, salon, hardware, hills, city) rendered as four-tone SVG over per-place gradients, with a highlight and a bottom scrim. Used at every scale: editorial collection cards, feed cards, list thumbnails, a 5-tile detail mosaic, visitor photo strips, and review attachments.

**Skeletons.** Shape-matched, shimmer-swept, on every async surface — feeds, search results, saved, dashboard stats. Not spinners: a spinner tells you to wait, a skeleton tells you what's coming.

**Optimistic UI.** Three flows apply the change first and reconcile after:
- *Save* — heart fills instantly and pulses; on failure it reverts and the toast offers Retry
- *Review* — sheet closes immediately, the review appears greyed with "Posting…", the average recalculates; on failure everything rolls back and it's kept as a draft
- *Owner reply* — same pattern with a Retry that restores your text

Turn on **Simulate a bad connection** in You → and the failure rate goes to 45% with 3× latency, so the rollbacks are actually demonstrable.

**Footer + legal.** Five-column footer on every consumer screen. Terms of service (15 sections) and Privacy policy (13 sections) with sticky tables of contents, serif headings, and retention/lawful-basis tables.

## About the legal text

Written against real Zimbabwean law: the **Cyber and Data Protection Act [Chapter 12:07]**, POTRAZ as Data Protection Authority under s.5, **SI 155 of 2024** (controller licensing, DPO appointment, 24-hour breach notification), and the **Consumer Protection Act [Chapter 14:44]**. Governing law and jurisdiction are Zimbabwe, Harare.

It is a **drafting template, not legal advice** — the app says so in an amber notice at the top of both pages. Have a registered legal practitioner review it before publishing.

## Still not real

- The map is CSS. Pin coordinates are percentages in the data; the pin artwork is the Zelp mark and can be reused as-is.
- Photos are illustrations. Each `.ph` exposes `--a`/`--b`; drop an `<img>` in and delete the `.scene` svg.
- No persistence — browser storage isn't available in this preview. Persist `saved`, `mine`, theme and mode in production.

## Checks run

Zero storage calls · zero emoji · zero hotlinked images · every `$("#id")` resolves · every `<use>` resolves to a symbol · every `data-*` attribute has a delegated handler · every route has a section and a render function.
