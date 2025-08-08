import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { automationDB } from "./db";

export interface ListExecutionsParams {
  scriptId?: Query<number>;
  limit?: Query<number>;
}

export interface ListExecutionsResponse {
  executions: {
    id: number;
    scriptId: number;
    status: "running" | "completed" | "failed";
    errorMessage?: string;
    startedAt: Date;
    completedAt?: Date;
  }[];
}

// Retrieves execution history for scripts.
export const listExecutions = api<ListExecutionsParams, ListExecutionsResponse>(
  { expose: true, method: "GET", path: "/executions" },
  async (params) => {
    const limit = params.limit || 50;
    
    let query = `
      SELECT id, script_id, status, error_message, started_at, completed_at
      FROM executions
    `;
    
    const queryParams: any[] = [];
    
    if (params.scriptId) {
      query += ` WHERE script_id = $1`;
      queryParams.push(params.scriptId);
      query += ` ORDER BY started_at DESC LIMIT $2`;
      queryParams.push(limit);
    } else {
      query += ` ORDER BY started_at DESC LIMIT $1`;
      queryParams.push(limit);
    }

    const executions = await automationDB.rawQueryAll<{
      id: number;
      script_id: number;
      status: "running" | "completed" | "failed";
      error_message: string | null;
      started_at: Date;
      completed_at: Date | null;
    }>(query, ...queryParams);

    return {
      executions: executions.map(execution => ({
        id: execution.id,
        scriptId: execution.script_id,
        status: execution.status,
        errorMessage: execution.error_message || undefined,
        startedAt: execution.started_at,
        completedAt: execution.completed_at || undefined,
      })),
    };
  }
);
