import { timeEntries, type TimeEntry, type InsertTimeEntry, type SleepMetrics } from "@shared/schema";
import { timeToMinutes } from "../client/src/lib/utils";

export interface IStorage {
  getTimeEntries(): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;
  clearTimeEntries(): Promise<void>;
  calculateSleepMetrics(): Promise<SleepMetrics>;
}

export class MemStorage implements IStorage {
  private entries: Map<number, TimeEntry>;
  currentId: number;

  constructor() {
    this.entries = new Map();
    this.currentId = 1;
  }

  async getTimeEntries(): Promise<TimeEntry[]> {
    return Array.from(this.entries.values())
      .sort((a, b) => {
        // Sort by created timestamp
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.currentId++;
    const entry: TimeEntry = { 
      ...insertEntry, 
      id, 
      createdAt: new Date().toISOString() 
    };
    this.entries.set(id, entry);
    return entry;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    this.entries.delete(id);
  }

  async clearTimeEntries(): Promise<void> {
    this.entries.clear();
  }

  async calculateSleepMetrics(): Promise<SleepMetrics> {
    // Default metrics
    let totalSleepMinutes = 0;
    let totalAwakeMinutes = 0;
    let nightSleepMinutes = 0;

    // Get all entries sorted by time
    const entries = await this.getTimeEntries();

    if (entries.length < 2) {
      // Not enough data to calculate metrics
      return { totalSleepMinutes, totalAwakeMinutes, nightSleepMinutes };
    }

    // Check if entries start with wake-up
    const firstIsWakeUp = entries[0].type === 'woke-up';

    // Calculate total sleep and awake times
    for (let i = 0; i < entries.length - 1; i++) {
      const currentEntry = entries[i];
      const nextEntry = entries[i + 1];

      const startTime = timeToMinutes(currentEntry.time);
      const endTime = timeToMinutes(nextEntry.time);
      
      // Handle overnight crossing
      let duration = endTime - startTime;
      if (duration < 0) {
        // If end time is earlier than start time, assume it's the next day
        duration = (24 * 60 - startTime) + endTime;
      }

      if (currentEntry.type === 'woke-up' && nextEntry.type === 'fell-asleep') {
        // This is an awake period
        totalAwakeMinutes += duration;
      } else if (currentEntry.type === 'fell-asleep' && nextEntry.type === 'woke-up') {
        // This is a sleep period
        totalSleepMinutes += duration;
      }
    }

    // First morning wake up
    let morningWakeTime: string | null = null;
    if (firstIsWakeUp) {
      morningWakeTime = entries[0].time;
    }

    // Last sleep time of the day
    let nightSleepStart: string | null = null;
    const lastEntry = entries[entries.length - 1];
    if (lastEntry.type === 'fell-asleep') {
      nightSleepStart = lastEntry.time;
    }

    // Calculate night sleep if we have start and end times
    if (nightSleepStart && morningWakeTime) {
      const nightStart = timeToMinutes(nightSleepStart);
      const morningWake = timeToMinutes(morningWakeTime);

      // Handle overnight crossing (if morning time is less than night time)
      if (morningWake < nightStart) {
        nightSleepMinutes = (24 * 60 - nightStart) + morningWake;
      } else {
        nightSleepMinutes = morningWake - nightStart;
      }
    }

    return {
      totalSleepMinutes,
      totalAwakeMinutes,
      nightSleepMinutes
    };
  }
}

export const storage = new MemStorage();
