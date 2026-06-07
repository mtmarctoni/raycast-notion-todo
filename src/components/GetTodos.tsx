import { Action, ActionPanel, Detail, getPreferenceValues, List, openExtensionPreferences } from "@raycast/api";
import { missingPreferences } from "../utils";
import { Preferences } from "../types";
import { useTodos } from "../hooks/useTodos";
import { TodoListItem } from "./TodoListItem";
import { TodoFilterDropdown } from "./TodoFilterDropdown";

export default function GetTodosCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
  const { setTodos, loading, filter, setFilter, grouped } = useTodos();

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

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search todos..."
      searchBarAccessory={<TodoFilterDropdown filter={filter} onFilterChange={setFilter} />}
    >
      {Object.entries(grouped).map(([section, sectionTodos]) =>
        sectionTodos.length > 0 ? (
          <List.Section key={section} title={section}>
            {sectionTodos.map((todo) => (
              <TodoListItem
                key={todo.id}
                todo={todo}
                filter={filter}
                onFilterChange={setFilter}
                onUpdate={(updated) => setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))}
                onDelete={(id) => setTodos((prev) => prev.filter((t) => t.id !== id))}
              />
            ))}
          </List.Section>
        ) : null,
      )}
    </List>
  );
}
