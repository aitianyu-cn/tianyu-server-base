/**@format */

import { ERROR_CODE } from "../../common/Errors";
import { Log, MapOfString, MapOfType } from "@aitianyu.cn/types";
import { IncomingMessage, ServerResponse } from "http";
import { IHttpResponse, IHttpResponseError } from "../../service/web/HttpService";
import { URLSearchParams } from "url";
import { parseCookie, parseAcceptLanguage, defaultLanguage } from "./HttpHelper";

/** Http Query Data Package */
export interface IHttpQuery {
    lang: string;
    query: MapOfString;
}

/**
 * Http Request Process Instance interface
 *
 * Dispatcher is a set of some routers
 */
export interface IHttpDispatchInstance {
    /**
     * create dispatchers to specified http handler
     *
     * @param handler the registed handler
     */
    createDispatches(handler: HttpHandler): void;
}

/** Common dispatcher basic class */
export class HttpDispatcher implements IHttpDispatchInstance {
    public constructor() {}

    public createDispatches(handler: HttpHandler): void {
        throw new Error("Method not implemented.");
    }
}

/** Http request-response callback */
export type HttpRouterCallback = (query: any, messageList: IHttpResponseError[]) => Promise<any>;

function processLanguage(req: IncomingMessage, query: IHttpQuery): void {
    try {
        query.lang = query.query?.["lang"];
        if (!!!query.lang) {
            const cookie = parseCookie(req.headers.cookie || "");
            query.lang = cookie["LANGUAGE"];
        }
        if (!!!query.lang) {
            query.lang = parseAcceptLanguage(req.headers["accept-language"] || "");
        }
        if (!!!query.lang) {
            query.lang = defaultLanguage;
        }
    } catch {}
}

/** Http Request Handler */
export class HttpHandler {
    private router: MapOfType<HttpRouterCallback>;
    private fallback: HttpRouterCallback | null;

    /** Http Error Callback */
    public errorHandler?: (error: Error) => void;

    public constructor() {
        this.router = {};
        this.fallback = null;

        this.onError = this.onError.bind(this);
    }

    /**
     * Register Http dispatcher instance to current handler
     *
     * @param dispatchers http dispatcher instances
     */
    public registerDispatcher(...dispatchers: IHttpDispatchInstance[]): void {
        for (const dispatcher of dispatchers) {
            dispatcher.createDispatches(this);
        }
    }

    /**
     * Create specified dispatchers and register them to current handler
     *
     * @param dispatchs specified dispatchers object
     */
    public addDispatcher(...dispatchs: typeof HttpDispatcher[]): void {
        for (const dispatch of dispatchs) {
            const instance = new dispatch();
            instance.createDispatches(this);
        }
    }

    /**
     * Add http router to current handler
     *
     * @param url router path
     * @param router router response callback
     */
    public setRouter(url: string, router: HttpRouterCallback): void {
        this.router[url] = router;
    }

    /**
     * Set the callback for the router which could not be found
     *
     * @param fallback the failed callback
     */
    public setFallback(fallback: HttpRouterCallback): void {
        this.fallback = fallback;
    }

    /**
     * Http Get request responser
     *
     * @param req request message
     * @param res http response
     */
    public getter(req: IncomingMessage, res: ServerResponse): void {
        const originUrl = req.url || "";
        const urlParam = originUrl.split("?");

        const query: IHttpQuery = { lang: "", query: {} };
        const url = urlParam[0];
        if (urlParam.length > 1) {
            try {
                const querySearcher = new URLSearchParams(urlParam[1]);
                for (const [key, value] of querySearcher) query.query[key] = value;
            } catch {
                //
            }
        }
        processLanguage(req, query);

        this.dispatcher(url, query).then(
            (response: IHttpResponse) => {
                res.end(JSON.stringify(response));
            },
            (error: any) => {
                const errorResult: IHttpResponse = {
                    result: "failed",
                    message: [{ code: ERROR_CODE.GENERAL_EXCEPTIONS, text: `${error}` }],
                    response: null,
                    lang: query.lang,
                };
                res.end(JSON.stringify(errorResult));
            },
        );
    }

    /**
     * Http Post request responser
     *
     * @param req request message
     * @param res http response
     */
    public poster(req: IncomingMessage, res: ServerResponse): void {
        let data: string = "";

        req.on("data", (chunk: any) => {
            data += chunk;
        });

        req.on("end", () => {
            let query: MapOfString = {};
            try {
                query = JSON.parse(decodeURI(data));
            } catch {}

            const request = { lang: "", query: query };
            processLanguage(req, request);

            this.dispatcher(req.url || "", request).then(
                (response: IHttpResponse) => {
                    res.end(JSON.stringify(response));
                },
                (error: any) => {
                    const errorResult: IHttpResponse = {
                        result: "failed",
                        message: [{ code: ERROR_CODE.GENERAL_EXCEPTIONS, text: `${error}` }],
                        response: null,
                        lang: request.lang,
                    };
                    res.end(JSON.stringify(errorResult));
                },
            );
        });
    }

    /**
     * Http Router dispatcher
     *
     * @param url the http url
     * @param query the http query data
     * @returns return the dispatch response
     */
    public async dispatcher(url: string, query: IHttpQuery): Promise<IHttpResponse> {
        return new Promise(async (resolve) => {
            const result: IHttpResponse = { result: "success", message: [], response: null, lang: query.lang };

            try {
                if (typeof url !== "string" || !!!query) {
                    result.message.push({ code: ERROR_CODE.INVALID_OPERATION, text: "Invalid operation" });
                    result.result = "failed";
                } else {
                    if (url.startsWith("/")) url = url.substring(1, url.length);

                    const router = this.router[url] || this.fallback;
                    if (router) {
                        result.response = await router(query, result.message);
                    } else {
                        result.message.push({
                            code: ERROR_CODE.NOT_FIND_ACCESS_404,
                            text: "Error 404: the required path could not find or access.",
                        });
                        result.result = "failed";
                    }
                }
            } catch (e: any) {
                result.message.push({ code: ERROR_CODE.SYSTEM_EXCEPTIONS, text: `error: ${e?.message || "unknown"}` });
                result.result = "failed";
            } finally {
                resolve(result);
            }
        });
    }

    /**
     * Http Error Callback(Used for Server)
     *
     * @param error error
     */
    public onError(error: Error): void {
        if (this.errorHandler) {
            this.errorHandler(error);
        } else {
            Log.error(error.message, true);
        }
    }
}
