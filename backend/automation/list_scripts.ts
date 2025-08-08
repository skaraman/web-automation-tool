import { api } from "encore.dev/api";
import { automationDB } from "./db";
import type { AutomationStep } from "./types";

export interface ListScriptsResponse {
  scripts: {
    id: number;
    name: string;
    description?: string;
    steps: AutomationStep[];
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export const listScripts = api<void, ListScriptsResponse>(
  { expose: true, method: "GET", path: "/scripts" },
  async () => {
    const scripts = await automationDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      steps: string | AutomationStep[];
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, description, steps, created_at, updated_at
      FROM scripts
      ORDER BY created_at DESC
    `;

    return {
      scripts: scripts.map(script => {
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
      }),
    };
  }
);