import { Client } from "@notionhq/client";
import { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import { getPreferenceValues } from "@raycast/api";

import { Preferences, JOURNAL_DB_FIELDS, JournalEntry, CreateJournalInput, NotionPage } from "../types";
import { withRetry, sleep } from "../utils";

const NOTION_VERSION = "2022-06-28";

function getJournalToken(): string {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.personal_notion_token;
}

function getJournalClient(): Client {
  return new Client({ auth: getJournalToken() });
}

function getJournalDatabaseId(): string {
  const prefs = getPreferenceValues<Preferences>();
  if (!prefs.journal_db_id) {
    throw new Error("Journal Database ID not configured. Please set it in extension preferences.");
  }
  return prefs.journal_db_id;
}

function mapNotionPageToJournalEntry(page: NotionPage): JournalEntry {
  const props = page.properties;
  const F = JOURNAL_DB_FIELDS;

  const titleArr = (props[F.title] as { title?: Array<{ plain_text: string }> })?.title ?? [];
  const title = titleArr.map((t) => String(t.plain_text ?? "")).join("");

  const dateObj = (props[F.date] as { date?: { start: string } | null })?.date;
  const date = dateObj?.start ?? "";

  const moodObj = (props[F.mood] as { select?: { name: string } | null })?.select;
  const mood = moodObj?.name ?? undefined;

  const affectsObj = (props[F.affects] as { select?: { name: string } | null })?.select;
  const affects = affectsObj?.name ?? undefined;

  const energyObj = (props[F.energy] as { select?: { name: string } | null })?.select;
  const energy = energyObj?.name ?? undefined;

  const gratefulArr = (props[F.grateful] as { rich_text?: Array<{ plain_text: string }> })?.rich_text ?? [];
  const grateful = gratefulArr.map((t) => String(t.plain_text ?? "")).join("") || undefined;

  const improveArr = (props[F.improve] as { rich_text?: Array<{ plain_text: string }> })?.rich_text ?? [];
  const improve = improveArr.map((t) => String(t.plain_text ?? "")).join("") || undefined;

  const highlight = (props[F.highlight] as { checkbox?: boolean })?.checkbox === true;

  return {
    id: page.id,
    title,
    date,
    mood,
    affects,
    energy,
    grateful,
    improve,
    highlight,
    url: page.url,
  };
}

export async function fetchJournals(): Promise<JournalEntry[]> {
  const token = getJournalToken();
  const databaseId = getJournalDatabaseId();
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          sorts: [{ property: JOURNAL_DB_FIELDS.date, direction: "descending" }],
        }),
      });
      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = (retryAfter ? parseInt(retryAfter, 10) : 1) * 1000 * Math.pow(2, attempt);
          console.debug(`Notion rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { results: NotionPage[] };
      return data.results.map((page) => mapNotionPageToJournalEntry(page));
    } catch (error: unknown) {
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        console.debug(`Notion fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        await sleep(delay);
        continue;
      }
      console.debug("Error fetching journals:", error);
      return [];
    }
  }
  return [];
}

export async function createJournal(
  input: CreateJournalInput,
): Promise<{ success: true; pageId: string; url: string } | { success: false; error: string }> {
  const client = getJournalClient();
  const databaseId = getJournalDatabaseId();
  const F = JOURNAL_DB_FIELDS;

  const titleText = input.title || input.date;

  const properties: CreatePageParameters["properties"] = {
    [F.title]: {
      title: [{ text: { content: titleText } }],
    },
    [F.date]: {
      date: { start: input.date },
    },
  };

  if (input.mood) {
    properties[F.mood] = { select: { name: input.mood } };
  }
  if (input.affects) {
    properties[F.affects] = { select: { name: input.affects } };
  }
  if (input.energy) {
    properties[F.energy] = { select: { name: input.energy } };
  }
  if (input.grateful) {
    properties[F.grateful] = {
      rich_text: [{ text: { content: input.grateful } }],
    };
  }
  if (input.improve) {
    properties[F.improve] = {
      rich_text: [{ text: { content: input.improve } }],
    };
  }
  if (input.highlight) {
    properties[F.highlight] = { checkbox: true };
  }

  try {
    const response = await withRetry(() =>
      client.pages.create({
        parent: { database_id: databaseId },
        properties,
      }),
    );
    const page = response as { id: string; url: string };
    return { success: true, pageId: page.id, url: page.url };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "unauthorized"
    ) {
      return { success: false, error: "Unauthorized: Check your Notion token and database sharing." };
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

async function fetchBlockChildrenRaw(blockId: string): Promise<NotionBlock[]> {
  const token = getJournalToken();
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
      });
      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = (retryAfter ? parseInt(retryAfter, 10) : 1) * 1000 * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { results: NotionBlock[] };
      return data.results;
    } catch (error: unknown) {
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        console.debug(`Notion fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        await sleep(delay);
        continue;
      }
      console.debug("Error fetching blocks:", error);
      return [];
    }
  }
  return [];
}

export async function fetchJournalBlocks(pageId: string): Promise<NotionBlock[]> {
  return fetchBlockChildrenRaw(pageId);
}

export async function fetchBlockChildren(blockId: string): Promise<NotionBlock[]> {
  return fetchBlockChildrenRaw(blockId);
}
