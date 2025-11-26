export interface QuestionData {
  text: string;
  languages: string[];
}

export interface DailyData {
  questions: QuestionData[];
  status: "done" | "planned" | "not-done";
}

export interface DailyDataMap {
  [date: string]: DailyData;
}

export interface Star {
  id: string;
  date: string;
  question: string;
  questions?: string[]; // Support multiple questions
  languages: string[];
  inJar: boolean;
}

export interface StarMap {
  [id: string]: Star;
}

export interface Sticker {
  id: number;
  name: string;
  image: string;
  earnedDate: string;
}
