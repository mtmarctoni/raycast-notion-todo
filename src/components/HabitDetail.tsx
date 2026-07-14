import { Action, ActionPanel, Detail, Icon, open } from "@raycast/api";
import { HabitEntry } from "../types";
import { formatJournalDate, getMoodColor, toNotionPageUrl } from "../utils";

const HABIT_LABELS = [
  { key: "exercise" as const, label: "Exercise" },
  { key: "typing" as const, label: "Typing" },
  { key: "visualize" as const, label: "Visualize" },
  { key: "read" as const, label: "Read" },
  { key: "anki" as const, label: "Anki" },
  { key: "oratory" as const, label: "Oratory" },
  { key: "pill" as const, label: "Pill" },
  { key: "write" as const, label: "Write" },
];

export function HabitDetail({ habit }: { habit: HabitEntry }) {
  const completedCount = HABIT_LABELS.filter((h) => habit[h.key]).length;

  const habitsMarkdown = HABIT_LABELS.map((h) => {
    const icon = habit[h.key] ? "✅" : "❌";
    return `- ${icon} **${h.label}**`;
  }).join("\n");

  const fullMarkdown = `# ${formatJournalDate(habit.date)} — ${habit.dayOfWeek}\n\n${habitsMarkdown}\n\n**${completedCount}/${HABIT_LABELS.length} habits completed**`;

  return (
    <Detail
      markdown={fullMarkdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Date" text={formatJournalDate(habit.date)} />
          <Detail.Metadata.Label title="Day" text={habit.dayOfWeek} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.TagList title="Mood">
            {habit.mood ? (
              <Detail.Metadata.TagList.Item text={habit.mood} color={getMoodColor(habit.mood)} />
            ) : (
              <Detail.Metadata.TagList.Item text="Not set" color="grey" />
            )}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Completed"
            text={`${completedCount}/${HABIT_LABELS.length}`}
            icon={Icon.CheckCircle}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Open in Notion"
            icon={Icon.AppWindow}
            onAction={() => open(toNotionPageUrl(habit.id))}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.CopyToClipboard
            content={`${habit.dayOfWeek} ${formatJournalDate(habit.date)}: ${
              HABIT_LABELS.filter((h) => habit[h.key])
                .map((h) => h.label)
                .join(", ") || "None"
            }`}
            title="Copy Summary"
            shortcut={{ modifiers: ["cmd"], key: "." }}
          />
        </ActionPanel>
      }
    />
  );
}
