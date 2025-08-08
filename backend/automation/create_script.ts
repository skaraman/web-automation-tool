import { api } from "encore.dev/api";
import { automationDB } from "./db";
import type { AutomationStep } from "./types";

export interface CreateScriptRequest {
  name: string;
  description?: string;
  steps: AutomationStep[];
}

export interface CreateScriptResponse {
  id: number;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new automation script.
export const createScript = api<CreateScriptRequest, CreateScriptResponse>(
  { expose: true, method: "POST", path: "/scripts" },
  async (req) => {
    const now = new Date();
    const result = await automationDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      steps: AutomationStep[];
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO scripts (name, description, steps, created_at, updated_at)
      VALUES (${req.name}, ${req.description || null}, ${JSON.stringify(req.steps)}, ${now}, ${now})
      RETURNING id, name, description, steps, created_at, updated_at
    `;

    if (!result) {
      throw new Error("Failed to create script");
    }

    return {
      id: result.id,
      name: result.name,
      description: result.description || undefined,
      steps: result.steps,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }
);
