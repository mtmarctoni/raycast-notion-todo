import { describe, it, expect } from "vitest";
import { isOverdue } from "./date";

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
});
