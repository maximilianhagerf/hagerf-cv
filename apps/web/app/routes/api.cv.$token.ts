import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getPublicCV } from "../../src/server/cv.js";

export const APIRoute = createAPIFileRoute("/api/cv/$token")({
  GET: async ({ params }) => {
    const { token } = params;
    const data = await getPublicCV(token);
    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
