# Reservin

## Overview

A calm, modern reservation interface for restaurants and cafés.

Reservin is designed to make booking a table feel effortless for customers while giving restaurant management a clear and reliable way to manage tables and reservations.

The aesthetic is warm, refined, and quietly confident. Generous whitespace, strong typography, subtle surfaces, and restrained interaction states create a hospitality-focused experience without feeling luxurious, corporate, or overly playful.

The product should always feel:

**Effortless. Clear. Welcoming.**

Customer-facing screens prioritize simplicity and confidence.

Management screens prioritize clarity, efficiency, and information visibility while maintaining the same visual language.

---

## Colors

- **Primary** (`#3F5A45`): Primary buttons, active states, selected tables, links, focus states — deep olive
- **Primary Hover** (`#334A39`): Darker olive for primary hover and pressed states
- **Secondary** (`#A9B8A3`): Supporting elements, subtle selected states, secondary highlights — sage green
- **Accent** (`#C97A5A`): Small hospitality-oriented accents and selected visual details — soft terracotta
- **Background** (`#F7F3EA`): Main page background — warm cream
- **Surface** (`#FFFDF8`): Cards, forms, modals, navigation surfaces
- **Surface Muted** (`#F1EDE4`): Secondary sections, disabled surfaces, schedule backgrounds
- **Text Primary** (`#2B2D2A`): Headings, body text, important labels — warm charcoal
- **Text Secondary** (`#777A74`): Supporting descriptions, metadata, timestamps
- **Neutral** (`#A5A7A2`): Placeholders, disabled text, unavailable states
- **Border** (`#E4DED3`): Cards, dividers, form fields, schedule boundaries

Semantic colors:

- **Available / Success** (`#4F7A5A`): Available tables, confirmed reservations, completed actions
- **Warning** (`#D99A3D`): Upcoming constraints, attention states
- **Error** (`#C65D57`): Validation errors, booking conflicts, destructive actions
- **Information** (`#5F7D8C`): Informational notices and neutral system messages

Primary olive should represent interaction and confirmation, not decoration.

Terracotta should be used sparingly so it remains recognizable as an accent.

---

## Typography

- **Display Font**: General Sans
- **Body Font**: DM Sans
- **Utility / Data Font**: DM Sans

General Sans is used for brand statements, page titles, section headings, and important reservation information.

DM Sans is used for body copy, forms, navigation, table information, schedules, and management interfaces.

The contrast should feel modern and approachable rather than editorial or technical.

Heading text uses medium to bold weights with slightly tight letter spacing.

Body text should remain highly readable and neutral.

Recommended type scale:

- Display: 64px
- Hero headline: 52px
- Page heading: 36px
- Section heading: 28px
- Subheading: 20px
- Body: 15px
- UI label: 14px
- Small: 13px
- Caption: 12px
- Overline: 11px uppercase

Large display typography should mainly appear on customer-facing landing and reservation screens.

Management interfaces should favor smaller, more information-efficient typography.

---

## Elevation

Reservin uses minimal elevation.

Static elements should generally remain flat.

Cards use a subtle 1px border rather than permanent shadows.

Interactive cards may gain:

`0 8px 24px rgba(43,45,42,0.08)`

with a subtle upward movement of 1–2px.

Primary buttons may use a very subtle olive glow on hover:

`0 4px 12px rgba(63,90,69,0.20)`

Navigation should rely on surface contrast, border separation, and backdrop blur rather than strong shadows.

Dropdowns, date pickers, and popovers may use stronger elevation because they temporarily sit above the interface.

Focus state:

`0 0 0 3px rgba(63,90,69,0.14)`

Avoid heavy shadows.

Reservin should feel grounded rather than floating.

---

## Components

### Buttons

Primary buttons use deep olive background with warm white text.

Example:

**Reserve table**

Secondary buttons use transparent backgrounds with subtle borders.

Example:

**Change time**

Ghost buttons are used for low-priority actions.

Example:

**View details**

Destructive actions use error-colored text and borders.

Example:

**Cancel reservation**

Button radius: `8px`

Sizes:

- Small: 32px
- Medium: 40px
- Large: 46px

Buttons may shift upward 1px on hover.

There should normally be only one visually dominant primary action in a section.

---

### Reservation Search

The reservation search is one of the most important components in Reservin.

It should combine:

- Date
- Start time
- End time
- Party size
- Search availability action

The component should feel simple despite containing several inputs.

Desktop layouts may present these controls in one horizontal surface.

Mobile layouts should stack them vertically.

The primary CTA should be:

**Find a table**

---

### Table Cards

Each available table should be presented as a clear selectable card.

Information may include:

- Table name
- Table code
- Capacity
- Area
- Availability

Example:

**Window Table**

T03  
Up to 4 guests  
Indoor

Table cards use:

- warm surface background
- 1px border
- 12px radius
- clear selected state

Selected table:

- olive border
- subtle sage background
- optional check indicator

Unavailable tables should usually not appear in customer search results.

Management screens may show unavailable tables with muted styling.

---

### Reservation Cards

Reservation cards display:

- booking name
- table
- party size
- start time
- end time
- reservation status

Example:

**Zaidan Daffa**

T03 · Window Table  
4 guests  
18:00–20:00

Confirmed

Cards should prioritize time, customer name, and table assignment.

---

### Inputs

Inputs use:

- Surface background
- 1px subtle border
- 8px radius
- 10px vertical padding
- 14px horizontal padding
- 14px text

Focus:

- olive border
- subtle olive focus ring

Error:

- error border
- short explanatory message underneath

Placeholder text uses Neutral.

Labels should always remain visible rather than relying solely on placeholders.

---

### Date and Time Picker

Date and time selection should feel lightweight.

Selected dates use olive.

Current day may use a subtle outline.

Unavailable dates or times use muted styling.

Avoid overly colorful calendars.

The reservation period should always be visible as an explicit start and end time.

Example:

**18:00 — 20:00**

---

### Chips

Chips are used for:

- Reservation status
- Table area
- Capacity indicators
- Filters

Default:

- Surface Muted background
- Text Secondary

Active:

- Sage background
- Primary text

Status examples:

Confirmed → green  
Seated → olive  
Completed → muted green  
Cancelled → error tint  
No show → neutral / error tint

Radius:

`9999px`

---

### Lists

Management reservation lists use compact stacked rows.

Each row may display:

```text
18:00–20:00

Zaidan Daffa
4 guests

T03
Confirmed
```

Rows use subtle dividers rather than individual heavy cards where information density is higher.

Hover may slightly change background.

---

### Table Management

Restaurant tables should appear as cards or compact rows containing:

- Code
- Name
- Capacity
- Area
- Status

Example:

**T03**

Window Table  
4 guests · Indoor  
Active

Primary actions should not visually overwhelm the table information.

Editing may happen through a side panel or modal.

---

### Schedule

The management schedule should visually communicate table usage over time.

Available periods remain visually quiet.

Reserved periods use subtle olive or sage surfaces.

Avoid turning the schedule into a highly saturated calendar.

Time should remain easy to scan vertically or horizontally depending on layout.

---

### Navigation

Navigation uses a warm surface background with subtle bottom border.

Customer navigation should remain minimal.

Example:

```text
Reservin

Reservations
My Booking
```

Management navigation may include:

```text
Overview
Reservations
Tables
Settings
```

Nav height:

`60–64px`

The Reservin wordmark stays left aligned.

---

### Confirmation States

Successful reservation confirmation should feel calm rather than celebratory.

Example:

**Your table is reserved.**

Tuesday, 29 September  
18:00–20:00  
Window Table · T03  
4 guests

**Reservation under Zaidan Daffa**

Avoid excessive animation, confetti, or celebratory graphics.

A subtle confirmation icon is enough.

---

### Empty States

Empty states should remain simple and useful.

Examples:

**No reservations yet.**

Reservations for this day will appear here.

or:

**No tables available for this time.**

Try another time or adjust your party size.

Avoid decorative illustrations unless they provide real value.

---

## Spacing

Base unit:

`4px`

Scale:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px`

Component padding:

- Small: `8 × 12`
- Medium: `10 × 16`
- Large: `12 × 24`

Section spacing:

- Mobile: 32px
- Tablet: 48px
- Desktop: 64px

Customer-facing container:

`1200px max-width`

Management dashboard:

`1360px max-width`

Horizontal page padding:

- Mobile: 16px
- Tablet: 24px
- Desktop: 32px

Card grid gap:

`16–24px`

Spacing should feel generous on reservation flows and more compact in management views.

---

## Border Radius

- `6px`: Small tags and compact elements
- `8px`: Buttons, inputs, selects
- `10px`: Dropdowns and management panels
- `12px`: Table cards, reservation cards, date picker
- `16px`: Large booking surfaces and featured containers
- `9999px`: Status chips, avatars, pills

Avoid excessive rounding.

Reservin should feel soft, but not bubble-like.

---

## Motion

Motion should communicate state rather than decorate the interface.

Default transition:

`160–200ms ease`

Suitable motion:

- subtle button hover
- card selection
- dropdown appearance
- reservation confirmation
- schedule state changes

Avoid:

- bouncing
- large scaling
- excessive spring animation
- decorative page transitions

The interface should feel calm and responsive.

---

## Customer Tone

Customer-facing copy should be:

- friendly
- short
- direct
- reassuring

Prefer:

**When are you coming?**

**How many people?**

**Choose your table.**

**Your table is reserved.**

**See you at 7:00 PM.**

Avoid:

**Please provide the requested reservation parameters.**

Avoid excessive enthusiasm:

**Awesome! Your amazing table is ready!**

---

## Management Tone

Management copy should be:

- clear
- operational
- concise

Prefer:

**Today's reservations**

**Table T03 is available**

**Reserved until 20:00**

**Add table**

**Update reservation**

Avoid overly conversational language in operational screens.

---

## Do's and Don'ts

- Do use Deep Olive (`#3F5A45`) for primary actions and selected states.
- Do maintain warm neutral backgrounds rather than pure white pages.
- Do keep customer reservation flows visually simple.
- Do make availability and booking status immediately understandable.
- Do maintain the 4px spacing system.
- Do use whitespace generously on customer-facing pages.
- Do allow management interfaces to become denser without changing the brand language.
- Do keep reservation times highly visible.
- Do use semantic colors consistently.

- Don't use bright blue as the primary brand color.
- Don't introduce gradients as major visual elements.
- Don't use large permanent shadows.
- Don't turn every container into a card.
- Don't use terracotta for primary actions.
- Don't make the interface overly luxurious or fine-dining oriented.
- Don't make the interface look like generic enterprise software.
- Don't use unnecessary restaurant illustrations or food imagery in operational screens.
- Don't use excessive animation.
- Don't hide important field labels inside placeholders.
- Don't use more than one dominant primary CTA within the same interaction section.

---

## Brand Principle

Reservin should never make reserving a table feel like filling out a form.

The experience should feel like a short conversation:

**When?**

**How many?**

**Which table?**

**Reserved.**