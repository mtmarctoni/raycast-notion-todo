import { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import { getPreferenceValues } from "@raycast/api";

import { Client } from "@notionhq/client";
import {
  PERSONAL_DB_FIELDS,
  WORK_DB_FIELDS,
  Workspaces,
  Preferences,
  CreateTodoInput,
  Todo,
  NotionPage,
} from "../types";
import { mapNotionPageToTodo, sleep, withRetry } from "../utils";

function getNotionClient(workspace: Workspaces): Client {
  const prefs = getPreferenceValues<Preferences>();
  const token = workspace === Workspaces.PERSONAL ? prefs.personal_notion_token : prefs.work_notion_token;
  return new Client({ auth: token });
}

function getDatabaseId(workspace: Workspaces): string {
  const prefs = getPreferenceValues<Preferences>();
  return workspace === Workspaces.PERSONAL ? prefs.personal_db_id : prefs.work_db_id;
}

export async function deleteTodo(pageId: string, workspace: Workspaces): Promise<boolean> {
  const client = getNotionClient(workspace);
  try {
    await withRetry(() =>
      client.pages.update({
        page_id: pageId,
        archived: true,
      }),
    );
    return true;
  } catch (error) {
    console.debug("Failed to delete todo:", error);
    return false;
  }
}

export async function createTodo(
  workspace: Workspaces,
  input: CreateTodoInput,
): Promise<{ success: true; pageId: string; url: string } | { success: false; error: string }> {
  const client = getNotionClient(workspace);
  const databaseId = getDatabaseId(workspace);

  const FIELDS = workspace === Workspaces.PERSONAL ? PERSONAL_DB_FIELDS : WORK_DB_FIELDS;
  const properties: CreatePageParameters["properties"] = {
    [FIELDS.title]: {
      title: [
        {
          text: {
            content: input.title,
          },
        },
      ],
    },
    [FIELDS.done]: {
      checkbox: false,
    },
  };

  if (input.notes) {
    properties[FIELDS.notes] = {
      rich_text: [
        {
          text: {
            content: input.notes,
          },
        },
      ],
    };
  }
  if (input.dueDate) {
    properties[FIELDS.date] = {
      date: {
        start: input.dueDate,
      },
    };
  }
  if (input.priority) {
    properties[FIELDS.priority] = {
      select: {
        name: input.priority,
      },
    };
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

export async function markTodoCompleted(pageId: string, workspace: Workspaces): Promise<boolean> {
  const client = getNotionClient(workspace);
  const FIELDS = workspace === Workspaces.PERSONAL ? PERSONAL_DB_FIELDS : WORK_DB_FIELDS;
  try {
    await withRetry(() =>
      client.pages.update({
        page_id: pageId,
        properties: {
          [FIELDS.done]: { checkbox: true },
        },
      }),
    );
    return true;
  } catch (error) {
    console.debug("Failed to mark todo completed:", error);
    return false;
  }
}

export async function updateTodo(pageId: string, workspace: Workspaces, updates: Partial<Todo>) {
  const client = getNotionClient(workspace);
  const FIELDS = workspace === Workspaces.PERSONAL ? PERSONAL_DB_FIELDS : WORK_DB_FIELDS;
  try {
    await withRetry(() =>
      client.pages.update({
        page_id: pageId,
        properties: {
          ...(updates.title ? { [FIELDS.title]: { title: [{ text: { content: updates.title } }] } } : {}),
          ...(updates.priority ? { [FIELDS.priority]: { select: { name: updates.priority } } } : {}),
          ...(updates.notes ? { [FIELDS.notes]: { rich_text: [{ text: { content: updates.notes } }] } } : {}),
          ...(updates.dueDate ? { [FIELDS.date]: { date: { start: updates.dueDate } } } : {}),
        },
      }),
    );
    return true;
  } catch (error) {
    console.debug("Failed to update todo:", error);
    return false;
  }
}

const NOTION_VERSION = "2022-06-28";

export async function fetchTodosFromWorkspace(workspace: Workspaces): Promise<Todo[]> {
  const token = getNotionToken(workspace);
  const databaseId = getDatabaseId(workspace);
  const fields = workspace === Workspaces.PERSONAL ? PERSONAL_DB_FIELDS : WORK_DB_FIELDS;
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
          sorts: [{ timestamp: "created_time", direction: "descending" }],
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
      return data.results.map((page) => mapNotionPageToTodo(page, fields, workspace));
    } catch (error: unknown) {
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        console.debug(`Notion fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        await sleep(delay);
        continue;
      }
      console.debug(`Error fetching ${workspace} todos:`, error);
      return [];
    }
  }
  return [];
}

function getNotionToken(workspace: Workspaces): string {
  const prefs = getPreferenceValues<Preferences>();
  return workspace === Workspaces.PERSONAL ? prefs.personal_notion_token : prefs.work_notion_token;
}
