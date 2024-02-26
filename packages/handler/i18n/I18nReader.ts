/**@format */

import { MapOfString, MapOfType } from "@aitianyu.cn/types";
import * as path from "path";

/** Structure Reader for International */
export class I18nReader {
    private readers: MapOfType<MapOfString>;
    private basePath: string;

    /**
     * Create an instance base on specified source path
     *
     * @param basicPath i18n files path
     *
     * @description the path is a root path of international files. In this path, you can add other path or add files directly.
     */
    public constructor(basicPath: string) {
        this.readers = {};
        this.basePath = basicPath || __dirname;
    }

    /**
     * Get the i18n map from specified sub package and language
     *
     * @param language the language should be gotten
     * @param pack the sub package where the language file in.
     * @param forceGet force get i18n from file event the data is loaded.
     * @returns return the language source map
     */
    public get(language: string, pack: string, forceGet?: boolean): MapOfString {
        const file: string = path.resolve(this.basePath, pack, `${language}.json`);

        if (!forceGet && this.readers[file]) {
            return this.readers[file];
        }

        const reader: MapOfString = require(file);
        this.readers[file] = reader;

        return reader;
    }
}
