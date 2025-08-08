import { api } from "encore.dev/api";
import { automationDB } from "./db";

export interface ClearExecutionsParams {
  scriptId?: number;
}

export interface ClearExecutionsResponse {
  deletedCount: number;
}

// Clears execution history for a specific script or all scripts.
export const clearExecutions = api<ClearExecutionsParams, ClearExecutionsResponse>(
  { expose: true, method: "DELETE", path: "/executions/clear" },
  async (params) => {
    let deletedCount = 0;
    
    if (params.scriptId) {
      // Clear executions for a specific script
      const result = await automationDB.queryAll<{ id: number }>`
        DELETE FROM executions
        WHERE script_id = ${params.scriptId}
        RETURNING id
      `;
      deletedCount = result.length;
    } else {
      // Clear all executions
      const result = await automationDB.queryAll<{ id: number }>`
        DELETE FROM executions
        RETURNING id
      `;
      deletedCount = result.length;
    }

    return { deletedCount };
  }
);
