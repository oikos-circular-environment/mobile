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
```

No test suite is configured.

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
- **Styling**: Use `NativeWind` (`className` prop). No inline styles unless strictly necessary.
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
