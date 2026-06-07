import { useEffect, useMemo, useState } from "react";
import { fetchTodosFromWorkspace } from "../notion";
import { Todo, TodoDateGroup, TodoFilter, Workspaces } from "../types";

function getDateCategory(dateStr?: string): TodoDateGroup {
  if (!dateStr) return TodoDateGroup.NO_DATE;
  const today = new Date();
  const date = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return TodoDateGroup.PAST;
  if (diffDays === 0) return TodoDateGroup.TODAY;
  if (diffDays === 1) return TodoDateGroup.TOMORROW;
  if (diffDays > 1 && diffDays <= 7) return TodoDateGroup.NEXT_WEEK;
  if (diffDays > 7) return TodoDateGroup.LATER;
  return TodoDateGroup.NO_DATE;
}

function groupByDate(todos: Todo[]): Record<TodoDateGroup, Todo[]> {
  const grouped: Record<TodoDateGroup, Todo[]> = {
    [TodoDateGroup.PAST]: [],
    [TodoDateGroup.TODAY]: [],
    [TodoDateGroup.TOMORROW]: [],
    [TodoDateGroup.NEXT_WEEK]: [],
    [TodoDateGroup.LATER]: [],
    [TodoDateGroup.NO_DATE]: [],
  };
  todos.forEach((todo) => {
    const cat = getDateCategory(todo.dueDate);
    grouped[cat].push(todo);
  });
  return grouped;
}

const FILTERS: TodoFilter[] = [TodoFilter.ALL, TodoFilter.PERSONAL, TodoFilter.WORK];

export function getNextFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx + 1) % FILTERS.length];
}

export function getPrevFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx - 1 + FILTERS.length) % FILTERS.length];
}

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  return todos
    .filter((todo) => {
      if (filter === TodoFilter.PERSONAL) return todo.workspace === Workspaces.PERSONAL && !todo.done;
      if (filter === TodoFilter.WORK) return todo.workspace === Workspaces.WORK && !todo.done;
      return !todo.done;
    })
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodoFilter>(TodoFilter.ALL);

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      const [personalTodos, workTodos] = await Promise.all([
        fetchTodosFromWorkspace(Workspaces.PERSONAL),
        fetchTodosFromWorkspace(Workspaces.WORK),
      ]);
      setTodos([...personalTodos, ...workTodos]);
      setLoading(false);
    }
    loadTodos();
  }, []);

  const filteredTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);
  const grouped = useMemo(() => groupByDate(filteredTodos), [filteredTodos]);

  return { todos, setTodos, loading, filter, setFilter, grouped };
}
