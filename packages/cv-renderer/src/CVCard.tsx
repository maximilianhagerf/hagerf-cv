import React from "react";
import type { ProfileLink } from "./schema.js";

export interface CVCardProps {
  name: string;
  headline?: string | null;
  links?: ProfileLink[];
}

export function CVCard({ name, headline, links }: CVCardProps): React.ReactElement {
  return (
    <div className="cv-card">
      <h2 className="cv-card-name">{name}</h2>
      {headline && <p className="cv-card-headline">{headline}</p>}
      {links && links.length > 0 && (
        <ul className="cv-card-links">
          {links.map((link, i) => (
            <li key={i} className="cv-card-link-item">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
