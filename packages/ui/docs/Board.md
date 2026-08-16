---
category: Layout
---

# Board

The baize table every piece sits on — the page-level surface, with the rail flush against its left edge.

Wood is structure, paint is action, paper is data. When designing a new screen, decide which of the three each element is and the component choice follows.

```jsx
<Board rail={<Rail brand={<strong>trakkit</strong>}>…</Rail>}>
  <Plaque>Board</Plaque>
  <Well label="Today">…</Well>
</Board>
```
