/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CVDocument } from "../src/CVDocument.js";
import type { CVData } from "../src/schema.js";
import { baseCVData } from "./fixtures.js";

// ── Rendering all sections ───────────────────────────────────────────────────

describe("CVDocument renders all sections", () => {
  test("renders summary section when visible", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Summary");
    expect(container.textContent).toContain("Experienced developer.");
  });

  test("renders summary_override when present instead of bio", () => {
    const data: CVData = {
      ...baseCVData,
      summary_override: "Custom summary text",
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("Custom summary text");
    expect(container.textContent).not.toContain("Experienced developer.");
  });

  test("renders work experience section", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Work Experience");
    expect(container.textContent).toContain("Acme Corp");
    expect(container.textContent).toContain("Senior Engineer");
    expect(container.textContent).toContain("Startup Inc");
  });

  test("renders education section", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Education");
    expect(container.textContent).toContain("KTH Royal Institute of Technology");
    expect(container.textContent).toContain("MSc");
  });

  test("renders skills section", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Skills");
    expect(container.textContent).toContain("Languages");
    expect(container.textContent).toContain("TypeScript");
  });

  test("renders projects section", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Projects");
    expect(container.textContent).toContain("Open Source Project");
  });

  test("renders links section", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Links");
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("LinkedIn");
  });

  test("renders profile header with name and headline", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.textContent).toContain("Jane Doe");
    expect(container.textContent).toContain("Software Engineer");
  });
});

// ── Section visibility ───────────────────────────────────────────────────────

describe("CVDocument section visibility", () => {
  test("hides work section when not visible", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: true },
        { type: "work", visible: false },
        { type: "education", visible: true },
        { type: "skills", visible: true },
        { type: "projects", visible: true },
        { type: "links", visible: true },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Work Experience");
    expect(container.textContent).not.toContain("Acme Corp");
  });

  test("hides education section when not visible", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: true },
        { type: "work", visible: true },
        { type: "education", visible: false },
        { type: "skills", visible: true },
        { type: "projects", visible: true },
        { type: "links", visible: true },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Education");
    expect(container.textContent).not.toContain("KTH");
  });

  test("hides skills section when not visible", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: true },
        { type: "work", visible: true },
        { type: "education", visible: true },
        { type: "skills", visible: false },
        { type: "projects", visible: true },
        { type: "links", visible: true },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Skills");
  });

  test("hides projects section when not visible", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: true },
        { type: "work", visible: true },
        { type: "education", visible: true },
        { type: "skills", visible: true },
        { type: "projects", visible: false },
        { type: "links", visible: true },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Projects");
  });

  test("hides links section when not visible", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: true },
        { type: "work", visible: true },
        { type: "education", visible: true },
        { type: "skills", visible: true },
        { type: "projects", visible: true },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Links");
  });

  test("renders nothing but header when all sections hidden", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: false },
        { type: "education", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("Jane Doe");
    expect(container.textContent).not.toContain("Work Experience");
    expect(container.textContent).not.toContain("Education");
  });
});

// ── Section ordering ─────────────────────────────────────────────────────────

describe("CVDocument section ordering", () => {
  test("renders sections in sections_config order", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "skills", visible: true },
        { type: "work", visible: true },
        { type: "summary", visible: true },
        { type: "education", visible: true },
        { type: "projects", visible: true },
        { type: "links", visible: true },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    const text = container.textContent ?? "";
    const skillsIdx = text.indexOf("Skills");
    const workIdx = text.indexOf("Work Experience");
    const summaryIdx = text.indexOf("Summary");
    expect(skillsIdx).toBeLessThan(workIdx);
    expect(workIdx).toBeLessThan(summaryIdx);
  });

  test("renders education before work when configured that way", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "education", visible: true },
        { type: "work", visible: true },
        { type: "summary", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    const text = container.textContent ?? "";
    const eduIdx = text.indexOf("Education");
    const workIdx = text.indexOf("Work Experience");
    expect(eduIdx).toBeLessThan(workIdx);
  });
});

// ── included_ids filtering ────────────────────────────────────────────────────

describe("CVDocument included_ids filtering", () => {
  test("renders only included work entries", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: true, included_ids: ["w1"] },
        { type: "education", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("Acme Corp");
    expect(container.textContent).not.toContain("Startup Inc");
  });

  test("renders all work entries when included_ids is absent", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: true },
        { type: "education", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("Acme Corp");
    expect(container.textContent).toContain("Startup Inc");
  });

  test("renders only included education entries", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: false },
        { type: "education", visible: true, included_ids: ["e1"] },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("KTH");
  });

  test("renders only included projects", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: false },
        { type: "education", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: true, included_ids: ["p1"] },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).toContain("Open Source Project");
    expect(container.textContent).not.toContain("Side Project");
  });

  test("renders empty section when included_ids matches nothing", () => {
    const data: CVData = {
      ...baseCVData,
      sections_config: [
        { type: "summary", visible: false },
        { type: "work", visible: true, included_ids: ["nonexistent"] },
        { type: "education", visible: false },
        { type: "skills", visible: false },
        { type: "projects", visible: false },
        { type: "links", visible: false },
      ],
    };
    const { container } = render(<CVDocument data={data} />);
    expect(container.textContent).not.toContain("Acme Corp");
    expect(container.textContent).not.toContain("Startup Inc");
  });
});

// ── A4 vs Letter dimensions ──────────────────────────────────────────────────

describe("CVDocument format classes", () => {
  test("A4 document has cv-format-a4 class", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    const doc = container.firstElementChild;
    expect(doc?.classList).toContain("cv-format-a4");
    expect(doc?.classList).not.toContain("cv-format-letter");
  });

  test("Letter document has cv-format-letter class", () => {
    const data: CVData = { ...baseCVData, format: "letter" };
    const { container } = render(<CVDocument data={data} />);
    const doc = container.firstElementChild;
    expect(doc?.classList).toContain("cv-format-letter");
    expect(doc?.classList).not.toContain("cv-format-a4");
  });

  test("A4 document has data-format=a4 attribute", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    expect(container.firstElementChild?.getAttribute("data-format")).toBe("a4");
  });

  test("Letter document has data-format=letter attribute", () => {
    const data: CVData = { ...baseCVData, format: "letter" };
    const { container } = render(<CVDocument data={data} />);
    expect(container.firstElementChild?.getAttribute("data-format")).toBe("letter");
  });
});

// ── Minimal theme class names ────────────────────────────────────────────────

describe("CVDocument minimal theme class names", () => {
  test("document root has cv-theme-minimal class", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    const doc = container.firstElementChild;
    expect(doc?.classList).toContain("cv-theme-minimal");
  });

  test("document root has cv-document class", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    const doc = container.firstElementChild;
    expect(doc?.classList).toContain("cv-document");
  });

  test("section headings have cv-section-title class", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    const sectionTitles = container.querySelectorAll(".cv-section-title");
    expect(sectionTitles.length).toBeGreaterThan(0);
  });

  test("sections have cv-section class for break-inside avoid", () => {
    const { container } = render(<CVDocument data={baseCVData} />);
    const sections = container.querySelectorAll(".cv-section");
    expect(sections.length).toBeGreaterThan(0);
  });
});
