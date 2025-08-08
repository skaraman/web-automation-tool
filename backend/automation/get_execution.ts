import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";

export interface GetExecutionParams {
  id: number;
}

export interface GetExecutionResponse {
  id: number;
  scriptId: number;
  status: "running" | "completed" | "failed";
  result?: any;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

// Retrieves the status and result of a script execution.
export const getExecution = api<GetExecutionParams, GetExecutionResponse>(
  { expose: true, method: "GET", path: "/executions/:id" },
  async (params) => {
    const execution = await automationDB.queryRow<{
      id: number;
      script_id: number;
      status: "running" | "completed" | "failed";
      result: any;
      error_message: string | null;
      started_at: Date;
      completed_at: Date | null;
    }>`
      SELECT id, script_id, status, result, error_message, started_at, completed_at
      FROM executions
      WHERE id = ${params.id}
    `;

    if (!execution) {
      throw APIError.notFound("Execution not found");
    }

    return {
      id: execution.id,
      scriptId: execution.script_id,
      status: execution.status,
      result: execution.result,
      errorMessage: execution.error_message || undefined,
      startedAt: execution.started_at,
      completedAt: execution.completed_at || undefined,
    };
  }
);
