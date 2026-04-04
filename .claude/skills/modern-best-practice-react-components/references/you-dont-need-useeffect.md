# You Might Not Need useEffect — Reference

> **Core rule:** Effects are an escape hatch for synchronizing with _external_ systems (DOM, network, third-party widgets). If there is no external system involved, you probably don't need an Effect.

---

## 1. Transforming data for rendering

**❌ Avoid — redundant state + unnecessary Effect:**
```js
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);
```

**✅ Good — calculate during rendering:**
```js
const fullName = firstName + ' ' + lastName;
```

> If something can be calculated from existing props or state, don't put it in state. Calculate it during rendering instead. This avoids extra re-renders and keeps data in sync automatically.

---

## 2. Caching expensive calculations

**❌ Avoid:**
```js
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);
```

**✅ Good — use `useMemo` instead:**
```js
const visibleTodos = useMemo(
  () => getFilteredTodos(todos, filter),
  [todos, filter]
);
```

> `useMemo` skips re-running the function unless its dependencies change. Use it only when the calculation is measurably slow (>1ms). React Compiler can handle this automatically in many cases.

---

## 3. Resetting all state when a prop changes

**❌ Avoid — resetting state in an Effect:**
```js
useEffect(() => {
  setComment('');
}, [userId]);
```

**✅ Good — pass a `key` to force remount:**
```js
export default function ProfilePage({ userId }) {
  return <Profile userId={userId} key={userId} />;
}
```

> When `key` changes, React destroys and recreates the component, resetting all state automatically. No Effect needed.

---

## 4. Adjusting partial state when a prop changes

**❌ Avoid:**
```js
useEffect(() => {
  setSelection(null);
}, [items]);
```

**✅ Better — store an ID, derive the value during rendering:**
```js
const [selectedId, setSelectedId] = useState(null);
const selection = items.find(item => item.id === selectedId) ?? null;
```

> Derive values from minimal state rather than synchronizing state variables with Effects.

---

## 5. Handling user events

**❌ Avoid — event-specific logic inside an Effect:**
```js
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to the shopping cart!`);
  }
}, [product]);
```

**✅ Good — put it directly in the event handler:**
```js
function handleBuyClick() {
  addToCart(product);
  showNotification(`Added ${product.name} to the shopping cart!`);
}
```

> Ask yourself: does this code run because the component was *displayed*, or because the user *did something*? If it's user-triggered, it belongs in an event handler.

---

## 6. Chains of Effects adjusting state

**❌ Avoid — Effects triggering each other:**
```js
useEffect(() => {
  if (card !== null && card.gold) setGoldCardCount(c => c + 1);
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) { setRound(r => r + 1); setGoldCardCount(0); }
}, [goldCardCount]);
```

**✅ Good — calculate everything in the event handler:**
```js
function handlePlaceCard(nextCard) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

> Effect chains cause multiple unnecessary re-renders and become fragile as requirements change. Consolidate logic into the event handler.

---

## 7. Notifying parent components about state changes

**❌ Avoid — calling `onChange` from an Effect:**
```js
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);
```

**✅ Good — update both states in the same event handler:**
```js
function updateToggle(nextIsOn) {
  setIsOn(nextIsOn);
  onChange(nextIsOn);
}
```

> Or better yet, lift state up so the parent fully controls the component.

---

## 8. Passing data to a parent component

**❌ Avoid — child fetches data and sends it up via Effect:**
```js
useEffect(() => {
  if (data) onFetched(data);
}, [data, onFetched]);
```

**✅ Good — fetch in the parent, pass data down:**
```js
function Parent() {
  const data = useSomeAPI();
  return <Child data={data} />;
}
```

> Data should flow downward. Passing data up through Effects makes the data flow hard to trace.

---

## 9. Subscribing to an external store

**❌ Avoid — manual subscription in an Effect:**
```js
useEffect(() => {
  function updateState() { setIsOnline(navigator.onLine); }
  window.addEventListener('online', updateState);
  window.addEventListener('offline', updateState);
  return () => {
    window.removeEventListener('online', updateState);
    window.removeEventListener('offline', updateState);
  };
}, []);
```

**✅ Good — use `useSyncExternalStore`:**
```js
const isOnline = useSyncExternalStore(
  subscribe,
  () => navigator.onLine,
  () => true
);
```

---

## 10. Sending a POST request triggered by a user action

**❌ Avoid:**
```js
useEffect(() => {
  if (jsonToSubmit !== null) {
    post('/api/register', jsonToSubmit);
  }
}, [jsonToSubmit]);
```

**✅ Good — call directly in the event handler:**
```js
function handleSubmit(e) {
  e.preventDefault();
  post('/api/register', { firstName, lastName });
}
```

> Only analytics events that fire because the component was *displayed* belong in an Effect with `[]`. Requests caused by user interactions belong in event handlers.

---

## Quick decision checklist

| Situation | Solution |
|---|---|
| Value derivable from props/state | Calculate during render |
| Expensive derivation | `useMemo` |
| Reset all state on prop change | Pass `key` |
| Reset partial state on prop change | Derive from minimal state |
| Logic runs on user interaction | Event handler |
| Multiple Effects triggering each other | Consolidate into event handler |
| Parent needs child's state | Lift state up |
| Subscribe to browser/third-party store | `useSyncExternalStore` |
| Fetch data (needs sync with props) | Effect **with cleanup** to avoid race conditions |