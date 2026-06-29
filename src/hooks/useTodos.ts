import { useEffect, useMemo, useState } from "react";
import { fetchTodosFromWorkspace } from "../notion";
import { Todo, TodoFilter, Workspaces } from "../types";
import { groupByDate } from "../utils/todo-grouping";

const FILTERS: TodoFilter[] = [TodoFilter.ALL, TodoFilter.PERSONAL, TodoFilter.WORK];

export function getNextFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx + 1) % FILTERS.length];
}

export function getPrevFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx - 1 + FILTERS.length) % FILTERS.length];
}

function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  return todos.filter((todo) => {
    if (filter === TodoFilter.PERSONAL) return todo.workspace === Workspaces.PERSONAL && !todo.done;
    if (filter === TodoFilter.WORK) return todo.workspace === Workspaces.WORK && !todo.done;
    return !todo.done;
  });
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodoFilter>(TodoFilter.ALL);

  useEffect(() => {
    let cancelled = false;
    async function loadTodos() {
      setLoading(true);
      const personalTodos = await fetchTodosFromWorkspace(Workspaces.PERSONAL);
      const workTodos = await fetchTodosFromWorkspace(Workspaces.WORK);
      if (!cancelled) {
        setTodos([...personalTodos, ...workTodos]);
        setLoading(false);
      }
    }
    loadTodos();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);
  const grouped = useMemo(() => groupByDate(filteredTodos), [filteredTodos]);

  return { todos, setTodos, loading, filter, setFilter, grouped };
}
