// Habit domain types

export const HABIT_DB_FIELDS = {
  dayOfWeek: "Día de la semana",
  date: "Fecha",
  exercise: "Exercise",
  typing: "Typing",
  visualize: "Visualize",
  read: "Read",
  anki: "Anki",
  oratory: "Oratory",
  pill: "Pill",
  write: "Write",
  mood: "Estado anímico",
} as const;

export enum HabitMoodOption {
  CONFIANZA = "Confianza 😏",
  ALIVIO = "Alivio 😮‍💨",
  SATISFACCION = "Satisfacción 😙",
  DIVERSION = "Diversión 🥳",
  FASCINADO = "Fascinado/a 😯",
  FELICIDAD = "Felicidad 🤩",
  SORPRESA = "Sorpresa 😵",
  GRATITUD = "Gratitud 🤗",
  ORGULLO = "Orgullo 😊",
  TRANQUILIDAD = "Tranquilidad 😇",
  CALMA = "Calma 😴",
  PREOCUPACION = "Preocupación 🤔",
  EMOCION = "Emoción 😮",
  ESPERANZA = "Esperanza 😇",
  AGOTADO = "Agotado/a 🥱",
  INDIFERENCIA = "Indiferencia 😐",
  NERVIOSO = "Nervioso/a 😬",
  ENVIDIA = "Envidia 😒",
  VERGUENZA = "Vergüenza 🥵",
  AMBICION = "Ambición 😏",
  FRUSTRACION = "Frustración 🥺",
  IRRITACION = "Irritación 😠",
  ENFADO = "Enfado 😡",
  BOCHORNO = "Bochorno 😵‍💫",
  PASION = "Pasión 🥰",
  VALENTIA = "Valentía 😎",
  CULPABILIDAD = "Culpabilidad 😬",
  AGOBIO = "Agobio 😖",
  SOLEDAD = "Soledad 🤕",
  ANSIEDAD = "Ansiedad 😰",
  DECEPCION = "Decepción 😤",
  ESTRES = "Estrés 😫",
  FASTIDIO = "Fastidio 😢",
  DESANIMO = "Desánimo 🥱",
  DISGUSTO = "Disgusto 🙄",
  TRISTEZA = "Tristeza 😭",
  NEUTRAL = "Neutral 😐",
}

export interface HabitEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  exercise: boolean;
  typing: boolean;
  visualize: boolean;
  read: boolean;
  anki: boolean;
  oratory: boolean;
  pill: boolean;
  write: boolean;
  mood?: string;
  url: string;
}

export type CreateHabitInput = {
  date: string;
  dayOfWeek: string;
  exercise?: boolean;
  typing?: boolean;
  visualize?: boolean;
  read?: boolean;
  anki?: boolean;
  oratory?: boolean;
  pill?: boolean;
  write?: boolean;
  mood?: string;
};
