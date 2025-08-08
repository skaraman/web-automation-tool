import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";

export interface DeleteScriptParams {
  id: number;
}

export const deleteScript = api<DeleteScriptParams, void>(
  { expose: true, method: "DELETE", path: "/scripts/:id" },
  async (params) => {
    const result = await automationDB.queryRow<{ id: number }>`
      DELETE FROM scripts
      WHERE id = ${params.id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("Script not found");
    }
  }
);