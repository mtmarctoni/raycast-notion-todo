import { Action, ActionPanel, Detail, Icon, open } from "@raycast/api";
import { useEffect, useState } from "react";
import { JournalEntry } from "../types";
import { fetchJournalBlocks, fetchBlockChildren } from "../notion/journal";
import { notionBlocksToMarkdown } from "../utils/journal-blocks";
import { formatJournalDate, toNotionPageUrl } from "../utils";
import type { NotionBlock } from "../notion/journal";

export function JournalDetail({ journalId, journal }: { journalId: string; journal: JournalEntry }) {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadBlocks() {
      const blocks = await fetchJournalBlocks(journalId);
      if (cancelled) return;

      // Fetch children for blocks that have them (one level of nesting)
      const childMap = new Map<string, NotionBlock[]>();

      for (const block of blocks) {
        if (block.has_children) {
          try {
            const children = await fetchBlockChildren(block.id);
            childMap.set(block.id, children);
          } catch {
            // Skip failed child fetches
          }
        }
      }

      const bodyMarkdown = notionBlocksToMarkdown(blocks, childMap);
      if (!cancelled) {
        setMarkdown(bodyMarkdown);
        setLoading(false);
      }
    }
    loadBlocks();
    return () => {
      cancelled = true;
    };
  }, [journalId]);

  const fullMarkdown = `# ${formatJournalDate(journal.date)}\n\n${markdown || "_No content yet._"}`;

  return (
    <Detail
      isLoading={loading}
      markdown={fullMarkdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Mood">
            {journal.mood ? (
              <Detail.Metadata.TagList.Item text={journal.mood} />
            ) : (
              <Detail.Metadata.TagList.Item text="Not set" color="grey" />
            )}
          </Detail.Metadata.TagList>
          <Detail.Metadata.TagList title="Energy">
            {journal.energy ? (
              <Detail.Metadata.TagList.Item text={journal.energy} />
            ) : (
              <Detail.Metadata.TagList.Item text="Not set" color="grey" />
            )}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Date" text={formatJournalDate(journal.date)} />
          {journal.affects && <Detail.Metadata.Label title="Affects" text={journal.affects} />}
          {journal.grateful && <Detail.Metadata.Label title="Grateful for" text={journal.grateful} />}
          {journal.improve && <Detail.Metadata.Label title="Want to improve" text={journal.improve} />}
          {journal.highlight && <Detail.Metadata.Label title="Highlighted" text="Yes" />}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Open in Notion"
            icon={Icon.AppWindow}
            onAction={() => open(toNotionPageUrl(journalId))}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.CopyToClipboard content={markdown} title="Copy Content" shortcut={{ modifiers: ["cmd"], key: "." }} />
        </ActionPanel>
      }
    />
  );
}
