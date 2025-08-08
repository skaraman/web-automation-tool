import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { automationDB } from "./db";

export interface ListAllScreenshotsParams {
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListAllScreenshotsResponse {
  screenshots: {
    id: number;
    executionId: number;
    scriptId: number;
    scriptName: string;
    stepNumber: number;
    filename: string;
    url: string;
    createdAt: Date;
  }[];
  total: number;
}

export const listAllScreenshots = api<ListAllScreenshotsParams, ListAllScreenshotsResponse>(
  { expose: true, method: "GET", path: "/screenshots" },
  async (params) => {
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const countResult = await automationDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM screenshots s
      JOIN executions e ON s.execution_id = e.id
      JOIN scripts sc ON e.script_id = sc.id
    `;

    const total = countResult?.count || 0;

    const screenshots = await automationDB.rawQueryAll<{
      id: number;
      execution_id: number;
      script_id: number;
      script_name: string;
      step_number: number;
      filename: string;
      created_at: Date;
    }>(
      `
      SELECT 
        s.id,
        s.execution_id,
        e.script_id,
        sc.name as script_name,
        s.step_number,
        s.filename,
        s.created_at
      FROM screenshots s
      JOIN executions e ON s.execution_id = e.id
      JOIN scripts sc ON e.script_id = sc.id
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      limit,
      offset
    );

    return {
      screenshots: screenshots.map(screenshot => ({
        id: screenshot.id,
        executionId: screenshot.execution_id,
        scriptId: screenshot.script_id,
        scriptName: screenshot.script_name,
        stepNumber: screenshot.step_number,
        filename: screenshot.filename,
        url: `/api/automation/screenshots/${screenshot.id}`,
        createdAt: screenshot.created_at,
      })),
      total,
    };
  }
);