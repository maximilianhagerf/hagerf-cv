import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "hagerf-cv" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <footer style={{ textAlign: "center", padding: "1rem", fontSize: "0.75rem", color: "#888" }}>
          Powered by{" "}
          <a
            href="https://github.com/maximilianhagerf/hagerf-cv"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit" }}
          >
            hagerf-cv
          </a>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
