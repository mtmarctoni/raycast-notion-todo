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

import { Preferences, Priority, Workspaces, ParsedTodo, QuickAddArguments } from "../types";
import { missingPreferences } from "../utils";

const TODAY = new Date().toISOString().split("T")[0];

const AI_PROMPT = `You are a todo parser. Extract todo information from the user's natural language input.
Today's date is ${TODAY}.

Return ONLY a valid JSON object with these fields:
- title (required): The main task description, clean and concise
- workspace: Either "personal" or "work". Default to "personal" if not specified. Look for keywords like "work", "office", "job", "trabajo", "oficina" for work tasks.
- description: Any additional notes or context (optional)
- dueDate: ISO date string (YYYY-MM-DD) if a date is mentioned. Interpret relative dates like "tomorrow", "next Monday", "mañana", "próximo lunes" based on today's date.
- priority: One of "MUY ALTA", "Alta", "Media", "Baja", "Delegar" if priority is mentioned. Map terms like:
  - "urgent", "urgente", "very high", "muy alta", "asap" → "MUY ALTA"
  - "high", "alta", "important", "importante" → "Alta"
  - "medium", "media", "normal" → "Media"
  - "low", "baja", "not urgent", "no urgente" → "Baja"
  - "delegate", "delegar" → "Delegar"

Understand both English and Spanish input.

User input: `;

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

        // Extract JSON from response (handle potential markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr
            .replace(/```json?\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }

        const parsed = JSON.parse(jsonStr) as ParsedTodo;

        // Validate required field
        if (!parsed.title) {
          throw new Error("Could not extract a title from your input");
        }

        // Ensure workspace is valid
        if (parsed.workspace !== "personal" && parsed.workspace !== "work") {
          parsed.workspace = Workspaces.PERSONAL;
        }

        // Validate priority if provided
        if (parsed.priority && !Object.values(Priority).includes(parsed.priority)) {
          parsed.priority = undefined;
        }

        setParsedTodo(parsed);
        await showToast({ style: Toast.Style.Success, title: "Ready to confirm" });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setParseError(`Failed to parse: ${errorMessage}`);
        await showToast({ style: Toast.Style.Failure, title: "Failed to parse todo", message: errorMessage });
      } finally {
        setLoading(false);
      }
    }

    parseWithAI();
  }, [userInput]);

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
    return <Detail isLoading={true} markdown="🤖 Understanding your todo with AI..." />;
  }

  if (parseError || !parsedTodo) {
    return (
      <Detail
        markdown={`## ❌ Failed to Parse Todo\n\n${parseError || "Could not understand the input."}\n\n**Your input:** "${userInput}"\n\nTry rephrasing or use the regular "Add Todo" command.`}
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
    description?: string;
    dueDate?: Date;
    priority?: Priority;
  }) {
    setSubmitting(true);
    await showToast({ style: Toast.Style.Animated, title: "Saving todo..." });
    try {
      const result = await createTodo(values.workspace, {
        title: values.title,
        description: values.description,
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
      <Form.Description title="🤖 AI Parsed" text={`From: "${userInput}"`} />
      <Form.Separator />
      <Form.Dropdown id="workspace" title="Target Workspace" defaultValue={parsedTodo.workspace}>
        <Form.Dropdown.Item value="personal" title="Personal" />
        <Form.Dropdown.Item value="work" title="Work" />
      </Form.Dropdown>
      <Form.TextField id="title" title="Title" defaultValue={parsedTodo.title} />
      <Form.TextArea id="description" title="Description / Notes" defaultValue={parsedTodo.description || ""} />
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
