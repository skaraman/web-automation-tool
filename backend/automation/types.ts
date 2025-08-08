export type ActionType = 
  | "navigate"
  | "click"
  | "type"
  | "wait"
  | "screenshot"
  | "extract_text"
  | "extract_attribute"
  | "scroll"
  | "select_dropdown";

export type SelectorType = "css" | "xpath" | "id" | "class" | "text";

export interface AutomationStep {
  id: string;
  action: ActionType;
  selector?: string;
  selectorType?: SelectorType;
  value?: string;
  waitTime?: number;
  description?: string;
}

export interface Script {
  id: number;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Execution {
  id: number;
  scriptId: number;
  status: "running" | "completed" | "failed";
  result?: any;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface StepResult {
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

export interface ExecutionResult {
  success: boolean;
  screenshots: string[];
  extractedData: Record<string, any>;
  logs: string[];
  stepResults?: StepResult[];
  error?: string;
}
