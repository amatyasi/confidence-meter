import { pgTable, text, serial, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const confidenceAssessments = pgTable("confidence_assessments", {
  id: serial("id").primaryKey(),
  ideaName: text("idea_name").notNull(),
  evidenceData: json("evidence_data").notNull(),
  totalScore: real("total_score").notNull(),
  groupContributions: json("group_contributions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAssessmentSchema = createInsertSchema(confidenceAssessments).pick({
  ideaName: true,
  evidenceData: true,
  totalScore: true,
  groupContributions: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof confidenceAssessments.$inferSelect;
