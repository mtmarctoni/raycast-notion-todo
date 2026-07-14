import { Form, ActionPanel, Action, showToast, Toast, open } from "@raycast/api";
import { useState } from "react";
import { createJournal } from "../notion/journal";
import { MoodOption, AffectsOption, EnergyOption } from "../types";
import { formatLocalDate, toNotionPageUrl } from "../utils";

export function NewJournalEntry({ onCreated }: { onCreated?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: {
    date: Date | null;
    title: string;
    mood: string;
    affects: string;
    energy: string;
    grateful: string;
    improve: string;
    highlight: boolean;
  }) {
    if (!values.date) {
      await showToast({ style: Toast.Style.Failure, title: "Date is required" });
      return;
    }

    setLoading(true);
    await showToast({ style: Toast.Style.Animated, title: "Creating journal entry..." });

    try {
      const result = await createJournal({
        date: formatLocalDate(values.date),
        title: values.title || undefined,
        mood: values.mood || undefined,
        affects: values.affects || undefined,
        energy: values.energy || undefined,
        grateful: values.grateful || undefined,
        improve: values.improve || undefined,
        highlight: values.highlight,
      });

      setLoading(false);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Journal entry created",
        });
        onCreated?.();
        open(toNotionPageUrl(result.pageId));
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to create journal entry",
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
          <Action.SubmitForm onSubmit={handleSubmit} title="Create Journal Entry" />
        </ActionPanel>
      }
    >
      <Form.DatePicker id="date" title="Fecha *" autoFocus defaultValue={new Date()} />
      <Form.TextField id="title" title="Evento ocurrido a destacar" placeholder="Optional - defaults to date" />
      <Form.Separator />
      <Form.Dropdown id="mood" title="Hoy me siento...">
        <Form.Dropdown.Item value="" title="Not set" />
        {Object.values(MoodOption).map((mood) => (
          <Form.Dropdown.Item key={mood} value={mood} title={mood} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="affects" title="Me afecta...">
        <Form.Dropdown.Item value="" title="Not set" />
        {Object.values(AffectsOption).map((affect) => (
          <Form.Dropdown.Item key={affect} value={affect} title={affect} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="energy" title="Nivel de energía">
        <Form.Dropdown.Item value="" title="Not set" />
        {Object.values(EnergyOption).map((energy) => (
          <Form.Dropdown.Item key={energy} value={energy} title={energy} />
        ))}
      </Form.Dropdown>
      <Form.Separator />
      <Form.TextArea id="grateful" title="Agradezco" placeholder="What are you grateful for today?" />
      <Form.TextArea id="improve" title="Me gustaría mejorar" placeholder="What would you like to improve?" />
      <Form.Checkbox id="highlight" label="Destacar día" defaultValue={false} />
    </Form>
  );
}
