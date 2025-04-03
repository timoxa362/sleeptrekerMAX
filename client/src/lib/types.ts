export type EntryType = 'woke-up' | 'fell-asleep';

export interface TimeEntry {
  id: number;
  type: EntryType;
  time: string; // HH:MM format
  date: string; // YYYY-MM-DD format
  createdAt: string;
}

export interface SleepMetrics {
  totalSleep: string;
  totalAwake: string;
  nightSleep: string;
  date: string;
  sleepCompletionPercentage?: number;
  requiredSleepMinutes?: number;
}

export interface SleepSettings {
  id: number;
  requiredSleepMinutes: number;
  createdAt: string;
  updatedAt: string;
}
