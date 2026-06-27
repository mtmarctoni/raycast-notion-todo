// Todo domain types

export enum TodoDateGroup {
  OVERDUE = "Overdue",
  TODAY = "Today",
  TOMORROW = "Tomorrow",
  THIS_WEEK = "This Week",
  PENDING = "Pending",
  LATER = "Later",
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
  done: boolean;
  dueDate?: string;
  priority?: Priority;
  notes?: string;
  workspace: Workspaces;
  url: string;
}

export type CreateTodoInput = Pick<Todo, "title" | "dueDate" | "priority" | "notes">;

export type ParsedTodo = Pick<Todo, "title" | "workspace" | "dueDate" | "priority" | "notes">;

export interface QuickAddArguments {
  text: string;
}

export enum TodoFilter {
  ALL = "all",
  PERSONAL = "personal",
  WORK = "work",
}
