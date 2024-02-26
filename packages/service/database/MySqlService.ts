/**@format */

import { ArgumentNullOrEmptyException, CallbackActionT, MapOfType } from "@aitianyu.cn/types";
import * as mysql from "mysql";
import { ConnectionConfig } from "mysql";

/**
 * create a MySql service entity with specified database
 *
 * @param database the database name
 * @param baseConfig the database config
 * @returns return the connection
 */
export function createService(database: string, baseConfig: ConnectionConfig): mysql.Connection {
    if (!!!database || !!!baseConfig) {
        throw new ArgumentNullOrEmptyException("createService(database: string, baseConfig: ConnectionConfig)");
    }

    const config = { ...baseConfig, database: database };
    const connection = mysql.createConnection(config);

    return connection;
}

/**
 * Create a database connection pool with specified database
 *
 * @param database the database name
 * @param baseConfig the database config
 * @returns return the connection
 */
export function createPool(database: string, baseConfig: ConnectionConfig): mysql.Pool {
    if (!!!database || !!!baseConfig) {
        throw new ArgumentNullOrEmptyException("createPool(database: string, baseConfig: ConnectionConfig)");
    }

    const config = { ...baseConfig, database: database };
    const pool = mysql.createPool(config);

    return pool;
}

interface IMySqlPoolCache {
    timestamp: number;
    valid: boolean;
    data: any;
}

const CACHE_LIFE_TIME_DEFAULT: number = 300000;

export interface IDatabasePoolsOptions {
    disableCache?: boolean;
    lifeTime?: number;
}

/** MySql Database Connection Pool */
export class DatabasePools {
    private databaseConfig: ConnectionConfig;

    private pool: MapOfType<mysql.Pool>;
    private sqlCache: MapOfType<MapOfType<IMySqlPoolCache>>;
    private disableCache: boolean;
    private cacheLifeTime: number;

    public constructor(databaseConfig: ConnectionConfig, options?: IDatabasePoolsOptions) {
        if (!!!databaseConfig) {
            throw new ArgumentNullOrEmptyException("DatabasePools(databaseConfig: ConnectionConfig)");
        }

        this.pool = {};
        this.sqlCache = {};
        this.disableCache = !!options?.disableCache;
        this.cacheLifeTime = options?.lifeTime || CACHE_LIFE_TIME_DEFAULT;

        this.databaseConfig = databaseConfig;
    }

    /**
     * Get the specified database connection pool
     *
     * @param database the database name
     * @returns return the database pool
     */
    public get(database: string): mysql.Pool {
        if (this.pool[database]) {
            return this.pool[database];
        }

        const newPool = createPool(database, this.databaseConfig);
        this.pool[database] = newPool;

        return newPool;
    }

    /**
     * Get the specified database pool does contain in the pool
     *
     * @param database the database name
     * @returns return a boolean value
     */
    public contains(database: string): boolean {
        return !!this.pool[database];
    }

    /**
     * Delete a database connection pool from current pool
     *
     * @param database the database name
     */
    public delete(database: string): void {
        if (!this.contains(database)) {
            return;
        }

        const db = this.pool[database];
        db.end();

        delete this.pool[database];
    }

    /** destroy current pool and close all the connections in this pool */
    public destroy(): void {
        for (const db of Object.keys(this.pool)) {
            const pool = this.pool[db];
            pool.end();
        }
    }

    /**
     * execute a sql statement in the specified database
     *
     * @param database the database name
     * @param sql sql statement
     * @param callback execute callback to return the sql results
     * @param failed callback when execute sql failed
     * @param forceSql force to execute sql and to update the cache.
     */
    public execute(
        database: string,
        sql: string,
        callback: CallbackActionT<any>,
        failed: CallbackActionT<string>,
        forceSql?: boolean,
    ) {
        if (!this.disableCache && !forceSql) {
            if (!!!this.sqlCache[database]) {
                this.sqlCache[database] = {};
            }

            if (!!this.sqlCache[database][sql]?.valid && !!this.sqlCache[database][sql].data) {
                const stamp = this.sqlCache[database][sql].timestamp;
                const overtime = Date.now() - stamp;
                if (overtime > this.cacheLifeTime) {
                    delete this.sqlCache[database][sql];
                } else {
                    callback(this.sqlCache[database][sql].data);
                    return;
                }
            }
        }

        const pool = this.get(database);
        pool.getConnection((err: mysql.MysqlError | null, connection: mysql.PoolConnection) => {
            if (err) {
                failed?.(err.message);
            } else {
                connection.query(sql, (error: mysql.MysqlError | null, results?: any) => {
                    connection.release();

                    if (error) {
                        failed?.(error.message);
                    } else {
                        if (!!results) {
                            this.sqlCache[database][sql] = {
                                valid: true,
                                data: results,
                                timestamp: Date.now(),
                            };
                        }
                        callback(results);
                    }
                });
            }
        });
    }

    /**
     * get a promise to async execute a sql statement in the specified database
     *
     * @param database the database name
     * @param sql sql statement
     * @param forceSql force to execute sql and to update the cache.
     * @returns sql exection promise
     */
    public async executeAsync(database: string, sql: string, forceSql?: boolean): Promise<any> {
        if (!this.disableCache && !forceSql) {
            if (!!!this.sqlCache[database]) {
                this.sqlCache[database] = {};
            }

            if (!!this.sqlCache[database][sql]?.valid && !!this.sqlCache[database][sql].data) {
                const stamp = this.sqlCache[database][sql].timestamp;
                const overtime = Date.now() - stamp;
                if (overtime > this.cacheLifeTime) {
                    delete this.sqlCache[database][sql];
                } else {
                    return this.sqlCache[database][sql].data;
                }
            }
        }

        return new Promise<any>((resolve, reject) => {
            try {
                const pool = this.get(database);
                pool.getConnection((err: mysql.MysqlError | null, connection: mysql.PoolConnection) => {
                    if (err) {
                        reject(err.message);
                    } else {
                        connection.query(sql, (error: mysql.MysqlError | null, results?: any) => {
                            connection.release();

                            if (error) {
                                reject(error.message);
                            } else {
                                if (!!results && !this.disableCache) {
                                    this.sqlCache[database][sql] = {
                                        valid: true,
                                        data: results,
                                        timestamp: Date.now(),
                                    };
                                }
                                resolve(results);
                            }
                        });
                    }
                });
            } catch (e) {
                reject((e as any)?.message || "sytem running error");
            }
        });
    }
}
