import { Client } from "@notionhq/client";
import type { NotablePoint } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_NOTABLE_POINTS = process.env.NOTION_DB_NOTABLE_POINTS!;

// Simple in-memory cache
let cache: { data: NotablePoint[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getRichText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text: string }> };
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getTitle(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }> };
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

function getSelect(prop: unknown): string | null {
  const p = prop as { select?: { name: string } | null };
  return p?.select?.name ?? null;
}

function getMultiSelect(prop: unknown): string[] {
  const p = prop as { multi_select?: Array<{ name: string }> };
  return p?.multi_select?.map((o) => o.name) ?? [];
}

function getNumber(prop: unknown): number | null {
  const p = prop as { number?: number | null };
  return p?.number ?? null;
}

export async function getNotablePoints(
  bustCache = false
): Promise<NotablePoint[]> {
  if (!bustCache && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const results: NotablePoint[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: DB_NOTABLE_POINTS,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;
      const props = page.properties;

      results.push({
        id: page.id,
        name: getTitle(props["Name"]),
        description: getRichText(props["Description"]),
        type: getSelect(props["Type"]) || getSelect(props["Category"]),
        status: getSelect(props["Status"]),
        engagementLayers: getMultiSelect(props["Engagement Layer"]),
        tags: getMultiSelect(props["Tags"]),
        x: getNumber(props["X (Map)"]) ?? getNumber(props["X"]),
        y: getNumber(props["Y (Map)"]) ?? getNumber(props["Y"]),
        zoomMin: getNumber(props["Zoom Min"]),
        notionUrl: (page as { url: string }).url,
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  cache = { data: results, timestamp: Date.now() };
  return results;
}

export async function placePoint(
  pageId: string,
  x: number,
  y: number
): Promise<void> {
  // Determine the correct property names by checking which exists
  const page = await notion.pages.retrieve({ page_id: pageId });
  const props = (page as { properties: Record<string, { type: string }> }).properties;

  const xProp = "X (Map)" in props ? "X (Map)" : "X";
  const yProp = "Y (Map)" in props ? "Y (Map)" : "Y";

  await notion.pages.update({
    page_id: pageId,
    properties: {
      [xProp]: { number: x },
      [yProp]: { number: y },
    },
  });

  // Bust cache after placement
  cache = null;
}
