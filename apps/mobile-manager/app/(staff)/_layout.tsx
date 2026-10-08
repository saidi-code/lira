// app/(staff)/_layout.tsx — non-tab staff screens (Lyra Admin)
// ==========================================
// The backoffice tabs live in `app/admin/_layout.tsx`. This group holds the
// screens that must render *outside* those tabs: `denied`, which is where
// non-staff roles land (a signed-in customer has no dashboard tab to show).
// Kept as a plain Stack so `denied` never appears as a tab.
import { Stack } from "expo-router";

export default function StaffLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
