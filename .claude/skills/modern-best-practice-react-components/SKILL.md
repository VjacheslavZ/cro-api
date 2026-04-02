---
name: modern-best-practice-react-components
description: Build clean, modern React components that apply common best practices and avoid common pitfalls like unnecessary pitfalls like unnecessary re-renders, prop drilling, and state management issues.
---

# Writing react components
We're using modern React (19+) and we're following common best practices focused on clarity, correctness, and maintainability.

# React 19+ Best Practices

## 1. Component Design

### Prefer Functional Components

Always use functional components with hooks.

### Keep Components Small

* One responsibility per component
* Extract logic into hooks
* Extract UI into subcomponents

### Use Composition Over Inheritance

---

## 2. Hooks Best Practices

### Use Custom Hooks for Reusable Logic

### Follow Hook Rules

* Call hooks only at top level
* Never inside conditions
* Never inside loops

---

## 3. State Management

### Keep State Minimal

Store only necessary data.

### Lift State Up When Needed

Share state between components properly.

### Avoid Deeply Nested State

Flatten state shape.

---

## 4. Performance Optimization

### Use `React.memo` Carefully

### Use `useCallback` for Stable Functions

### Use `useMemo` for Expensive Calculations

---

## 5. Effects Best Practices

### Avoid Unnecessary Effects

- See the ['You Might Not Need an Effect' reference](./references/you-dont-need-useeffect.md) for more details.

### Clean Up Effects

## 6. Naming Conventions

### Components

* PascalCase

### Hooks

* must start with `use`

### Files

* match component name
* `UserCard.jsx`

---

## 7. Props Best Practices

### Destructure Props

### Use Default Values

---

## 8. Error Handling

Use Error Boundaries

---

## 9. Avoid Anti-Patterns
* Mutating state 
* Too many props drilling
* Overusing context
* Large components
* Inline heavy logic in JSX

---

## 10. Context Best Practices

Use context only for:

* Theme
* Auth
* Global settings

Avoid using context for:
* frequently changing data

---

## 11. Accessibility

* Use semantic HTML
* Add aria labels

---

## 12. General Principles

* Keep components pure
* Avoid side effects
* Prefer declarative code
* Optimize only when needed
* Write readable code first

---

## 13. Checklist

* [ ] Component is small
* [ ] No unnecessary state
* [ ] No unnecessary effects
* [ ] Hooks extracted
* [ ] Performance considered
* [ ] Accessible
* [ ] Tested

---
