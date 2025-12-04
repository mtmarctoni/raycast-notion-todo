import { useState } from "react";
import { Priority, Todo } from "../types";
import { formatLocalDate } from "../utils";
import { Action, ActionPanel, Form } from "@raycast/api";

export function EditTodoForm({ todo, onEdit }: { todo: Todo; onEdit: (updated: Partial<Todo>) => void }) {
  const [loading, setLoading] = useState(false);
  const [workspace] = useState(todo.workspace); // workspace is not editable
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(todo.dueDate ? new Date(todo.dueDate) : undefined);
  const [priority, setPriority] = useState<Priority | undefined>(todo.priority);

  async function handleSubmit() {
    setLoading(true);
    await onEdit({
      title,
      description,
      dueDate: dueDate ? formatLocalDate(dueDate) : undefined,
      priority,
      notes: todo.notes,
    });
    setLoading(false);
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Save Changes" />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="workspace" title="Target Workspace" defaultValue={workspace}>
        <Form.Dropdown.Item value="personal" title="Personal" />
        <Form.Dropdown.Item value="work" title="Work" />
      </Form.Dropdown>
      <Form.TextField id="title" title="Title" value={title} onChange={setTitle} autoFocus />
      <Form.TextArea id="description" title="Description / Notes" value={description} onChange={setDescription} />
      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        value={dueDate ?? null}
        onChange={(date) => setDueDate(date ?? undefined)}
      />
      <Form.Dropdown
        id="priority"
        title="Prioridad"
        value={priority ?? ""}
        onChange={(value) => setPriority(value as Priority)}
      >
        {Object.values(Priority).map((p) => (
          <Form.Dropdown.Item key={p} value={p} title={p} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
