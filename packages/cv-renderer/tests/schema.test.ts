import { CVData, CVFormat, CVTheme, CVSectionType, SectionConfig } from "../src/schema.js";
import { baseCVData } from "./fixtures.js";

// ArkType validators return the value on success and ArkErrors on failure.
// We check by testing whether the result is an instance of ArkErrors (has `.summary` getter)
// or by verifying the returned value equals the input on success.

function isArkErrors(result: unknown): boolean {
  return (
    result !== null &&
    typeof result === "object" &&
    "summary" in result &&
    typeof (result as Record<string, unknown>).summary === "string"
  );
}

describe("CVFormat schema", () => {
  test("accepts a4", () => {
    expect(CVFormat("a4")).toBe("a4");
  });

  test("accepts letter", () => {
    expect(CVFormat("letter")).toBe("letter");
  });

  test("rejects unknown format", () => {
    const result = CVFormat("legal");
    expect(isArkErrors(result)).toBe(true);
  });
});

describe("CVTheme schema", () => {
  test("accepts minimal", () => {
    expect(CVTheme("minimal")).toBe("minimal");
  });

  test("accepts compact", () => {
    expect(CVTheme("compact")).toBe("compact");
  });

  test("rejects unknown theme", () => {
    expect(isArkErrors(CVTheme("elegant"))).toBe(true);
  });
});

describe("CVSectionType schema", () => {
  const validTypes = ["summary", "work", "education", "skills", "projects", "links"] as const;
  for (const t of validTypes) {
    test(`accepts ${t}`, () => {
      expect(CVSectionType(t)).toBe(t);
    });
  }

  test("rejects unknown section type", () => {
    expect(isArkErrors(CVSectionType("certifications"))).toBe(true);
  });
});

describe("SectionConfig schema", () => {
  test("accepts valid config without included_ids", () => {
    const input = { type: "work", visible: true };
    const result = SectionConfig(input);
    expect(result).toEqual(input);
  });

  test("accepts valid config with included_ids", () => {
    const input = { type: "work", visible: false, included_ids: ["w1", "w2"] };
    const result = SectionConfig(input);
    expect(result).toEqual(input);
  });

  test("rejects config with invalid type", () => {
    const result = SectionConfig({ type: "awards", visible: true });
    expect(isArkErrors(result)).toBe(true);
  });

  test("rejects config with non-boolean visible", () => {
    const result = SectionConfig({ type: "work", visible: "yes" });
    expect(isArkErrors(result)).toBe(true);
  });
});

describe("CVData schema", () => {
  test("accepts complete valid CVData", () => {
    const result = CVData(baseCVData);
    expect(isArkErrors(result)).toBe(false);
    expect((result as typeof baseCVData).id).toBe("cv-1");
  });

  test("accepts CVData with optional fields omitted", () => {
    const minimal = {
      id: "cv-2",
      label: "Minimal CV",
      format: "letter",
      theme: "compact",
      sections_config: [{ type: "summary", visible: false }],
      profile: { name: "John" },
    };
    const result = CVData(minimal);
    expect(isArkErrors(result)).toBe(false);
  });

  test("rejects CVData with invalid format", () => {
    const bad = { ...baseCVData, format: "tabloid" };
    expect(isArkErrors(CVData(bad))).toBe(true);
  });

  test("rejects CVData with invalid theme", () => {
    const bad = { ...baseCVData, theme: "neon" };
    expect(isArkErrors(CVData(bad))).toBe(true);
  });

  test("rejects CVData missing required id field", () => {
    const { id: _id, ...noId } = baseCVData;
    expect(isArkErrors(CVData(noId))).toBe(true);
  });

  test("rejects CVData missing required label field", () => {
    const { label: _label, ...noLabel } = baseCVData;
    expect(isArkErrors(CVData(noLabel))).toBe(true);
  });
});
