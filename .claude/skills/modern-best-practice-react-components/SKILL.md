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

## 13. Component interfaces
* Define TS interfaces for props

## 14. SOLID Principles for React Components

### Single Responsibility (SRP)

* Each component should have one reason to change
* **Page/Tab components** — layout, coordination, navigation callbacks
* **Form components** — form state, validation, submission, field rendering
* **Display components** — presenting data, no data fetching or mutation logic
* Never mix orchestration (tab switching, page routing) with data mutation (API calls, form handling) in the same component

### Open/Closed (OCP)

* Components should be open for extension via props/composition, closed for modification
* Use `children`, render props, or slot patterns instead of adding flags to existing components

### Liskov Substitution (LSP)

* Components sharing an interface (e.g., form variants) should be interchangeable without breaking the parent

### Interface Segregation (ISP)

* Keep prop interfaces focused — don't force consumers to pass props they don't use
* Split large prop interfaces into smaller, composed ones when a component serves multiple contexts

### Dependency Inversion (DIP)

* Components should depend on abstractions (callbacks like `onCreated`, `onSubmit`) not concrete implementations
* Parent components pass behavior down; child components don't reach up for context they don't own

## 15. Checklist

* [ ] Component is small
* [ ] Single responsibility respected
* [ ] No unnecessary state
* [ ] No unnecessary effects
* [ ] Hooks extracted
* [ ] Performance considered
* [ ] Accessible
* [ ] Tested

---
