// Notion API field and page types

export type NotionPageTitle = {
  title: Array<{
    plain_text: string;
    text: { content: string };
    [key: string]: unknown;
  }>;
};

export type NotionRichText = {
  rich_text: Array<{
    plain_text: string;
    text: { content: string };
    [key: string]: unknown;
  }>;
};

export type NotionCheckbox = {
  checkbox: boolean;
  [key: string]: unknown;
};

export type NotionSelect = {
  select: { name: string } | null;
  [key: string]: unknown;
};

export type NotionDate = {
  date: { start: string } | null;
  [key: string]: unknown;
};

export type NotionProperties = {
  [propertyName: string]: NotionPageTitle | NotionRichText | NotionCheckbox | NotionSelect | NotionDate | unknown;
};

export type NotionPage = {
  id: string;
  url: string;
  properties: NotionProperties;
  // ...add more fields as needed
};
