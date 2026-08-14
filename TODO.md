# TODO - Fix DropDownPicker for brand and category

- [x] Inspect dropdown implementations (category + brand)
- [x] Fix brand `DropDownPicker` broken syntax and item shape (expects `{ label, value }`)
- [x] Make brand `valueBrand` a consistent type (`string | null`)
- [ ] Re-run typecheck and verify dropdown region in `client/app/(tabs)/index.tsx` has no parsing errors
- [ ] If remaining build errors exist, they should be unrelated to dropdowns; confirm via focused compile/lint

