import { api } from "encore.dev/api";
import { automationDB } from "./db";

export interface ListScreenshotsParams {
  executionId: number;
}

export interface ListScreenshotsResponse {
  screenshots: {
    id: number;
    stepNumber: number;
    filename: string;
    url: string;
    createdAt: Date;
  }[];
}

export const listScreenshots = api<ListScreenshotsParams, ListScreenshotsResponse>(
  { expose: true, method: "GET", path: "/executions/:executionId/screenshots" },
  async (params) => {
    const screenshots = await automationDB.queryAll<{
      id: number;
      step_number: number;
      filename: string;
      created_at: Date;
    }>`
      SELECT id, step_number, filename, created_at
      FROM screenshots
      WHERE execution_id = ${params.executionId}
      ORDER BY step_number ASC, created_at ASC
    `;

    return {
      screenshots: screenshots.map(screenshot => ({
        id: screenshot.id,
        stepNumber: screenshot.step_number,
        filename: screenshot.filename,
        url: `/api/automation/screenshots/${screenshot.id}`,
        createdAt: screenshot.created_at,
      })),
    };
  }
);