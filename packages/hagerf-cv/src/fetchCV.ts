import { type } from "arktype";
import { CVData } from "@hagerf-cv/renderer";
import type { CVData as CVDataType } from "@hagerf-cv/renderer";

export interface FetchCVOptions {
  token: string;
  apiUrl?: string;
}

export async function fetchCV({
  token,
  apiUrl = "https://cv.hagerf.se",
}: FetchCVOptions): Promise<CVDataType> {
  const url = `${apiUrl}/api/cv/${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `fetchCV: server returned ${response.status} ${response.statusText} for ${url}`,
    );
  }

  const json: unknown = await response.json();
  const result = CVData(json);

  if (result instanceof type.errors) {
    throw result;
  }

  return result;
}
