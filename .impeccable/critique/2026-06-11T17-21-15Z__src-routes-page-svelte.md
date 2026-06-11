---
target: main dashboard page (src/routes/+page.svelte)
total_score: 21
p0_count: 0
p1_count: 2
p2_count: 4
p3_count: 2
timestamp: 2026-06-11T17-21-15Z
slug: src-routes-page-svelte
---
# Critique: Dashboard page (`src/routes/+page.svelte`)

## Design Health Score: 21/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Theme toggle mislabeled; no save/delete confirmation feedback |
| 2 | Match System / Real World | 3/4 | Clear writer terminology; first-run could be more welcoming |
| 3 | User Control and Freedom | 2/4 | No confirmation before destructive delete; no undo |
| 4 | Consistency and Standards | 3/4 | Consistent component vocabulary; matches editor patterns |
| 5 | Error Prevention | 2/4 | Delete has no guardrails; import has good error handling |
| 6 | Recognition Rather Than Recall | 2/4 | Stories enumerated well; import format is opaque to new users |
| 7 | Flexibility and Efficiency of Use | 1/4 | No keyboard shortcuts; no bulk ops; no search/filter |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean restrained palette; empty state is functional but flat |
| 9 | Error Recovery | 2/4 | Import errors displayed inline; delete is unrecoverable |
| 10 | Help and Documentation | 1/4 | No visible help, onboarding, or documentation anywhere |

## Anti-Patterns Verdict

**LLM assessment**: Not obviously AI-generated. The restrained palette, single typeface, and functional layout are deliberate. But the dashboard reads as safe to the point of blandness — no visual personality reflects the brand personality ("playful, modern, fast").

**Deterministic scan**: Clean — no codex defects detected.

## What's Working
1. Clean, restrained chrome. The header is minimal and doesn't compete with content.
2. Consistent visual language with the editor (card radii, border weights, spacing tokens match).
3. Smart dashed "New Story" card at end of populated grid — signals room for more.

## Priority Issues

### [P1] Delete has no confirmation and breaks on touch
Delete button is `opacity-0 group-hover:opacity-100` — invisible on touch devices. No confirmation before destructive action. High risk for accidental data loss.

### [P1] No keyboard shortcuts or power-user paths
Zero shortcuts on the dashboard (n, i, /). No search. No bulk operations.

### [P2] Theme toggle mislabels its target
Static aria-label "Switch to dark" regardless of current theme.

### [P2] Card titles truncated mid-word
`truncate` on story titles clips words mid-character. Contradicts "words come first" principle.

### [P2] Cards lack hover elevation
`transition-all duration-200` does nothing visible — no shadow, no border change, no translate. Cards feel dead.

### [P3] Empty state is purely functional
Generic document icon + "No stories yet" says nothing about what makes Act different.

### [P3] "Screenplay" badge has no affordance
Same muted text as stats, no interaction, no visual distinction.

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts. No bulk deletion. No search. No way to pin/reorder stories.

**Jordan (First-Timer)**: Empty state doesn't explain product. "Import" is opaque. Templates shown without explanation.

**Sam (Accessibility-Dependent)**: Theme toggle mislabeled. Delete invisible without hover/focus. No visible focus style on grid cards.

## Minor Observations
- Generous padding and max-width work well at all screen sizes.
- Import error banner using `--warm` is one of the few uses of color — effective.
- Loading spinner matches editor consistency.

## Questions to Consider
1. What if the empty state sold the product rather than just announcing emptiness?
2. Does this dashboard need a command palette for power users?
3. What would make this feel playful without adding decoration?
