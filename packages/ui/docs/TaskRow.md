---
category: Data
---

# TaskRow

One task on the board. Paper, not a piece: flat, 4px radius, a hairline rule between rows and deliberately no edge.

This is the most-repeated element in the product and the reason rows stay flat — giving forty rows the piece treatment makes a board impossible to scan.

`emphasis` drives the 4px leading stripe. Always pair it with a matching `Chip`; never encode priority with the stripe alone.

```jsx
<TaskRow
  title="Fix cream-on-wood contrast in the rail"
  meta={<><span>ana</span><span>due today</span></>}
  emphasis="high"
  end={<><ProjectChip projectId="design-system">design-system</ProjectChip><Chip tone="flag">high</Chip></>}
/>
```
