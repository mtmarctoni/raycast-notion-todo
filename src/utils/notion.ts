// Notion mapping and extraction helpers

/**
 * Convert a 32-char hex Notion page ID to a notion:// URL that opens in the desktop app.
 * e.g. "1633914189d381ef88f4f9a212c7ea92" -> "notion://www.notion.so/16339141-89d3-81ef-88f4-f9a212c7ea92"
 */
export function toNotionPageUrl(pageId: string): string {
  const hex = pageId.replace(/-/g, "");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return `notion://www.notion.so/${uuid}`;
}

import {
  Todo,
  Workspaces,
  NotionPage,
  NotionProperties,
  NotionPageTitle,
  NotionRichText,
  NotionCheckbox,
  NotionDate,
  NotionSelect,
  Priority,
} from "../types";

export function mapNotionPageToTodo(
  page: NotionPage,
  fields: typeof import("../types").PERSONAL_DB_FIELDS | typeof import("../types").WORK_DB_FIELDS,
  workspace: Workspaces,
): Todo {
  const props = page.properties as NotionProperties;
  const done = extractCheckbox(props[fields.done] as NotionCheckbox);
  const notes = extractRichText(props[fields.notes] as NotionRichText);
  return {
    id: page.id,
    title: extractTitle(props[fields.title] as NotionPageTitle),
    done,
    dueDate: extractDate(props[fields.date] as NotionDate) ?? undefined,
    priority: extractSelect(props[fields.priority] as NotionSelect) ?? undefined,
    notes: notes ?? undefined,
    workspace,
    url: page.url,
  };
}

function extractTitle(titleProperty: NotionPageTitle): string {
  const titleArr = titleProperty?.title ?? [];
  if (Array.isArray(titleArr)) {
    return titleArr.map((t) => String(t.plain_text ?? "")).join("") || "Untitled";
  }
  return "Untitled";
}

function extractRichText(richTextProperty: NotionRichText): string | undefined {
  const richArr = richTextProperty?.rich_text ?? [];
  if (Array.isArray(richArr)) {
    return richArr.map((t) => String(t.plain_text ?? "")).join("");
  }
  return undefined;
}

function extractCheckbox(checkboxProperty: NotionCheckbox): boolean {
  return checkboxProperty?.checkbox === true;
}

function extractDate(dateProperty: NotionDate): string | undefined {
  const dateObj = dateProperty?.date;
  if (dateObj?.start && typeof dateObj.start === "string") {
    return dateObj.start;
  }
  return undefined;
}

function extractSelect(selectProperty: NotionSelect): import("../types").Priority | undefined {
  const selectObj = selectProperty?.select;
  const value = selectObj?.name;
  if (typeof value === "string" && Object.values(Priority).includes(value as Priority)) {
    return value as Priority;
  }
  return undefined;
}
