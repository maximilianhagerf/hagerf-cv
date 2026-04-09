import { fetchCV } from "../src/fetchCV.js";

const validCVData = {
  id: "cv-1",
  label: "Test CV",
  format: "a4",
  theme: "minimal",
  summary_override: null,
  sections_config: [{ type: "summary", visible: true }],
  profile: {
    name: "Jane Doe",
    headline: "Engineer",
    email: "jane@example.com",
  },
  work: [],
  education: [],
  skills: [],
  projects: [],
};

function mockFetch(status: number, body: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("fetchCV", () => {
  test("returns valid CVData from a mock server", async () => {
    mockFetch(200, validCVData);
    const result = await fetchCV({ token: "abc123" });
    expect(result.id).toBe("cv-1");
    expect(result.label).toBe("Test CV");
    expect(result.format).toBe("a4");
  });

  test("calls the correct URL with default apiUrl", async () => {
    mockFetch(200, validCVData);
    await fetchCV({ token: "abc123" });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://cv.hagerf.se/api/cv/abc123",
    );
  });

  test("calls the correct URL with a custom apiUrl", async () => {
    mockFetch(200, validCVData);
    await fetchCV({ token: "tok", apiUrl: "https://my.instance.com" });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://my.instance.com/api/cv/tok",
    );
  });

  test("throws ArkType error on malformed response", async () => {
    mockFetch(200, { id: "bad", label: "Bad CV", format: "tabloid" });
    await expect(fetchCV({ token: "bad" })).rejects.toMatchObject({
      summary: expect.any(String),
    });
  });

  test("throws on non-200 status", async () => {
    mockFetch(404, null);
    await expect(fetchCV({ token: "missing" })).rejects.toThrow(
      "fetchCV: server returned 404",
    );
  });

  test("throws on 500 status", async () => {
    mockFetch(500, null);
    await expect(fetchCV({ token: "err" })).rejects.toThrow(
      "fetchCV: server returned 500",
    );
  });
});
