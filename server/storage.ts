import { users, confidenceAssessments, type User, type InsertUser, type Assessment, type InsertAssessment } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  saveAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getRecentAssessments(limit?: number): Promise<Assessment[]>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessments: Map<number, Assessment>;
  private currentUserId: number;
  private currentAssessmentId: number;

  constructor() {
    this.users = new Map();
    this.assessments = new Map();
    this.currentUserId = 1;
    this.currentAssessmentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentAssessmentId++;
    const now = new Date();
    const assessment: Assessment = {
      ...insertAssessment,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.assessments.set(id, assessment);
    return assessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getRecentAssessments(limit = 10): Promise<Assessment[]> {
    const assessments = Array.from(this.assessments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return assessments;
  }

  async updateAssessment(id: number, updateData: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const existing = this.assessments.get(id);
    if (!existing) return undefined;

    const updated: Assessment = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.assessments.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
