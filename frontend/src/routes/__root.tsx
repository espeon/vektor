import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/hooks/useTheme";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Outlet />
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
});
