import { Client } from "@notionhq/client";
import type { Character } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB_CHARACTERS = process.env.NOTION_DB_CHARACTERS!;

let cache: { data: Character[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function getTitle(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }> };
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

function getRichText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text: string }> };
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getStatus(prop: unknown): string | null {
  const p = prop as {
    type?: string;
    status?: { name: string } | null;
    select?: { name: string } | null;
  };
  if (p?.type === "status") return p?.status?.name ?? null;
  if (p?.type === "select") return p?.select?.name ?? null;
  return p?.status?.name ?? p?.select?.name ?? null;
}

export async function getCharacters(bustCache = false): Promise<Character[]> {
  if (!bustCache && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const results: Character[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: DB_CHARACTERS,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;
      const props = page.properties;

      results.push({
        id: page.id,
        name: getTitle(props["Name"]),
        status: getStatus(props["Status"]),
        routinesRaw: getRichText(props["Routines"]),
        notionUrl: (page as { url: string }).url,
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  cache = { data: results, timestamp: Date.now() };
  return results;
}

export async function updateRoutines(
  pageId: string,
  routinesText: string
): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Routines: {
        rich_text: [{ text: { content: routinesText } }],
      },
    },
  });
  cache = null;
}
