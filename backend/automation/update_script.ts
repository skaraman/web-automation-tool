import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";
import type { AutomationStep } from "./types";

export interface UpdateScriptParams {
  id: number;
}

export interface UpdateScriptRequest {
  name?: string;
  description?: string;
  steps?: AutomationStep[];
}

export interface UpdateScriptResponse {
  id: number;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: Date;
  updatedAt: Date;
}

// Updates an existing automation script.
export const updateScript = api<UpdateScriptParams & UpdateScriptRequest, UpdateScriptResponse>(
  { expose: true, method: "PUT", path: "/scripts/:id" },
  async (req) => {
    const existing = await automationDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      steps: string | AutomationStep[];
    }>`
      SELECT id, name, description, steps
      FROM scripts
      WHERE id = ${req.id}
    `;

    if (!existing) {
      throw APIError.notFound("Script not found");
    }

    // Parse existing steps if they come as a string
    let existingSteps: AutomationStep[];
    if (typeof existing.steps === 'string') {
      try {
        existingSteps = JSON.parse(existing.steps);
      } catch (error) {
        existingSteps = [];
      }
    } else {
      existingSteps = existing.steps || [];
    }

    const now = new Date();
    const updatedScript = await automationDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      steps: string | AutomationStep[];
      created_at: Date;
      updated_at: Date;
    }>`
      UPDATE scripts
      SET 
        name = ${req.name ?? existing.name},
        description = ${req.description !== undefined ? req.description : existing.description},
        steps = ${req.steps ? JSON.stringify(req.steps) : JSON.stringify(existingSteps)},
        updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING id, name, description, steps, created_at, updated_at
    `;

    if (!updatedScript) {
      throw new Error("Failed to update script");
    }

    // Parse steps if they come as a string
    let parsedSteps: AutomationStep[];
    if (typeof updatedScript.steps === 'string') {
      try {
        parsedSteps = JSON.parse(updatedScript.steps);
      } catch (error) {
        parsedSteps = [];
      }
    } else {
      parsedSteps = updatedScript.steps || [];
    }

    return {
      id: updatedScript.id,
      name: updatedScript.name,
      description: updatedScript.description || undefined,
      steps: parsedSteps,
      createdAt: updatedScript.created_at,
      updatedAt: updatedScript.updated_at,
    };
  }
);
