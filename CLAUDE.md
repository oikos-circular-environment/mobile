# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run lint           # Lint with Biome (auto-fixes in place)
npm run format         # Format code with Biome
npm run generate:api   # Regenerate API SDK from OpenAPI spec (requires backend running on localhost:3333)
npm test               # Run Jest tests
npm run test:coverage  # Run Jest with coverage report
```

## Expo MCP

An `expo` MCP server is configured (`https://mcp.expo.dev/mcp`, project-scoped).
Use it for: fetching current Expo/EAS library docs, checking EAS build/workflow
status, and pulling TestFlight/Play Store crash and review data — prefer it over
guessing at EAS CLI output or scraping docs.expo.dev by hand. Run `/mcp` once per
session to authenticate (OAuth) if tools aren't responding.

## Testing

**Stack**: Jest (via `jest-expo` preset) + React Native Testing Library (RNTL v14).

Tests live in `src/tests/` — **never** inside `src/app/` or alongside components:
- `src/tests/component/` — component tests (rendered in isolation)
- `src/tests/integration/` — integration tests (multiple components/contexts together)

# React Native Testing Library in this project

This project uses `@testing-library/react-native` v14. Its APIs differ from older versions.
Before writing or changing RNTL tests, read the relevant guide in
`node_modules/@testing-library/react-native/docs/`, starting with
`node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`.
Prefer those package docs over training-data assumptions, and follow deprecation notices.

Key conventions (from RNTL v14 docs):
- `render()` is **async** — always `await render(<Component />)`
- Use `screen` object, not destructuring from `render()`
- Prefer `userEvent` over `fireEvent`; use `jest.useFakeTimers()` in `beforeEach` to avoid 130ms press delays
- `findBy*` for async elements; `queryBy*` ONLY for non-existence checks
- Matchers (`toBeOnTheScreen`, `toBeDisabled`, etc.) auto-extend — no setup needed

## Architecture

**Framework**: Expo (~54) + React Native 0.81.5 + React 19. New Architecture and React Compiler are enabled.

**Routing**: Expo Router with file-based routing under `src/app/`. Three tabs are active: `market`, `(home)`, `complaints`. Two exist but are disabled in the UI: `donations`, `learn`. The `(home)` tab is a nested stack with auth-guarded routes (using `Stack.Protected`).

**API layer**: `src/libs/oikos-sdk/` is auto-generated from the OpenAPI spec at `http://localhost:3333/docs/openapi.json` via `@hey-api/openapi-ts`. Never edit files in `oikos-sdk/` by hand — regenerate them. The Axios instance in `src/libs/api/oikos-api.ts` wraps the SDK with auth token injection and automatic refresh-on-401 with request queuing.

**API base URLs** are hardcoded per platform in `src/libs/api/oikos-api.ts`:
- iOS: `http://192.168.18.44:3333`
- Android: `http://10.0.2.2:3333`

**State management**:
- React Context (`src/contexts/`) for cross-cutting concerns: auth, geospatial, notifications, complaint creation, tab bar visibility.
- React Query v5 (`@tanstack/react-query`) for all server state, caching, and background refetching.
- Zustand is installed but not used.

**Auth flow**: On app start, `auth-context.tsx` reads tokens from `expo-secure-store` (keys: `oikos_auth_token`, `oikos_refresh_token`) and fetches the profile. Protected routes rely on `Stack.Protected` with `isAuthenticated`. A 401 response triggers an automatic token refresh; failure forces logout.

**Path alias**: `@/*` maps to `./src/*`.

## UI Standards (mandatory)

These rules are enforced project-wide (`.github/copilot-instructions.md`):

- **Components**: Use `gluestack-ui v5`. Prefer Gluestack primitives over raw React Native ones. All Gluestack wrappers live in `src/components/ui/`.
- **Styling**: Use `NativeWind` (`className` prop). No inline styles unless strictly necessary. Any `className` with conditional logic **must** use `cn` from `@/libs/utils` — never template literals (e.g. `` `base ${cond ? "a" : "b"}` ``). Use `cn("base", cond && "modifier")` or `cn("base", cond ? "a" : "b")`.
- **Theme**: Primary color is `lime-800`. Do not introduce competing primary palettes.
- **Icons**: Use `lucide-react-native` exclusively.
- **Navigation**: Bottom tabs via `@react-navigation/bottom-tabs`. The main nav has 5 fixed actions: `market`, `complaints`, `home`, `donations`, `learn`. New screens must integrate without changing this structure.
- **Forms**: All forms must be wrapped in `KeyboardAvoidingView behavior="padding"` combined with `ScrollView`. Use `contentContainerClassName` for padding inside `ScrollView`.

```jsx
<KeyboardAvoidingView behavior="padding" className="flex-1">
  <ScrollView contentContainerClassName="p-4 pb-8">
    {/* form fields */}
  </ScrollView>
</KeyboardAvoidingView>
```

## Session Reset

When the user logs out (or a 401 forces logout), `sessionBus.emit()` fires from `auth-context.tsx`. Any store, context, or module that holds user-specific data must subscribe to the session bus (`src/libs/session-bus.ts`) to reset its state. Zustand stores subscribe at module level; React Contexts subscribe via `useEffect` inside the provider.

## Key Libraries

| Purpose | Library |
|---|---|
| Forms | `react-hook-form` + `zod` |
| Date utilities | `date-fns` |
| Maps | `react-native-maps` + Google Maps API |
| Camera | `expo-camera` |
| Location | `expo-location` (background tracking) |
| Animation | `react-native-reanimated` + `@legendapp/motion` |
| Haptics | `expo-haptics` |
| Class merging | `clsx` + `tailwind-merge` |

## Pencil design file

The design source of truth is `pencil/oikos-pencil.pen` — read/edit it only through the Pencil MCP tools.

**Document conventions**:
- Screens are named after their expo-router route (e.g. `market/index`, `complaints/(create)/camera`). Screens without an implemented route get the `(proposta)` suffix.
- Each feature lives in a top-level flow frame (`Market Flow`, `Complaints Flow`, `Auth Flow`...). Never leave loose nodes at the document root.
- All master components live inside the `Oikos Design System` frame, named in PascalCase after the React component that implements them (`TabBar`, `FilterChip`, `CompanyCard`).
- Every flow and master component carries a `context` property: purpose + corresponding code path.

**Componentization rules (mandatory when designing)**:
1. Before drawing, list existing components (`batch_get` with `reusable: true`) and reuse them via `ref` instances with overrides — never copy or redraw an existing pattern.
2. Any UI that appears 2+ times (cards, chips, list rows) must first be created as a master component in the Design System, then instanced in screens.
3. Variants (active/inactive, open/closed, collector/company) are instance overrides via `descendants` — not new components.
4. Use the document variables (`$lime-*`, `$gray-*`, `$spacing-*`, `$radius-*`) instead of hardcoded values.
