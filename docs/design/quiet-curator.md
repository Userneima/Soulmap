# Design System Specification: The Quiet Curator

This document outlines the visual and functional framework for a high-end desktop community interface. Our objective is to move away from "utility-first" design toward a "high-end editorial" experience. We prioritize restraint over decoration, and atmosphere over density.

## 1. Overview & Creative North Star: "The Quiet Curator"

The Creative North Star for this design system is **The Quiet Curator**. This is not a social network meant for noise; it is a space designed for focused, high-value community interaction.

To achieve this, we break the "standard template" look through:
- **Intentional Asymmetry:** The layout relies on a fixed left navigation and a central feed that feels anchored yet breathable.
- **Atmospheric Depth:** We replace harsh structural lines with soft tonal shifts, creating a UI that feels carved out of a single obsidian block rather than assembled from parts.
- **Editorial Spacing:** We treat white space (or "dark space") as a primary design element to direct focus and reduce cognitive load.

## 2. Colors: Tonal Architecture

Our palette is rooted in deep, near-black neutrals and high-contrast typography, accented by a single "soulful" blue.

### Surface Hierarchy & Nesting

We do not use borders to define space. We use **Tonal Layering**. Boundaries must be defined solely through background color shifts.

- **Foundation:** The base level of the application sits on `surface` (`#0e0e0e`).
- **Nesting Rule:** To create depth, use the `surface-container` tiers.
- Place a `surface-container-low` (`#131313`) section on a `surface` background.
- Place a `surface-container-highest` (`#252626`) element (like a post or card) inside that section to create a soft, natural lift.

### The "No-Line" Rule

**Prohibit 1px solid borders for sectioning.** Physical dividers are replaced by vertical whitespace or color shifts. If a boundary is strictly required for accessibility, use a "Ghost Border": the `outline-variant` (`#484848`) at 15% opacity.

### The "Glass & Gradient" Rule

For floating elements such as the Community Header or Modal overlays, use a semi-transparent `surface-container` with a `backdrop-blur` (20px+). This "Glassmorphism" ensures the UI feels integrated into the atmosphere, allowing the subtle `primary` blue of the header to bleed through.

## 3. Typography: The Editorial Voice

We use a high-contrast typography scale to create an authoritative, editorial feel. The primary typeface is **Inter**, paired with system-optimized sans-serif fonts for Chinese characters to ensure crispness and readability at all sizes.

- **Display/Headline:** Use `headline-lg` and `headline-md` sparingly for community names or major section headers. These should be `on-surface` (`#e7e5e4`) to command attention.
- **The Content Feed:** Primary post text uses `body-lg`. Secondary metadata (timestamps, member counts) uses `label-md` or `body-sm` with the `on-surface-variant` (`#acabaa`) token.
- **Contextual Contrast:** By maintaining a large gap between the brightness of primary text (`#e7e5e4`) and secondary text (`#acabaa`), we create a clear path for the eye to follow without needing decorative icons.

## 4. Elevation & Depth

Hierarchy is achieved through **Ambient Light** and **Tonal Stacking** rather than traditional drop shadows.

- **Ambient Shadows:** When an element must "float" (e.g., a context menu), use an extra-diffused shadow.
- *Blur:* 32px to 64px.
- *Opacity:* 4% to 8%.
- *Color:* Use a tinted version of `on-surface` rather than pure black.
- **The Layering Principle:**
- Level 0: `surface` (Main Background)
- Level 1: `surface-container-low` (Sidebars/Widgets)
- Level 2: `surface-container-highest` (Interactive Cards/Posts)
- Level 3: Glassmorphism (Floating Headers/Nav)

## 5. Components

### Cards & Lists

- **Rule:** Forbid divider lines.
- **Implementation:** Use a 24px–32px vertical gap to separate posts. Use `surface-container-highest` for the post background and `surface-container-low` for the widget background to create a "container within a container" feel.
- **Radius:** All containers must use `rounded-xl` (1.5rem) or `rounded-lg` (1rem) to maintain a soft, premium feel.

### Buttons

- **Primary:** Uses a subtle gradient from `primary` (`#adc6ff`) to `primary-container` (`#004395`). Shape is `full` (pill-shaped) for high-end distinction.
- **Tertiary/Ghost:** High-contrast `on-surface` text with no background. Interaction is indicated by a subtle `surface-variant` background on hover.

### Input Fields

- **Search/Post Box:** Integrated into the surface. Use `surface-container-highest` with a `rounded-md` radius. The border should be a "Ghost Border" (10% opacity `outline`).

### Community Header Card

- **Visual Soul:** This is the only area allowed to use a subtle blue accent. Use a soft gradient from `surface` to `primary-container` to create a "Glow" effect that feels calm and restrained.

## 6. Do’s and Don’ts

### Do

- **Do** use generous whitespace (24px+) between sidebar items to create a sense of luxury.
- **Do** use `rounded-full` for avatars and action chips to contrast against the `rounded-xl` structural cards.
- **Do** prioritize the Chinese typography’s line height (1.6 to 1.8) for maximum legibility in long-form posts.

### Don’t

- **Don’t** use pure white (`#FFFFFF`) for text; use `on-surface` (`#e7e5e4`) to prevent eye strain in dark mode.
- **Don’t** use 100% opaque, high-contrast borders. They break the "Quiet Curator" atmosphere.
- **Don’t** use standard shadows. If you can see the shadow’s edge, it is too harsh.
- **Don’t** crowd the right sidebar. If a widget isn't essential, omit it to preserve the "Minimalist" style.
