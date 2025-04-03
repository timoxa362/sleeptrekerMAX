import { 
  timeEntries, 
  sleepSettings,
  type TimeEntry, 
  type InsertTimeEntry, 
  type SleepMetrics,
  type SleepSettings,
  type InsertSleepSettings
} from "@shared/schema";
import { timeToMinutes } from "../client/src/lib/utils";
import { db } from "./db";
import { eq, and, desc, asc } from 'drizzle-orm';

export interface IStorage {
  getTimeEntries(date?: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;
  clearTimeEntries(date?: string): Promise<void>;
  calculateSleepMetrics(date: string): Promise<SleepMetrics>;
  getAvailableDates(): Promise<string[]>;
  
  // Sleep settings methods
  getSleepSettings(): Promise<SleepSettings | undefined>;
  createOrUpdateSleepSettings(settings: InsertSleepSettings): Promise<SleepSettings>;
}

export class DatabaseStorage implements IStorage {
  async getTimeEntries(date?: string): Promise<TimeEntry[]> {
    if (date) {
      return db.select()
        .from(timeEntries)
        .where(eq(timeEntries.date, date))
        .orderBy(asc(timeEntries.time));
    } else {
      return db.select()
        .from(timeEntries)
        .orderBy(desc(timeEntries.date), asc(timeEntries.time));
    }
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db
      .insert(timeEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, id));
  }

  async clearTimeEntries(date?: string): Promise<void> {
    if (date) {
      await db
        .delete(timeEntries)
        .where(eq(timeEntries.date, date));
    } else {
      await db
        .delete(timeEntries);
    }
  }

  async getAvailableDates(): Promise<string[]> {
    const result = await db
      .select({ date: timeEntries.date })
      .from(timeEntries)
      .groupBy(timeEntries.date)
      .orderBy(desc(timeEntries.date));
    
    return result.map(item => {
      // Convert the date to a string in YYYY-MM-DD format
      const date = new Date(item.date);
      return date.toISOString().split('T')[0];
    });
  }

  async calculateSleepMetrics(date: string): Promise<SleepMetrics> {
    // Default metrics
    let totalSleepMinutes = 0;
    let totalAwakeMinutes = 0;
    let nightSleepMinutes = 0;

    // Get all entries for the specific date, sorted by time
    const entries = await this.getTimeEntries(date);
    
    // Get sleep settings for required sleep calculation
    const settings = await this.getSleepSettings();
    const requiredSleepMinutes = settings?.requiredSleepMinutes;

    if (entries.length < 2) {
      // Not enough data to calculate metrics
      return { 
        totalSleepMinutes, 
        totalAwakeMinutes, 
        nightSleepMinutes,
        date,
        requiredSleepMinutes,
        sleepCompletionPercentage: 0
      };
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

    // Calculate sleep completion percentage if required sleep is available
    let sleepCompletionPercentage: number | undefined = undefined;
    if (requiredSleepMinutes && requiredSleepMinutes > 0) {
      sleepCompletionPercentage = Math.min(100, Math.round((totalSleepMinutes / requiredSleepMinutes) * 100));
    }

    return {
      totalSleepMinutes,
      totalAwakeMinutes,
      nightSleepMinutes,
      date,
      requiredSleepMinutes,
      sleepCompletionPercentage
    };
  }
  
  async getSleepSettings(): Promise<SleepSettings | undefined> {
    // Get the first (and should be only) sleep settings record
    const settings = await db
      .select()
      .from(sleepSettings)
      .limit(1);
    
    return settings[0];
  }
  
  async createOrUpdateSleepSettings(insertSettings: InsertSleepSettings): Promise<SleepSettings> {
    // Check if settings already exist
    const existingSettings = await this.getSleepSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db
        .update(sleepSettings)
        .set({
          ...insertSettings,
          updatedAt: new Date()
        })
        .where(eq(sleepSettings.id, existingSettings.id))
        .returning();
      
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(sleepSettings)
        .values(insertSettings)
        .returning();
      
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
