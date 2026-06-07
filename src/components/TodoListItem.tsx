import { Action, ActionPanel, Color, Icon, List, showToast, Toast } from "@raycast/api";
import {
  capitalizeFirstLetter,
  formatVisualDate,
  getPriorityColor,
  getWorkspaceColor,
  getWorkspaceIcon,
  isOverdue,
  getTomorrow,
  getNextMonday,
} from "../utils";
import { Todo, Workspaces } from "../types";
import { markTodoCompleted, updateTodo, deleteTodo, createTodo } from "../notion";
import { EditTodoForm } from "./EditTodoForm";
import { getNextFilter, getPrevFilter } from "../hooks/useTodos";
import type { TodoFilter } from "../types";

export function TodoListItem({
  todo,
  onUpdate,
  onDelete,
  filter,
  onFilterChange,
}: {
  todo: Todo;
  onUpdate: (updated: Todo) => void;
  onDelete: (id: string) => void;
  filter: TodoFilter;
  onFilterChange: (f: TodoFilter) => void;
}) {
  return (
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
                  onDelete(todo.id);
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
                onUpdate({ ...todo, dueDate: tomorrow });
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
                onUpdate({ ...todo, dueDate: nextMonday });
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
            onAction={() => onFilterChange(getNextFilter(filter))}
          />
          <Action
            title="Previous Filter"
            icon={Icon.ArrowUp}
            shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
            onAction={() => onFilterChange(getPrevFilter(filter))}
          />
          <Action.Push
            title="Edit Todo"
            icon={Icon.Pencil}
            target={
              <EditTodoForm
                todo={todo}
                onEdit={async (updates) => {
                  const newWorkspace = updates.workspace;
                  const workspaceChanged = newWorkspace && newWorkspace !== todo.workspace;

                  if (workspaceChanged && newWorkspace) {
                    const createResult = await createTodo(newWorkspace, {
                      title: updates.title ?? todo.title,
                      notes: updates.notes ?? todo.notes,
                      dueDate: updates.dueDate ?? todo.dueDate,
                      priority: updates.priority ?? todo.priority,
                    });

                    if (createResult.success) {
                      const deleteSuccess = await deleteTodo(todo.id, todo.workspace);
                      if (deleteSuccess) {
                        onUpdate({
                          ...todo,
                          ...updates,
                          id: createResult.pageId,
                          url: createResult.url,
                          workspace: newWorkspace,
                        });
                        showToast({ style: Toast.Style.Success, title: "Todo moved to new workspace" });
                      } else {
                        showToast({
                          style: Toast.Style.Failure,
                          title: "Failed to delete from old workspace",
                        });
                      }
                    } else {
                      showToast({ style: Toast.Style.Failure, title: "Failed to create in new workspace" });
                    }
                  } else {
                    const success = await updateTodo(todo.id, todo.workspace, updates);
                    if (success) {
                      onUpdate({ ...todo, ...updates });
                      showToast({ style: Toast.Style.Success, title: "Todo updated" });
                    } else {
                      showToast({ style: Toast.Style.Failure, title: "Failed to update todo" });
                    }
                  }
                }}
              />
            }
            shortcut={{ modifiers: ["cmd"], key: "e" }}
          />
          <Action.CopyToClipboard content={todo.title} title="Copy Title" shortcut={{ modifiers: ["cmd"], key: "." }} />
          <Action
            title="Delete Todo"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={async () => {
              const success = await deleteTodo(todo.id, todo.workspace);
              if (success) {
                onDelete(todo.id);
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
  );
}
