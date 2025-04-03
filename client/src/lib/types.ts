export type EntryType = 'woke-up' | 'fell-asleep';

export interface TimeEntry {
  id: number;
  type: EntryType;
  time: string; // HH:MM format
  createdAt: string;
}

export interface SleepMetrics {
  totalSleep: string;
  totalAwake: string;
  nightSleep: string;
}
