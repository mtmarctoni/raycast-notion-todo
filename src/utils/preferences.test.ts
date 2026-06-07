import { describe, it, expect } from "vitest";
import { missingPreferences } from "./preferences";

describe("missingPreferences", () => {
  it("returns all keys when all preferences are missing", () => {
    const result = missingPreferences({} as never);
    expect(result).toEqual(["Personal Notion Token", "Personal Database ID", "Work Notion Token", "Work Database ID"]);
  });

  it("returns empty array when all preferences are present", () => {
    const prefs = {
      personal_notion_token: "tok_1",
      personal_db_id: "db_1",
      work_notion_token: "tok_2",
      work_db_id: "db_2",
    };
    const result = missingPreferences(prefs as never);
    expect(result).toEqual([]);
  });

  it("returns only missing personal token", () => {
    const prefs = {
      personal_notion_token: "",
      personal_db_id: "db_1",
      work_notion_token: "tok_2",
      work_db_id: "db_2",
    };
    const result = missingPreferences(prefs as never);
    expect(result).toEqual(["Personal Notion Token"]);
  });
});
