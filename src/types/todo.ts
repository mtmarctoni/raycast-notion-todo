// Todo domain types

export enum TodoDateGroup {
  PAST = "Past",
  TODAY = "Today",
  TOMORROW = "Tomorrow",
  NEXT_WEEK = "Next Week",
  LATER = "Later",
  NO_DATE = "No Date",
}

export enum Workspaces {
  PERSONAL = "personal",
  WORK = "work",
}

export enum Priority {
  MUY_ALTA = "MUY ALTA",
  ALTA = "Alta",
  MEDIA = "Media",
  BAJA = "Baja",
  DELEGAR = "Delegar",
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  dueDate?: string;
  priority?: Priority;
  notes?: string;
  workspace: Workspaces;
  url: string;
}

export type CreateTodoInput = Pick<Todo, "title" | "description" | "dueDate" | "priority" | "notes">;

export type ParsedTodo = Pick<Todo, "title" | "workspace" | "description" | "dueDate" | "priority">;

export interface QuickAddArguments {
  text: string;
}

export enum TodoFilter {
  ALL = "all",
  PERSONAL = "personal",
  WORK = "work",
}
