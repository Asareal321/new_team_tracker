---
category: Data
---

# ProjectChip

A chip carrying a project's identity colour, assigned by hashing `projectId` into one of nine slots, so a project is always "the teal one."

The colour arrives via CSS custom properties on a slot class, never an inline style — that is what makes the dark variant follow the theme. Project hues live in the cool half of the wheel plus rose; the warm quadrant is reserved for state, so a project can never be misread as a priority.
