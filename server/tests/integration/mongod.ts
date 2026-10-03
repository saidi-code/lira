// tests/integration/mongod.ts
// ==========================================
//   Shared mongod bootstrap for the integration suites.
//
// Each file starts its own server rather than sharing one, because they run in
// parallel and a shared instance would let one suite's `deleteMany` wipe
// another's fixtures mid-test.
//
// `LAUNCH_TIMEOUT_MS` exists because the library default is 10s and that is not
// always enough on a cold cache or a loaded CI runner. The symptom is
// `Instance failed to start within 10000ms`, which fails all 7 suites at once
// and looks like a code change broke them. It was observed on a machine already
// running a local mongod, an Expo dev server and a dozen node processes — so the
// fix is a larger budget, not a retry.
// ==========================================
import { MongoMemoryServer } from "mongodb-memory-server";

// Re-exported so the suites import one thing from here rather than reaching into
// the package directly — that is what keeps the timeout setting in one place.
export { MongoMemoryServer };

/** 60s. Long enough for a cold binary cache on a busy machine, short enough to fail. */
export const LAUNCH_TIMEOUT_MS = 60_000;