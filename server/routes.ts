import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTimeEntrySchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all time entries
  app.get("/api/entries", async (req, res) => {
    try {
      const entries = await storage.getTimeEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  // Create a new time entry
  app.post("/api/entries", async (req, res) => {
    try {
      const entry = insertTimeEntrySchema.parse(req.body);
      const newEntry = await storage.createTimeEntry(entry);
      res.status(201).json(newEntry);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid entry data", errors: error.errors });
      } else {
        console.error("Error creating entry:", error);
        res.status(500).json({ message: "Failed to create entry" });
      }
    }
  });

  // Delete a time entry
  app.delete("/api/entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      
      await storage.deleteTimeEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting entry:", error);
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  // Clear all time entries
  app.delete("/api/entries", async (req, res) => {
    try {
      await storage.clearTimeEntries();
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing entries:", error);
      res.status(500).json({ message: "Failed to clear entries" });
    }
  });

  // Get sleep metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.calculateSleepMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      res.status(500).json({ message: "Failed to calculate sleep metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
