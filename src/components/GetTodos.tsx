import {
  Action,
  ActionPanel,
  Color,
  Detail,
  getPreferenceValues,
  Icon,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  capitalizeFirstLetter,
  formatVisualDate,
  getPriorityColor,
  getWorkspaceColor,
  getWorkspaceIcon,
  isOverdue,
  missingPreferences,
  getTomorrow,
  getNextMonday,
} from "../utils";
import { Todo, TodoFilter, Workspaces, TodoDateGroup } from "../types";
import { fetchTodosFromWorkspace, markTodoCompleted, updateTodo, deleteTodo } from "../notion";
import { EditTodoForm } from "./EditTodoForm";

const FILTERS: TodoFilter[] = [TodoFilter.ALL, TodoFilter.PERSONAL, TodoFilter.WORK];

function getNextFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx + 1) % FILTERS.length];
}

function getPrevFilter(current: TodoFilter): TodoFilter {
  const idx = FILTERS.indexOf(current);
  return FILTERS[(idx - 1 + FILTERS.length) % FILTERS.length];
}

export default function GetTodosCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
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
    if (missing.length === 0) {
      loadTodos();
    }
  }, []);

  if (missing.length > 0) {
    return (
      <Detail
        markdown={`**Missing required preferences:**\n${missing.map((m) => `- ${m}`).join("\n")}\n\nPlease open extension preferences and fill in all fields.`}
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  // First, filter by workspace and completion status, then sort by dueDate
  const filteredTodos = todos
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

  // Group todos by date category
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

  const grouped: Record<TodoDateGroup, typeof filteredTodos> = {
    [TodoDateGroup.PAST]: [],
    [TodoDateGroup.TODAY]: [],
    [TodoDateGroup.TOMORROW]: [],
    [TodoDateGroup.NEXT_WEEK]: [],
    [TodoDateGroup.LATER]: [],
    [TodoDateGroup.NO_DATE]: [],
  };
  filteredTodos.forEach((todo) => {
    const cat = getDateCategory(todo.dueDate);
    grouped[cat].push(todo);
  });

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search todos..."
      searchBarAccessory={
        <List.Dropdown tooltip="Filter Todos" value={filter} onChange={(value) => setFilter(value as TodoFilter)}>
          <List.Dropdown.Item title={capitalizeFirstLetter(TodoFilter.ALL)} value={TodoFilter.ALL} />
          <List.Dropdown.Item
            title={capitalizeFirstLetter(TodoFilter.PERSONAL)}
            value={TodoFilter.PERSONAL}
            icon={Icon.Person}
          />
          <List.Dropdown.Item
            title={capitalizeFirstLetter(TodoFilter.WORK)}
            value={TodoFilter.WORK}
            icon={Icon.Building}
          />
        </List.Dropdown>
      }
    >
      {Object.entries(grouped).map(([section, todos]) =>
        todos.length > 0 ? (
          <List.Section key={section} title={section}>
            {todos.map((todo) => (
              <List.Item
                key={todo.id}
                title={todo.title}
                subtitle={todo.notes}
                icon={todo.done ? { source: Icon.CheckCircle, tintColor: Color.Green } : Icon.Circle}
                accessories={[
                  ...[
                    {
                      icon: { source: getWorkspaceIcon(todo.workspace), tintColor: getWorkspaceColor(todo.workspace) },
                      tooltip:
                        todo.workspace === Workspaces.PERSONAL
                          ? capitalizeFirstLetter(Workspaces.PERSONAL)
                          : capitalizeFirstLetter(Workspaces.WORK),
                    },
                    ...(todo.priority
                      ? [
                          {
                            tag: { value: todo.priority, color: getPriorityColor(todo.priority) },
                          },
                        ]
                      : []),
                    ...(todo.dueDate
                      ? [
                          {
                            text: isOverdue(todo.dueDate)
                              ? `🔴 ${formatVisualDate(new Date(todo.dueDate))}`
                              : formatVisualDate(new Date(todo.dueDate)),
                            icon: Icon.Calendar,
                            tooltip: new Date(todo.dueDate).toLocaleDateString(),
                          },
                        ]
                      : []),
                  ],
                ]}
                actions={
                  <ActionPanel>
                    {!todo.done && (
                      <Action
                        title="Mark as Completed"
                        onAction={async () => {
                          const success = await markTodoCompleted(todo.id, todo.workspace);
                          if (success) {
                            setTodos((prev) => prev.filter((t) => t.id !== todo.id));
                            showToast({ style: Toast.Style.Success, title: "Todo marked as completed" });
                          } else {
                            showToast({ style: Toast.Style.Failure, title: "Failed to mark as completed" });
                          }
                        }}
                        icon={Icon.Checkmark}
                        shortcut={{ modifiers: [], key: "return" }}
                      />
                    )}
                    <Action
                      title="Move to Tomorrow"
                      icon={Icon.Calendar}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
                      onAction={async () => {
                        const tomorrow = getTomorrow();
                        const success = await updateTodo(todo.id, todo.workspace, { dueDate: tomorrow });
                        if (success) {
                          setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, dueDate: tomorrow } : t)));
                          showToast({ style: Toast.Style.Success, title: "Moved to tomorrow" });
                        } else {
                          showToast({ style: Toast.Style.Failure, title: "Failed to update todo" });
                        }
                      }}
                    />
                    <Action
                      title="Move to Next Monday"
                      icon={Icon.Calendar}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                      onAction={async () => {
                        const nextMonday = getNextMonday();
                        const success = await updateTodo(todo.id, todo.workspace, { dueDate: nextMonday });
                        if (success) {
                          setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, dueDate: nextMonday } : t)));
                          showToast({ style: Toast.Style.Success, title: "Moved to next Monday" });
                        } else {
                          showToast({ style: Toast.Style.Failure, title: "Failed to update todo" });
                        }
                      }}
                    />
                    <Action
                      title="Next Filter"
                      icon={Icon.ArrowDown}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "arrowDown" }}
                      onAction={() => setFilter(getNextFilter(filter))}
                    />
                    <Action
                      title="Previous Filter"
                      icon={Icon.ArrowUp}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
                      onAction={() => setFilter(getPrevFilter(filter))}
                    />
                    <Action.Push
                      title="Edit Todo"
                      icon={Icon.Pencil}
                      target={
                        <EditTodoForm
                          todo={todo}
                          onEdit={async (updates) => {
                            const success = await updateTodo(todo.id, todo.workspace, updates);
                            if (success) {
                              setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, ...updates } : t)));
                              showToast({ style: Toast.Style.Success, title: "Todo updated" });
                            } else {
                              showToast({ style: Toast.Style.Failure, title: "Failed to update todo" });
                            }
                          }}
                        />
                      }
                      shortcut={{ modifiers: ["cmd"], key: "e" }}
                    />
                    <Action.CopyToClipboard
                      content={todo.title}
                      title="Copy Title"
                      shortcut={{ modifiers: ["cmd"], key: "." }}
                    />
                    <Action
                      title="Delete Todo"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      onAction={async () => {
                        const success = await deleteTodo(todo.id, todo.workspace);
                        if (success) {
                          setTodos((prev) => prev.filter((t) => t.id !== todo.id));
                          showToast({ style: Toast.Style.Success, title: "Todo deleted" });
                        } else {
                          showToast({ style: Toast.Style.Failure, title: "Failed to delete todo" });
                        }
                      }}
                      shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ) : null,
      )}
    </List>
  );
}
