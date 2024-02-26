/**@format */

import { MapOfString } from "@aitianyu.cn/types";

/**
 * Http Cookie parse tool
 *
 * @param cookie the cookie string
 * @returns return a set of cookies
 */
export function parseCookie(cookie: string): MapOfString {
    const parsedCookie: MapOfString = {};

    const cookieItems = cookie.split(";");
    for (const item of cookieItems) {
        const processedItem = item.trim();
        const pair = processedItem.split("=");
        if (pair.length > 1) {
            const key = pair[0];
            pair.shift();
            parsedCookie[key] = pair.join("=");
        }
    }

    return parsedCookie;
}

/**
 * Http Language processor
 *
 * @param acceptLang the language string from the cookie or request
 * @returns return the formatted language name
 */
export function parseAcceptLanguage(acceptLang: string): string {
    const langItems = acceptLang.split(";");
    const firstItem = langItems[0];
    if (!!firstItem) {
        const languagePair = firstItem.split(",");
        if (languagePair.length !== 0) {
            const language = languagePair[0];
            const formattedLanguage = language.replace("-", "_").trim();

            return formattedLanguage;
        }
    }

    return "";
}

/** Tianyu Server base default language */
export const defaultLanguage: string = "zh_CN";
