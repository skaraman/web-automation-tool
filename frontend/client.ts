import type { CookieWithOptions } from "encore.dev/api";

export type BaseURL = string

export const Local: BaseURL = "http://localhost:4000"

export function Environment(name: string): BaseURL {
    return `https://${name}-.encr.app`
}

export function PreviewEnv(pr: number | string): BaseURL {
    return Environment(`pr${pr}`)
}

const BROWSER = typeof globalThis === "object" && ("window" in globalThis);

export class Client {
    public readonly automation: automation.ServiceClient
    private readonly options: ClientOptions
    private readonly target: string

    constructor(target: BaseURL, options?: ClientOptions) {
        this.target = target
        this.options = options ?? {}
        const base = new BaseClient(this.target, this.options)
        this.automation = new automation.ServiceClient(base)
    }

    public with(options: ClientOptions): Client {
        return new Client(this.target, {
            ...this.options,
            ...options,
        })
    }
}

export interface ClientOptions {
    fetcher?: Fetcher
    requestInit?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> }
}

import { clearExecutions as api_automation_clear_executions_clearExecutions } from "~backend/automation/clear_executions";
import { createScript as api_automation_create_script_createScript } from "~backend/automation/create_script";
import { deleteScript as api_automation_delete_script_deleteScript } from "~backend/automation/delete_script";
import { executeScript as api_automation_execute_script_executeScript } from "~backend/automation/execute_script";
import { getExecution as api_automation_get_execution_getExecution } from "~backend/automation/get_execution";
import { getScreenshot as api_automation_get_screenshot_getScreenshot } from "~backend/automation/get_screenshot";
import { getScript as api_automation_get_script_getScript } from "~backend/automation/get_script";
import { listAllScreenshots as api_automation_list_all_screenshots_listAllScreenshots } from "~backend/automation/list_all_screenshots";
import { listExecutions as api_automation_list_executions_listExecutions } from "~backend/automation/list_executions";
import { listScreenshots as api_automation_list_screenshots_listScreenshots } from "~backend/automation/list_screenshots";
import { listScripts as api_automation_list_scripts_listScripts } from "~backend/automation/list_scripts";
import { updateScript as api_automation_update_script_updateScript } from "~backend/automation/update_script";

export namespace automation {

    export class ServiceClient {
        private baseClient: BaseClient

        constructor(baseClient: BaseClient) {
            this.baseClient = baseClient
            this.clearExecutions = this.clearExecutions.bind(this)
            this.createScript = this.createScript.bind(this)
            this.deleteScript = this.deleteScript.bind(this)
            this.executeScript = this.executeScript.bind(this)
            this.getExecution = this.getExecution.bind(this)
            this.getScreenshot = this.getScreenshot.bind(this)
            this.getScript = this.getScript.bind(this)
            this.listAllScreenshots = this.listAllScreenshots.bind(this)
            this.listExecutions = this.listExecutions.bind(this)
            this.listScreenshots = this.listScreenshots.bind(this)
            this.listScripts = this.listScripts.bind(this)
            this.updateScript = this.updateScript.bind(this)
        }

        public async clearExecutions(params: RequestType<typeof api_automation_clear_executions_clearExecutions>): Promise<ResponseType<typeof api_automation_clear_executions_clearExecutions>> {
            const query = makeRecord<string, string | string[]>({
                scriptId: params.scriptId === undefined ? undefined : String(params.scriptId),
            })

            const resp = await this.baseClient.callTypedAPI(`/executions/clear`, {query, method: "DELETE", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_clear_executions_clearExecutions>
        }

        public async createScript(params: RequestType<typeof api_automation_create_script_createScript>): Promise<ResponseType<typeof api_automation_create_script_createScript>> {
            const resp = await this.baseClient.callTypedAPI(`/scripts`, {method: "POST", body: JSON.stringify(params)})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_create_script_createScript>
        }

        public async deleteScript(params: { id: number }): Promise<void> {
            await this.baseClient.callTypedAPI(`/scripts/${encodeURIComponent(params.id)}`, {method: "DELETE", body: undefined})
        }

        public async executeScript(params: { id: number }): Promise<ResponseType<typeof api_automation_execute_script_executeScript>> {
            const resp = await this.baseClient.callTypedAPI(`/scripts/${encodeURIComponent(params.id)}/execute`, {method: "POST", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_execute_script_executeScript>
        }

        public async getExecution(params: { id: number }): Promise<ResponseType<typeof api_automation_get_execution_getExecution>> {
            const resp = await this.baseClient.callTypedAPI(`/executions/${encodeURIComponent(params.id)}`, {method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_get_execution_getExecution>
        }

        public async getScreenshot(params: { id: number }): Promise<ResponseType<typeof api_automation_get_screenshot_getScreenshot>> {
            const resp = await this.baseClient.callTypedAPI(`/screenshots/${encodeURIComponent(params.id)}`, {method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_get_screenshot_getScreenshot>
        }

        public async getScript(params: { id: number }): Promise<ResponseType<typeof api_automation_get_script_getScript>> {
            const resp = await this.baseClient.callTypedAPI(`/scripts/${encodeURIComponent(params.id)}`, {method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_get_script_getScript>
        }

        public async listAllScreenshots(params: RequestType<typeof api_automation_list_all_screenshots_listAllScreenshots>): Promise<ResponseType<typeof api_automation_list_all_screenshots_listAllScreenshots>> {
            const query = makeRecord<string, string | string[]>({
                limit:  params.limit === undefined ? undefined : String(params.limit),
                offset: params.offset === undefined ? undefined : String(params.offset),
            })

            const resp = await this.baseClient.callTypedAPI(`/screenshots`, {query, method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_list_all_screenshots_listAllScreenshots>
        }

        public async listExecutions(params: RequestType<typeof api_automation_list_executions_listExecutions>): Promise<ResponseType<typeof api_automation_list_executions_listExecutions>> {
            const query = makeRecord<string, string | string[]>({
                limit:    params.limit === undefined ? undefined : String(params.limit),
                scriptId: params.scriptId === undefined ? undefined : String(params.scriptId),
            })

            const resp = await this.baseClient.callTypedAPI(`/executions`, {query, method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_list_executions_listExecutions>
        }

        public async listScreenshots(params: { executionId: number }): Promise<ResponseType<typeof api_automation_list_screenshots_listScreenshots>> {
            const resp = await this.baseClient.callTypedAPI(`/executions/${encodeURIComponent(params.executionId)}/screenshots`, {method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_list_screenshots_listScreenshots>
        }

        public async listScripts(): Promise<ResponseType<typeof api_automation_list_scripts_listScripts>> {
            const resp = await this.baseClient.callTypedAPI(`/scripts`, {method: "GET", body: undefined})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_list_scripts_listScripts>
        }

        public async updateScript(params: RequestType<typeof api_automation_update_script_updateScript>): Promise<ResponseType<typeof api_automation_update_script_updateScript>> {
            const body: Record<string, any> = {
                description: params.description,
                name:        params.name,
                steps:       params.steps,
            }

            const resp = await this.baseClient.callTypedAPI(`/scripts/${encodeURIComponent(params.id)}`, {method: "PUT", body: JSON.stringify(body)})
            return JSON.parse(await resp.text(), dateReviver) as ResponseType<typeof api_automation_update_script_updateScript>
        }
    }
}


type PickMethods<Type> = Omit<CallParameters, "method"> & { method?: Type };

type OmitCookie<T> = {
  [K in keyof T as T[K] extends CookieWithOptions<any> ? never : K]: T[K];
};

type RequestType<Type extends (...args: any[]) => any> =
  Parameters<Type> extends [infer H, ...any[]]
    ? OmitCookie<H>
    : void;

type ResponseType<Type extends (...args: any[]) => any> = OmitCookie<Awaited<ReturnType<Type>>>;

function dateReviver(key: string, value: any): any {
  if (
    typeof value === "string" &&
    value.length >= 10 &&
    value.charCodeAt(0) >= 48 &&
    value.charCodeAt(0) <= 57
  ) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return value;
}


function encodeQuery(parts: Record<string, string | string[]>): string {
    const pairs: string[] = []
    for (const key in parts) {
        const val = (Array.isArray(parts[key]) ?  parts[key] : [parts[key]]) as string[]
        for (const v of val) {
            pairs.push(`${key}=${encodeURIComponent(v)}`)
        }
    }
    return pairs.join("&")
}

function makeRecord<K extends string | number | symbol, V>(record: Record<K, V | undefined>): Record<K, V> {
    for (const key in record) {
        if (record[key] === undefined) {
            delete record[key]
        }
    }
    return record as Record<K, V>
}

import {
  StreamInOutHandlerFn,
  StreamInHandlerFn,
  StreamOutHandlerFn,
} from "encore.dev/api";

type StreamRequest<Type> = Type extends
  | StreamInOutHandlerFn<any, infer Req, any>
  | StreamInHandlerFn<any, infer Req, any>
  | StreamOutHandlerFn<any, any>
  ? Req
  : never;

type StreamResponse<Type> = Type extends
  | StreamInOutHandlerFn<any, any, infer Resp>
  | StreamInHandlerFn<any, any, infer Resp>
  | StreamOutHandlerFn<any, infer Resp>
  ? Resp
  : never;


function encodeWebSocketHeaders(headers: Record<string, string>) {
    const base64encoded = btoa(JSON.stringify(headers))
      .replaceAll("=", "")
      .replaceAll("+", "-")
      .replaceAll("/", "_");
    return "encore.dev.headers." + base64encoded;
}

class WebSocketConnection {
    public ws: WebSocket;

    private hasUpdateHandlers: (() => void)[] = [];

    constructor(url: string, headers?: Record<string, string>) {
        let protocols = ["encore-ws"];
        if (headers) {
            protocols.push(encodeWebSocketHeaders(headers))
        }

        this.ws = new WebSocket(url, protocols)

        this.on("error", () => {
            this.resolveHasUpdateHandlers();
        });

        this.on("close", () => {
            this.resolveHasUpdateHandlers();
        });
    }

    resolveHasUpdateHandlers() {
        const handlers = this.hasUpdateHandlers;
        this.hasUpdateHandlers = [];

        for (const handler of handlers) {
            handler()
        }
    }

    async hasUpdate() {
        await new Promise((resolve) => {
            this.hasUpdateHandlers.push(() => resolve(null))
        });
    }

    on(type: "error" | "close" | "message" | "open", handler: (event: any) => void) {
        this.ws.addEventListener(type, handler);
    }

    off(type: "error" | "close" | "message" | "open", handler: (event: any) => void) {
        this.ws.removeEventListener(type, handler);
    }

    close() {
        this.ws.close();
    }
}

export class StreamInOut<Request, Response> {
    public socket: WebSocketConnection;
    private buffer: Response[] = [];

    constructor(url: string, headers?: Record<string, string>) {
        this.socket = new WebSocketConnection(url, headers);
        this.socket.on("message", (event: any) => {
            this.buffer.push(JSON.parse(event.data, dateReviver));
            this.socket.resolveHasUpdateHandlers();
        });
    }

    close() {
        this.socket.close();
    }

    async send(msg: Request) {
        if (this.socket.ws.readyState === WebSocket.CONNECTING) {
            await new Promise((resolve) => {
                this.socket.ws.addEventListener("open", resolve, { once: true });
            });
        }

        return this.socket.ws.send(JSON.stringify(msg));
    }

    async next(): Promise<Response | undefined> {
        for await (const next of this) return next;
        return undefined;
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<Response, undefined, void> {
        while (true) {
            if (this.buffer.length > 0) {
                yield this.buffer.shift() as Response;
            } else {
                if (this.socket.ws.readyState === WebSocket.CLOSED) return;
                await this.socket.hasUpdate();
            }
        }
    }
}

export class StreamIn<Response> {
    public socket: WebSocketConnection;
    private buffer: Response[] = [];

    constructor(url: string, headers?: Record<string, string>) {
        this.socket = new WebSocketConnection(url, headers);
        this.socket.on("message", (event: any) => {
            this.buffer.push(JSON.parse(event.data, dateReviver));
            this.socket.resolveHasUpdateHandlers();
        });
    }

    close() {
        this.socket.close();
    }

    async next(): Promise<Response | undefined> {
        for await (const next of this) return next;
        return undefined;
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<Response, undefined, void> {
        while (true) {
            if (this.buffer.length > 0) {
                yield this.buffer.shift() as Response;
            } else {
                if (this.socket.ws.readyState === WebSocket.CLOSED) return;
                await this.socket.hasUpdate();
            }
        }
    }
}

export class StreamOut<Request, Response> {
    public socket: WebSocketConnection;
    private responseValue: Promise<Response>;

    constructor(url: string, headers?: Record<string, string>) {
        let responseResolver: (_: any) => void;
        this.responseValue = new Promise((resolve) => responseResolver = resolve);

        this.socket = new WebSocketConnection(url, headers);
        this.socket.on("message", (event: any) => {
            responseResolver(JSON.parse(event.data, dateReviver))
        });
    }

    async response(): Promise<Response> {
        return this.responseValue;
    }

    close() {
        this.socket.close();
    }

    async send(msg: Request) {
        if (this.socket.ws.readyState === WebSocket.CONNECTING) {
            await new Promise((resolve) => {
                this.socket.ws.addEventListener("open", resolve, { once: true });
            });
        }

        return this.socket.ws.send(JSON.stringify(msg));
    }
}

type CallParameters = Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>
    query?: Record<string, string | string[]>
}

export type Fetcher = typeof fetch;

const boundFetch = fetch.bind(this);

class BaseClient {
    readonly baseURL: string
    readonly fetcher: Fetcher
    readonly headers: Record<string, string>
    readonly requestInit: Omit<RequestInit, "headers"> & { headers?: Record<string, string> }

    constructor(baseURL: string, options: ClientOptions) {
        this.baseURL = baseURL
        this.headers = {}

        if (!BROWSER) {
            this.headers["User-Agent"] = "-Generated-TS-Client (Encore/1.48.8)";
        }

        this.requestInit = options.requestInit ?? {};

        if (options.fetcher !== undefined) {
            this.fetcher = options.fetcher
        } else {
            this.fetcher = boundFetch
        }
    }

    async getAuthData(): Promise<CallParameters | undefined> {
        return undefined;
    }

    async createStreamInOut<Request, Response>(path: string, params?: CallParameters): Promise<StreamInOut<Request, Response>> {
        let { query, headers } = params ?? {};

        const authData = await this.getAuthData();

        if (authData) {
            if (authData.query) {
                query = {...query, ...authData.query};
            }
            if (authData.headers) {
                headers = {...headers, ...authData.headers};
            }
        }

        const queryString = query ? '?' + encodeQuery(query) : ''
        return new StreamInOut(this.baseURL + path + queryString, headers);
    }

    async createStreamIn<Response>(path: string, params?: CallParameters): Promise<StreamIn<Response>> {
        let { query, headers } = params ?? {};

        const authData = await this.getAuthData();

        if (authData) {
            if (authData.query) {
                query = {...query, ...authData.query};
            }
            if (authData.headers) {
                headers = {...headers, ...authData.headers};
            }
        }

        const queryString = query ? '?' + encodeQuery(query) : ''
        return new StreamIn(this.baseURL + path + queryString, headers);
    }

    async createStreamOut<Request, Response>(path: string, params?: CallParameters): Promise<StreamOut<Request, Response>> {
        let { query, headers } = params ?? {};

        const authData = await this.getAuthData();

        if (authData) {
            if (authData.query) {
                query = {...query, ...authData.query};
            }
            if (authData.headers) {
                headers = {...headers, ...authData.headers};
            }
        }

        const queryString = query ? '?' + encodeQuery(query) : ''
        return new StreamOut(this.baseURL + path + queryString, headers);
    }

    public async callTypedAPI(path: string, params?: CallParameters): Promise<Response> {
        return this.callAPI(path, {
            ...params,
            headers: { "Content-Type": "application/json", ...params?.headers }
        });
    }

    public async callAPI(path: string, params?: CallParameters): Promise<Response> {
        let { query, headers, ...rest } = params ?? {}
        const init = {
            ...this.requestInit,
            ...rest,
        }

        init.headers = {...this.headers, ...init.headers, ...headers}

        const authData = await this.getAuthData();

        if (authData) {
            if (authData.query) {
                query = {...query, ...authData.query};
            }
            if (authData.headers) {
                init.headers = {...init.headers, ...authData.headers};
            }
        }

        const queryString = query ? '?' + encodeQuery(query) : ''
        const response = await this.fetcher(this.baseURL+path+queryString, init)

        if (!response.ok) {
            let body: APIErrorResponse = { code: ErrCode.Unknown, message: `request failed: status ${response.status}` }

            try {
                const text = await response.text()

                try {
                    const jsonBody = JSON.parse(text)
                    if (isAPIErrorResponse(jsonBody)) {
                        body = jsonBody
                    } else {
                        body.message += ": " + JSON.stringify(jsonBody)
                    }
                } catch {
                    body.message += ": " + text
                }
            } catch (e) {
                body.message += ": " + String(e)
            }

            throw new APIError(response.status, body)
        }

        return response
    }
}

interface APIErrorResponse {
    code: ErrCode
    message: string
    details?: any
}

function isAPIErrorResponse(err: any): err is APIErrorResponse {
    return (
        err !== undefined && err !== null &&
        isErrCode(err.code) &&
        typeof(err.message) === "string" &&
        (err.details === undefined || err.details === null || typeof(err.details) === "object")
    )
}

function isErrCode(code: any): code is ErrCode {
    return code !== undefined && Object.values(ErrCode).includes(code)
}

export class APIError extends Error {
    public readonly status: number
    public readonly code: ErrCode
    public readonly details?: any

    constructor(status: number, response: APIErrorResponse) {
        super(response.message);

        Object.defineProperty(this, 'name', {
            value:        'APIError',
            enumerable:   false,
            configurable: true,
        })

        if ((Object as any).setPrototypeOf == undefined) {
            (this as any).__proto__ = APIError.prototype
        } else {
            Object.setPrototypeOf(this, APIError.prototype);
        }

        if ((Error as any).captureStackTrace !== undefined) {
            (Error as any).captureStackTrace(this, this.constructor);
        }

        this.status = status
        this.code = response.code
        this.details = response.details
    }
}

export function isAPIError(err: any): err is APIError {
    return err instanceof APIError;
}

export enum ErrCode {
    OK = "ok",
    Canceled = "canceled",
    Unknown = "unknown",
    InvalidArgument = "invalid_argument",
    DeadlineExceeded = "deadline_exceeded",
    NotFound = "not_found",
    AlreadyExists = "already_exists",
    PermissionDenied = "permission_denied",
    ResourceExhausted = "resource_exhausted",
    FailedPrecondition = "failed_precondition",
    Aborted = "aborted",
    OutOfRange = "out_of_range",
    Unimplemented = "unimplemented",
    Internal = "internal",
    Unavailable = "unavailable",
    DataLoss = "data_loss",
    Unauthenticated = "unauthenticated",
}

export default new Client(import.meta.env.VITE_CLIENT_TARGET, { requestInit: { credentials: "include" } });