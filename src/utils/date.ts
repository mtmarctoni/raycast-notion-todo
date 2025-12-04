// Date-related helpers

export function formatVisualDate(date: Date): string {
  const now = new Date();
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  if (year !== now.getFullYear()) {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const date = new Date(dueDate);
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < now;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().split("T")[0];
}
