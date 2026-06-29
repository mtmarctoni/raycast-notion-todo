import {
  Form,
  ActionPanel,
  Action,
  showToast,
  getPreferenceValues,
  Detail,
  openExtensionPreferences,
  Toast,
  LaunchProps,
  AI,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { createTodo } from "../notion";

import { Preferences, Workspaces, Priority, ParsedTodo, QuickAddArguments } from "../types";
import { missingPreferences, AI_PROMPT, formatAIError, parseAIResponse } from "../utils";

export default function QuickAddTodoCommand(props: LaunchProps<{ arguments: QuickAddArguments }>) {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsedTodo, setParsedTodo] = useState<ParsedTodo | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const userInput = props.arguments.text;

  useEffect(() => {
    async function parseWithAI() {
      if (!userInput || missing.length > 0) {
        setLoading(false);
        return;
      }

      try {
        await showToast({ style: Toast.Style.Animated, title: "Understanding your todo..." });

        const response = await AI.ask(AI_PROMPT + userInput, {
          creativity: "low",
        });

        const parsed = parseAIResponse(response);
        setParsedTodo(parsed);
        await showToast({ style: Toast.Style.Success, title: "Ready to confirm" });
      } catch (error: unknown) {
        const errorMessage = formatAIError(error);
        setParseError(errorMessage);
        await showToast({ style: Toast.Style.Failure, title: "Failed to parse todo", message: errorMessage });
      } finally {
        setLoading(false);
      }
    }

    parseWithAI();
  }, [userInput, missing]);

  if (missing.length > 0) {
    return (
      <Detail
        markdown={`**Missing required preferences:**\n${missing.map((m: string) => `- ${m}`).join("\n")}\n\nPlease open extension preferences and fill in all fields.`}
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  if (loading) {
    return <Detail isLoading={true} markdown="Understanding your todo with AI..." />;
  }

  if (parseError || !parsedTodo) {
    return (
      <Detail
        markdown={`## Failed to Parse Todo\n\n${parseError || "Could not understand the input."}\n\n**Your input:** "${userInput}"\n\nTry rephrasing or use the regular "Add Todo" command.`}
        actions={
          <ActionPanel>
            <Action.Push title="Try Again" target={<QuickAddTodoCommand {...props} />} />
          </ActionPanel>
        }
      />
    );
  }

  async function handleSubmit(values: {
    workspace: Workspaces;
    title: string;
    notes?: string;
    dueDate?: Date;
    priority?: Priority;
  }) {
    setSubmitting(true);
    await showToast({ style: Toast.Style.Animated, title: "Saving todo..." });
    try {
      const result = await createTodo(values.workspace, {
        title: values.title,
        notes: values.notes,
        dueDate: values.dueDate ? values.dueDate.toISOString().split("T")[0] : undefined,
        priority: values.priority,
      });
      setSubmitting(false);
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
      setSubmitting(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await showToast({ style: Toast.Style.Failure, title: "Error", message: errorMessage });
    }
  }

  // Parse the dueDate string to a Date object for the form
  const dueDateValue = parsedTodo.dueDate ? new Date(parsedTodo.dueDate) : undefined;

  return (
    <Form
      isLoading={submitting}
      navigationTitle="Confirm Todo"
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Create Todo" />
        </ActionPanel>
      }
    >
      <Form.Description title="AI Parsed" text={`From: "${userInput}"`} />
      <Form.Separator />
      <Form.Dropdown id="workspace" title="Target Workspace" defaultValue={parsedTodo.workspace}>
        <Form.Dropdown.Item value="personal" title="Personal" />
        <Form.Dropdown.Item value="work" title="Work" />
      </Form.Dropdown>
      <Form.TextField id="title" title="Title" defaultValue={parsedTodo.title} />
      <Form.TextArea id="notes" title="Notes" defaultValue={parsedTodo.notes || ""} />
      <Form.DatePicker id="dueDate" title="Due Date" defaultValue={dueDateValue} />
      <Form.Dropdown id="priority" title="Priority" defaultValue={parsedTodo.priority || ""}>
        <Form.Dropdown.Item value="" title="No Priority" />
        {Object.values(Priority).map((priority: string) => (
          <Form.Dropdown.Item key={priority} value={priority} title={priority} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
