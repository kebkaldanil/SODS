"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlite3_dbAdapter = void 0;
const util_1 = require("util");
class sqlite3_dbAdapter {
    constructor(db, table, pk) {
        this.db = db;
        this.dbAll = util_1.promisify(db.all).bind(db);
        this.dbGet = util_1.promisify(db.get).bind(db);
        this.dbRun = util_1.promisify(db.run).bind(db);
        this.pk = pk;
        this.table = table;
    }
    async getByKey(key, pk) {
        if (!pk)
            pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
        return this.dbGet(`select * from ${this.table} where ${pk} = ${key}`);
    }
    async getWhere(condition, limit, skip) {
        return this.dbAll(`select * from ${this.table} where ${condition}`);
    }
    async insert(obj) {
        if (!Array.isArray(obj))
            obj = [obj];
        const keys = Object.keys(obj[0]);
        await this.dbRun(`insert into ${this.table} (${keys.join()}) values ${obj.map(v => `(${keys.map(k => JSON.stringify(v[k], (k, v) => typeof v === "object" ? null : v)).join()})`).join()}`);
    }
    async updateWhere(obj, where, editedProps) {
        await this.dbRun(`update ${this.table} where ${where} set ${editedProps.map(k => `${k} = ${JSON.stringify(obj[k])}`).join()}`);
    }
    async update(obj, key, editedProps, pk) {
        if (!pk)
            pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
        await this.updateWhere(obj, `${this.pk} = ${key}`, editedProps);
    }
    async deleteWhere(where) {
        await this.dbRun(`delete ${this.table} where ${where}`);
    }
    async delete(key, pk) {
        if (!pk)
            pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
        await this.deleteWhere(`${this.pk} = ${key}`);
    }
}
exports.sqlite3_dbAdapter = sqlite3_dbAdapter;
//# sourceMappingURL=sqlite.js.map