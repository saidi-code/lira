import { SignOutButton } from "@clerk/clerk-react";

export function DeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <div className="max-w-md rounded-2xl border border-primary/20 bg-white p-8 shadow-card">
        <p className="font-serif text-3xl font-semibold text-primary">ليرة</p>
        <h1 className="mt-4 font-serif text-xl font-medium text-ink">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted">
          This portal is reserved exclusively for authorized Lyra atelier staff and management.
        </p>
        <div className="mt-6">
          <SignOutButton>
            <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20 hover:bg-primary-dim transition-colors">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
