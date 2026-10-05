import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { isStaff, normalizeRole } from "@lira/shared";
import { Sidebar } from "@/components/Sidebar";

export function AdminLayout() {
  const { user, isLoaded } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role);

  if (!isLoaded) return <div className="p-10 text-muted">Loading atelier…</div>;

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {!isStaff(role) ? (
          <Navigate to="/denied" replace />
        ) : (
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 p-8">
              <Outlet />
            </div>
          </div>
        )}
      </SignedIn>
    </>
  );
}
