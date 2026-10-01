// Escape a user-supplied string for literal use inside a RegExp.
//
// Every string interpolated into a `$regex` must go through this. A raw value
// is not merely "sloppy matching": it lets the caller supply their own pattern.
// `?brand=a|b` becomes `^a|b$`, which matches almost anything, because `|` has
// lower precedence than the anchors — so a brand filter silently stops
// filtering. Worse, a nested quantifier (`?size=(a+)+`) is catastrophic
// backtracking, and `getProducts` is unauthenticated, so that is a remote CPU
// burn on a public endpoint.
//
// The same escape already existed inline in `getProducts` for `q` and `color`,
// but `brand`, `size` and the category title lookups interpolated raw. One
// shared implementation, so no call site can quietly skip it.
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
