/**@format */

import * as fs from "fs";
import * as path from "path";

const FILE_READ_CODE = {
    SUCCESS: 0,
    NOT_ACCESSIBLE: 10,
    READ_ERROR: 15,
};

/** File Read Result Package */
export interface IFileReadResult {
    /** The file data as string type */
    data: string;
    /** a flag indicates the file data is valid */
    state: boolean;
    /** exception error code */
    code: number;
}

/** File Reader Service */
export class FileService {
    private baseFolder: string;

    public constructor(baseFolder: string) {
        this.baseFolder = baseFolder;
    }

    /**
     * Async read a file based on the root path
     *
     * @param file the file name
     * @param pack the sub package path
     * @returns return the read result
     */
    public async read(file: string, pack: string): Promise<IFileReadResult> {
        return new Promise<IFileReadResult>((resolve) => {
            const filePath = path.resolve(this.baseFolder, pack);
            if (!fs.existsSync(filePath)) {
                resolve({
                    state: false,
                    code: FILE_READ_CODE.NOT_ACCESSIBLE,
                    data: `file is not accessible or not exists - ${pack}/${file}`,
                });
                return;
            }

            const fileUrl = path.join(filePath, file);
            fs.readFile(fileUrl, "utf-8", (err: NodeJS.ErrnoException | null, data: string) => {
                if (err) {
                    resolve({ state: false, code: FILE_READ_CODE.READ_ERROR, data: err.message });
                } else {
                    resolve({ state: true, code: FILE_READ_CODE.SUCCESS, data: data });
                }
            });
        });
    }
}
