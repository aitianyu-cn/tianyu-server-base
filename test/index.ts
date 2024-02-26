/**@format */

import { HttpHandler, HttpDispatcher, IHttpQuery, IHttpResponseError, createServerAuto } from "../packages/index";

class TestClass extends HttpDispatcher {
    public constructor() {
        super();
    }

    createDispatches(handler: HttpHandler): void {
        handler.setRouter("test", this._test.bind(this));
    }

    private async _test(query: IHttpQuery, messageList: IHttpResponseError[]): Promise<string> {
        return "test router";
    }
}

class TestClass2 extends HttpDispatcher {
    public constructor() {
        super();
    }

    createDispatches(handler: HttpHandler): void {
        handler.setRouter("test2", this._test.bind(this));
    }

    private async _test(query: IHttpQuery, messageList: IHttpResponseError[]): Promise<string> {
        return "test2 router";
    }
}

const server = createServerAuto(TestClass, TestClass2);
server.listen(3000, "0.0.0.0");
