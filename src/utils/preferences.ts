// Preferences helpers
import { Preferences } from "../types";

export type MissingPreferenceKey =
  | "Personal Notion Token"
  | "Personal Database ID"
  | "Work Notion Token"
  | "Work Database ID";

export function missingPreferences(prefs: Preferences): MissingPreferenceKey[] {
  return [
    !prefs.personal_notion_token && "Personal Notion Token",
    !prefs.personal_db_id && "Personal Database ID",
    !prefs.work_notion_token && "Work Notion Token",
    !prefs.work_db_id && "Work Database ID",
  ].filter(Boolean) as MissingPreferenceKey[];
}
