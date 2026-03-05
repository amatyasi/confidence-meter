import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema } from "@shared/schema";
import { z } from "zod";
import { parseEvidenceWithLLM } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Save confidence assessment
  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.saveAssessment(validatedData);
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save assessment" });
      }
    }
  });

  // Get assessment by ID
  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve assessment" });
    }
  });

  // Get recent assessments
  app.get("/api/assessments", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const assessments = await storage.getRecentAssessments(limit);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve assessments" });
    }
  });

  // Update assessment
  app.patch("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const updateData = insertAssessmentSchema.partial().parse(req.body);
      const updated = await storage.updateAssessment(id, updateData);
      
      if (!updated) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update assessment" });
      }
    }
  });

  // Parse evidence text with LLM
  app.post("/api/parse-evidence", async (req, res) => {
    try {
      const { evidenceText } = req.body;
      
      if (!evidenceText || typeof evidenceText !== 'string') {
        res.status(400).json({ message: "Evidence text is required" });
        return;
      }

      if (evidenceText.trim().length === 0) {
        res.status(400).json({ message: "Evidence text cannot be empty" });
        return;
      }

      const parsedEvidence = await parseEvidenceWithLLM(evidenceText);
      res.json({ evidenceData: parsedEvidence });
    } catch (error) {
      console.error("Error parsing evidence:", error);
      res.status(500).json({ message: "Failed to parse evidence. Please try again." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
