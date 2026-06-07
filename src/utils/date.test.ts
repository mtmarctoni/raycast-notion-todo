import { describe, it, expect } from "vitest";
import { formatVisualDate, formatLocalDate, getTomorrow, getNextMonday, isOverdue } from "./date";

describe("isOverdue", () => {
  it("returns true for a past date", () => {
    const pastDate = new Date("2020-01-01");
    expect(isOverdue(pastDate.toISOString())).toBe(true);
  });

  it("returns false for a future date", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });

  it("returns false for today", () => {
    expect(isOverdue(new Date().toISOString())).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe("formatVisualDate", () => {
  it("includes year for dates in a different year", () => {
    const date = new Date("2023-06-15");
    const result = formatVisualDate(date);
    expect(result).toContain("2023");
  });

  it("omits year for current year dates", () => {
    const date = new Date();
    const result = formatVisualDate(date);
    expect(result).not.toContain(String(date.getFullYear()));
  });
});

describe("formatLocalDate", () => {
  it("formats as YYYY-MM-DD", () => {
    const date = new Date("2026-03-15");
    expect(formatLocalDate(date)).toBe("2026-03-15");
  });

  it("pads single-digit month and day", () => {
    const date = new Date("2026-01-05");
    expect(formatLocalDate(date)).toBe("2026-01-05");
  });
});

describe("getTomorrow", () => {
  it("returns a date string one day in the future", () => {
    const tomorrowStr = getTomorrow();
    const tomorrow = new Date(tomorrowStr);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expect(tomorrow.getFullYear()).toBe(expected.getFullYear());
    expect(tomorrow.getMonth()).toBe(expected.getMonth());
    expect(tomorrow.getDate()).toBe(expected.getDate());
  });
});

describe("getNextMonday", () => {
  it("returns a date string that is a Monday", () => {
    const nextMonday = new Date(getNextMonday());
    expect(nextMonday.getDay()).toBe(1);
  });

  it("returns a date in the future", () => {
    const nextMonday = new Date(getNextMonday());
    expect(nextMonday.getTime()).toBeGreaterThan(Date.now() - 86400000);
  });
});
