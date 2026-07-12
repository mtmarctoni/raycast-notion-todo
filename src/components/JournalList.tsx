import { Action, ActionPanel, Color, Icon, List, openExtensionPreferences } from "@raycast/api";
import { JournalDetail } from "./JournalDetail";
import { NewJournalEntry } from "./NewJournalEntry";
import { useJournals } from "../hooks/useJournals";
import { missingJournalPreference, missingPreferences } from "../utils";
import { JournalEntry, Preferences } from "../types";
import { getPreferenceValues, open } from "@raycast/api";
import { formatJournalDate, getEnergyColor, getMoodColor } from "../utils";

function JournalListItem({ journal, onRefresh }: { journal: JournalEntry; onRefresh: () => void }) {
  const dateLabel = formatJournalDate(journal.date);

  return (
    <List.Item
      key={journal.id}
      title={dateLabel}
      subtitle={journal.title || undefined}
      icon={journal.highlight ? { source: Icon.Star, tintColor: Color.Yellow } : Icon.Circle}
      accessories={[
        ...(journal.mood ? [{ tag: { value: journal.mood, color: getMoodColor(journal.mood) } }] : []),
        ...(journal.energy ? [{ tag: { value: journal.energy, color: getEnergyColor(journal.energy) } }] : []),
      ]}
      actions={
        <ActionPanel>
          <Action.Push
            title="View Journal Entry"
            icon={Icon.Eye}
            target={<JournalDetail journalId={journal.id} journal={journal} />}
            shortcut={{ modifiers: [], key: "return" }}
          />
          <Action
            title="Open in Notion"
            icon={Icon.AppWindow}
            onAction={() => open(`notion://${journal.id}`)}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.Push
            title="New Journal Entry"
            icon={Icon.Plus}
            target={<NewJournalEntry onCreated={onRefresh} />}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function JournalList() {
  const prefs = getPreferenceValues<Preferences>();
  const missing = missingPreferences(prefs);
  const missingJournal = missingJournalPreference(prefs);
  const { journals, loading, refresh } = useJournals();

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

  if (missingJournal.length > 0) {
    return (
      <List>
        <List.EmptyView
          title="Journal Not Configured"
          description="Set your Journal Database ID in extension preferences to use the journal feature."
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
    <List isLoading={loading} searchBarPlaceholder="Search journal entries...">
      {journals.length === 0 && !loading ? (
        <List.EmptyView
          title="No Journal Entries"
          description="Create your first journal entry"
          actions={
            <ActionPanel>
              <Action.Push
                title="New Journal Entry"
                icon={Icon.Plus}
                target={<NewJournalEntry onCreated={refresh} />}
              />
            </ActionPanel>
          }
        />
      ) : (
        journals.map((journal) => <JournalListItem key={journal.id} journal={journal} onRefresh={refresh} />)
      )}
    </List>
  );
}
