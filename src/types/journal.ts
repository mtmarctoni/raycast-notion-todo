// Journal domain types

export const JOURNAL_DB_FIELDS = {
  title: "Evento ocurrido a destacar",
  date: "Fecha",
  mood: "Hoy me siento...",
  affects: "Me afecta...",
  energy: "Nivel de energía",
  grateful: "Agradezco",
  improve: "Me gustaría mejorar",
  highlight: "Destacar día",
} as const;

export enum MoodOption {
  SORPRESA = "Sorpresa 😵",
  SATISFACCION = "Satisfacción 😙",
  ORGULLO = "Orgullo 😊",
  GRATITUD = "Gratitud 🤗",
  FELICIDAD = "Felicidad 🤩",
  FASCINADO = "Fascinado/a 😯",
  DIVERSION = "Diversión 🥳",
  CONFIANZA = "Confianza 😏",
  ALIVIO = "Alivio 😮‍💨",
  EMOCIONADO = "Emocionado/a 😍",
  TRANQUILIDAD = "Tranquilidad 😇",
  PREOCUPACION = "Preocupación 🤔",
  ESPERANZA = "Esperanza 😇",
  EMOCION = "Emoción 😮",
  CALMA = "Calma 😴",
  INDIFERENCIA = "Indiferencia 😐",
  AGOTADO_MOOD = "Agotado/a 🥱",
  AMBICION = "Ambición 😏",
  VERGUENZA = "Vergüenza 🥵",
  ENVIDIA = "Envidia 😒",
  NERVIOSO = "Nervioso/a 😬",
  FRUSTRACION = "Frustración 🥺",
  IRRITACION = "Irritación 😠",
  BOCHORNO = "Bochorno 😵‍💫",
  ENFADO = "Enfado 😡",
  VALENTIA = "Valentía 😎",
  PASION = "Pasión 🥰",
  TRISTEZA = "Tristeza 😭",
  DISGUSTO = "Disgusto 🙄",
  DESANIMO = "Desánimo 🥱",
  FASTIDIO = "Fastidio 😢",
  ESTRES = "Estrés 😫",
  DECEPCION = "Decepción 😤",
  ANSIEDAD = "Ansiedad 😰",
  SOLEDAD = "Soledad 🤕",
  CULPABILIDAD = "Culpabilidad 😬",
  AGOBIO = "Agobio 😖",
  NEUTRAL_MOOD = "Neutral 😐",
}

export enum AffectsOption {
  DINERO = "Dinero 💵",
  ACTUALIDAD = "Actualidad 🗓",
  TAREAS = "Tareas 📝",
  VIAJES = "Viajes 🧳",
  EDUCACION = "Educación 📚",
  TRABAJO = "Trabajo 🧑‍💻",
  CITAS = "Citas amorosas 💌",
  PAREJA = "Pareja 👫",
  AMISTADES = "Amistades 🤝",
  FAMILIA = "Familia 👨‍👩‍👧‍👧",
  CLIMA = "Clima 🌤",
  ENTORNO_SOCIAL = "Entorno social 🥂",
  ESPIRITUALIDAD = "Espiritualidad 🔮",
  IDENTIDAD = "Identidad 🗣️",
  AFICIONES = "Aficiones 🎳",
  CUIDADO_PERSONAL = "Cuidado personal 💆",
  DEPORTE = "Deporte ⚽️",
  SALUD = "Salud 💊",
}

export enum EnergyOption {
  RADIANTE = "Radiante 🤩",
  DESCANSADO = "Descansado 😃",
  AGOTADO = "Agotado 😴",
  NEUTRAL = "Neutral 😐",
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  mood?: string;
  affects?: string;
  energy?: string;
  grateful?: string;
  improve?: string;
  highlight: boolean;
  url: string;
}

export type CreateJournalInput = {
  date: string;
  title?: string;
  mood?: string;
  affects?: string;
  energy?: string;
  grateful?: string;
  improve?: string;
  highlight?: boolean;
};
