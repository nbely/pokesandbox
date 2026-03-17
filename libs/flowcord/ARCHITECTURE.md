# FlowCord Architecture

This document explains how FlowCord works under the hood. It covers the session lifecycle, interaction loop, component ID management, rendering pipeline, and navigation system.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Session Lifecycle](#session-lifecycle)
- [The Interaction Loop](#the-interaction-loop)
- [Component ID Management](#component-id-management)
- [Rendering Pipeline](#rendering-pipeline)
- [Navigation System](#navigation-system)
- [State Architecture](#state-architecture)
- [Modal Handling](#modal-handling)
- [Lifecycle Hook Execution](#lifecycle-hook-execution)
- [Sub-Menu & Continuation System](#sub-menu--continuation-system)
- [Pagination System](#pagination-system)
- [Error Handling](#error-handling)

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FlowCord                                │
│  (Facade — delegates everything to MenuEngine)                  │
├─────────────────────────────────────────────────────────────────┤
│                        MenuEngine                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ MenuRegistry │ │ ActionReg.   │ │ HookRegistry (global)    │ │
│  │ name→factory │ │ (reserved)   │ │ onEnter, onLeave, etc.   │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Active Sessions Map<sessionId, MenuSession>                  ││
│  │  ┌─────────────────────────────────────────────────────────┐ ││
│  │  │ MenuSession (one per slash command invocation)          │ ││
│  │  │  • MenuStack (navigation history)                       │ ││
│  │  │  • MenuInstance (current menu + actions + state)         │ ││
│  │  │  • MenuRenderer (Discord message rendering)             │ ││
│  │  │  • LifecycleManager (hook emission)                     │ ││
│  │  │  • StateStore (session-wide state)                      │ ││
│  │  └─────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key Classes

| Class | Responsibility |
|-------|---------------|
| **FlowCord** | Public API facade; delegates to `MenuEngine` |
| **MenuEngine** | Manages registries, creates/destroys sessions, routes interactions |
| **MenuSession** | Core interaction loop for a single user session |
| **MenuInstance** | Runtime wrapper for a single menu definition (actions, modals, state) |
| **MenuBuilder** | Fluent API for defining menu configurations |
| **MenuRenderer** | Converts menu definitions into Discord message payloads |
| **MenuStack** | LIFO stack for navigation history |
| **StateStore** | Session-wide key-value store |
| **StateAccessor\<T\>** | Typed per-menu state wrapper |
| **LifecycleManager** | Emits lifecycle hooks (global + per-menu) |
| **ComponentIdManager** | Encodes/decodes session + menu info in component custom IDs |
| **NavigationTracer** | Optional debug logging of menu transitions |

---

## Session Lifecycle

A session begins when a user triggers a slash command and ends when the menu closes, times out, or is cancelled.

```
User runs /command
       │
       ▼
┌──────────────────────┐
│ FlowCord             │
│ .handleInteraction() │
│      │               │
│      ▼               │
│ MenuEngine           │
│  .handleInteraction()│
│      │               │
│      ▼               │
│ Creates MenuSession  │──── UUID session ID
│  .initialize()       │
│      │               │
│      ▼               │
│ interaction.          │
│   deferReply()       │
│      │               │
│      ▼               │
│ navigateTo(menuName) │──── Creates MenuInstance from factory
│      │               │
│      ▼               │
│ processMenus()       │──── Main interaction loop (see below)
│      │               │
│      ▼               │
│ Session ends         │──── Engine removes session from map
└──────────────────────┘
```

### Session States

A session transitions through these states:

1. **Initializing** — `deferReply()` called, first menu being created
2. **Active** — Processing the interaction loop
3. **Completed** — User closed the menu or called `close()`
4. **Cancelled** — User pressed the Cancel button
5. **Timed out** — No interaction within the timeout window

---

## The Interaction Loop

The heart of FlowCord is the `processMenus()` loop inside `MenuSession`. It runs continuously until the session ends:

```
while (session is active) {
    │
    ▼
┌───────────────────────┐
│ 1. Check for pending  │
│    modal interaction   │──── If modal is active, await modal submit
│         │              │     then continue loop
│         ▼              │
│ 2. RENDER CYCLE        │
│    a. beforeRender     │──── Lifecycle hook
│    b. Run setEmbeds/   │
│       setButtons/      │──── Build Discord message payload
│       setLayout        │
│    c. Send or update   │──── Discord API call
│       message          │
│    d. afterRender      │──── Lifecycle hook
│         │              │
│         ▼              │
│ 3. AWAIT INTERACTION   │
│    Collect component   │──── Race: button/select vs timeout
│    interaction         │     (or message reply, or mixed)
│         │              │
│         ▼              │
│ 4. DISPATCH            │
│    a. Parse customId   │──── Extract session/menu/component info
│    b. Resolve action   │──── Look up action callback
│    c. Execute action   │──── Run the callback
│    d. onAction hook    │──── Lifecycle hook
│         │              │
│         ▼              │
│ 5. CHECK NAVIGATION    │
│    Did action call     │──── If yes: loop continues with new menu
│    goTo/goBack/close?  │──── If no: re-render current menu (auto-refresh)
└───────────────────────┘
```

### Key Behaviors

- **Auto re-render**: If an action does NOT navigate (no `goTo`, `goBack`, `close`), the loop automatically re-runs the render cycle. This is why you can just mutate `ctx.state` in a button action and the embed updates.
- **Navigation detection**: The session tracks a `_didNavigate` flag. Navigation actions set it to `true`. The loop checks this flag to decide whether to re-render or start a new menu.
- **Hard refresh**: `ctx.hardRefresh()` destroys and recreates the current `MenuInstance` from the factory function. Useful when the menu structure changes (e.g., different buttons based on updated data).

---

## Component ID Management

Discord requires unique `customId` strings for interactive components. FlowCord automatically manages these by encoding session metadata into each component's ID.

### Format

```
fc:{sessionId}:{menuName}:{componentIndex}
```

Example: `fc:a1b2c3d4:settings:3`

### How It Works

1. **On render**: `ComponentIdManager` assigns sequential indices to each interactive component (buttons, selects). The session ID and menu name are embedded in the custom ID.
2. **On interaction**: `ComponentIdManager.parse(customId)` extracts the session ID, menu name, and component index.
3. **Routing**: `MenuEngine.routeComponentInteraction()` uses the parsed session ID to find the correct `MenuSession`, which then uses the component index to resolve the action callback.

This encoding scheme:
- Prevents cross-session collisions
- Allows the engine to route interactions without a central registry
- Supports multiple concurrent sessions for different users

---

## Rendering Pipeline

The `MenuRenderer` handles conversion from FlowCord's internal representation to Discord API payloads.

### Embeds Mode

```
MenuDefinition                Discord Payload
┌─────────────────┐           ┌──────────────────────┐
│ setEmbeds(ctx)   │────▶     │ embeds: [...]         │
│ → EmbedBuilder[] │           │                      │
│                  │           │ components: [         │
│ setButtons(ctx)  │────▶     │   ActionRow(buttons), │
│ → ButtonConfig[] │           │   ActionRow(buttons), │
│                  │           │   ActionRow(select),  │
│ setSelectMenu()  │────▶     │   ActionRow(reserved) │
│ → SelectConfig   │           │ ]                    │
│                  │           │                      │
│ reserved buttons │────▶     │ (Cancel, Back,        │
│ (auto-generated) │           │  Next, Previous)     │
└─────────────────┘           └──────────────────────┘
```

### Layout Mode

```
MenuDefinition                Discord Payload
┌─────────────────┐           ┌──────────────────────┐
│ setLayout(ctx)   │────▶     │ components: [         │
│ → ComponentConfig│           │   Container(...),     │
│                  │           │   Section(...),       │
│                  │           │   ActionRow(buttons), │
│                  │           │   Separator,          │
│                  │           │   TextDisplay,        │
│                  │           │ ]                    │
│                  │           │ flags: IsComponentsV2 │
└─────────────────┘           └──────────────────────┘
```

### Button Layout Algorithm

Discord allows max 5 buttons per action row and max 5 action rows total. The renderer:
1. Collects all buttons from `setButtons()`
2. Applies pagination if configured (split into pages)
3. Injects reserved buttons (Cancel, Back, Next, Previous)
4. Groups into action rows of 5
5. Validates the total doesn't exceed Discord's limits

---

## Navigation System

### Menu Stack

Navigation uses a LIFO (Last In, First Out) stack:

```
User flow: Main → Settings → Profile → (Back) → Settings → (Back) → Main

Stack after each step:
1. Main opened:     []                  (Main is current, not in stack)
2. → Settings:      [Main]              (Main pushed, Settings is current)
3. → Profile:       [Main, Settings]    (Settings pushed, Profile is current)
4. ← Back:          [Main]              (Settings popped & restored as current)
5. ← Back:          []                  (Main popped & restored as current)
6. ← Back:          (session closes)    (stack empty, no fallback)
```

### History Tracking

Only menus with `.setTrackedInHistory()` are pushed onto the stack. This lets you create "pass-through" menus (like confirmations) that don't appear in the back-navigation path.

### Fallback Menus

When `goBack()` is called on an empty stack:
- **No fallback**: Session closes
- **With fallback**: Navigates to the fallback menu instead of closing

This is useful for menus accessible both directly (via slash command) and via navigation from another menu.

### Menu Recreation on goBack

When popping a menu from the stack, FlowCord does NOT reuse the old instance. It re-runs the factory function with the saved options to create a fresh `MenuInstance`. This ensures the menu reflects current data.

---

## State Architecture

```
┌─────────────────────────────────────────────┐
│ MenuSession                                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ sessionState: StateStore               │  │
│  │ (shared across all menus in session)   │  │
│  │                                        │  │
│  │  .get('key')  .set('key', value)       │  │
│  │  .has('key')  .delete('key')           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ MenuInstance (current menu)            │  │
│  │                                        │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ state: StateAccessor<TState>     │  │  │
│  │  │ (scoped to this menu instance)   │  │  │
│  │  │                                  │  │  │
│  │  │  .get('count')  → typed value    │  │  │
│  │  │  .set('count', 5)               │  │  │
│  │  │  .merge({ count: 5, name: 'x' })│  │  │
│  │  │  .current → readonly snapshot    │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### State Lifecycle

- **Menu state** is created fresh for each `MenuInstance`. When you navigate away and come back, state is reset (the factory re-runs).
- **Session state** persists for the entire session lifetime. Use it for cross-menu communication.

---

## Modal Handling

Modals follow a special flow because Discord requires them to be shown in response to an interaction (not deferred):

```
Button click (opensModal: true)
       │
       ▼
┌─────────────────────────┐
│ Session detects modal    │
│ trigger button           │
│       │                  │
│       ▼                  │
│ interaction.showModal()  │──── Discord shows modal to user
│       │                  │
│       ▼                  │
│ Set _isModalActive=true  │
│       │                  │
│       ▼                  │
│ Loop re-enters           │
│ awaitModalInteraction()  │──── Wait for submit or timeout
│       │                  │
│       ▼                  │
│ Modal submitted          │
│       │                  │
│       ▼                  │
│ Execute onSubmit()       │──── Run modal's callback
│       │                  │
│       ▼                  │
│ Auto re-render           │──── Menu updates with new state
└─────────────────────────┘
```

### Key Modal Behaviors

- **Auto re-render**: After `onSubmit` runs, the menu automatically re-renders. You don't need to call `hardRefresh()`.
- **State mutation**: The `onSubmit` callback receives the same `ctx` as other callbacks. Just mutate `ctx.state` or `ctx.sessionState`.
- **Multiple modals**: Each modal has an `id` field. Buttons reference modals via `opensModal: 'modal-id'`.
- **Validation in onSubmit**: If validation fails, set an error message in state and return. The auto re-render will display it.

---

## Lifecycle Hook Execution

### Execution Order

Hooks fire in a defined order during the menu lifecycle:

```
Menu factory called
       │
       ▼
    setup()                  ← One-time initialization
       │
       ▼
    onEnter                  ← Menu entered
       │
       ▼
┌─── RENDER LOOP ──────────────────────────┐
│      │                                    │
│      ▼                                    │
│   beforeRender             ← Before build │
│      │                                    │
│      ▼                                    │
│   (build embeds/buttons/layout)           │
│   (send/update Discord message)           │
│      │                                    │
│      ▼                                    │
│   afterRender              ← After send   │
│      │                                    │
│      ▼                                    │
│   (await interaction)                     │
│      │                                    │
│      ▼                                    │
│   (execute action)                        │
│      │                                    │
│      ▼                                    │
│   onAction                 ← After action │
│      │                                    │
│      ▼                                    │
│   onNext / onPrevious      ← Pagination   │
│      │                                    │
│      ▼                                    │
│   (if no navigation: loop back to render) │
└───────────────────────────────────────────┘
       │
       ▼ (navigation or close)
    onCancel                 ← If cancelled
       │
       ▼
    onLeave                  ← Menu leaving
```

### Global vs Menu Hooks

The `LifecycleManager` fires hooks in this order:
1. **Global hooks** (registered via `HookRegistry`) — fire for every menu
2. **Menu-specific hooks** (defined via `MenuBuilder.onEnter()`, etc.) — fire for this menu only

---

## Sub-Menu & Continuation System

Sub-menus enable parent–child relationships between menus where the parent can receive a result from the child.

### Flow

```
Parent Menu
    │
    ▼
ctx.openSubMenu('child', {
  someData: 123,
  onComplete: async (parentCtx, result) => {
    // Handle child's result
  }
})
    │
    ▼
┌─────────────────────────────────────┐
│ Session pushes continuation:        │
│   { menuName: 'child',             │
│     onComplete: <callback> }        │
│                                     │
│ Session navigates to 'child'        │
│ (parent pushed to stack)            │
└─────────────────────────────────────┘
    │
    ▼
Child Menu runs
    │
    ▼
ctx.complete({ picked: 'item-42' })
    │
    ▼
┌─────────────────────────────────────┐
│ Session calls goBack() with result  │
│                                     │
│ Parent menu popped from stack       │
│ Parent menu re-created from factory │
│                                     │
│ Continuations executed:             │
│   onComplete(parentCtx, result)     │
│   → parentCtx.state.set(...)        │
│                                     │
│ Parent re-renders with updated state│
└─────────────────────────────────────┘
```

### Continuation Stack

Continuations are stored as an array on the session. Multiple sub-menus can push continuations. When `goBack()` fires, the session checks if the completing menu name matches any continuation and executes the callback.

---

## Pagination System

### Button Pagination

When `setButtons()` is called with `{ pagination: { perPage: N } }`:

1. The renderer collects all buttons from the callback
2. Separates **fixed-position** buttons (`fixedPosition: 'start'` or `'end'`)
3. Splits remaining buttons into pages of size N
4. On each render, shows only the current page's buttons + fixed buttons
5. Automatically adds Next/Previous reserved buttons

```
All buttons: [A, B, C, D, E, F, G]  (perPage: 3)
Fixed start: [X]
Fixed end:   [Y]

Page 1: [X] [A] [B] [C] [Y] [◀ Prev] [Next ▶]
Page 2: [X] [D] [E] [F] [Y] [◀ Prev] [Next ▶]
Page 3: [X] [G] [Y]         [◀ Prev]
```

### List Pagination

List pagination is controlled by the menu, not the renderer. The `PaginationState` object is computed before render:

```ts
interface PaginationState {
  currentPage: number;    // 1-indexed
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;     // For Array.slice() (inclusive)
  endIndex: number;       // For Array.slice() (exclusive)
}
```

The `setEmbeds()` or `setLayout()` callback reads `ctx.pagination` and slices data accordingly. FlowCord manages the current page and adds Next/Previous buttons automatically.

---

## Error Handling

### Session-Level Error Handler

```ts
const flowcord = new FlowCord({
  client,
  onError: async (session, error) => {
    // Custom error handling
    console.error(`Session ${session.id} error:`, error);
  },
});
```

If no `onError` is provided, FlowCord uses a default handler that replies with an ephemeral error message.

### Guard Errors

`GuardFailedError` is a special error type thrown by guard actions. It is caught by the session's action dispatcher and does NOT propagate to the error handler. Instead, the menu simply re-renders (the guard failure message can be used in UI feedback).

### Action Errors

If a button/select action throws a non-guard error, it propagates to the session-level error handler. The session is terminated.

### Timeout

When the interaction collector times out, the session renders a "closed" state (disabled components) and cleans up. No error is thrown.
