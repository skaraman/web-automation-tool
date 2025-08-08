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
    const result = await runAutomationSteps(steps, executionId);
    
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
  screenshotId?: number;
  extractedData?: any;
  error?: string;
  timestamp: string;
}

async function runAutomationSteps(steps: AutomationStep[], executionId: number): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    success: true,
    screenshots: [],
    extractedData: {},
    logs: [],
    stepResults: [],
  };

  let browser: Browser | null = null;
  let page: Page | null = null;

  // Helper function to ensure page stability before screenshots
  async function ensurePageStability(page: Page, logs: string[]): Promise<void> {
    try {
      logs.push("Ensuring page stability before screenshot...");
      
      // Wait for any pending network requests using a simplified approach
      await new Promise<void>((resolve) => {
        let timeoutId: NodeJS.Timeout;
        const maxWaitTime = 3000; // Maximum 3 seconds wait
        
        const onRequest = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            page.off('request', onRequest);
            page.off('response', onResponse);
            resolve();
          }, 300); // No requests for 300ms = idle
        };
        
        const onResponse = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            page.off('request', onRequest);
            page.off('response', onResponse);
            resolve();
          }, 300);
        };
        
        page.on('request', onRequest);
        page.on('response', onResponse);
        
        // Start initial timer
        timeoutId = setTimeout(() => {
          page.off('request', onRequest);
          page.off('response', onResponse);
          resolve();
        }, 300);
        
        // Safety timeout
        setTimeout(() => {
          page.off('request', onRequest);
          page.off('response', onResponse);
          clearTimeout(timeoutId);
          resolve();
        }, maxWaitTime);
      });
      
      // Wait for any animations or transitions to complete
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          // Wait for any CSS transitions/animations
          const animationPromises: Promise<void>[] = [];
          
          document.querySelectorAll('*').forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const animationDuration = parseFloat(computedStyle.animationDuration) || 0;
            const transitionDuration = parseFloat(computedStyle.transitionDuration) || 0;
            
            if (animationDuration > 0) {
              animationPromises.push(
                new Promise<void>((animResolve) => {
                  setTimeout(() => animResolve(), Math.min(animationDuration * 1000, 2000));
                })
              );
            }
            
            if (transitionDuration > 0) {
              animationPromises.push(
                new Promise<void>((transResolve) => {
                  setTimeout(() => transResolve(), Math.min(transitionDuration * 1000, 2000));
                })
              );
            }
          });
          
          // Wait for all animations to complete, or timeout after 2 seconds
          Promise.race([
            Promise.all(animationPromises),
            new Promise<void>((timeoutResolve) => setTimeout(() => timeoutResolve(), 2000))
          ]).then(() => {
            // Additional frame wait for visual stability
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        });
      });
      
      logs.push("Page stability ensured");
    } catch (stabilityError) {
      logs.push(`Page stability check failed: ${stabilityError} - continuing anyway`);
    }
  }

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
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
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
            result.logs.push(`Successfully navigated to: ${step.value}`);
            break;
          
          case "click":
            if (!step.selector) {
              throw new Error("Selector is required for click action");
            }
            result.logs.push(`Waiting for element: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            result.logs.push(`Clicking element: ${step.selector}`);
            await page.click(step.selector);
            result.logs.push(`Successfully clicked: ${step.selector}`);
            break;
          
          case "type":
            if (!step.selector || !step.value) {
              throw new Error("Selector and value are required for type action");
            }
            result.logs.push(`Waiting for input field: ${step.selector}`);
            await page.waitForSelector(step.selector, { timeout: 10000 });
            result.logs.push(`Focusing on: ${step.selector}`);
            await page.focus(step.selector);
            result.logs.push(`Clearing existing text in: ${step.selector}`);
            await page.evaluate((selector) => {
              const element = document.querySelector(selector) as HTMLInputElement;
              if (element) {
                element.value = '';
              }
            }, step.selector);
            result.logs.push(`Typing "${step.value}" into: ${step.selector}`);
            await page.type(step.selector, step.value);
            result.logs.push(`Successfully typed text into: ${step.selector}`);
            break;
          
          case "wait":
            const waitTime = step.waitTime || 1000;
            result.logs.push(`Waiting for ${waitTime}ms and ensuring page stability`);
            
            // First wait for the specified time
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Additionally wait for network to be idle to ensure page is stable
            try {
              result.logs.push("Waiting for network to be idle...");
              await page.waitForSelector('body', { timeout: 2000 }); // Ensure page has loaded
              result.logs.push("Page body loaded, checking for network idle state...");
              
              // Wait for network idle by checking if no new requests are made for 500ms
              await new Promise<void>((resolve) => {
                let timeoutId: NodeJS.Timeout;
                let requestCount = 0;
                const startTime = Date.now();
                const maxWaitTime = 5000; // Maximum 5 seconds wait
                
                const onRequest = () => {
                  requestCount++;
                  clearTimeout(timeoutId);
                  
                  timeoutId = setTimeout(() => {
                    page.off('request', onRequest);
                    page.off('response', onResponse);
                    resolve();
                  }, 500); // No requests for 500ms = idle
                };
                
                const onResponse = () => {
                  // Reset timer on response
                  clearTimeout(timeoutId);
                  timeoutId = setTimeout(() => {
                    page.off('request', onRequest);
                    page.off('response', onResponse);
                    resolve();
                  }, 500);
                };
                
                page.on('request', onRequest);
                page.on('response', onResponse);
                
                // Start initial timer
                timeoutId = setTimeout(() => {
                  page.off('request', onRequest);
                  page.off('response', onResponse);
                  resolve();
                }, 500);
                
                // Safety timeout
                setTimeout(() => {
                  page.off('request', onRequest);
                  page.off('response', onResponse);
                  clearTimeout(timeoutId);
                  resolve();
                }, maxWaitTime);
              });
              
              result.logs.push("Network appears to be idle");
            } catch (networkError) {
              result.logs.push(`Network idle check failed: ${networkError} - continuing anyway`);
            }
            
            // Wait for any pending DOM updates
            await page.evaluate(() => {
              return new Promise<void>((resolve) => {
                if (document.readyState === 'complete') {
                  // Use requestAnimationFrame to wait for any pending renders
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      resolve();
                    });
                  });
                } else {
                  document.addEventListener('DOMContentLoaded', () => {
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        resolve();
                      });
                    });
                  });
                }
              });
            });
            
            result.logs.push("Page stability checks completed");
            break;
          
          case "screenshot":
            result.logs.push("Taking manual screenshot");
            await ensurePageStability(page, result.logs);
            const screenshotBuffer = await page.screenshot({ 
              fullPage: true,
              type: 'png',
              clip: undefined // Let it capture the full page
            });
            const { url: screenshotUrl, id: screenshotId } = await saveScreenshot(screenshotBuffer, `manual_screenshot_${Date.now()}.png`, executionId, i + 1);
            result.screenshots.push(screenshotUrl);
            stepResult.screenshot = screenshotUrl;
            stepResult.screenshotId = screenshotId;
            result.logs.push(`Screenshot saved: ${screenshotUrl}`);
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
            result.logs.push(`Extracted text: "${extractedText}"`);
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
            result.logs.push(`Extracted attribute: "${extractedAttr}"`);
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
          result.logs.push(`Capturing screenshot after step ${i + 1}`);
          await ensurePageStability(page, result.logs);
          const autoScreenshotBuffer = await page.screenshot({ 
            fullPage: true,
            type: 'png',
            clip: undefined // Let it capture the full page
          });
          const { url: autoScreenshotUrl, id: autoScreenshotId } = await saveScreenshot(autoScreenshotBuffer, `step_${i + 1}_${Date.now()}.png`, executionId, i + 1);
          result.screenshots.push(autoScreenshotUrl);
          stepResult.screenshot = autoScreenshotUrl;
          stepResult.screenshotId = autoScreenshotId;
          result.logs.push(`Screenshot captured and saved: ${autoScreenshotUrl}`);
        }

        // Small delay between steps for stability
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        stepResult.success = false;
        stepResult.error = error instanceof Error ? error.message : String(error);
        result.logs.push(`Error in step ${i + 1}: ${stepResult.error}`);
        result.success = false;
        
        // Still try to capture a screenshot on error
        try {
          result.logs.push(`Capturing error screenshot for step ${i + 1}`);
          await ensurePageStability(page, result.logs);
          const errorScreenshotBuffer = await page.screenshot({ 
            fullPage: true,
            type: 'png',
            clip: undefined
          });
          const { url: errorScreenshotUrl, id: errorScreenshotId } = await saveScreenshot(errorScreenshotBuffer, `error_step_${i + 1}_${Date.now()}.png`, executionId, i + 1);
          stepResult.screenshot = errorScreenshotUrl;
          stepResult.screenshotId = errorScreenshotId;
          result.screenshots.push(errorScreenshotUrl);
          result.logs.push(`Error screenshot saved: ${errorScreenshotUrl}`);
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
        result.logs.push("Page closed");
      }
      if (browser) {
        await browser.close();
        result.logs.push("Browser closed successfully");
      }
    } catch (cleanupError) {
      result.logs.push(`Browser cleanup error: ${cleanupError}`);
    }
  }

  return result;
}

async function saveScreenshot(buffer: Buffer, filename: string, executionId: number, stepNumber: number): Promise<{ url: string; id: number }> {
  try {
    // First, try to save to database
    const screenshotRecord = await automationDB.queryRow<{ id: number }>`
      INSERT INTO screenshots (execution_id, step_number, filename, data, content_type)
      VALUES (${executionId}, ${stepNumber}, ${filename}, ${buffer}, 'image/png')
      RETURNING id
    `;

    if (!screenshotRecord) {
      throw new Error("Failed to save screenshot to database");
    }

    // Try to upload to object storage as well (fallback)
    try {
      await screenshotBucket.upload(filename, buffer, {
        contentType: 'image/png'
      });
      const publicUrl = screenshotBucket.publicUrl(filename);
      return { url: publicUrl, id: screenshotRecord.id };
    } catch (bucketError) {
      console.error('Failed to upload to bucket, using database URL:', bucketError);
      // Return database URL as fallback
      return { url: `/api/automation/screenshots/${screenshotRecord.id}`, id: screenshotRecord.id };
    }

  } catch (error) {
    console.error('Failed to save screenshot:', error);
    // Return a base64 data URL as last resort
    const base64 = buffer.toString('base64');
    return { url: `data:image/png;base64,${base64}`, id: -1 };
  }
}
