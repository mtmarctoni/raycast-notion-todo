import {
  Form,
  ActionPanel,
  Action,
  showToast,
  getPreferenceValues,
  Detail,
  openExtensionPreferences,
  Toast,
} from "@raycast/api";
import { useState } from "react";
import { createTodo } from "../notion";
import { Preferences, Priority, Workspaces } from "../types";
import { formatLocalDate, missingPreferences } from "../utils";

export default function AddNotionTodoCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(values: {
    workspace: Workspaces;
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: Priority;
  }) {
    setLoading(true);
    await showToast({ style: Toast.Style.Animated, title: "Saving todo..." });
    try {
      const result = await createTodo(values.workspace, {
        title: values.title,
        description: values.description,
        dueDate: values.dueDate ? formatLocalDate(values.dueDate) : undefined,
        priority: values.priority,
      });
      setLoading(false);
      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: `Added to ${values.workspace} workspace`,
          message: values.title,
        });
      } else {
        await showToast({ style: Toast.Style.Failure, title: "Failed to create todo", message: result.error });
      }
    } catch (error: unknown) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await showToast({ style: Toast.Style.Failure, title: "Error", message: errorMessage });
    }
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Add Todo" />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="workspace" title="Target Workspace" defaultValue="personal">
        <Form.Dropdown.Item value="personal" title="Personal" />
        <Form.Dropdown.Item value="work" title="Work" />
      </Form.Dropdown>
      <Form.TextField id="title" title="Title" placeholder="Todo title" autoFocus />
      <Form.TextArea id="description" title="Description / Notes" placeholder="Optional notes" />
      <Form.DatePicker id="dueDate" title="Due Date" />
      <Form.Dropdown id="priority" title="Prioridad">
        {Object.values(Priority).map((priority) => (
          <Form.Dropdown.Item key={priority} value={priority} title={priority} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
