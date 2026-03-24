import { Client } from "@notionhq/client";
import type { MapTag } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_MAP_TAGS = process.env.NOTION_DB_MAP_TAGS!;

let cache: { data: MapTag[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function getTitle(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }> };
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

function getRichText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text: string }> };
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getSelect(prop: unknown): string | null {
  const p = prop as { select?: { name: string } | null };
  return p?.select?.name ?? null;
}

function getCheckbox(prop: unknown): boolean {
  const p = prop as { checkbox?: boolean };
  return p?.checkbox ?? false;
}

function getNumber(prop: unknown): number | null {
  const p = prop as { number?: number | null };
  return p?.number ?? null;
}

function getCreatedTime(prop: unknown): string {
  const p = prop as { created_time?: string };
  return p?.created_time ?? "";
}

export async function getMapTags(bustCache = false): Promise<MapTag[]> {
  if (!bustCache && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const results: MapTag[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: DB_MAP_TAGS,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;
      const props = page.properties;

      results.push({
        id: page.id,
        name: getTitle(props["Name"]),
        tagType: getSelect(props["Select"]),
        done: getCheckbox(props["Done?"]),
        x: getNumber(props["X (Map)"]),
        y: getNumber(props["Y (Map)"]),
        addedBy: getRichText(props["Added by"]),
        createdTime: getCreatedTime(props["Created time"]),
        notionUrl: (page as { url: string }).url,
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  cache = { data: results, timestamp: Date.now() };
  return results;
}

export async function getTagTypeOptions(): Promise<string[]> {
  const db = await notion.databases.retrieve({ database_id: DB_MAP_TAGS });
  const selectProp = (db.properties as Record<string, Record<string, unknown>>)["Select"];
  if (selectProp?.type === "select") {
    const opts = (selectProp as { select?: { options?: Array<{ name: string }> } }).select?.options;
    return opts?.map((o) => o.name) ?? [];
  }
  return [];
}

export async function createMapTag(
  name: string,
  tagType: string,
  addedBy: string
): Promise<MapTag> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await (notion.pages.create as any)({
    parent: { database_id: DB_MAP_TAGS },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Select: { select: { name: tagType } },
      "Added by": { rich_text: [{ text: { content: addedBy } }] },
    },
  });

  cache = null;

  return {
    id: page.id,
    name,
    tagType,
    done: false,
    x: null,
    y: null,
    addedBy,
    createdTime: new Date().toISOString(),
    notionUrl: (page as { url: string }).url,
  };
}

export async function updateMapTag(
  pageId: string,
  updates: { done?: boolean; tagType?: string }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};

  if (updates.done !== undefined) {
    properties["Done?"] = { checkbox: updates.done };
  }
  if (updates.tagType !== undefined) {
    properties["Select"] = { select: { name: updates.tagType } };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notion.pages.update({ page_id: pageId, properties } as any);
  cache = null;
}
