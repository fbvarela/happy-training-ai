# OpenSpec: Happy Training AI — UX & Code Quality Overhaul

## Summary

Make the app more useful, organized, and user-friendly by auditing code quality, reorganizing UI elements for consistency, shifting the layout toward a training-course-oriented experience, professionalizing the CSS, and replacing text buttons with Lucide icons where appropriate.

## Context

The current app has inconsistent UI patterns (e.g., "hide resource" button position varies), duplicated or redundant code paths, and a layout that doesn't clearly communicate its purpose as a training-course organizer. The CSS needs a more professional polish, and many text-only buttons can be replaced with Lucide icons for better scannability.

## Requirements

### R1 — Code Audit & Cleanup

- [ ] Identify and remove duplicate options, redundant code, and dead branches.
- [ ] Consolidate any repeated UI component patterns into shared components.
- [ ] Flag any TODO/FIXME comments for resolution or tracking.
- [ ] Ensure consistent naming conventions across `src/lib/` modules.

### R2 — UI Consistency

- [ ] Standardize button placement: all action buttons (hide, delete, edit, etc.) must appear on the **right** side of cards and rows.
- [ ] Ensure consistent spacing, alignment, and card structure across all views (resources, topics, repos, snippets).
- [ ] Audit all pages for layout drift and fix inconsistencies.

### R3 — Training-Course-Oriented Reorganization

- [ ] Restructure the primary navigation and landing experience around **courses** rather than raw resource lists.
- [ ] Introduce or surface a "course" concept: group resources under course-like containers with clear progress indicators.
- [ ] Update page titles, breadcrumbs, and empty states to reflect a course-learning mental model.
- [ ] Ensure the topic hierarchy maps naturally to course modules/lessons.

### R4 — Professional CSS Polish

- [ ] Adopt a refined color palette (professional, accessible, consistent with the Happy Factory brand tokens).
- [ ] Improve typography: consistent font sizes, weights, and line heights.
- [ ] Add subtle shadows, borders, and hover states for depth and interactivity feedback.
- [ ] Ensure responsive behavior is polished on mobile and tablet breakpoints.
- [ ] Verify sufficient color contrast (WCAG AA minimum).

### R5 — Icon-First Buttons

- [ ] Replace text-only action buttons with Lucide icons where the action is universally understood (e.g., 🗑️ delete, ✏️ edit, 👁️ toggle visibility, 🔗 link, ⬇️ download).
- [ ] Keep text labels as `aria-label` on icon-only buttons for accessibility.
- [ ] Use the existing `lucide-react` dependency; do not add new icon libraries.
- [ ] Maintain a consistent icon size scale (e.g., `w-4 h-4` for inline actions, `w-5 h-5` for primary actions).

## Output Format

Deliver a diff or set of changed files with:
1. A brief commit message per logical change group.
2. Before/after screenshots or descriptions for UI changes (if applicable).
3. A summary of removed/consolidated code.

## Constraints

- Do not alter the database schema or API contracts unless a bug requires it.
- Preserve all existing functionality; this is a refactor + polish, not a feature add.
- Keep changes within the Next.js 16 / React 19 / Tailwind v4 stack.
- Use existing brand tokens and auth patterns from the Happy Factory suite.