// Notion blocks to Markdown converter
import type { NotionBlock } from "../notion/journal";

type RichTextItem = {
  plain_text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

function extractRichText(richText?: RichTextItem[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText
    .map((item) => {
      let text = item.plain_text ?? "";
      const a = item.annotations;
      if (a?.bold) text = `**${text}**`;
      if (a?.italic) text = `*${text}*`;
      if (a?.strikethrough) text = `~~${text}~~`;
      if (a?.code) text = `\`${text}\``;
      return text;
    })
    .join("");
}

function richTextFromBlock(block: NotionBlock): RichTextItem[] {
  const type = block.type;
  const content = block[type] as { rich_text?: RichTextItem[] } | undefined;
  return content?.rich_text ?? [];
}

function convertBlock(block: NotionBlock, children?: NotionBlock[]): string {
  const type = block.type;
  const text = extractRichText(richTextFromBlock(block));

  switch (type) {
    case "paragraph":
      return text;

    case "heading_1":
      return `# ${text}`;
    case "heading_2":
      return `## ${text}`;
    case "heading_3":
      return `### ${text}`;

    case "bulleted_list_item":
      return `- ${text}`;

    case "numbered_list_item":
      return `1. ${text}`;

    case "quote":
      return `> ${text}`;

    case "divider":
      return `---`;

    case "to_do": {
      const checked = (block.to_do as { checked?: boolean })?.checked;
      return checked ? `- [x] ${text}` : `- [ ] ${text}`;
    }

    case "callout": {
      const calloutText = text;
      const childLines = children?.map((child) => convertBlock(child)).filter(Boolean) ?? [];
      const lines = calloutText
        ? [`> **${calloutText}**`, ...childLines.map((l) => `> ${l}`)]
        : childLines.map((l) => `> ${l}`);
      return lines.join("\n");
    }

    default:
      return text;
  }
}

export function notionBlocksToMarkdown(blocks: NotionBlock[], childMap?: Map<string, NotionBlock[]>): string {
  return blocks
    .map((block) => {
      const children = childMap?.get(block.id);
      return convertBlock(block, children);
    })
    .filter((line) => line !== undefined && line !== null)
    .join("\n\n");
}
