import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const container = document.getElementById("root");
if (!container) throw new Error("#root missing from index.html");

// Clerk is optional in dev: without a publishable key the app still boots
// (signed-out shell) instead of white-screening.
createRoot(container).render(
  <StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <App clerk />
      </ClerkProvider>
    ) : (
      <App clerk={false} />
    )}
  </StrictMode>
);
