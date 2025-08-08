import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";

export interface GetScreenshotParams {
  id: number;
}

// Retrieves a screenshot by database ID.
export const getScreenshot = api<GetScreenshotParams, Buffer>(
  { expose: true, method: "GET", path: "/screenshots/:id" },
  async (params) => {
    try {
      const screenshot = await automationDB.queryRow<{
        data: Buffer;
        content_type: string;
        filename: string;
      }>`
        SELECT data, content_type, filename
        FROM screenshots
        WHERE id = ${params.id}
      `;

      if (!screenshot) {
        throw APIError.notFound("Screenshot not found");
      }

      return screenshot.data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to retrieve screenshot");
    }
  }
);
