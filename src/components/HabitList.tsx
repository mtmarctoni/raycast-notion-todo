import { Action, ActionPanel, Color, Icon, List, openExtensionPreferences } from "@raycast/api";
import { HabitDetail } from "./HabitDetail";
import { NewHabitEntry } from "./NewHabitEntry";
import { useHabits, DayFilter } from "../hooks/useHabits";
import { missingHabitPreference, missingPreferences } from "../utils";
import { HabitEntry, Preferences } from "../types";
import { getPreferenceValues, open } from "@raycast/api";
import { formatJournalDate, getMoodColor, toNotionPageUrl } from "../utils";

const DAY_FILTER_OPTIONS: { label: string; value: DayFilter }[] = [
  { label: "All Days", value: "all" },
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

const HABIT_ICONS = [
  { key: "exercise" as const, label: "Exercise", icon: Icon.Heart },
  { key: "typing" as const, label: "Typing", icon: Icon.Keyboard },
  { key: "visualize" as const, label: "Visualize", icon: Icon.Eye },
  { key: "read" as const, label: "Read", icon: Icon.Book },
  { key: "anki" as const, label: "Anki", icon: Icon.MemoryChip },
  { key: "oratory" as const, label: "Oratory", icon: Icon.Microphone },
  { key: "pill" as const, label: "Pill", icon: Icon.Pill },
  { key: "write" as const, label: "Write", icon: Icon.Pencil },
];

function DayFilterDropdown({ value, onChange }: { value: DayFilter; onChange: (v: DayFilter) => void }) {
  return (
    <List.Dropdown tooltip="Filter by Day" value={value} onChange={(v) => onChange(v as DayFilter)}>
      {DAY_FILTER_OPTIONS.map((opt) => (
        <List.Dropdown.Item key={opt.value} title={opt.label} value={opt.value} />
      ))}
    </List.Dropdown>
  );
}

function HabitListItem({ habit, onRefresh }: { habit: HabitEntry; onRefresh: () => void }) {
  const dateLabel = formatJournalDate(habit.date);
  const completedCount = HABIT_ICONS.filter((h) => habit[h.key]).length;

  return (
    <List.Item
      key={habit.id}
      title={dateLabel}
      subtitle={habit.dayOfWeek}
      icon={{ source: Icon.Calendar, tintColor: Color.Blue }}
      accessories={[
        ...(habit.mood ? [{ tag: { value: habit.mood, color: getMoodColor(habit.mood) } }] : []),
        {
          text: `${completedCount}/${HABIT_ICONS.length}`,
          icon: Icon.CheckCircle,
          tooltip: `${completedCount} habits completed`,
        },
        ...HABIT_ICONS.map((h) => ({
          icon: habit[h.key]
            ? { source: h.icon, tintColor: Color.Green }
            : { source: h.icon, tintColor: Color.SecondaryText },
          tooltip: `${h.label}: ${habit[h.key] ? "Done" : "Missed"}`,
        })),
      ]}
      actions={
        <ActionPanel>
          <Action.Push
            title="View Habit Entry"
            icon={Icon.Eye}
            target={<HabitDetail habit={habit} />}
            shortcut={{ modifiers: [], key: "return" }}
          />
          <Action
            title="Open in Notion"
            icon={Icon.AppWindow}
            onAction={() => open(toNotionPageUrl(habit.id))}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.Push
            title="New Habit Entry"
            icon={Icon.Plus}
            target={<NewHabitEntry onCreated={onRefresh} />}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function HabitList() {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
  const missingHabits = missingHabitPreference(prefs);
  const { habits, loading, refresh, dayFilter, setDayFilter } = useHabits();

  if (missing.length > 0) {
    return (
      <List>
        <List.EmptyView
          title="Missing Preferences"
          description="Please configure your Notion tokens and database IDs in extension preferences."
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" onAction={openExtensionPreferences} icon={Icon.Gear} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (missingHabits.length > 0) {
    return (
      <List>
        <List.EmptyView
          title="Habits Not Configured"
          description="Set your Habits Database ID in extension preferences to use the habits feature."
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" onAction={openExtensionPreferences} icon={Icon.Gear} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search habit entries..."
      searchBarAccessory={<DayFilterDropdown value={dayFilter} onChange={setDayFilter} />}
    >
      {habits.length === 0 && !loading ? (
        <List.EmptyView
          title="No Habit Entries"
          description="Create your first habit entry"
          actions={
            <ActionPanel>
              <Action.Push title="New Habit Entry" icon={Icon.Plus} target={<NewHabitEntry onCreated={refresh} />} />
            </ActionPanel>
          }
        />
      ) : (
        habits.map((habit) => <HabitListItem key={habit.id} habit={habit} onRefresh={refresh} />)
      )}
    </List>
  );
}
