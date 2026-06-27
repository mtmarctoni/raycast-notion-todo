import { describe, it, expect } from "vitest";
import { getDateCategory, groupByDate, OVERDUE_THRESHOLD_DAYS } from "../utils/todo-grouping";
import { Todo, TodoDateGroup, Workspaces } from "../types";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

describe("getDateCategory", () => {
  it("returns PENDING for no date", () => {
    expect(getDateCategory(undefined)).toBe(TodoDateGroup.PENDING);
  });

  it("returns OVERDUE for yesterday", () => {
    const yesterday = formatLocalDate(addDays(today, -1));
    expect(getDateCategory(yesterday)).toBe(TodoDateGroup.OVERDUE);
  });

  it("returns OVERDUE for 7 days ago (boundary inclusive)", () => {
    const date = formatLocalDate(addDays(today, -OVERDUE_THRESHOLD_DAYS));
    expect(getDateCategory(date)).toBe(TodoDateGroup.OVERDUE);
  });

  it("returns PENDING for 8 days ago (just over threshold)", () => {
    const date = formatLocalDate(addDays(today, -(OVERDUE_THRESHOLD_DAYS + 1)));
    expect(getDateCategory(date)).toBe(TodoDateGroup.PENDING);
  });

  it("returns TODAY for today", () => {
    const date = formatLocalDate(today);
    expect(getDateCategory(date)).toBe(TodoDateGroup.TODAY);
  });

  it("returns TOMORROW for tomorrow", () => {
    const date = formatLocalDate(addDays(today, 1));
    expect(getDateCategory(date)).toBe(TodoDateGroup.TOMORROW);
  });

  it("returns THIS_WEEK for 3 days from now", () => {
    const date = formatLocalDate(addDays(today, 3));
    expect(getDateCategory(date)).toBe(TodoDateGroup.THIS_WEEK);
  });

  it("returns THIS_WEEK for 7 days from now (boundary inclusive)", () => {
    const date = formatLocalDate(addDays(today, OVERDUE_THRESHOLD_DAYS));
    expect(getDateCategory(date)).toBe(TodoDateGroup.THIS_WEEK);
  });

  it("returns LATER for 8 days from now", () => {
    const date = formatLocalDate(addDays(today, OVERDUE_THRESHOLD_DAYS + 1));
    expect(getDateCategory(date)).toBe(TodoDateGroup.LATER);
  });
});

describe("groupByDate", () => {
  function makeTodo(overrides: Partial<Todo> & { dueDate: string }): Todo;
  function makeTodo(overrides: Partial<Todo>): Todo;
  function makeTodo(overrides: Partial<Todo>): Todo {
    return {
      id: "test-id",
      title: "Test todo",
      done: false,
      workspace: Workspaces.PERSONAL,
      url: "https://notion.so/test",
      ...overrides,
    };
  }

  it("sorts OVERDUE descending (most recent past-due first)", () => {
    const todos = [
      makeTodo({ dueDate: formatLocalDate(addDays(today, -5)), title: "5 days ago" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, -1)), title: "yesterday" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, -3)), title: "3 days ago" }),
    ];

    const grouped = groupByDate(todos);

    expect(grouped[TodoDateGroup.OVERDUE].map((t) => t.title)).toEqual(["yesterday", "3 days ago", "5 days ago"]);
  });

  it("sorts THIS_WEEK ascending (closest deadline first)", () => {
    const todos = [
      makeTodo({ dueDate: formatLocalDate(addDays(today, 5)), title: "5 days out" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 2)), title: "2 days out" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 4)), title: "4 days out" }),
    ];

    const grouped = groupByDate(todos);

    expect(grouped[TodoDateGroup.THIS_WEEK].map((t) => t.title)).toEqual(["2 days out", "4 days out", "5 days out"]);
  });

  it("sorts LATER ascending (closest deadline first)", () => {
    const todos = [
      makeTodo({ dueDate: formatLocalDate(addDays(today, 14)), title: "14 days out" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 10)), title: "10 days out" }),
    ];

    const grouped = groupByDate(todos);

    expect(grouped[TodoDateGroup.LATER].map((t) => t.title)).toEqual(["10 days out", "14 days out"]);
  });

  it("sorts PENDING descending with dated items before undated", () => {
    const todos = [
      makeTodo({ dueDate: formatLocalDate(addDays(today, -20)), title: "20 days ago" }),
      makeTodo({ id: "no-date-1", title: "no date" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, -15)), title: "15 days ago" }),
    ];

    const grouped = groupByDate(todos);

    const pendingTitles = grouped[TodoDateGroup.PENDING].map((t) => t.title);
    expect(pendingTitles).toEqual(["15 days ago", "20 days ago", "no date"]);
  });

  it("assigns items to the correct section", () => {
    const todos = [
      makeTodo({ dueDate: formatLocalDate(addDays(today, -3)), title: "overdue" }),
      makeTodo({ dueDate: formatLocalDate(today), title: "today" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 1)), title: "tomorrow" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 4)), title: "this week" }),
      makeTodo({ dueDate: formatLocalDate(addDays(today, 14)), title: "later" }),
      makeTodo({ title: "pending" }),
    ];

    const grouped = groupByDate(todos);

    expect(grouped[TodoDateGroup.OVERDUE]).toHaveLength(1);
    expect(grouped[TodoDateGroup.TODAY]).toHaveLength(1);
    expect(grouped[TodoDateGroup.TOMORROW]).toHaveLength(1);
    expect(grouped[TodoDateGroup.THIS_WEEK]).toHaveLength(1);
    expect(grouped[TodoDateGroup.LATER]).toHaveLength(1);
    expect(grouped[TodoDateGroup.PENDING]).toHaveLength(1);

    expect(grouped[TodoDateGroup.OVERDUE][0].title).toBe("overdue");
    expect(grouped[TodoDateGroup.TODAY][0].title).toBe("today");
    expect(grouped[TodoDateGroup.TOMORROW][0].title).toBe("tomorrow");
    expect(grouped[TodoDateGroup.THIS_WEEK][0].title).toBe("this week");
    expect(grouped[TodoDateGroup.LATER][0].title).toBe("later");
    expect(grouped[TodoDateGroup.PENDING][0].title).toBe("pending");
  });
});
