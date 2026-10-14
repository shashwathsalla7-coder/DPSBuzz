# DPS Buzz — Architecture & Technical Design

## 1. High-Level Architecture Overview

DPS Buzz is built with **Next.js 16 (App Router)** and **Tailwind CSS v4**, operating on strict design tokens and centralized state management.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router                │
│  (auth) / (main) / admin / styleguide / not-found      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Shared UI Layer                        │
│ Button · Input · Avatar · Chip · Card · Sheet · Tabs  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│              Design System & Tokens                    │
│   src/config/tokens.ts · src/config/school.ts          │
│   globals.css (CSS Custom Properties & @theme)         │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│              Central Data Store & Auth                 │
│      src/lib/dataStore.ts (Production LocalStorage     │
│      + Schema-validated Supabase Integration Layer)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Tokenized Corner Radii System

Overriding generic 16–24px card radii in favor of restrained, friendly proportions:
- `4px` (`--r-xs`): Notice cards and small category tags
- `6px` (`--r-sm`): Chips and small controls
- `10px` (`--r-md`): Buttons, inputs, post media, group avatars, segmented controls
- `12px` (`--r-lg`): Feed cards, student profile photos
- `14px` (`--r-bubble`): Chat message bubbles
- `16px` (`--r-sheet`): Bottom sheets (top corners only)
- `9999px` (`--r-full`): People avatars and story rings only

---

## 3. Visual Separation & Distinct Object Shapes

Different product entities have distinct visual geometries:
- **People**: Circles (`9999px`) with deterministic 2-color initial avatars.
- **Groups**: Rounded squares (`10px`) with category identifiers.
- **Notices**: Folded-corner paper (`4px`) with a 3px left edge matching 1 of 6 notice categories.
- **Badges**: Flat stamps with a 2px outline and subtle 1° tilt.

---

## 4. Security & Safety Architectural Guarantees

1. **Child Safety by Design**:
   - CHILDLINE India 1098 integrated into safety sheet.
   - 2-tap report flow for posts, comments, messages, and profiles.
   - Content with 3+ reports automatically hidden.
   - Message requests folder: no read receipt sent until accepted.
2. **Admission Number Privacy**:
   - Admission numbers are verified only during registration against the school diary roster.
   - They are never rendered or returned in public profile queries.
3. **Finite Feed Design**:
   - No algorithmic infinite scroll. The feed terminates with *"That's everything for now."*
