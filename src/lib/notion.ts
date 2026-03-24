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

function getStatus(prop: unknown): string | null {
  // Handles both Notion "status" type and "select" type
  const p = prop as {
    type?: string;
    status?: { name: string } | null;
    select?: { name: string } | null;
  };
  if (p?.type === "status") return p?.status?.name ?? null;
  if (p?.type === "select") return p?.select?.name ?? null;
  // Fallback: try both
  return p?.status?.name ?? p?.select?.name ?? null;
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
        status: getStatus(props["Status"]),
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

export async function getPageContent(pageId: string): Promise<string> {
  const blocks: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if (!("type" in block)) continue;
      const b = block as Record<string, unknown>;
      const type = b.type as string;
      const data = b[type] as { rich_text?: Array<{ plain_text: string }> } | undefined;
      const text = data?.rich_text?.map((t) => t.plain_text).join("") ?? "";

      if (!text && type !== "divider") continue;

      switch (type) {
        case "heading_1":
          blocks.push(`# ${text}`);
          break;
        case "heading_2":
          blocks.push(`## ${text}`);
          break;
        case "heading_3":
          blocks.push(`### ${text}`);
          break;
        case "bulleted_list_item":
          blocks.push(`• ${text}`);
          break;
        case "numbered_list_item":
          blocks.push(`  ${text}`);
          break;
        case "to_do": {
          const checked = (b[type] as { checked?: boolean })?.checked;
          blocks.push(`${checked ? "☑" : "☐"} ${text}`);
          break;
        }
        case "divider":
          blocks.push("---");
          break;
        default:
          if (text) blocks.push(text);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks.join("\n\n");
}

export async function updatePointStatus(
  pageId: string,
  status: string
): Promise<void> {
  // Determine the property type first
  const page = await notion.pages.retrieve({ page_id: pageId });
  const props = (page as { properties: Record<string, { type: string }> }).properties;
  const statusProp = props["Status"];

  const update: Record<string, unknown> = {};
  if (statusProp?.type === "status") {
    update["Status"] = { status: { name: status } };
  } else {
    update["Status"] = { select: { name: status } };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notion.pages.update({
    page_id: pageId,
    properties: update,
  } as any);
  cache = null;
}

export async function createPoint(name: string): Promise<NotablePoint> {
  // Detect Status property type from database schema
  const db = await notion.databases.retrieve({ database_id: DB_NOTABLE_POINTS });
  const statusPropType = (db.properties as Record<string, { type: string }>)["Status"]?.type;
  const statusValue =
    statusPropType === "status"
      ? { status: { name: "Placeholder" } }
      : { select: { name: "Placeholder" } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await (notion.pages.create as any)({
    parent: { database_id: DB_NOTABLE_POINTS },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Status: statusValue,
    },
  });

  cache = null;

  const props = (page as { properties: Record<string, unknown> }).properties;
  return {
    id: page.id,
    name,
    description: "",
    type: getSelect(props["Type"]) || getSelect(props["Category"]),
    status: "Placeholder",
    engagementLayers: [],
    tags: [],
    x: null,
    y: null,
    zoomMin: null,
    notionUrl: (page as { url: string }).url,
  };
}

export async function placePoint(
  pageId: string,
  x: number | null,
  y: number | null
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
