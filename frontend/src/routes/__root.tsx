import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/hooks/useTheme";
import { PreferencesProvider } from "@/providers/PreferencesProvider";

export const Route = createRootRoute({
  component: () => (
    <PreferencesProvider>
      <ThemeProvider>
        <Outlet />
        <TanStackRouterDevtools />
      </ThemeProvider>
    </PreferencesProvider>
  ),
});
