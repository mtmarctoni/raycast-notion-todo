import { Form, ActionPanel, Action, showToast, Toast, open } from "@raycast/api";
import { useState } from "react";
import { createHabit } from "../notion/habit";
import { HabitMoodOption } from "../types";
import { formatLocalDate, toNotionPageUrl } from "../utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayOfWeek(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function NewHabitEntry({ onCreated }: { onCreated?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: {
    date: Date | null;
    exercise: boolean;
    typing: boolean;
    visualize: boolean;
    read: boolean;
    anki: boolean;
    oratory: boolean;
    pill: boolean;
    write: boolean;
    mood: string;
  }) {
    if (!values.date) {
      await showToast({ style: Toast.Style.Failure, title: "Date is required" });
      return;
    }

    setLoading(true);
    await showToast({ style: Toast.Style.Animated, title: "Creating habit entry..." });

    try {
      const result = await createHabit({
        date: formatLocalDate(values.date),
        dayOfWeek: getDayOfWeek(values.date),
        exercise: values.exercise,
        typing: values.typing,
        visualize: values.visualize,
        read: values.read,
        anki: values.anki,
        oratory: values.oratory,
        pill: values.pill,
        write: values.write,
        mood: values.mood || undefined,
      });

      setLoading(false);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Habit entry created",
        });
        onCreated?.();
        open(toNotionPageUrl(result.pageId));
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to create habit entry",
          message: result.error,
        });
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
          <Action.SubmitForm onSubmit={handleSubmit} title="Create Habit Entry" />
        </ActionPanel>
      }
    >
      <Form.DatePicker id="date" title="Fecha *" autoFocus defaultValue={new Date()} />
      <Form.Separator />
      <Form.Checkbox id="exercise" label="Exercise" defaultValue={false} />
      <Form.Checkbox id="typing" label="Typing" defaultValue={false} />
      <Form.Checkbox id="visualize" label="Visualize" defaultValue={false} />
      <Form.Checkbox id="read" label="Read" defaultValue={false} />
      <Form.Checkbox id="anki" label="Anki" defaultValue={false} />
      <Form.Checkbox id="oratory" label="Oratory" defaultValue={false} />
      <Form.Checkbox id="pill" label="Pill" defaultValue={false} />
      <Form.Checkbox id="write" label="Write" defaultValue={false} />
      <Form.Separator />
      <Form.Dropdown id="mood" title="Estado anímico">
        <Form.Dropdown.Item value="" title="Not set" />
        {Object.values(HabitMoodOption).map((mood) => (
          <Form.Dropdown.Item key={mood} value={mood} title={mood} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
