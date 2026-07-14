// UI helpers
import { Priority, Workspaces } from "../types";
import { Color, Icon } from "@raycast/api";

export function getPriorityColor(priority?: Priority): Color {
  if (!priority) return Color.SecondaryText;
  switch (priority) {
    case Priority.MUY_ALTA:
      return Color.Red;
    case Priority.ALTA:
      return Color.Orange;
    case Priority.MEDIA:
      return Color.Yellow;
    case Priority.BAJA:
      return Color.Green;
    case Priority.DELEGAR:
      return Color.Blue;
    default: {
      const _exhaustiveCheck: never = priority;
      return _exhaustiveCheck;
    }
  }
}

export function getWorkspaceIcon(workspace: Workspaces): Icon {
  return workspace === Workspaces.PERSONAL ? Icon.Person : Icon.Building;
}

export function getWorkspaceColor(workspace: Workspaces): Color {
  return workspace === Workspaces.PERSONAL ? Color.Purple : Color.Blue;
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Journal UI helpers

export function formatJournalDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  if (year !== now.getFullYear()) {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
}

const MOOD_COLOR_MAP: Record<string, Color> = {
  "Sorpresa 😵": Color.Green,
  "Satisfacción 😙": Color.Green,
  "Orgullo 😊": Color.Green,
  "Gratitud 🤗": Color.Green,
  "Felicidad 🤩": Color.Green,
  "Fascinado/a 😯": Color.Green,
  "Diversión 🥳": Color.Green,
  "Confianza 😏": Color.Green,
  "Alivio 😮‍💨": Color.Green,
  "Emocionado/a 😍": Color.Green,
  "Tranquilidad 😇": Color.Blue,
  "Preocupación 🤔": Color.Blue,
  "Esperanza 😇": Color.Blue,
  "Emoción 😮": Color.Blue,
  "Calma 😴": Color.Blue,
  "Indiferencia 😐": Color.Yellow,
  "Agotado/a 🥱": Color.Yellow,
  "Ambición 😏": Color.Orange,
  "Vergüenza 🥵": Color.Orange,
  "Envidia 😒": Color.Orange,
  "Nervioso/a 😬": Color.Orange,
  "Frustración 🥺": Color.Red,
  "Irritación 😠": Color.Red,
  "Bochorno 😵‍💫": Color.Red,
  "Enfado 😡": Color.Red,
  "Valentía 😎": Color.Magenta,
  "Pasión 🥰": Color.Magenta,
  "Tristeza 😭": Color.SecondaryText,
  "Disgusto 🙄": Color.SecondaryText,
  "Desánimo 🥱": Color.SecondaryText,
  "Fastidio 😢": Color.SecondaryText,
  "Estrés 😫": Color.SecondaryText,
  "Decepción 😤": Color.SecondaryText,
  "Ansiedad 😰": Color.SecondaryText,
  "Soledad 🤕": Color.SecondaryText,
  "Culpabilidad 😬": Color.SecondaryText,
  "Agobio 😖": Color.SecondaryText,
  "Neutral 😐": Color.SecondaryText,
};

export function getMoodColor(mood: string): Color {
  return MOOD_COLOR_MAP[mood] ?? Color.SecondaryText;
}

export function getEnergyColor(energy: string): Color {
  if (energy === "Radiante 🤩") return Color.Green;
  if (energy === "Descansado 😃") return Color.Blue;
  if (energy === "Agotado 😴") return Color.Red;
  return Color.SecondaryText;
}
