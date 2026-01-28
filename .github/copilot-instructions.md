# COPILOT EDITS OPERATIONAL GUIDELINES

## PROJECT OVERVIEW

    This project establishes a full-stack Typescript NX project with 4 distinct parts:

1. **/shared** - Common package that contains:

   - Endpoint ts-rest DTO schemas and contracts
   - Data Model zod and Mongoose (ORM for MongoDB) schemas/types and accompanying service functions.
   - Shared utility functions.
   - Any other shared code that is used by more than one part of the project.

2. **/apps/bot** - Discord.js bot application that allows Discord server admin users to create and manage every part of a Pokemon game, and allows players to play the games that have been published by the server admins.

   - Uses `/shared` package service functions for fetching and updating database data
   - Includes:
     - Custom Menu classes for streamlining development of Discord.js commands
     - `/interactions` - Exports global message, slash, and context menu commands, as well as any other Discord.js interactions.
     - `/interactions/guilds` - Exports guild-specific commands, which is were all development of bot commands should take place for now

3. **/apps/server/** - Express server that utilizes contracts from the `/shared` package to provide a REST API for the bot.

   - Also uses `/shared` package service functions for fetching and updating database data
   - Primarily used to feed DB data to the web application.

4. **/apps/webapp/** - Next.js React web application that provides a way for Discord servers to make their servers/games discoverable, and allows players to view their game progress for any game they are playing.

   - Fetches and updates game data via endpoint calls to the `/apps/server/` Express server

## PRIME DIRECTIVE

- In prompts, always get the context of the open file and any selection at minimum.
- When I start a prompt with `(Full Context)`, freely scan and use context of entire workspace/project before responding with answers or proposed edits.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE

    When working with large files (>300 lines) or complex changes:
    	1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required

            3. Format your plan as:

## PROPOSED EDIT PLAN

    Working with: [filename]
    Total planned edits: [number]

### MAKING EDITS

    - Focus on one conceptual change at a time
    - Show clear "before" and "after" snippets when proposing changes
    - Include concise explanations of what changed and why
    - Always check if the edit maintains the project's coding style

### Edit sequence:

    1. [First specific change] - Purpose: [why]
    2. [Second specific change] - Purpose: [why]
    3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
    4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]

### EXECUTION PHASE

    - After each individual edit, clearly indicate progress:
    	"✅ Completed edit [#] of [total]. Ready for next edit?"
    - If you discover additional needed changes during editing:
    - STOP and update the plan
    - Get approval before continuing

### REFACTORING GUIDANCE

    When refactoring large files:
    - Break work into logical, independently functional chunks
    - Ensure each intermediate state maintains functionality
    - Consider temporary duplication as a valid interim step
    - Always indicate the refactoring pattern being applied

### RATE LIMIT AVOIDANCE

    - For very large files, suggest splitting changes across multiple sessions
    - Prioritize changes that are logically complete units
    - Always provide clear stopping points

## General Requirements

    Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.

### Accessibility

    - Ensure compliance with **WCAG 2.1** AA level minimum, AAA whenever feasible.
    - Always suggest:
    - Labels for form fields.
    - Proper **ARIA** roles and attributes.
    - Adequate color contrast.
    - Alternative texts (`alt`, `aria-label`) for media elements.
    - Semantic HTML for clear structure.
    - Tools like **Lighthouse** for audits.

## Browser Compatibility (for `/apps/webapp/`)

    - Prioritize feature detection (`if ('fetch' in window)` etc.).
        - Support latest two stable releases of major browsers:
    - Firefox, Chrome, Edge, Safari (macOS/iOS)
        - Emphasize progressive enhancement with polyfills or bundlers (e.g., **Babel**, **Vite**) as needed.

## Next.js / React Requirements (for `/apps/webapp/`)

- Use nextauth for authenticating with Discord oAuth
- Use `src/app/` structure for building out routes in Next.js
- Currently, utilizing redux store for state management, but will transition to React Query and lightweight context providers in the future.
- If page may not require mutations, prefer server-side rendering (SSR) or static site generation (SSG) for performance.
- Follow best practices for React components:
- Use functional components with hooks.
- Prefer building out smaller, reusable components and hooks that rely on Tailwind where simple and possible.
- For complex components, request permission to use Ant Design pre-built components
- Avoid class components altogether.
- Use **TypeScript** for type safety.
- Ensure proper error boundaries and fallback UI for critical components.
- Optimize performance with code splitting, lazy loading, and memoization.
- Use **Next.js Image component** for optimized image handling.

## HTML/CSS Requirements (for `/apps/webapp/`)

    - **HTML**:
    - Use HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<search>`, etc.) when possible
    - Include appropriate ARIA attributes for accessibility
    - Ensure valid markup that passes W3C validation
    - Use responsive design practices
    - Optimize images using modern formats (`WebP`, `AVIF`)
    - Include `loading="lazy"` on images where applicable
    - Generate `srcset` and `sizes` attributes for responsive images when relevant
    - Prioritize SEO-friendly elements (`<title>`, `<meta description>`, Open Graph tags)

    - **CSS / Sass / Tailwind**:

- Use Tailwind CSS for utility-first styling, and for handling any of the below styling requirements that are able to be handled by Tailwind.
- Strive to commonize styles across components to reduce duplication, using the globals and utils files in `/webapp/src/styles/`
  - Include dark mode support as per `/webapp/tailwind.config.js`
- Use Sass for more complex styles'
  - Use modern CSS features including:
  - Use modern units (`rem`, `vh`, `vw`) instead of traditional pixels (`px`) for better responsiveness
  - CSS Grid and Flexbox for layouts
  - CSS Custom Properties (variables)
  - CSS animations and transitions
  - Media queries for responsive design
  - Logical properties (`margin-inline`, `padding-block`, etc.)
  - Modern selectors (`:is()`, `:where()`, `:has()`)

## TypeScript Requirements

    - **Minimum Compatibility**: ECMAScript 2020 (ES11) or higher
    - **Features to Use**:
    - Arrow functions
    - Template literals
    - Destructuring assignment
    - Spread/rest operators
    - Async/await for asynchronous code
    - Classes with proper inheritance when OOP is needed
    - Object shorthand notation
    - Optional chaining (`?.`)
    - Nullish coalescing (`??`)
    - Dynamic imports
    - BigInt for large integers
    - `Promise.allSettled()`
    - `String.prototype.matchAll()`
    - `globalThis` object
    - Private class fields and methods
    - Export * as namespace syntax
    - Array methods (`map`, `filter`, `reduce`, `flatMap`, etc.)
    - **Avoid**:
    - `var` keyword (use `const` and `let`)
    - jQuery or any external libraries
    - Callback-based asynchronous patterns when promises can be used
    - Internet Explorer compatibility
    - Legacy module formats (use ES modules)
    - Limit use of `eval()` due to security risks
    - **Performance Considerations:**
    - Recommend code splitting and dynamic imports for lazy loading
    **Error Handling**:
    - Use `try-catch` blocks **consistently** for asynchronous and API calls, and handle promise rejections explicitly.
    - Differentiate among:
    - **Network errors** (e.g., timeouts, server errors, rate-limiting)
    - **Functional/business logic errors** (logical missteps, invalid user input, validation failures)
    - **Runtime exceptions** (unexpected errors such as null references)
    - Provide **user-friendly** error messages (e.g., “Something went wrong. Please try again shortly.”) and log more technical details to dev/ops (e.g., via a logging service).
    - Consider a central error handler function or global event (e.g., `window.addEventListener('unhandledrejection')`) to consolidate reporting.
    - Carefully handle and validate JSON responses, incorrect HTTP status codes, etc.

## Documentation Requirements

    - Include JSDoc comments for JavaScript/TypeScript functions.
    - Maintain concise Markdown documentation.
    - Minimum docblock info: `param`, `return`, `throws`

## Database Requirements (MongoDB with Mongoose ORM)

- Use zod-based Mongoose schemas for data validation and structure
  - Leverage ObjectId relationships and `populate()` for relationship querying
- Offer suggestions for efficient indexing strategies, based on the query patterns
- Use transactions for multi-document operations when necessary, especially when failures should collectively roll back related changes
- Implement proper error handling for database operations

## Security Considerations

    - Sanitize all user inputs thoroughly.
    - Parameterize database queries.
    - Enforce strong Content Security Policies (CSP).
    - Use CSRF protection where applicable.
    - Ensure secure cookies (`HttpOnly`, `Secure`, `SameSite=Strict`).
    - Limit privileges and enforce role-based access control.
    - Implement detailed internal logging and monitoring.
