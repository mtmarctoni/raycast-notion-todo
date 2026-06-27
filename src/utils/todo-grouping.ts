import { Todo, TodoDateGroup } from "../types";

export const OVERDUE_THRESHOLD_DAYS = 7;

export function getDateCategory(dateStr?: string): TodoDateGroup {
  if (!dateStr) return TodoDateGroup.PENDING;
  const today = new Date();
  const date = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 && diffDays >= -OVERDUE_THRESHOLD_DAYS) return TodoDateGroup.OVERDUE;
  if (diffDays < -OVERDUE_THRESHOLD_DAYS) return TodoDateGroup.PENDING;
  if (diffDays === 0) return TodoDateGroup.TODAY;
  if (diffDays === 1) return TodoDateGroup.TOMORROW;
  if (diffDays >= 2 && diffDays <= OVERDUE_THRESHOLD_DAYS) return TodoDateGroup.THIS_WEEK;
  if (diffDays > OVERDUE_THRESHOLD_DAYS) return TodoDateGroup.LATER;
  return TodoDateGroup.PENDING;
}

export function groupByDate(todos: Todo[]): Record<TodoDateGroup, Todo[]> {
  const grouped: Record<TodoDateGroup, Todo[]> = {
    [TodoDateGroup.OVERDUE]: [],
    [TodoDateGroup.TODAY]: [],
    [TodoDateGroup.TOMORROW]: [],
    [TodoDateGroup.THIS_WEEK]: [],
    [TodoDateGroup.PENDING]: [],
    [TodoDateGroup.LATER]: [],
  };
  todos.forEach((todo) => {
    const cat = getDateCategory(todo.dueDate);
    grouped[cat].push(todo);
  });

  grouped[TodoDateGroup.OVERDUE].sort((a, b) => b.dueDate!.localeCompare(a.dueDate!));
  grouped[TodoDateGroup.THIS_WEEK].sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  grouped[TodoDateGroup.LATER].sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  grouped[TodoDateGroup.PENDING].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return b.dueDate.localeCompare(a.dueDate);
  });

  return grouped;
}
