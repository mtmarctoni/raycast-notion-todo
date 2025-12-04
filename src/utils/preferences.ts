// Preferences helpers
import { Preferences } from "../types";

export function missingPreferences(prefs: Preferences): string[] {
  return [
    !prefs.personal_notion_token && "Personal Notion Token",
    !prefs.personal_db_id && "Personal Database ID",
    !prefs.work_notion_token && "Work Notion Token",
    !prefs.work_db_id && "Work Database ID",
  ].filter(Boolean) as string[];
}
