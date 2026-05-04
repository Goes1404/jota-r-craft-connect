# Palette's Journal

## 2026-05-03 - AICopilot Chat Widget Accessibility
**Learning:** A chat widget on every page with unlabeled icon buttons, a deprecated keyboard event handler, and no `aria-live` region is completely silent to screen readers — the AI's replies are never announced.
**Action:** Added `aria-label` to the 4 icon-only buttons (trigger, minimize, close, send), upgraded `onKeyPress` → `onKeyDown` (with `!e.shiftKey` guard), added `aria-label` to the message input, added `role="log" aria-live="polite"` to the messages container, `aria-busy` on the send button, and `focus-visible` rings on interactive controls. 10 lines changed total.
