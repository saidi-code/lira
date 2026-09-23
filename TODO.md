# TODO - Fix DropDownPicker for brand and category

- [x] Inspect dropdown implementations (category + brand)
- [x] Fix brand `DropDownPicker` broken syntax and item shape (expects `{ label, value }`)
- [x] Make brand `valueBrand` a consistent type (`string | null`)
- [x] Re-run typecheck and verify dropdown region in `client/app/(tabs)/index.tsx` has no parsing errors — `npx tsc --noEmit` passes with 0 errors
- [x] If remaining build errors exist, they should be unrelated to dropdowns; confirm via focused compile/lint — 43 errors in 8 unrelated files fixed; `npx expo lint` reports 0 errors (48 pre-existing warnings)

