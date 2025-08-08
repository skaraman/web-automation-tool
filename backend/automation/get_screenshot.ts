import { api, APIError } from "encore.dev/api";
import { screenshotBucket } from "./storage";

export interface GetScreenshotParams {
  filename: string;
}

export interface GetScreenshotResponse {
  url: string;
}

// Retrieves a screenshot URL by filename.
export const getScreenshot = api<GetScreenshotParams, GetScreenshotResponse>(
  { expose: true, method: "GET", path: "/screenshots/:filename" },
  async (params) => {
    try {
      const exists = await screenshotBucket.exists(params.filename);
      if (!exists) {
        throw APIError.notFound("Screenshot not found");
      }

      const url = screenshotBucket.publicUrl(params.filename);
      return { url };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to retrieve screenshot");
    }
  }
);
