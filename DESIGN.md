# FOH AI design system

Direction: plain, calm and professional. White pages, the logo blue used for actions only, lots of space, real content instead of decoration. Not based on UXKIN examples (not connected). Based on the existing brand and on what I saw on Hostie and Loman: a clear top banner, one strong promise, proof near the top, short sections, a simple FAQ.

## Color
| Token | Value | Role |
|---|---|---|
| --blue | #4aa5dd | Primary buttons, accents, rules (the logo blue) |
| --blue-ink | #1f6fa5 | Links and small blue text on white (contrast 5.3:1; #2b88c4 only reaches 3.9:1, so don't use it for small text) |
| --blue-tint | #eef7fd | Soft section and card backgrounds |
| --blue-line | #cfe6f6 | Borders on tinted areas |
| --navy | #0b1b2b | Text on blue buttons, dark band, headings |
| --ink | #16222e | Body text |
| --muted | #566676 | Secondary text (6.0:1 on white) |
| --line | #e3e9ee | Hairlines and card borders |
| --soft | #f6f9fb | Alternate section background |
Rule: one accent only (the blue). No gradients, no second color. Dark mode: not used.

## Typography
System font stack (no web fonts, no tracking). Sizes: 14 / 16 / 18 / 22 / 28 / 36 / 52 px. Body 16-18px, line height 1.6. Headings 700, tight (-0.02em), line height 1.1-1.2. Lines no wider than 62 characters.

## Spacing and shape
8px base: 8, 16, 24, 32, 48, 80. Sections 64-80px tall. Content width 1000px. Radius: 8 (cards), 999 (buttons, chips). One soft shadow for floating cards only.

## Components
- Primary button: blue pill, navy text, 600 weight, 14px 30px. Hover: lighter blue. Focus: 3px navy outline.
- Secondary button: white pill, 2px grey border. Dark button: navy pill, white text.
- Top bar: thin, white, 1px black line under it, logo left, links centered, one pill button right. Not sticky.
- Cards: white, 1px --line border, 14px radius, no shadow.
- FAQ: plain list with +/- toggles.

## Imagery
Real product views only (call log, booking slip). No stock photos, no emoji, one thin-line icon set. Anything illustrative is labelled "Example".
