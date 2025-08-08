import { api, APIError } from "encore.dev/api";
import { automationDB } from "./db";
import { screenshotBucket } from "./storage";
import type { AutomationStep, ExecutionResult } from "./types";
import puppeteer, { Browser, Page } from "puppeteer";

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

interface StepResult {
  stepId: string;
  action: string;
  description?: string;
  success: boolean;
  screenshot?: string;
  extractedData?: any;
  error?: string;
  timestamp: string;
}

async function runAutomationSteps(steps: AutomationStep[]): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    success: true,
    screenshots: [],
    extractedData: {},
    logs: [],
    stepResults: [],
  };

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    result.logs.push("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    result.logs.push("Browser launched successfully");

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepResult: StepResult = {
        stepId: step.id,
        action: step.action,
        description: step.description,
        success: true,
        timestamp: new Date().toISOString(),
      };

      result.logs.push(`Step ${i + 1}: Executing ${step.action} - ${step.description || 'No description'}`);
      
      try {
        switch (step.action) {
          case "navigate":
            if (!step.value) {
              throw new Error("URL is required for navigate action");
            }
            result.logs.push(`Navigating to: ${step.value}`);
            await page.goto(step.value, { waitUntil: 'networkidle2', timeout: 30000 });
            break;
          
          case "click":
            if (!step.selector) {
              throw new Error("Selector is required for click action");
            }
            result.logs.push(`Clicking element: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await page.click(step.selector);
            break;
          
          case "type":
            if (!step.selector || !step.value) {
              throw new Error("Selector and value are required for type action");
            }
            result.logs.push(`Typing "${step.value}" into element: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await page.focus(step.selector);
            await page.keyboard.type(step.value);
            break;
          
          case "wait":
            const waitTime = step.waitTime || 1000;
            result.logs.push(`Waiting for ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            break;
          
          case "screenshot":
            result.logs.push("Taking screenshot");
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            const screenshotUrl = await uploadScreenshot(screenshotBuffer, `manual_screenshot_${Date.now()}.png`);
            result.screenshots.push(screenshotUrl);
            stepResult.screenshot = screenshotUrl;
            break;
          
          case "extract_text":
            if (!step.selector) {
              throw new Error("Selector is required for extract_text action");
            }
            result.logs.push(`Extracting text from: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            const extractedText = await page.$eval(step.selector, el => el.textContent?.trim() || '');
            result.extractedData[step.id] = extractedText;
            stepResult.extractedData = extractedText;
            break;
          
          case "extract_attribute":
            if (!step.selector || !step.value) {
              throw new Error("Selector and attribute name are required for extract_attribute action");
            }
            result.logs.push(`Extracting attribute "${step.value}" from: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            const extractedAttr = await page.$eval(step.selector, (el, attr) => el.getAttribute(attr), step.value);
            result.extractedData[step.id] = extractedAttr;
            stepResult.extractedData = extractedAttr;
            break;
          
          case "scroll":
            result.logs.push("Scrolling page");
            await page.evaluate(() => {
              window.scrollBy(0, window.innerHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            break;
          
          case "select_dropdown":
            if (!step.selector || !step.value) {
              throw new Error("Selector and value are required for select_dropdown action");
            }
            result.logs.push(`Selecting "${step.value}" from dropdown: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await page.select(step.selector, step.value);
            break;
        }

        // Capture a screenshot after every step (except for the screenshot action itself)
        if (step.action !== "screenshot") {
          const autoScreenshotBuffer = await page.screenshot({ fullPage: true });
          const autoScreenshotUrl = await uploadScreenshot(autoScreenshotBuffer, `step_${i + 1}_${Date.now()}.png`);
          result.screenshots.push(autoScreenshotUrl);
          stepResult.screenshot = autoScreenshotUrl;
          result.logs.push(`Screenshot captured after step ${i + 1}`);
        }

        // Small delay between steps for stability
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        stepResult.success = false;
        stepResult.error = error instanceof Error ? error.message : String(error);
        result.logs.push(`Error in step ${i + 1}: ${stepResult.error}`);
        result.success = false;
        
        // Still try to capture a screenshot on error
        try {
          const errorScreenshotBuffer = await page.screenshot({ fullPage: true });
          const errorScreenshotUrl = await uploadScreenshot(errorScreenshotBuffer, `error_step_${i + 1}_${Date.now()}.png`);
          stepResult.screenshot = errorScreenshotUrl;
          result.screenshots.push(errorScreenshotUrl);
        } catch (screenshotError) {
          result.logs.push(`Failed to capture error screenshot: ${screenshotError}`);
        }
      }

      result.stepResults.push(stepResult);
    }

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    result.logs.push(`Browser execution failed: ${result.error}`);
  } finally {
    // Clean up browser resources
    try {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
      result.logs.push("Browser closed successfully");
    } catch (cleanupError) {
      result.logs.push(`Browser cleanup error: ${cleanupError}`);
    }
  }

  return result;
}

async function uploadScreenshot(buffer: Buffer, filename: string): Promise<string> {
  try {
    await screenshotBucket.upload(filename, buffer, {
      contentType: 'image/png'
    });
    return screenshotBucket.publicUrl(filename);
  } catch (error) {
    console.error('Failed to upload screenshot:', error);
    return `failed_upload_${filename}`;
  }
}
