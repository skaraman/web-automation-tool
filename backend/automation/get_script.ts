import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";
import type { AutomationStep } from "./types";

export interface GetScriptParams {
  id: number;
}

export interface GetScriptResponse {
  id: number;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves a specific automation script by ID.
export const getScript = api<GetScriptParams, GetScriptResponse>(
  { expose: true, method: "GET", path: "/scripts/:id" },
  async (params) => {
    const script = await automationDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      steps: string | AutomationStep[];
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, description, steps, created_at, updated_at
      FROM scripts
      WHERE id = ${params.id}
    `;

    if (!script) {
      throw APIError.notFound("Script not found");
    }

    // Parse steps if they come as a string
    let parsedSteps: AutomationStep[];
    if (typeof script.steps === 'string') {
      try {
        parsedSteps = JSON.parse(script.steps);
      } catch (error) {
        parsedSteps = [];
      }
    } else {
      parsedSteps = script.steps || [];
    }

    return {
      id: script.id,
      name: script.name,
      description: script.description || undefined,
      steps: parsedSteps,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
    };
  }
);
