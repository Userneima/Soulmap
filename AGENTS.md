# Project Principles

## Scope Control

- Modify only the parts required to complete the user's request.
- Do not add UI blocks, states, content, or behaviors that were not requested.
- Allow only minimal adjacent changes when they are necessary to keep the result consistent, functional, and visually coherent.
- If a requested change would reasonably imply broader UI or interaction changes, stop at the requested scope unless the user explicitly asks to expand it.

## UI Sizing

- Size new UI windows, popovers, and overlays in proportion to the surrounding typography, controls, and panel scale.
- Do not make new floating UI noticeably larger than nearby components unless there is a clear functional reason or the user explicitly asks for it.
- When matching a reference popup, popover, or modal, default to sizing it two steps smaller than the first comfortable draft unless the reference clearly requires a larger size.
- Preserve deliberate outer spacing around floating UI.
- Do not place popovers or modal-like surfaces flush against the viewport bottom by default; keep a bottom margin consistent with the surrounding layout.
- When a reference image exists for a floating UI, lock the outer width, inner padding, and the size of the largest inner element to that reference before filling in content.
- Do not size a new floating UI from content comfort alone; first compare it against nearby inputs, panels, and buttons in the actual page.
- Before finishing a floating UI, explicitly sanity-check whether it is visually larger than the reference by more than one size step. If it is, shrink it before considering the task done.

## Consistency

- Match existing spacing, radius, border, shadow, and typography patterns before introducing new ones.
- Prefer extending existing components and styles over creating new visual patterns.
- Keep changes visually quiet unless the user explicitly asks for a stronger redesign.

## Validation

- After making UI changes, verify layout, alignment, spacing, and overflow against the surrounding page structure.
- Do not claim completion without checking that the change works in context.
