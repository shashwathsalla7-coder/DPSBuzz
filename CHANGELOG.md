# DPS Buzz — Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-10-12 (Master Prompt Quality Pass)

### Changed
- **Corner Radii Token Override**: Overrode Section 6 of `DESIGN.md` with restrained, friendly maximum 12px radii (4px notice cards, 6px chips, 10px buttons/inputs/media/groups, 12px cards, 14px chat bubbles, 16px bottom sheets).
- **Shared UI Components**: Rebuilt shared components once in `src/components/ui/` (`Button`, `Input`, `Avatar`, `Chip`, `Card`, `Sheet`, `Toast`, `Tabs`, `EmptyState`, `Skeleton`) eliminating copy-pasted styles and hardcoded dimensions.
- **Font Evaluation Suite**: Added side-by-side font testing for Display (Bricolage Grotesque vs Fraunces vs Outfit) and Body (Hanken Grotesk vs Plus Jakarta Sans vs DM Sans) on `/styleguide`.
- **Unit Testing**: Implemented native test suite in `tests/unit.test.mjs` verifying profanity filtering, rate limiting, Star Board ranking calculation, and diary roster matching (9/9 passing).

## [0.1.0] - 2026-10-11 (DESIGN.md Visual & Copy Redesign)

### Added
- Complete visual styling conforming to `DESIGN.md`: zero purple/pink gradients, zero glassmorphism, flat warm colors (`#FAF7F2` light, `#14161C` dark).
- Unseen story ring (only permitted gradient in product).
- Folded-corner paper notice cards with 3px category-colored left edge.
- Indian school student authentic copy (*assembly, free period, tiffin break, unit test, school diary, canteen*).
- Star Board 3:2:1 podium with Kalam *"Star of the week"* annotation.
- Dedicated Admin Console and `/admin/login` for faculty with live CSV roster preview and moderation queue.
