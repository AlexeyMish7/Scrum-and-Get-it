# QA Checklist — AI Resume Editor (Sprint 2)

Use this list to verify acceptance criteria and UX quality.

## Steps & Navigation

- [ ] Stepper shows correct current step and allows Next/Back where appropriate
- [ ] Auto-advance: Selecting a draft moves to Generate; first successful generation moves to Apply
- [ ] Preview and Versions/Export render only in Step 4
- [ ] Skip links work: generation controls, preview, versions/export

## Generation & Apply

- [ ] Generation runs with chosen job/tone/focus; errors surface with helpful messages
- [ ] Apply Skills updates draft order (or reports no changes)
- [ ] Apply Summary sets draft summary (or reports no changes)
- [ ] Merge Experience opens and merges selected bullets
- [ ] Segment status shows base/skills/experience states

## Preview & Versions

- [ ] AI, Formatted, Draft, Variations, Skills, Raw tabs behave as expected
- [ ] Diff/Compare dialog opens from Versions list, shows changes, and lets you choose version
- [ ] Attach to Job links selected version to job materials (check DB row or UI snackbar)

## Export

- [ ] Export PDF produces a file that visually matches the formatted preview
- [ ] Export DOCX produces a Word file with expected sections and bullets
- [ ] After export, a document row is created and linked to job materials

## Accessibility

- [ ] Landmarks present: navigation (left), main (preview), complementary (versions)
- [ ] Compare dialog traps focus, supports Escape to close, restores previous focus
- [ ] Screen reader announcements for key actions (exports, link operations)
- [ ] Tutorial region is focusable, has aria-labelledby, and provides Skip/Start options

## Dark Mode & Theming

- [ ] Preview background and text are legible in dark mode
- [ ] Chips, dividers, and buttons have sufficient contrast
- [ ] No theme clashing or hardcoded colors that reduce readability

## Stability

- [ ] No console errors in typical flows
- [ ] Typecheck passes
- [ ] Basic performance acceptable on mid-range laptops (no noticeable jank)

## Notes

- For linking checks, verify `job_materials` and `documents` rows exist for the latest export.
- For exports, file names should include job id when available.
