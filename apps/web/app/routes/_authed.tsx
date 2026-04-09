import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionUser } from "../../src/server/auth.js";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }
    return { user };
  },
  component: () => <Outlet />,
});
