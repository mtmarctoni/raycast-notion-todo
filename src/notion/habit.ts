import { Client } from "@notionhq/client";
import { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import { getPreferenceValues } from "@raycast/api";

import { Preferences, HABIT_DB_FIELDS, HabitEntry, CreateHabitInput, NotionPage } from "../types";
import { withRetry, sleep } from "../utils";

const NOTION_VERSION = "2022-06-28";

function getHabitToken(): string {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.personal_notion_token;
}

function getHabitClient(): Client {
  return new Client({ auth: getHabitToken() });
}

function getHabitDatabaseId(): string {
  const prefs = getPreferenceValues<Preferences>();
  if (!prefs.habits_db_id) {
    throw new Error("Habits Database ID not configured. Please set it in extension preferences.");
  }
  return prefs.habits_db_id;
}

function extractCheckbox(props: Record<string, unknown>, key: string): boolean {
  const prop = props[key] as { checkbox?: boolean } | undefined;
  return prop?.checkbox === true;
}

function extractSelect(props: Record<string, unknown>, key: string): string | undefined {
  const prop = props[key] as { select?: { name: string } | null } | undefined;
  return prop?.select?.name ?? undefined;
}

function extractDate(props: Record<string, unknown>, key: string): string {
  const prop = props[key] as { date?: { start: string } | null } | undefined;
  return prop?.date?.start ?? "";
}

function extractTitle(props: Record<string, unknown>, key: string): string {
  const prop = props[key] as { title?: Array<{ plain_text: string }> } | undefined;
  return (prop?.title ?? []).map((t) => String(t.plain_text ?? "")).join("");
}

function mapNotionPageToHabitEntry(page: NotionPage): HabitEntry {
  const props = page.properties;
  const F = HABIT_DB_FIELDS;

  return {
    id: page.id,
    date: extractDate(props, F.date),
    dayOfWeek: extractTitle(props, F.dayOfWeek),
    exercise: extractCheckbox(props, F.exercise),
    typing: extractCheckbox(props, F.typing),
    visualize: extractCheckbox(props, F.visualize),
    read: extractCheckbox(props, F.read),
    anki: extractCheckbox(props, F.anki),
    oratory: extractCheckbox(props, F.oratory),
    pill: extractCheckbox(props, F.pill),
    write: extractCheckbox(props, F.write),
    mood: extractSelect(props, F.mood),
    url: page.url,
  };
}

export async function fetchHabits(): Promise<HabitEntry[]> {
  const token = getHabitToken();
  const databaseId = getHabitDatabaseId();
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
          sorts: [{ property: HABIT_DB_FIELDS.date, direction: "descending" }],
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
      return data.results.map((page) => mapNotionPageToHabitEntry(page));
    } catch (error: unknown) {
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        console.debug(`Notion fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        await sleep(delay);
        continue;
      }
      console.debug("Error fetching habits:", error);
      return [];
    }
  }
  return [];
}

export async function createHabit(
  input: CreateHabitInput,
): Promise<{ success: true; pageId: string; url: string } | { success: false; error: string }> {
  const client = getHabitClient();
  const databaseId = getHabitDatabaseId();
  const F = HABIT_DB_FIELDS;

  const properties: CreatePageParameters["properties"] = {
    [F.dayOfWeek]: {
      title: [{ text: { content: input.dayOfWeek } }],
    },
    [F.date]: {
      date: { start: input.date },
    },
  };

  if (input.exercise) properties[F.exercise] = { checkbox: true };
  if (input.typing) properties[F.typing] = { checkbox: true };
  if (input.visualize) properties[F.visualize] = { checkbox: true };
  if (input.read) properties[F.read] = { checkbox: true };
  if (input.anki) properties[F.anki] = { checkbox: true };
  if (input.oratory) properties[F.oratory] = { checkbox: true };
  if (input.pill) properties[F.pill] = { checkbox: true };
  if (input.write) properties[F.write] = { checkbox: true };
  if (input.mood) properties[F.mood] = { select: { name: input.mood } };

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
