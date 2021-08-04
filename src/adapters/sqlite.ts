import { promisify } from "util";
import { dbAdapter } from "./base";

interface Database {
    all(sql: string, cb: (err: any, result: any[]) => void): void;
    get(sql: string, cb: (err: any, result: any) => void): void;
    run(sql: string, cb: (err: any) => void): void;
}

export class sqlite3_dbAdapter implements dbAdapter {
	db: Database;
	private dbAll: (sql: string) => Promise<any[]>;
	private dbGet: (sql: string) => Promise<any>;
	private dbRun: (sql: string) => Promise<void>;
	protected pk?: string;
	table: string;

	constructor(db: Database, table: string, pk?: string) {
		this.db = db;
		this.dbAll = promisify(db.all).bind(db);
		this.dbGet = promisify(db.get).bind(db);
		this.dbRun = promisify(db.run).bind(db);
		this.pk = pk;
		this.table = table;
	}
	async getByKey(key: string | number, pk?: string): Promise<any> {
		if (!pk)
			pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
		return this.dbGet(`select * from ${this.table} where ${pk} = ${key}`);
	}
	async getWhere(condition: string, limit?: number, skip?: number): Promise<any[]> {
		return this.dbAll(`select * from ${this.table} where ${condition}`);
	}
	async insert(obj: any) {
		if (!Array.isArray(obj))
			obj = [obj];
		const keys: string[] = Object.keys(obj[0]) as any;
		await this.dbRun(`insert into ${this.table} (${keys.join()}) values ${obj.map(v => `(${keys.map(k => JSON.stringify(v[k], (k, v) => typeof v === "object" ? null : v)).join()})`).join()}`);
	}
	async updateWhere(obj: any, where: string, editedProps: string[]) {
		await this.dbRun(`update ${this.table} where ${where} set ${editedProps.map(k => `${k} = ${JSON.stringify(obj[k])}`).join()}`);
	}
	async update(obj: any, key: string | number, editedProps: string[], pk?: string) {
		if (!pk)
			pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
		await this.updateWhere(obj, `${this.pk} = ${key}`, editedProps);
	}
	async deleteWhere(where: string): Promise<void> {
		await this.dbRun(`delete ${this.table} where ${where}`);
	}
	async delete(key: string | number, pk?: string): Promise<void> {
		if (!pk)
			pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
		await this.deleteWhere(`${this.pk} = ${key}`);
	}
}