---
name: Stage Point Master Investor Site
description: A conservative, institutional single-page landing site for a secured promissory note offering
colors:
  institutional-navy: "#002060"
  navy-deep: "#001233"
  navy-tint: "#EEF2F9"
  steel-teal: "#66A7B8"
  steel-teal-tint: "#EAF2F4"
  neutral-white: "#FFFFFF"
  neutral-paper: "#F8FAFC"
  neutral-ink: "#1A1A1A"
  neutral-slate: "#334155"
  neutral-mist: "#64748B"
  neutral-border: "#E2E8F0"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 1.5rem + 4vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "32px"
  lg: "64px"
  xl: "120px"
components:
  button-primary:
    backgroundColor: "{colors.institutional-navy}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-secondary:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.institutional-navy}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  card-stat:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.institutional-navy}"
    rounded: "{rounded.md}"
    padding: "32px"
---

# Design System: Stage Point Master Investor Site

## 1. Overview

**Creative North Star: "The Offering Memorandum, Rendered"**

This system treats the web page the way Stage Point treats a loan: conservatively underwritten, fully collateralized by evidence, and free of unnecessary risk. The aesthetic is the calm confidence of a well-prepared institutional document, not the energy of a startup pitch. Deep navy and muted steel-teal read as bank-grade rather than fintech-trendy; generous whitespace and a serif display face borrow the gravitas of print finance (offering memoranda, annual letters) while the interface itself stays modern, fast, and legible on a phone.

The system explicitly rejects the crypto/fintech hype register (neon gradients, countdown timers, glassmorphism, emoji-style icons, "APY" energy) and the generic SaaS-startup register (purple gradient blobs, bouncy illustrations, "Get Started Free" urgency). Nothing on the page should feel like it was assembled from a landing-page template; every section earns its layout from the content it carries.

**Key Characteristics:**
- Deep navy as the dominant color (60-70% of visual weight via type, nav, and section anchors), steel-teal reserved for accents, data highlights, and interactive states.
- Serif display headlines paired with a clean grotesque sans for body copy and UI chrome, evoking print-finance credibility without looking dated.
- Flat, bordered surfaces over heavy shadows; depth communicated through tonal layering and hairline borders, not drop shadows.
- Numbers are the hero: statistics render large, precise, and unadorned rather than wrapped in decorative iconography.

## 2. Colors

The palette is restrained and asymmetric: one dominant navy, one disciplined accent, and a tightly controlled neutral ramp. No secondary or tertiary hue is introduced; every color on the page traces back to one of these roles.

### Primary
- **Institutional Navy** (#002060): Dominant color. Nav background, headline text, primary buttons, section anchors, iconography. Sourced directly from Stage Point's own brand mark.

### Secondary
- **Muted Steel Teal** (#66A7B8): The accent. Used sparingly for interactive highlights, chart accents, stat emphasis, hover states, and the payment-waterfall "your position" marker. Never used as a large background fill; its rarity is the point.

### Neutral
- **Navy Deep** (#001233): Hover/active state for navy surfaces and buttons.
- **Navy Tint** (#EEF2F9): Very light navy-tinted background for alternating section bands.
- **Steel Teal Tint** (#EAF2F4): Light accent-tinted background for callouts and highlighted stat cards.
- **Neutral White** (#FFFFFF): Primary background and card surfaces.
- **Neutral Paper** (#F8FAFC): Secondary section background, alternating with white to create rhythm without a hard color shift.
- **Neutral Ink** (#1A1A1A): Body text on light backgrounds where near-black is needed for maximum legibility (small print, disclaimer).
- **Neutral Slate** (#334155): Primary body copy color; softer than pure black, easier to read at length.
- **Neutral Mist** (#64748B): Secondary/muted text, captions, metadata.
- **Neutral Border** (#E2E8F0): Hairline borders, dividers, card outlines.

### Named Rules
**The One Accent Rule.** Steel teal never exceeds roughly 10% of any given section's visual weight. It marks the single most important number or interactive element on screen, never a background or a decorative flourish.

**The No-Gradient Rule.** Flat color fields only. No gradients, no glassmorphism, no neon glows. Depth comes from tonal layering (navy tint vs. white vs. paper) and hairline borders, never from blur or transparency effects.

## 3. Typography

**Display Font:** Archivo (with Helvetica Neue, Arial, sans-serif fallback). Stands in for Acumin Pro, the Adobe face the live stagepointcapital.com uses for headings, which cannot be self-hosted; Archivo has the same neo-grotesque skeleton.
**Body Font:** Poppins (with system-ui, sans-serif fallback), the live site's actual body face, loaded at weights 300 to 600.
**Label/Mono Font:** Poppins, uppercase with wide letter-spacing for the small labels; no separate mono face

**Character:** A firm neo-grotesque for headlines paired with a rounder geometric sans for everything functional. There is no serif anywhere in the system: gravitas comes from scale, weight, and the navy palette, and Poppins keeps data, forms, and navigation crisp and modern.

### Hierarchy
- **Display** (500 weight, clamp(2.75rem, 4vw, 4.5rem), 1.05 line-height): Hero headline only.
- **Headline** (500 weight, clamp(1.75rem, 1.6vw, 2.5rem), 1.15 line-height): Section titles ("The market opportunity", "How your capital is protected").
- **Title** (600 weight, 1.25rem, 1.3 line-height): Card headings, note-term labels, team member names.
- **Body** (400 weight, 1.0625rem, 1.65 line-height, 65-75ch max width): Paragraph copy throughout.
- **Label** (600 weight, 0.8125rem, uppercase, 0.08em letter-spacing): Eyebrow tags above headlines, nav links, stat captions.

### Named Rules
**The Two-Face Rule.** Archivo is for headings at Headline size and up; everything smaller (body, labels, figures, UI chrome) is Poppins. Do not introduce a third family.

**The 13px Floor.** No running text or label is set below 13px (the Label size). The one exception is a short uppercase badge inside a diagram (the "Your position" tag, the "Paid first" rail), which may go to 12px because capitals read larger. This applies to chart axis and annotation text too: draw charts in real pixels so their text is never scaled below the floor.

## 4. Elevation

The system is flat by default. Depth is conveyed through tonal layering (white cards on paper or navy-tint backgrounds) and 1px hairline borders in Neutral Border, not through box-shadow. A single soft ambient shadow appears only on hover for interactive cards, signaling "this responds to you" rather than implying permanent depth.

### Shadow Vocabulary
- **card-rest** (`box-shadow: none; border: 1px solid #E2E8F0`): Default state for all cards and containers.
- **card-hover** (`box-shadow: 0 8px 24px rgba(0, 32, 96, 0.08)`): Applied only on hover/focus for interactive cards (note-term cards, stat cards), paired with a 2-4px upward translate.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat and bordered at rest. Shadow is a response to interaction, never a resting state.

## 5. Components

### Buttons
- **Shape:** Rectangular with a slight rounding (6px radius) rather than a pill. A pill shape reads as consumer-app; a sharp corner reads as legal-document. 6px splits the difference toward institutional.
- **Primary:** Institutional Navy (#002060) background, white text, 14px/32px padding, Label-style letter-spacing on the button text.
- **Hover/Focus:** Background shifts to Navy Deep (#001233); focus-visible adds a 2px steel-teal outline offset by 2px for keyboard accessibility.
- **Secondary/Ghost:** White or transparent background, navy 1.5px border, navy text; hover fills with Navy Tint (#EEF2F9).

### Cards / Containers
- **Corner Style:** 10px radius for content cards (note-term cards, stat cards, team cards); 16px for larger feature panels (waterfall diagram, capital structure diagram).
- **Background:** White on paper/navy-tint section backgrounds; paper or navy-tint when the surrounding section is white, to keep alternating rhythm.
- **Shadow Strategy:** card-rest at baseline, card-hover on interactive cards only (see Elevation).
- **Border:** 1px solid Neutral Border at rest.
- **Internal Padding:** 32px (desktop), 24px (mobile).

### Inputs / Fields
- **Style:** White background, 1.5px Neutral Border stroke, 6px radius.
- **Focus:** Border shifts to Institutional Navy, 2px steel-teal focus ring for keyboard visibility.

### Navigation
- **Style:** Sticky top bar, white background with a bottom hairline border (Neutral Border) once scrolled. Wordmark left in navy, anchor links in Label style (uppercase, letter-spaced), primary CTA button right.
- **States:** Anchor links default Neutral Slate, hover/active Institutional Navy with a steel-teal underline that animates in on hover.
- **Mobile:** Collapses to wordmark plus a single CTA button; anchor links move to a slide-down panel.

### Stat Callout (signature component)
Large count-up numerals in bold Poppins (numerals should feel precise and tabular), Institutional Navy, with a Label-style caption beneath in Neutral Mist. The figure is always present in the server-rendered HTML; the count-up is an enhancement that runs only once the client confirms the stat is below the fold. Used for the track-record marquee statistics (50th consecutive quarter, $205M originations, zero principal loss).

## 6. Do's and Don'ts

### Do:
- **Do** keep steel-teal (#66A7B8) under roughly 10% of any section's visual weight; it marks the single most important element, not a background.
- **Do** use flat, bordered surfaces (1px #E2E8F0) as the default container style; reserve shadow for hover states only.
- **Do** set all body copy in Poppins at Neutral Slate (#334155) or Neutral Ink (#1A1A1A), never pure black on pure white for large text blocks.
- **Do** reserve Archivo for Headline sizes and up.
- **Do** ship content in its final state in the server HTML. Entrance animations (fades, count-ups, bar fills) may only collapse an element on the client after it is confirmed below the fold, so no-JS readers, crawlers, and print see the real figures.
- **Do** let statistics render large and unadorned; the number is the persuasion, not an icon next to it.

### Don't:
- **Don't** use gradients, glassmorphism, neon glows, or any "crypto/fintech hype" visual language; this is an institutional credit fund, not an APY dashboard.
- **Don't** use bouncy illustrations, purple gradient blobs, or "Get Started Free" urgency patterns borrowed from generic SaaS landing pages.
- **Don't** use em dashes as sentence punctuation, exclamation marks, all-caps sentences, or emojis anywhere on the page.
- **Don't** use border-left or edge stripes as a decorative accent on cards; depth and separation come from borders and whitespace, not color bars.
- **Don't** scale elements from zero on entrance, animate box-shadow or non-GPU properties, or run any UI transition longer than 300ms.
- **Don't** let any animation ignore `prefers-reduced-motion`; every scroll reveal and count-up must degrade to an immediate static state.
