# DPS Buzz — Architectural & Design Decisions (ADR Log)

## Decision 1: Corner Radius Overrides (Master Prompt)
- **Context**: The product owner noted that standard 16–24px card corners can look bloated or generic.
- **Decision**: Capped all card and container corners at a maximum of 12px (`--r-lg`), with buttons and inputs at 10px (`--r-md`), chips at 6px (`--r-sm`), notices at 4px (`--r-xs`), chat bubbles at 14px (`--r-bubble`), bottom sheets at 16px (`--r-sheet`), and people avatars as circles (`--r-full`).
- **Rationale**: Retains the friendly school feel while looking crisp, restrained, and intentional.

## Decision 2: Display & Body Font Evaluation
- **Display Slot**:
  - *Option 1 (Recommended)*: **Bricolage Grotesque**. Humanist personality, bouncy ink traps, perfect fit for school wordmark and display headers without looking generic.
  - *Option 2 (Alternative A)*: **Fraunces**. Warm editorial serif, looks slightly too collegiate/academic for 11–16-year-olds.
  - *Option 3 (Alternative B)*: **Outfit**. Clean geometric sans, but feels closer to a standard tech startup than an authentic Indian school notebook.
- **Body Slot**:
  - *Option 1 (Recommended)*: **Hanken Grotesk**. High x-height, open apertures, highly legible on low-budget Android screens on school Wi-Fi.
  - *Option 2 (Alternative A)*: **Plus Jakarta Sans**. Very clean, but has wider letterforms that reduce text density in chat bubbles.
  - *Option 3 (Alternative B)*: **DM Sans**. Geometric and balanced, serves as a strong backup.

## Decision 3: Zero Invented School Facts
- **Context**: A common AI template mistake is inventing school crests, Latin mottos, or arbitrary house names.
- **Decision**: Stored all school identity in `src/config/school.ts`. Disabled the house system (`hasHouses: false`) until confirmed by the school administration, replacing house feeds with real class sections (e.g. `Class 10-A`, `Class 8-A`).

## Decision 4: Neutral Rank Changes on Star Board
- **Context**: Showing red arrows or downward indicators for rank decreases creates anxiety for 11–16-year-olds.
- **Decision**: Drops are displayed in muted secondary text without red color or downward arrows. Positive jumps are displayed with a simple neutral `+3`.

## Decision 5: Dedicated /admin/login Route
- **Context**: Faculty and computer lab supervisors need a distraction-free, dense management console.
- **Decision**: Implemented a dedicated `/admin/login` page separate from the student diary login.
