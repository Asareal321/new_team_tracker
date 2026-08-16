---
category: Foundations
---

# DSRoot

Wraps everything. Establishes base typography and, with `theme="dark"`, the dark token set.

Every screen must be inside a `DSRoot` — all component colour comes from custom properties defined here, so a component rendered outside one falls back to unstyled browser defaults. Import `@trakkit/ui/styles.css` once at the app entry.

```jsx
<DSRoot theme="dark">
  <Board rail={<Rail>…</Rail>}>…</Board>
</DSRoot>
```
