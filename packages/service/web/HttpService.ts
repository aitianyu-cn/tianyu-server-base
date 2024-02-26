/**@format */

import http, { IncomingMessage, ServerResponse, Server } from "http";
import { ERROR_CODE } from "../../common/Errors";
import { CallbackActionT } from "@aitianyu.cn/types";
import { HttpDispatcher, HttpHandler } from "../../handler/web/HttpHandler";

/** Http Query Response Callback */
export type HttpCallback = (req: IncomingMessage, res: ServerResponse) => void;

/** Http Response Error Item */
export interface IHttpResponseError {
    /** Error code of the exception */
    code: number;
    /** Error message of the exception */
    text: string;
}

/** Http response */
export interface IHttpResponse {
    /** indicates the request process status */
    result: "failed" | "success";
    /** contains the response errors */
    message: IHttpResponseError[];
    /** the response body */
    response: any;
    /** the language which is used during the processing */
    lang?: string;
}

/**
 * create a http server with specified HTTP Get/Post request responser and error responser
 *
 * @param get Http Get Request Processor
 * @param post Http Post Request Processor
 * @param error Http Error Request Processor
 * @returns return the created server
 */
export function createServer(get: HttpCallback, post: HttpCallback, error: CallbackActionT<Error>): Server {
    const server: Server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        switch (req.method) {
            case "GET":
                get(req, res);
                break;
            case "POST":
                post(req, res);
                break;
            default:
                const response: IHttpResponse = {
                    result: "failed",
                    message: [{ code: ERROR_CODE.NOT_SUPPORT_OPERATION, text: `Not support operation: ${req.method}` }],
                    response: null,
                };
                res.end(JSON.stringify(response));
                break;
        }
    });

    server.on("error", error);

    return server;
}

/**
 * create a http server with specified HTTP handler
 *
 * @param handler Http handler instance
 */
export function createrServerByHandle(handler: HttpHandler): Server {
    const server: Server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        switch (req.method) {
            case "GET":
                handler.getter(req, res);
                break;
            case "POST":
                handler.poster(req, res);
                break;
            default:
                const response: IHttpResponse = {
                    result: "failed",
                    message: [{ code: ERROR_CODE.NOT_SUPPORT_OPERATION, text: `Not support operation: ${req.method}` }],
                    response: null,
                };
                res.end(JSON.stringify(response));
                break;
        }
    });

    server.on("error", handler.onError);

    return server;
}

/**
 * create a http server with specified HTTP response dispatchers
 *
 * @param dispatchers Http response dispatchers
 */
export function createServerAuto(...dispatchers: typeof HttpDispatcher[]) {
    const httpHandler = new HttpHandler();
    httpHandler.addDispatcher(...dispatchers);
    return createrServerByHandle(httpHandler);
}
