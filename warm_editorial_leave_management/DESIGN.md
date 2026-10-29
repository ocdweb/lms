---
name: Warm Editorial Leave Management
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede8'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#444748'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#795915'
  on-secondary: '#ffffff'
  secondary-container: '#fdd182'
  on-secondary-container: '#785814'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e1b14'
  on-tertiary-container: '#898379'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdea7'
  secondary-fixed-dim: '#ebc073'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#e9e2d5'
  tertiary-fixed-dim: '#cdc6ba'
  on-tertiary-fixed: '#1e1b14'
  on-tertiary-fixed-variant: '#4a463d'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.75rem
    fontWeight: '600'
    lineHeight: 3.25rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.625rem
    fontWeight: '600'
    lineHeight: 2.125rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  numerical-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.5rem
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an editorial, calm, and dignified approach to leave and time-off management. Moving deliberately away from cold, mechanical enterprise HR suites, the interface evokes the quiet confidence of a boutique hotel concierge combined with Swiss editorial precision. 

### Brand Personality & Emotional Impact
- **Serene & Respectful:** Time off is personal, rejuvenating, and essential. The UI feels tranquil rather than bureaucratic, treating employee rest with value.
- **Approachable Sophistication:** Warm cream foundations eliminate glare and sterile clinical tones, providing an inviting, tactile canvas for day-to-day interactions.
- **Uncluttered Clarity:** Information is structured with deliberate pacing and ample negative space. Visual fatigue is minimized by foregrounding only the primary active tasks (e.g., remaining allowance balances, quick requests, frictionless approvals).

### Design Style: Editorial Warm Minimalism
The visual language merges modern architectural minimalism with warm editorial sensibilities. Surface hierarchy relies on crisp off-white layers settled upon warm alabaster canvases, anchored by deep charcoal-black typography, delicate hairline contours, and focused applications of warm muted gold to highlight balance states and key actions.

## Colors

The color palette is rooted in natural, warm mineral pigments, balancing deep black ink against a soft linen-inspired background, punctuated by warm golden highlights.

### Palette Architecture
- **Primary Ink (`#121212` / `#1c1b18`):** The dominant dark tone. Used for critical primary buttons, high-contrast headings, active states, and structural icons. Avoid pure `#000000` to preserve editorial warmth.
- **Surface Canvas (`#f4f1ec`):** The baseline page background. Replaces clinical white with a calm, warm alabaster cream that softens eye strain.
- **Elevated Canvas / Cards (`#ffffff`):** Pure white reserved exclusively for interactive cards, sheets, panels, and floating popovers to establish natural contrast against the cream ground.
- **Accent Muted Gold (`#c9a157`):** Represents value, attention, and celebratory rest. Employed selectively for remaining balance badges, calendar range highlights, primary milestones, and pending-action indicators. Never used in overwhelming floods.
- **Subdued Linework & Borders (`#e4dec3`):** Delicate, warm hairline borders that define structure without harsh visual barriers.
- **Secondary Text & Muted Charcoal (`#6e695f`):** Used for metadata, field labels, descriptive notes, and table column heads.
- **Deep Muted Base (`#2a2825`):** Used for pressed interactive states, dark chip selections, or high-emphasis modal headers.

### Semantic Status Colors
- **Approved / Active:** Natural Sage (`#3e6b48`) on light tint (`#edf3ee`).
- **Pending Review:** Warm Amber Gold (`#c9a157`) on warm cream tint (`#faf5eb`).
- **Rejected / Warning:** Brick Terra-Cotta (`#9e3f36`) on light rose tint (`#fbf2f1`).

## Typography

**Plus Jakarta Sans** is the sole typographic voice throughout the system. Its geometric underpinnings provide modern clarity, while its subtle humanist curves infuse warmth, legibility, and high-end editorial rhythm.

### Typographic Principles
- **Editorial Headings:** Large numbers and titles feature negative letter-spacing for a tailored, publication-grade tone. Numerical figures (e.g., "18 Days Remaining") use `numerical-display` with balanced kerning to become quiet hero centerpieces.
- **Restrained Hierarchies:** Avoid arbitrary font weight shifts. Stick to regular (`400`) for body/instructions and semibold (`600`) for navigation, headings, and data markers.
- **Label Formatting:** Small metadata tags, table headers, and category tags utilize `label-md` or `label-sm` with slight positive tracking (`0.02em` to `0.04em`), ensuring crisp scanning even at small viewports.

## Layout & Spacing

The layout is grounded in a responsive fluid-constrained grid designed to feel uncrowded, intentional, and readable across all viewport dimensions.

### Layout Philosophy
- **Standard Widths:** Content aligns to a central container max-width of `1280px` for desktop dashboards and `720px` for single-focus application flows.
- **Desktop (1024px+):** 12-column layout with `2rem` gutters and minimum `3rem` side canvas margins. The dashboard employs an asymmetric arrangement: quota summary cards occupy the top band, primary approval streams take 8 columns, and personal mini-calendars occupy the right 4 columns.
- **Tablet (768px - 1023px):** 8-column layout with `1.5rem` gutters and `2rem` side margins. Balances switch from multi-column rows to 2-by-2 card matrices.
- **Mobile (< 768px):** 4-column layout with `1.25rem` gutters and `1rem` side margins. Multi-column forms and approval cards collapse into full-width sequential flows.
- **Rhythm & Empty Space:** Form elements and quota metrics rely on the `space-lg` (`1.5rem`) and `space-xl` (`2.5rem`) tokens to avoid the cramped visual density typical of enterprise portals.

## Elevation & Depth

Visual hierarchy is established through tonal paper layering, subtle warmth-tinted ambient shadows, and gossamer hairline dividers, deliberately avoiding heavy, generic dropshadows.

### Layering Philosophy
- **Base Ground:** `#f4f1ec` (warm alabaster cream) serves as the floor.
- **Surface Elevation (Cards & Panels):** `#ffffff` (pure white) elevated physically against the base.
- **Outlines over Cast Shadows:** Structural hierarchy primarily relies on a `1px` continuous border in `#e4dec3`. 
- **Ambient Shadow Crafting:**
  - *Standard Card:* A whisper-soft, warm shadow prevents white surfaces from visually bleeding into cream: `0 2px 8px -2px rgba(28, 27, 24, 0.04), 0 1px 2px -1px rgba(28, 27, 24, 0.03)`.
  - *Floating Modals & Date Pickers:* Elevated interaction planes use a double-layer diffuse shadow: `0 16px 32px -8px rgba(28, 27, 24, 0.08), 0 4px 12px -2px rgba(28, 27, 24, 0.04)`.
- **Active / Dragging States:** Slight upward lift using subtle scale (`1.005`) and intensified warm ambient blur.

## Shapes

The design system implements a soft, architectural geometry (`roundedness: 2`), balancing human warmth with structural stability.

### Geometry Rules
- **Interactive Controls (Inputs, Buttons, Dropdowns):** `0.5rem` (8px) radius. This provides tactile touch points without appearing childish or overly rounded.
- **Containers & Quota Cards:** `1rem` (16px) radius (`rounded-lg`). Creates comfortable framing for metrics, application summaries, and balance snapshots.
- **Overlays & Dialog Panels:** `1.5rem` (24px) radius (`rounded-xl`).
- **Pill Elements (Exceptions):** Status tags, filter chips, and leave type badges explicitly utilize full pill rounding (`9999px`) to immediately distinguish contextual metadata from clickable structural cards.

## Components

### Buttons
- **Primary:** Deep charcoal (`#121212`) background with white (`#ffffff`) text, `0.5rem` border radius, and `0.75rem 1.5rem` padding. On hover: shifts smoothly to `#2a2825`.
- **Accent (Special Action / Apply):** Used sparingly for direct submissions: `#c9a157` background with `#ffffff` text, transitioning to `#b88f46` on hover.
- **Secondary / Outline:** Pure white (`#ffffff`) background, `1px` border in `#e4dec3`, text in `#121212`. Hover triggers an alabaster surface fill (`#f4f1ec`).
- **Ghost:** Transparent background, `#6e695f` text, hover shifts to subtle cream tone with `#121212` text.

### Quota & Balance Cards
- **Structure:** Clean white background, bordered with `#e4dec3`, `1rem` corner rounding, and `1.5rem` interior padding.
- **Hierarchy:** 
  - Top row: Leave category label (`label-md` in uppercase `#6e695f`) alongside a circular leave icon.
  - Middle row: Large numerical remaining days (`numerical-display` in `#121212`) accompanied by an understated "of 25 available" footnote (`body-sm`).
  - Bottom row: Subtle linear progress track (`4px` height, background `#f4f1ec`, fill colored via `#c9a157` or `#121212`).

### Chips & Status Badges
- **Shape:** Full pill radius (`9999px`), `0.25rem 0.75rem` padding, `label-sm` weight.
- **States:**
  - *Approved:* Light sage surface (`#edf3ee`), dark forest text (`#3e6b48`).
  - *Pending:* Soft cream surface (`#faf5eb`), warm muted gold text (`#a47f3b`).
  - *Rejected:* Pale blush surface (`#fbf2f1`), deep terra-cotta text (`#9e3f36`).

### Form Inputs & Date Pickers
- **Text & Select Fields:** Pure white background, `1px` border `#e4dec3`, `0.75rem 1rem` padding, text `#121212`, placeholder `#6e695f`.
- **Focus State:** Border shifts cleanly to `#121212` with a `2px` concentric ring in `rgba(201, 161, 87, 0.25)`. No harsh primary blue rings.
- **Date Range Selector:** Continuous white background container showing dual Start and End zones separated by a discreet rightward arrow icon.

### Checkboxes & Radios
- **Shape:** Radio is circular (`50%`), checkbox has soft corners (`4px`).
- **Base State:** `1px` border `#e4dec3`, white background.
- **Selected State:** Fill `#121212` with crisp `#ffffff` check or inner dot.

### Lists & Request Approval Rows
- **List Container:** Borderless rows or grouped white card list items separated by a `1px` `#f4f1ec` horizontal divider.
- **Approval Card Row:** Features employee avatar/initials in a `#f4f1ec` circle, employee name (`label-lg`), request duration badge, and two inline compact icon buttons: 
  - *Approve:* Dark pill button (`#121212`).
  - *Decline / Review:* Subtle outline pill button with `#e4dec3` border.