// Notion mapping and extraction helpers
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
    description: notes ?? undefined, // Explicitly set description (optional)
    workspace,
    url: page.url,
  };
}

export function extractTitle(titleProperty: NotionPageTitle): string {
  const titleArr = titleProperty?.title ?? [];
  if (Array.isArray(titleArr)) {
    return titleArr.map((t) => String(t.plain_text ?? "")).join("") || "Untitled";
  }
  return "Untitled";
}

export function extractRichText(richTextProperty: NotionRichText): string | undefined {
  const richArr = richTextProperty?.rich_text ?? [];
  if (Array.isArray(richArr)) {
    return richArr.map((t) => String(t.plain_text ?? "")).join("");
  }
  return undefined;
}

export function extractCheckbox(checkboxProperty: NotionCheckbox): boolean {
  return checkboxProperty?.checkbox === true;
}

export function extractDate(dateProperty: NotionDate): string | undefined {
  const dateObj = dateProperty?.date;
  if (dateObj?.start && typeof dateObj.start === "string") {
    return dateObj.start;
  }
  return undefined;
}

export function extractSelect(selectProperty: NotionSelect): import("../types").Priority | undefined {
  const selectObj = selectProperty?.select;
  const value = selectObj?.name;
  if (typeof value === "string" && Object.values(Priority).includes(value as Priority)) {
    return value as Priority;
  }
  return undefined;
}
