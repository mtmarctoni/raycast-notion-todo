import { ParsedTodo, Priority, Workspaces } from "../types";

const TODAY = new Date().toISOString().split("T")[0];

export const AI_PROMPT = `You are a todo parser. Extract todo information from the user's natural language input.
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

export function formatAIError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";
  const lower = message.toLowerCase();
  if (lower.includes("quota") || lower.includes("limit") || lower.includes("rate")) {
    return `AI rate limit reached: ${message}\n\nTry using the "Add Todo" command instead, or wait a moment and try again.`;
  }
  if (lower.includes("pro") || lower.includes("unavailable") || lower.includes("not available")) {
    return `AI unavailable: ${message}\n\nUse the "Add Todo" command to add a todo manually.`;
  }
  return `Failed to parse: ${message}`;
}

export function parseAIResponse(response: string): ParsedTodo {
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
  }

  const parsed = JSON.parse(jsonStr) as ParsedTodo;

  if (!parsed.title) {
    throw new Error("Could not extract a title from your input");
  }

  if (parsed.workspace !== "personal" && parsed.workspace !== "work") {
    parsed.workspace = Workspaces.PERSONAL;
  }

  if (parsed.priority && !Object.values(Priority).includes(parsed.priority)) {
    parsed.priority = undefined;
  }

  return parsed;
}
