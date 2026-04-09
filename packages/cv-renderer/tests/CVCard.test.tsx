/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CVCard } from "../src/CVCard.js";
import type { ProfileLink } from "../src/schema.js";

const links: ProfileLink[] = [
  { label: "GitHub", url: "https://github.com/janedoe" },
  { label: "LinkedIn", url: "https://linkedin.com/in/janedoe" },
];

// ── Name rendering ───────────────────────────────────────────────────────────

describe("CVCard name rendering", () => {
  test("renders the provided name", () => {
    const { container } = render(<CVCard name="Jane Doe" />);
    expect(container.textContent).toContain("Jane Doe");
  });

  test("name is in an h2 element", () => {
    const { container } = render(<CVCard name="Jane Doe" />);
    const h2 = container.querySelector("h2.cv-card-name");
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toBe("Jane Doe");
  });
});

// ── Headline rendering ───────────────────────────────────────────────────────

describe("CVCard headline rendering", () => {
  test("renders headline when provided", () => {
    const { container } = render(
      <CVCard name="Jane Doe" headline="Software Engineer" />
    );
    expect(container.textContent).toContain("Software Engineer");
  });

  test("headline has cv-card-headline class", () => {
    const { container } = render(
      <CVCard name="Jane Doe" headline="Software Engineer" />
    );
    expect(container.querySelector(".cv-card-headline")).not.toBeNull();
  });

  test("does not render headline element when headline is omitted", () => {
    const { container } = render(<CVCard name="Jane Doe" />);
    expect(container.querySelector(".cv-card-headline")).toBeNull();
  });

  test("does not render headline element when headline is null", () => {
    const { container } = render(<CVCard name="Jane Doe" headline={null} />);
    expect(container.querySelector(".cv-card-headline")).toBeNull();
  });
});

// ── Links rendering ──────────────────────────────────────────────────────────

describe("CVCard links rendering", () => {
  test("renders all provided links", () => {
    const { container } = render(<CVCard name="Jane Doe" links={links} />);
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("LinkedIn");
  });

  test("links are anchor elements with correct hrefs", () => {
    const { container } = render(<CVCard name="Jane Doe" links={links} />);
    const anchors = container.querySelectorAll("a");
    const hrefs = Array.from(anchors).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://github.com/janedoe");
    expect(hrefs).toContain("https://linkedin.com/in/janedoe");
  });

  test("does not render links list when links is omitted", () => {
    const { container } = render(<CVCard name="Jane Doe" />);
    expect(container.querySelector(".cv-card-links")).toBeNull();
  });

  test("does not render links list when links is empty array", () => {
    const { container } = render(<CVCard name="Jane Doe" links={[]} />);
    expect(container.querySelector(".cv-card-links")).toBeNull();
  });
});

// ── Missing optional fields ──────────────────────────────────────────────────

describe("CVCard with missing optional fields", () => {
  test("renders with name only — no errors", () => {
    expect(() => render(<CVCard name="Jane Doe" />)).not.toThrow();
  });

  test("renders cv-card wrapper in all cases", () => {
    const { container } = render(<CVCard name="Jane Doe" />);
    expect(container.querySelector(".cv-card")).not.toBeNull();
  });
});
