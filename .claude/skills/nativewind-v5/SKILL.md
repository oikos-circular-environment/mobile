---
name: nativewind-v5
description: NativeWind v5 API reference for this project (className styling on React Native, built on Tailwind CSS v4). Use when writing or reviewing styled JSX, wrapping a third-party RN component so it accepts className (cssInterop/remapProps/styled), doing dynamic/CSS-variable theming (vars/VariableContextProvider), using pseudo-class or platform modifiers (hover:/active:/ios:/android:/group-*), debugging a className that has no effect, or touching custom fonts/units/dark mode. Complements gluestack-ui-v5 (which owns spacing-scale/semantic-token rules) and expo-tailwind-setup (which owns installation) — this skill is about NativeWind's own runtime APIs and CSS feature set.
metadata:
  version: 1.0.0
  source: https://www.nativewind.dev/v5/llms-full.txt
---

# NativeWind v5 — API & Styling Reference

This project already runs NativeWind v5 (preview) + Tailwind CSS v4, CSS-first (no `tailwind.config.js`), theme defined in `src/app/global.css`. For **installation/setup** questions, use the `expo-tailwind-setup` skill instead — this skill assumes the project is already configured and focuses on how to *use* NativeWind once it's running. For **spacing-scale and semantic-color-token rules**, use `gluestack-ui-v5:styling` — this skill does not repeat those, it covers NativeWind's own APIs and CSS feature set (pseudo-classes, platform variants, third-party component interop, dynamic theming, units, fonts).

Full source doc: https://www.nativewind.dev/v5/llms-full.txt (fetch it directly for anything not covered below or when a detail needs verifying against the latest docs — training data may lag).

## Core mental model

- On native, `className` compiles at build time into `StyleSheet.create`-equivalent styles; on web it's a thin polyfill reusing the real Tailwind stylesheet (SSR-friendly).
- `View` does not cascade color styles to children — if text isn't picking up a color set on a parent `View`, that's expected; put the color class on the `Text` itself.
- React Native's default length unit is `dp`; NativeWind treats `px` in classNames as equivalent to `dp` (`w-10` = 10dp on native, 10px on web). Don't try to convert.
- **No mixing numeric and percentage units in `calc()`** — `calc(100% - 20px)` does not work in React Native. Keep both sides of a `calc()` in the same unit family.

## Third-party components: making `className` work

Most RN libraries (maps, svg, custom pickers) don't accept `className` out of the box. Three tools, in order of preference:

1. **`styled()`** — the unified v5 wrapper, prefer this for new code:
   ```tsx
   import { styled } from "nativewind";
   const StyledCircle = styled(Circle, {
     className: { target: "style", nativeStyleToProp: { fill: true, stroke: true, strokeWidth: true } },
   });
   ```
2. **`cssInterop()`** — same idea, imperative registration (this is the pattern already used in `src/components/complaints/filters/complaint-pressable-filter.tsx` for `StyledUIIcon`, and is fine to keep following for consistency in that file, though new third-party wrappers should prefer `styled()`):
   ```tsx
   cssInterop(MapView, { className: "style" });
   // now: <MapView className="w-full h-64" />
   ```
   For multiple distinct className props on one component (e.g. `FlatList`'s outer view vs its content container):
   ```tsx
   cssInterop(FlatList, { className: "style", contentContainerClassName: "contentContainerStyle" });
   ```
3. **`remapProps()`** — when the target component already has its own differently-named style-ish props to map into, rather than a generic `style` prop.

If a wrapped component's className has no visible effect, the first thing to check is whether it actually forwards/spreads the prop the interop targets — not every "doesn't accept className" bug is a NativeWind bug.

## Dynamic theming: CSS variables

- `vars()` is deprecated in favor of `VariableContextProvider` (still works, prints a dev warning) — for new dynamic-theming code prefer:
  ```tsx
  import { VariableContextProvider } from "nativewind";
  <VariableContextProvider variables={{ "--theme-color": "#3b82f6" }}>
    <Text className="text-[--theme-color]">Themed</Text>
  </VariableContextProvider>
  ```
- Read a CSS variable back in JS with `useUnstableNativeVariable("--theme-color")` (name signals it's not a stable API yet — don't lean on it for anything load-bearing).
- This project's actual color theming already goes through `src/app/global.css`'s `@theme`/`@layer theme` blocks (see `gluestack-ui-v5:styling`) rather than per-instance `VariableContextProvider` — reach for the CSS-variable APIs above only for genuinely per-instance/runtime-computed theming (e.g. a user-picked brand color), not for the app's static light/dark palette.

## Pseudo-classes & states

`hover:`, `active:`, `focus:` work like web Tailwind, but **only if the component exposes the matching event prop** (`onHoverIn`/`onHoverOut`, `onPressIn`/`onPressOut`, `onFocus`/`onBlur`). A `hover:bg-primary/90` on a plain `View` with no press handling silently does nothing — this is the most common "my modifier isn't working" cause, check the component's prop support before assuming a NativeWind bug.

- `disabled:` needs the RN `disabled` prop wired.
- `group-*`/`group-active/name:` etc. for parent-state-driven child styling — mark the parent `className="group/name"`, style children with `group-active/name:text-blue-700`.
- `ltr:`/`rtl:` for direction-aware styling.
- Gluestack's own `data-[hover=true]:`/`data-[active=true]:` pattern (already documented in `gluestack-ui-v5:styling`) is a related but distinct mechanism layered on top via `data-*` attributes gluestack components set themselves — prefer that when working inside a gluestack component's own `tva` styles; reach for plain `hover:`/`active:` on raw RN primitives.

## Platform & responsive variants

- Breakpoints (`md:`, `lg:`, ...) work as in web Tailwind, driven by width media queries; they update reactively on rotation/split-screen without a remount.
- Platform-only variants: `ios:`, `android:`, `native:` (all non-web platforms) — e.g. `className="font-sans ios:font-sans-medium android:font-sans-semibold"`. Prefer these over `Platform.select` + inline styles when the only difference is which utility classes apply.
- `prefers-color-scheme` (i.e. `dark:`) is wired to the RN `Appearance` API automatically.

## Dark mode

- `dark:` variants map to `@media (prefers-color-scheme: dark)` automatically — no extra wiring needed for system-driven dark mode.
- Manual toggle goes through RN's own `Appearance.setColorScheme(...)`, read via `useColorScheme()` — NativeWind's own `useColorScheme` export is deprecated in v5, use React Native's.
- Always pair a class with its dark counterpart (`text-black dark:text-white`), never ship a `dark:`-only override with no light default — an element with only `dark:text-white` renders with no explicit color at all in light mode.

## Units & sizing gotchas

- `px`≈`dp` on native (see above); `vw`/`vh` are polyfilled and reactive to viewport changes; `rem` defaults differ by platform (14 native vs 16 web) and can't be changed at runtime — for anything that must be identical cross-platform, use CSS variables instead of relying on `rem` scaling.
- Aspect ratios (`aspect-[16/9]`) are supported.
- The spacing *scale* itself (which step maps to how many px) is covered by `gluestack-ui-v5:styling` Rule 4 — this section is about unit *types*, not the scale.

## Custom fonts

- Variable fonts are not supported — use individual static weight files (Inter-Regular.otf, Inter-Bold.otf, ...), loaded via the `expo-font` config plugin.
- The font file's PostScript name must match exactly, case-sensitive on iOS.
- Register loaded fonts as theme tokens in `global.css`'s `@theme` block, then use `font-<name>` classes — don't hardcode `fontFamily` in inline styles once a font is registered this way.
- React Native does not support CSS font-fallback lists — a `font-*` value must resolve to exactly one font name.

## Style specificity (lowest → highest precedence)

1. Utility classes (`className="..."`)
2. Modifier classes (`hover:`, `active:`, etc.)
3. Inline `style` prop — **wins over plain classNames**, including base utility classes
4. `!important` (the `!` prefix, e.g. `!text-white`) — wins over everything, including inline `style`

This means a component that accepts both `className` and a `style` override prop can have its className silently overridden by a caller-supplied `style` — if that's surprising in a given component, either don't expose a raw `style` prop, or use `!`-prefixed classes for anything that must not be overridable.

## Troubleshooting

- Cache is a common false lead: `npx expo start --clear` before digging further into "my styles aren't applying."
- `DEBUG=nativewind npx expo start --clear` for verbose interop/compile logging.
- `import { verifyInstallation } from "nativewind"` and call `verifyInstallation()` inside a component body (not at module scope) to sanity-check the toolchain itself is wired correctly.
- If colors "don't apply": check for the `View`-doesn't-cascade-color gotcha above before assuming a config problem.
- If a third-party component's className is a no-op: confirm it needs (and has) a `cssInterop`/`styled()` registration — see above.

## v4 → v5 changes worth knowing (this project is on v5, but old patterns may still be referenced in older code or muscle memory)

- No more `tailwind.config.js`-driven config by default — theme lives in CSS (`@theme`, `@import`, `@utility`, `@custom-variant` directives in `global.css`). An optional `tailwind.config.js` can still be pulled in via `@config "./tailwind.config.js"` if genuinely needed, but this project doesn't have one — don't add one to "fix" something without checking whether a CSS-side `@theme` addition solves it instead.
- `elevation-sm` → `elevation-xs`, `elevation` → `elevation-sm` (renamed shadow/elevation scale steps).
- `shadow-*` utilities now map to CSS `boxShadow`, not the old `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` style props — if you see those RN-specific shadow style props used directly (as in some of this project's inline `style={{ shadowColor: ..., shadowOffset: ..., shadowOpacity: ..., shadowRadius: ..., elevation: ... }}` blocks), that's pre-v5-style raw RN styling coexisting with NativeWind, not a NativeWind API — don't assume `shadow-*` classNames are a drop-in replacement without checking visual parity, since the underlying implementation changed.
- Numeric `lineHeight` values are now parsed as `em` (relative to font size), not fixed px — if migrating an old numeric line-height, divide by the font size to get the new value.
- Deprecated but still functional (prints dev warnings): NativeWind's own `useColorScheme` (use RN's), `vars()` (use `VariableContextProvider`), and standalone `cssInterop()`/`remapProps()` calls where `styled()` would now do (existing `cssInterop` call sites don't need an urgent rewrite, just prefer `styled()` for new ones).

## Reference

- Full doc (single file, LLM-oriented): https://www.nativewind.dev/v5/llms-full.txt
- Doc index: https://www.nativewind.dev/v5/llms.txt
- This project's actual NativeWind config: `postcss.config.mjs`, `src/app/global.css`, `metro.config.js`
