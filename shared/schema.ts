import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define time entry table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ['woke-up', 'fell-asleep'] }).notNull(),
  time: text("time").notNull(), // HH:MM format
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schema
export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  type: true,
  time: true,
});

// Types
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Define Sleep metrics
export interface SleepMetrics {
  totalSleepMinutes: number;
  totalAwakeMinutes: number;
  nightSleepMinutes: number;
}
