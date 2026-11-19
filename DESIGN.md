# FOH AI design system

Direction (Nov 19, 2026, from Tyler's sketch): clean and professional, light. Warm off-white page, white cards, dark ink for main buttons, green only for progress and the call button. Square-ish buttons (10px corners), no pills. Real content, no decoration.

## Fonts
- Headlines: Instrument Serif (self-hosted in /fonts, OFL licence). Italic for one accent phrase.
- Reading and UI: Inter (Google Fonts).
- The demo phone uses the phone's own system font.

## Text strength (test with ?tune on any page)
- Main writing: 86% of the text colour (--o-strong)
- Lines under big titles: 57% (--o-soft). On white this is just under the 4.5:1 contrast guide for small text, so check it when testing.

## Colour tokens (style.css :root)
page #f6f5f1, card #ffffff, ink #111827, link #1f6fa5, logo blue #4aa5dd, green #16a34a, error #d92d20, arc track #ebe9e3. Dark theme exists under [data-theme=dark] for testing only.

## Components
- Main button: ink background, white text, 10px corners. Second button: white with a thin border.
- Onboarding: one white card, title, green progress arc with the percent inside, questions, plain "‹ Back" and "Next ›" in the bottom corners. Times use a small "Choose time" wheel that pops up on the time box.
- Tick boxes: thin border; ticked = ink border and ink check.
