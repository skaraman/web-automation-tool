import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";

export interface GetScreenshotParams {
  id: number;
}

export interface GetScreenshotResponse {
  data: string;
  contentType: string;
  filename: string;
}

export const getScreenshot = api<GetScreenshotParams, GetScreenshotResponse>(
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

      const base64Data = screenshot.data.toString('base64');

      return {
        data: base64Data,
        contentType: screenshot.content_type,
        filename: screenshot.filename,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to retrieve screenshot");
    }
  }
);