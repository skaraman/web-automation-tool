import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";
import type { AutomationStep, ExecutionResult } from "./types";

export interface ExecuteScriptParams {
  id: number;
}

export interface ExecuteScriptResponse {
  executionId: number;
  status: "running";
}

// Executes an automation script.
export const executeScript = api<ExecuteScriptParams, ExecuteScriptResponse>(
  { expose: true, method: "POST", path: "/scripts/:id/execute" },
  async (params) => {
    const script = await automationDB.queryRow<{
      id: number;
      steps: string | AutomationStep[];
    }>`
      SELECT id, steps
      FROM scripts
      WHERE id = ${params.id}
    `;

    if (!script) {
      throw APIError.notFound("Script not found");
    }

    // Parse steps if they come as a string
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

    const execution = await automationDB.queryRow<{ id: number }>`
      INSERT INTO executions (script_id, status)
      VALUES (${script.id}, 'running')
      RETURNING id
    `;

    if (!execution) {
      throw new Error("Failed to create execution");
    }

    // Execute the script asynchronously
    executeScriptAsync(execution.id, parsedSteps);

    return {
      executionId: execution.id,
      status: "running",
    };
  }
);

async function executeScriptAsync(executionId: number, steps: AutomationStep[]) {
  try {
    const result = await runAutomationSteps(steps);
    
    await automationDB.exec`
      UPDATE executions
      SET status = 'completed', result = ${JSON.stringify(result)}, completed_at = NOW()
      WHERE id = ${executionId}
    `;
  } catch (error) {
    await automationDB.exec`
      UPDATE executions
      SET status = 'failed', error_message = ${error instanceof Error ? error.message : String(error)}, completed_at = NOW()
      WHERE id = ${executionId}
    `;
  }
}

async function runAutomationSteps(steps: AutomationStep[]): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    success: true,
    screenshots: [],
    extractedData: {},
    logs: [],
  };

  // This is a mock implementation - in a real scenario, you would use a browser automation library
  for (const step of steps) {
    result.logs.push(`Executing step: ${step.action} - ${step.description || 'No description'}`);
    
    switch (step.action) {
      case "navigate":
        result.logs.push(`Navigating to: ${step.value}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      
      case "click":
        result.logs.push(`Clicking element: ${step.selector}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      case "type":
        result.logs.push(`Typing "${step.value}" into element: ${step.selector}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      case "wait":
        const waitTime = step.waitTime || 1000;
        result.logs.push(`Waiting for ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        break;
      
      case "screenshot":
        result.logs.push("Taking screenshot");
        result.screenshots.push(`screenshot_${Date.now()}.png`);
        break;
      
      case "extract_text":
        result.logs.push(`Extracting text from: ${step.selector}`);
        result.extractedData[step.id] = "Mock extracted text";
        break;
      
      case "extract_attribute":
        result.logs.push(`Extracting attribute "${step.value}" from: ${step.selector}`);
        result.extractedData[step.id] = "Mock attribute value";
        break;
      
      case "scroll":
        result.logs.push("Scrolling page");
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      case "select_dropdown":
        result.logs.push(`Selecting "${step.value}" from dropdown: ${step.selector}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
    }
  }

  return result;
}
