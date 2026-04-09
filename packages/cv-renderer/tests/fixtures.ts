import type { CVData } from "../src/schema.js";

export const baseCVData: CVData = {
  id: "cv-1",
  label: "Test CV",
  format: "a4",
  theme: "minimal",
  summary_override: null,
  sections_config: [
    { type: "summary", visible: true },
    { type: "work", visible: true },
    { type: "education", visible: true },
    { type: "skills", visible: true },
    { type: "projects", visible: true },
    { type: "links", visible: true },
  ],
  profile: {
    name: "Jane Doe",
    headline: "Software Engineer",
    bio: "Experienced developer.",
    email: "jane@example.com",
    location: "Stockholm, Sweden",
    links: [
      { label: "GitHub", url: "https://github.com/janedoe" },
      { label: "LinkedIn", url: "https://linkedin.com/in/janedoe" },
    ],
  },
  work: [
    {
      id: "w1",
      company: "Acme Corp",
      role: "Senior Engineer",
      start_date: "2020-01",
      end_date: null,
      description: "Built things.",
      bullets: ["Led team of 5", "Shipped 3 major features"],
      sort_order: 0,
    },
    {
      id: "w2",
      company: "Startup Inc",
      role: "Engineer",
      start_date: "2018-03",
      end_date: "2019-12",
      description: "Built more things.",
      bullets: [],
      sort_order: 1,
    },
  ],
  education: [
    {
      id: "e1",
      institution: "KTH Royal Institute of Technology",
      degree: "MSc",
      field_of_study: "Computer Science",
      start_date: "2014",
      end_date: "2016",
      sort_order: 0,
    },
  ],
  skills: [
    {
      id: "s1",
      category: "Languages",
      items: ["TypeScript", "Rust", "Go"],
      sort_order: 0,
    },
    {
      id: "s2",
      category: "Tools",
      items: ["Docker", "Kubernetes"],
      sort_order: 1,
    },
  ],
  projects: [
    {
      id: "p1",
      title: "Open Source Project",
      url: "https://github.com/janedoe/oss",
      description: "A cool open source project.",
      sort_order: 0,
    },
    {
      id: "p2",
      title: "Side Project",
      url: null,
      description: "A side project.",
      sort_order: 1,
    },
  ],
};
