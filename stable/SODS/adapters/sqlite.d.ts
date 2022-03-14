import { dbAdapter } from "./base";
interface Database {
    all(sql: string, cb: (err: any, result: any[]) => void): void;
    get(sql: string, cb: (err: any, result: any) => void): void;
    run(sql: string, cb: (err: any) => void): void;
}
export declare class sqlite3_dbAdapter implements dbAdapter {
    db: Database;
    private dbAll;
    private dbGet;
    private dbRun;
    protected pk?: string;
    table: string;
    constructor(db: Database, table: string, pk?: string);
    getByKey(key: string | number, pk?: string): Promise<any>;
    getWhere(condition: string, limit?: number, skip?: number): Promise<any[]>;
    insert(obj: any): Promise<void>;
    updateWhere(obj: any, where: string, editedProps: string[]): Promise<void>;
    update(obj: any, key: string | number, editedProps: string[], pk?: string): Promise<void>;
    deleteWhere(where: string): Promise<void>;
    delete(key: string | number, pk?: string): Promise<void>;
}
export {};
