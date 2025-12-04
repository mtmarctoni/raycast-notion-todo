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
