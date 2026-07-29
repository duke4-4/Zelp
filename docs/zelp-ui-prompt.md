# Zelp — UI Generation Prompt

> Copy everything below the line into v0, Lovable, Claude, Cursor, Figma Make, or any UI-generating tool. A compressed version for tools with short input limits is at the very bottom.

---

## THE BRIEF

Design and build the mobile-first UI for **Zelp**, a place-review and local-discovery app for Zimbabwe. People use it to answer one question: *is this place actually any good, and is it open right now?*

The visual model is **Airbnb's calm, photo-led shell wrapped around Yelp's dense, opinionated content**. Airbnb gives you the whitespace, the rounded photo cards, the floating search pill, the map-plus-list pattern, the restrained iconography. Yelp gives you what actually goes inside: star ratings, review counts, user photos, opening hours, category tags, long scrolling review threads. Take Airbnb's *composure* and Yelp's *substance*.

Explicitly do **not** take Yelp's clutter — no banner ads, no crowded three-column desktop layout, no sponsored results mixed into the feed. And do not take Airbnb's booking funnel — Zelp is not a transaction, it's a recommendation. Nothing should push toward a checkout.

## AUDIENCE & CONTEXT — this must shape the UI, not just the copy

- Primarily Zimbabweans in Harare, Bulawayo, Mutare, Vic Falls, plus diaspora planning visits.
- Most users are on **mid-range Android over patchy 3G/4G, paying for data by the megabyte.** Images must lazy-load, use skeletons instead of spinners, and never autoplay video. Target under 150KB for first paint. Saved places must work offline.
- **Load-shedding and water cuts are daily facts.** "Has a generator" and "has a borehole" are legitimate, high-value filters, not novelties.
- **Dual currency is normal.** Show prices in USD by default with a ZWG toggle. Payment badges matter: cash USD, EcoCash, Innbucks, card.
- Thumb-first layout. Primary actions live in the bottom third of the screen.

---

## DESIGN TOKENS — use these exact values

### Colour

```css
--flame:        #D9502B;  /* primary — buttons, active states, map pins, logo */
--flame-press:  #C23C1B;  /* pressed / hover */
--flame-tint:   #FDF0EA;  /* selected chips, subtle fills */
--gold:         #F2B133;  /* stars, ratings, badges — never body text */
--gold-tint:    #FEF6E6;
--ink:          #15201B;  /* headings and body text */
--ink-muted:    #55605A;  /* secondary text */
--ink-faint:    #8A938E;  /* metadata, placeholders */
--green:        #2E6A52;  /* open now, verified, success */
--green-tint:   #E8F1ED;
--stone:        #F7F1E7;  /* app background */
--surface:      #FFFFFF;  /* cards, sheets */
--line:         #EAE4D9;  /* borders and dividers */
--closed:       #A33A22;  /* closed now, errors */
```

Dark mode: `--ink` becomes the background (`#121916` surface `#1B2420`), text goes `#F7F1E7`, flame lifts to `#E8663F` for contrast, gold stays.

**Discipline rule:** flame is the only saturated colour allowed on a screen at rest, and it appears at most three times per viewport. Gold is reserved for rating signal. Everything else is stone, white, ink and line. If a screen looks bland in greyscale, fix the layout, not the colour.

### Type

- **Display / headings:** Outfit, 600, tracking −2%.
- **Body / UI:** Inter, 400 and 500.
- **Numbers:** Inter with `font-variant-numeric: tabular-nums` — ratings, prices, distances, review counts.

| Role | Size / line-height |
|---|---|
| Display | 32 / 1.1 |
| H1 | 24 / 1.2 |
| H2 | 20 / 1.25 |
| Body | 16 / 1.5 |
| Small | 14 / 1.45 |
| Caption | 12 / 1.35 |
| Overline | 11 / 1.2, uppercase, tracking .16em |

### Shape, depth, motion

- Radii: cards `18px`, images inside cards `14px`, inputs `12px`, buttons and chips fully pill, bottom sheets `24px` top corners only.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Screen gutter 20px.
- Shadows are barely there: resting `0 1px 2px rgba(21,32,27,.06)`, floating `0 6px 20px rgba(21,32,27,.08)`. No coloured shadows, no glows.
- Motion: 180ms ease-out for taps, 260ms for sheets and page transitions. Respect `prefers-reduced-motion`. No parallax, no scroll-jacking.
- Borders over shadows wherever both would work.

### The signature device

The **chevron frieze** — a zigzag band lifted from the stonework at Great Zimbabwe. Use it in exactly three places and nowhere else:

1. As the grab-handle band at the top of every bottom sheet.
2. As the divider between major sections on the place detail screen.
3. Filling empty states and the splash screen.

Map pins are the Zelp mark itself: a squared speech bubble with a dropped point, flame fill, white Z knocked out. Selected pin scales to 1.25× and gains the floating shadow.

---

## SCREENS

### 1. Explore (home)

- Sticky top: floating search pill on stone background — magnifier icon, "Search places in Harare", a small avatar on the right. Shadow only when scrolled.
- Below it, a horizontally scrolling **category rail**: 20px line icons above 11px labels — Sadza & grills, Cafés, Bars, Braai spots, Salons, Hardware, Lodges, Car service, Tuckshops. Active item gets a 2px flame underline. This is the Airbnb rail, borrowed exactly.
- Feed sections, each a horizontal carousel of place cards with a heading and a text "See all":
  - **Open now near you**
  - **Reviewed this week**
  - **Sunday lunch in Borrowdale** (an editorial collection)
  - **Braai and beer** — near-square cards, editorial photography, name in the corner
- Bottom tab bar, 5 items: Explore, Search, Saved, Reviews, You. Active tab is flame with a filled icon; the rest are ink-faint outline icons.

### 2. Place card (the workhorse component)

Used in every carousel and list. Get this right and most of the app is done.

- 4:3 photo, radius 14, with a heart save button top-right (white circle, ink outline heart, flame filled when saved) and a swipe-dot indicator if there are multiple photos — Airbnb's exact treatment.
- Below the photo, no card border, just spacing: name in 16/500 ink on the left, `★ 4.6` in gold on the right with tabular numerals.
- Second line, 14 ink-muted, all in one row separated by `·`: category · suburb · price band (`$`–`$$$$`) · distance.
- Third line: status pill — green "Open · closes 22:00" or `--closed` "Closed · opens 08:00 Mon".
- Fourth line, optional, 12 ink-faint: the most recent review's first line in quotes, truncated to one line.

### 3. Search results

- Sticky header: back arrow, the search pill showing the query, filter icon with a flame dot when filters are active.
- Below: a scrolling **filter chip row** — Open now, Top rated, Nearby, Delivery, Has generator, Has borehole, Takes USD cash, EcoCash, Card, Wi-Fi, Parking, Wheelchair access. Unselected chips are white with a line border; selected chips are flame-tint fill with a flame border and flame text.
- Body defaults to a vertical list of place cards. A floating pill button, centred at the bottom above the tab bar, toggles **Map** / **List** — dark ink pill, white text, map icon.
- Map view: full-bleed map, Zelp mark pins, a draggable bottom sheet at 20% / 55% / 92% snap points, chevron grab handle. Tapping a pin snaps the sheet to 55% and scrolls to that card.
- Empty state: chevron frieze illustration, "Nothing matching those filters in Avondale," and a "Clear filters" button. Never a sad face or a magnifying glass.

### 4. Place detail — the Yelp-density screen in an Airbnb frame

1. **Photo mosaic**: one large photo left, four smaller in a 2×2 right, radius 18 on the outer corners, tap opens a full gallery. A "See all 84 photos" pill sits bottom-right over the mosaic.
2. **Title block**: name in H1, then `★ 4.6 · 812 reviews · $$ · Restaurant · Avondale`. Then a green or closed status line with today's hours.
3. **Action row**: four equal-width outline buttons with icon above label — Directions, Call, WhatsApp, Share. Save is a separate flame-filled pill.
4. **Badge row**, horizontally scrolling: Generator, Borehole, Takes USD, EcoCash, Innbucks, Card, Wi-Fi, Parking, Outdoor seating, Wheelchair access. 12px labels in pill outlines with small line icons.
5. **Chevron divider.**
6. **Ratings breakdown**: big 4.6 on the left in Outfit 32, five gold stars, and five horizontal distribution bars in gold on stone.
7. **Reviews**: filter chips (Most recent, Highest, Lowest, With photos). Each review card is white on stone, radius 18 — avatar, name, review count under the name, gold stars, date, body text clamped to 4 lines with "Read more", a horizontal photo strip, and a footer with Helpful / Funny / Share as text buttons with counts. This is Yelp's structure, kept, because it's the reason people trust the app.
8. **Sticky bottom bar** on scroll: name and rating on the left, flame "Write a review" pill on the right.

### 5. Write a review

Full-screen, one thing at a time, generous spacing.

- Big star input, 40px gold stars, haptic on tap.
- Under the stars, quick-tag chips that change with the rating: Great value, Fast service, Good for groups, Quiet, Loud music, Slow service, Card machine down.
- Free-text area with the placeholder "What should someone know before they go?"
- Photo add row: dashed-border square with a plus, then thumbnails.
- Sticky flame "Post review" button, disabled until a rating is set. Disabled state is `--line` fill with ink-faint text — never a faded flame.

### 6. Saved

Airbnb Wishlists, renamed. A 2-column grid of collection covers — a 4-photo mosaic, collection name, count. Default collections: "Want to try", "Take visitors here", "Sunday spots". Tapping opens a list plus a map of just those places.

---

## COPY RULES

- Sentence case everywhere. No title case, no ALL CAPS except the overline style.
- Be specific and literal: "Closes at 22:00" not "Extended hours". "3 people reviewed this week" not "Trending now".
- Active voice, and the button name matches the result: "Post review" produces "Review posted".
- Errors say what happened and what to do: "Couldn't load reviews. Check your connection and try again." No apologies, no vagueness.
- Empty states are invitations: "No reviews yet — be the first."
- Zimbabwean English and local spellings stay as people write them. Suburb names, not GPS coordinates: Avondale, Borrowdale, Msasa, Mbare, Belgravia, Newlands, Milton Park.
- Use realistic seed data — real Harare suburbs, plausible business names, prices in USD like $4, $12, $28, ratings between 3.2 and 4.9, review counts from 3 to 900.

## QUALITY FLOOR

- Responsive from 360px up; desktop is a centred max-width 1140px layout with a two-column search view, list left, sticky map right.
- Visible keyboard focus rings in flame, 2px offset.
- Every interactive target at least 44×44.
- Text contrast meets WCAG AA: ink on stone, white on flame at 18px+ or bold, ink on gold.
- Skeleton loaders shaped like the real content. No spinners.
- `prefers-reduced-motion` and `prefers-color-scheme` both honoured.

## DO NOT

- No purple or blue gradients, no glassmorphism, no neon accents, no dark-mode-by-default.
- No generic hero with a big number and a small label.
- No stock "diverse team high-fiving" photography — food, streetscapes, storefronts and interiors only.
- No emoji in the interface.
- No sponsored slots, no interstitials, no "download our app" banners.
- Don't recolour the logo. Don't add a shadow or outline to it.
- Don't use flame and green adjacent at full saturation.

---

## COMPRESSED VERSION (for tools with short input limits)

> Build a mobile-first place-review app for Zimbabwe called Zelp: Airbnb's calm photo-led shell (floating search pill, category rail, rounded 4:3 photo cards with heart-save, map + draggable bottom sheet, wishlist grid) wrapped around Yelp's content density (star ratings, review counts, distribution bars, long review cards with photos and Helpful/Funny footers, opening hours, category and price tags).
>
> Palette: flame `#D9502B` primary, gold `#F2B133` for stars only, ink `#15201B` text, green `#2E6A52` for "open now", stone `#F7F1E7` background, white surfaces, `#EAE4D9` borders. Flame appears at most 3 times per screen. Type: Outfit 600 for headings, Inter for body, tabular numerals for all figures. Cards radius 18, buttons and chips fully pill, shadows almost invisible, borders preferred over shadows.
>
> Zimbabwe-specific: filters for "has generator", "has borehole", "takes USD cash", EcoCash and Innbucks; prices in USD with a ZWG toggle; suburb names like Avondale and Borrowdale; must feel fast on mid-range Android over 3G, so lazy images and skeleton loaders, no spinners, no video.
>
> Screens: Explore feed, search results with list/map toggle, place detail with photo mosaic and full review thread, write-a-review, saved collections. Bottom tabs: Explore, Search, Saved, Reviews, You.
>
> Avoid: gradients, glassmorphism, emoji, ads, stock office photography, generic hero sections.
