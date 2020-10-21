import { createReadStream, PathLike, ReadStream, Stats, promises as fsPromises } from "fs";
import { createServer as createHttpServer, ServerResponse, IncomingMessage, OutgoingHttpHeaders, RequestListener } from "http";
import { networkInterfaces } from "os";
import * as mime from "mime";
import { ServerOptions, createServer as createHttpsServer } from "https";
import { Database } from "sqlite3";
import { promisify } from "util";

//const parrent = Symbol("parrent");

type processFunction = <T extends MinimumTableObject>(o: RequestObject<T>, path: string) => any | Promise<any>;

export interface dbAdapter<T extends {}> {
	table: string;
	getByKey(key: number | string, pk?: string): Promise<T>;
	getWhere(condition: string, limit?: number, skip?: number): Promise<T[]>;
	insert(obj: T | T[]): Promise<void>;
	updateWhere(obj: T, where: string, editedProps: (Extract<keyof T, string>)[]): Promise<void>;
	update(obj: T, key: string | number, editedProps: (Extract<keyof T, string>)[], pk?: string): Promise<void>;
	deleteWhere(where: string): Promise<void>;
	delete(key: string | number, pk?: string): Promise<void>;

	run?(sql: string): Promise<any>;
	db?: any;
}

export class sqlite3_dbAdapter<T extends {}> implements dbAdapter<T> {
	db: Database;
	private dbAll: (sql: string) => Promise<T[]>;
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
	async getByKey(key: string | number, pk?: string): Promise<T> {
		if (!pk)
			pk = (this.pk ? this.pk : this.pk = await this.dbGet(`pragma table_info(${this.table}) where pk != 0`));
		return this.dbGet(`select * from ${this.table} where ${pk} = ${key}`);
	}
	async getWhere(condition: string, limit?: number, skip?: number): Promise<T[]> {
		return this.dbAll(`select * from ${this.table} where ${condition}`);
	}
	async insert(obj: T | T[]) {
		if (!Array.isArray(obj))
			obj = [obj];
		const keys: (keyof T)[] = Object.keys(obj[0]) as any;
		await this.dbRun(`insert into ${this.table} (${keys.join()}) values ${obj.map(v => `(${keys.map(k => JSON.stringify(v[k], (k, v) => typeof v === "object" ? null : v)).join()})`).join()}`);
	}
	async updateWhere(obj: T, where: string, editedProps: (Extract<keyof T, string>)[]) {
		await this.dbRun(`update ${this.table} where ${where} set ${editedProps.map(k => `${k} = ${JSON.stringify(obj[k])}`).join()}`);
	}
	async update(obj: T, key: string | number, editedProps: (Extract<keyof T, string>)[], pk?: string) {
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

export class RequestMessage extends IncomingMessage {
	cookies: ReceivedCookie[];
	stringParams: NodeJS.ReadOnlyDict<string | boolean>;
	body: Promise<string>;
}

export class ResponseMessage extends ServerResponse {
	cookies: Cookie[];
}

export class MinimumTableObject {
	token: string;
	expires: number;
};

export class RequestObject<T = MinimumTableObject> {
	request: RequestMessage;
	response: ResponseMessage;
	fpath: string;
	queue: ((o: RequestObject<T>, path: string) => void)[];
	doLog: boolean;
	dbAdapter: dbAdapter<T>;
};

export class ReceivedCookie {
	name: string;
	value: string;
	toString() {
		return `${this.name}=${this.value}`;
	}
}

export class Cookie extends ReceivedCookie {
	expires?: Date;
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	domain?: string;
	path?: string;
	sameSite?: "Strict" | "Lax" | "None";
	toString() {
		let res = super.toString();
		if (this.expires)
			res += "; Expires=" + this.expires.toUTCString();
		if (this.maxAge)
			res += "; Max-Age=" + this.maxAge;
		if (this.domain)
			res += "; Domain=" + this.domain;
		if (this.path)
			res += "; Path=" + this.path;
		if (this.secure)
			res += "; Secure";
		if (this.httpOnly)
			res += "; HttpOnly";
		if (this.sameSite)
			res += "; SameSite=" + this.sameSite;
		return res;
	}
}

type PortsArr = (number[] | number | "*")[];

type ServOptions = {
	silense?: boolean,
	mode: "http" | "https",
	serverOptions?: ServerOptions
};

export const onError = Symbol("Error route");
export const current = Symbol("Current path");
export const fromThere = Symbol("Subpaths only");

export type CurrentRouteObj = processFunction | {
	[method: string]: processFunction,
	HEAD?: processFunction,
	GET?: processFunction,
	POST?: processFunction,
	PUT?: processFunction,
	DELETE?: processFunction,
	OPTIONS?: processFunction
};

export type RouteObj = {
	[current]?: CurrentRouteObj,
	[onError]?: (e: Error | { code: number }, o: RequestObject) => any,
	[fromThere]?: <T extends MinimumTableObject>(o: RequestObject<T>, path: string, declaredPath: string) => any | Promise<any>
} & NodeJS.Dict<RouteObj> | string | processFunction;

export const tools = {
	time: (strings: TemplateStringsArray, ...params: any[]) => {
		var res = "";
		let i = 0;
		while (i < params.length) {
			const tmp = params[i];
			res += strings[i] + (typeof tmp === "number" ? tools._lengthOpti(2, tmp) : tmp);
			i++;
		}
		return res + strings[i];
	},
	_lengthOpti: (length: number, be: number) => {
		const bs = "" + Math.trunc(be);
		return "000000000000".slice(12 + bs.length - length) + bs;
	},
	get formatedTime() {
		const p = new Date();
		return tools.time`${p.getHours()}:${p.getMinutes()}:${p.getSeconds()}.${tools._lengthOpti(3, p.getMilliseconds())}`;
	},
	_rand: (start: number, lngth: number) => Math.floor(Math.random() * lngth + start),
	random: (start: number, end: number) => tools._rand(start, end - start),
	split: (str: string, separator: string = "", count: number = -1) => {
		if (count < 0)
			return str.split(separator);
		if (count === 0)
			return [];
		str = "" + str;
		if (count === 1)
			return [str];
		const res: string[] = [];
		while (count !== 1) {
			count--;
			separator = "" + separator;
			const si = str.indexOf(separator);
			if (si < 0)
				break;
			res.push(str.slice(0, si));
			str = str.slice(si + 1);
		}
		res.push(str);
		return res;
	},
	deepCopy: <T extends NodeJS.Dict<any>>(obj: T): T => {
		const res: any = {};
		for (const nm in obj) {
			const v = obj[nm];
			if (typeof v === "object")
				res[nm] = tools.deepCopy(v);
			else
				res[nm] = v;
		}
		return res;
	}
}

function map2obj(arr: string[], l = (l: string) => tools.split(l, '=', 2)) {
	const res: any = {};
	arr.forEach(s => {
		const a = l(s);
		if (a && a.length > 0)
			res[a[0]] = (a.length < 2 ? true : a[1]);
	});
	return res;
}

const pathNormalizeRegExp = /^\/+|\/+$|\/+(?=\/)/g;

let inpLine = "";
export const args = map2obj(process.argv.slice(2));

export function initConcoleProcessor(lineProc: (x: string) => any = (0, eval), { functionRun = true, logNulls = false } = {}) {
	process.stdin.setEncoding('utf8');
	process.stdin.resume();
	process.stdin.on("data", (data: string) => {
		data.split('\n').forEach((value, index, thiz) => {
			if (index && index === thiz.length - 1)
				inpLine += value;
			else (async () => {
				let r = lineProc(inpLine + value);
				r = functionRun && typeof r === "function" ? r() : r;
				if (logNulls || (r !== null && r !== undefined))
					console.log(r);
			})().catch(console.error).then(() => inpLine = "");
		});
	});
}

async function processRequest<T extends MinimumTableObject>(o: RequestObject<T>, path: string, sect: RouteObj): Promise<any> {
	try {
		if (sect) {
			let proc: processFunction;
			if (typeof sect == "function")
				proc = sect;
			else {
				let si = path.indexOf('/');
				const routepart = si >= 0 ? path.slice(0, si) : path;
				if (sect[routepart]) {
					const dab = sect[fromThere] && typeof sect[fromThere] === "function";
					if (dab)
						o.queue.push((o, p) => sect[fromThere](o, p, path)) - 1;
					const res = await processRequest(o, path.substring(routepart.length + 1), sect[routepart]);
					if (res)
						return res;
					if (dab)
						o.queue.pop();
				}
				if (sect[o.request.method])
					proc = sect[o.request.method];
				else if (sect[current]) {
					sect = sect[current];
					if (sect[current] && typeof sect[fromThere] === "function") {
						o.queue.push((o, p) => sect[fromThere](o, p, path));
					}
					if (typeof sect === "function")
						proc = sect;
					else if (sect[o.request.method])
						proc = sect[o.request.method];
				}
			}
			if (proc) {
				o.queue.forEach(v => v(o, path));
				if (typeof proc === "function") {
					let res = await proc(o, path);
					if (res || res === false) {
						if (typeof res === "object") {
							res = JSON.stringify(res);
						}
						o.response.end(res);
						return res;
					}
					else
						return true;
				}
				else {
					if (!o.response.hasHeader("Content-Type"))
						o.response.setHeader("Content-Type", "text/html; charset=UTF-8");
					return o.response.end(proc);
				}
			} else
				notFound(o);
		}
		return false;
	}
	catch (e) {
		if (sect[onError])
			sect[onError](e, o, o.fpath.slice(0, path.length - 1));
		else
			throw e;
	}
}

export function createProcessor<T extends MinimumTableObject = MinimumTableObject>(routeObj: RouteObj, dbAdapter: dbAdapter<T>) {
	return Object.assign((request: RequestMessage, response: ResponseMessage) => {
		const _writeHead = response.writeHead;
		response.cookies = [];
		response.writeHead = function (...args: any[]) {
			if (this.cookies.length !== 0)
				this.setHeader("Set-Cookie", this.cookies.map((v: Cookie) => v.toString()));
			return _writeHead.call(this, ...args);
		};
		let path = decodeURI(request.url);
		const stringParams: NodeJS.Dict<string | boolean> = {};
		const spsi = path.indexOf('?');
		if (spsi > 0) {
			path.substr(spsi + 1).split('&').forEach(function (param) {
				const splt = param.indexOf('=');
				if (splt > 0)
					stringParams[param.substr(0, splt)] = param.substr(splt + 1);
				else
					stringParams[param] = true;
			});
			path = path.substr(0, spsi);
		}
		request.stringParams = stringParams;
		request.cookies = (request.headers.cookie
			? request.headers.cookie.split(';').map(c => {
				const ca = tools.split(c, "=", 2);
				return {
					name: ca[0].trim(),
					value: ca[1].trim()
				};
			})
			: []);
		path = path.replace(pathNormalizeRegExp, "");
		request.body = new Promise((resolve, reject) => {
			let body = "";
			request.on("end", () => resolve(body));
			request.on("error", reject);
			request.on("data", data => body += data);
		});
		const startTime = tools.formatedTime;
		const o: RequestObject<T> = {
			request: request,
			response: response,
			fpath: path,
			queue: [],
			doLog: true,
			dbAdapter: dbAdapter
		};
		processRequest(o, path, routeObj).catch(e => {
			if (typeof e.code === "number") {
				if (o.doLog && !e.usual) {
					console.log(`${e.code} ${e.text}`);
				}
				response.writeHead(e.code, e.text);
				return response.end();
			}
			if (o.doLog)
				console.error(e);
			try {
				response.writeHead(500, "Internal Server Error");
			}
			finally {
				try {
					response.end();
				}
				catch (e) { }
			}
		});
		if (o.doLog) {
			console.log(`${startTime} -> request ${request.method} "${path}" ${JSON.stringify(stringParams)}`);
			response.on("close", () => console.log(`${startTime} - ${tools.formatedTime} -> closed ${request.method} "${path}" ${JSON.stringify(stringParams)}`));
			response.on("finish", () => console.log(`${startTime} - ${tools.formatedTime} -> finished ${request.method} "${path}" ${JSON.stringify(stringParams)}`));
		}
	}, {
		changeRouteObj: o => routeObj = (typeof o === "string" ? loadRouteObj(o) : o)
	})
};

export function crt(processor: RequestListener, port = args.port, options?: ServOptions) {
	const silense = options && options.silense;
	const mode = options && options.mode || (typeof options === "string" && options) || "http";
	const serverOptions = options && options.serverOptions || {};
	return new Promise((resolve, reject) => {
		if (!silense)
			console.log(`Starting listener (${mode}) on port ${port}`);
		let server;
		switch (mode) {
			case "http":
				server = createHttpServer(serverOptions, processor);
				break;
			case "https":
				server = createHttpsServer(serverOptions, processor);
				break;
			default:
				reject(`Unsupported mode "${mode}"`);
		}
		server.listen(port).on("listening", () => {
			if (!silense)
				console.log("success");
			resolve(server);
		}).on("error", e => {
			if (!silense)
				console.log("fail");
			reject(e);
		});
	});
}

function processRouteObj(v: RouteObj | string): RouteObj {
	return typeof v === "string"
		? eval(v.startsWith('{') ? `(${v})` : v)
		: tools.deepCopy(v);//convertStrings2FuncInObj(Object.assign({}, v));
}

export async function loadRouteObj(file: PathLike): Promise<RouteObj> {
	return processRouteObj(await fsPromises.readFile(file, "utf8"));
}

function convertStrings2FuncInObj(obj) {
	for (let o in obj)
		if (typeof obj[o] === "string")
			return obj[o] = (obj[o].startsWith("##") ? obj[o].slice(2) : obj[o] = eval(obj[o]));
		else if (typeof obj[o] === "object") {
			!(obj[o] instanceof Function) && convertStrings2FuncInObj(obj[o]);
		}
}

export function _pipeFile(istream: ReadStream, ostream: NodeJS.WritableStream): Promise<NodeJS.WritableStream> {
	return new Promise((resolve, reject) => {
		try {
			istream.pipe(ostream, { end: false });
			//istream.on("data", data => ostream.write(data));
			istream.on("error", reject);
			istream.on("end", () => resolve(ostream));
		}
		catch (e) {
			reject(e);
		}
	});
}

export async function file2response(response: ServerResponse, path: string, ranges?: string | { start?: number, end?: number }[], type?: string, head?: OutgoingHttpHeaders, filestat?: Stats) {
	if (!filestat)
		filestat = await fsPromises.stat(path);
	if (!type)
		type = mime.getType(path);
	if (typeof ranges == "string") {
		ranges = ranges.slice(6).split(",").map((r: any) => {
			if (!r.match(/^(?:\d+-\d*|-\d+)$/))
				//if (r.length != 2)
				throw { code: 400, text: "Bad Request" };
			r = r.split("-");
			const ra: any = {};
			if (r[0] != "")
				ra.start = +r[0];
			if (r[1] != "") {
				if ("start" in ra)
					ra.end = Math.min(+r[1], filestat.size - 1);
				else
					ra.start = Math.max(filestat.size - +r[1], 0);
			}
			if (ra.start || 0 > ra.end || (filestat.size - 1))
				ra.error = 416;
			return ra;
		});
	}
	if (ranges && !(Array.isArray(ranges))) {
		ranges = [ranges];
	}
	if (ranges && ranges.length != 0) {
		if (ranges.length == 1) {
			const tmp = ranges[0].end;
			response.setHeader("Content-Range", `bytes ${ranges[0].start || 0}-${tmp !== undefined ? tmp : (filestat.size - 1)}/${filestat.size}`);
		}
		else
			response.setHeader("Content-Type", "multipart/byteranges; boundary=3d6b6a416f9b5");
		response.writeHead(206, "Partial Content");
	}
	else {
		response.setHeader("Content-Type", type);
		response.writeHead(200, "OK", head);
		ranges = [{}];
	}
	if (ranges.length == 1)
		await _pipeFile(createReadStream(path, ranges[0]), response);
	else {
		for (let i = 0; i < ranges.length; i++) {
			const range = ranges[i];
			response.write(`\n--3d6b6a416f9b5\nContent-Type: ${type}\nContent-Range: bytes ${range.start || 0}-${range.end === 0 ? 0 : (range.end || (filestat.size - 1))}/${filestat.size}\n\n`);
			await _pipeFile(createReadStream(path, range), response);

		}
		response.write("\n--3d6b6a416f9b5--");
	}
	response.end();
}

export function fileAsResponse(path: string, options?: {
	doLog?: boolean,
	hostingLike?: boolean,
	useRange?: boolean,
	mime?: ((x: string) => string) | string,
	logErrors?: boolean,
	logRanges?: boolean
}) {
	if (!path)
		path = "/";
	if (!path.endsWith('/'))
		path += '/';
	options = Object.assign({ useRange: true, mime: mime.getType, hostingLike: false, logErrors: true, logRanges: false }, options);
	const dl = options.doLog;
	return async (o: RequestObject, p: string) => {
		if (dl !== null && dl !== undefined)
			o.doLog = dl;
		let fp = path + p;
		try {
			let filestat = await fsPromises.stat(fp);
			if (options.hostingLike && filestat.isDirectory()) {
				fp = fp + (fp.endsWith('/') ? "" : "/") + "index.html";
				filestat = await fsPromises.stat(fp);
			}
			o.response.setHeader("Content-Type", typeof options.mime === "function" ? options.mime(p) : options.mime);
			if (options.useRange && !o.request.headers.range)
				o.response.setHeader("Content-Length", filestat.size);
			//===========================
			//temp
			o.response.setHeader("Cache-Control", "no-cache");
			o.response.setHeader("Access-Control-Allow-Origin", "*");
			if (o.doLog && o.request.headers.range && !options.logRanges)
				o.doLog = false;
			//===========================
			await file2response(o.response, fp, options.useRange && o.request.headers.range, undefined, undefined, filestat);
		} catch (e) {
			if (o.doLog && options.logErrors)
				console.log(e);
			notFound(o, options.logErrors);
		}
	}
}

export function host(path, options) {
	if (!path)
		path = "/";
	if (!path.endsWith('/'))
		path += '/';

}

export function getRoleByToken(token) {

}

export function authorized(_as, tokenName = "token", e1se = (o: RequestObject): void => {
	throw { code: 401, text: "Unauthorized" };
}) {
	return (o: RequestObject) => {
		if (o.request.cookies[tokenName]) {
			//o.storage.tokens.
		} else
			e1se(o);
	};
}

export function authorization() {
	return {
		[current]: {
			get: (o: RequestObject, path: string) => { }
		}
	};
}

function normPort(port: PortsArr | number) {
	if (!Array.isArray(port))
		port = [[port], "*"];
	return port;
}

export async function createSubServer(processor: RequestListener, ports: PortsArr, options?: ServOptions) {
	for (let vrnts of ports) {
		let brck = false;
		if (vrnts === "*") {
			let countout = 100;
			let err;
			while (countout--) {
				try {
					const prt = tools._rand(10000, 40000)
					return {
						[prt]: await crt(processor, prt, options)
					};
				}
				catch (e) {
					err = e;
				}
			}
			console.log(err);
			return process.exit(1);
		}
		if (!Array.isArray(vrnts))
			vrnts = [vrnts];
		const res = {};
		for (const prt of vrnts) {
			try {
				res[prt] = await crt(processor, prt, options);
				brck = true;
			}
			catch (e) { }
		}
		if (brck)
			return res;
	}
}

export async function defaultServerStart(routeObj: string | RouteObj = "route.js", evalF = (0, eval), serverOptions?: ServerOptions, httpPort?: PortsArr | number, httpsPort?: PortsArr | number) {
	if (serverOptions && (typeof serverOptions !== "object" || Array.isArray(serverOptions) && !httpPort)) {
		httpPort = serverOptions;
		serverOptions = undefined;
	} else if (httpPort)
		httpPort = normPort(httpPort);
	else
		httpPort = [[80], [8080], "*"];
	if (typeof routeObj === "string")
		routeObj = await loadRouteObj(routeObj);
	const processor = createProcessor(routeObj, null);
	initConcoleProcessor(evalF);
	const res: any = await createSubServer(processor, httpPort);
	if (serverOptions) {
		httpsPort = httpsPort ? normPort(httpsPort) : [[443], [8443], "*"];
		Object.assign(res, await createSubServer(processor, httpsPort, { mode: "https", serverOptions }));
	}
	res.processor = processor;
	return res;
}

export function redirect<T extends MinimumTableObject>(o: RequestObject<T>, to: string, dl?: boolean) {
	if (dl !== null && dl !== undefined)
		o.doLog = dl;
	o.response.setHeader("Location", to);
	throw {
		code: 307,
		text: "Temporary Redirect"
	};
}

export function notFound<T extends MinimumTableObject>(o: RequestObject<T>, dl?: boolean) {
	if (dl !== null && dl !== undefined)
		o.doLog = dl;
	throw {
		code: 404,
		text: "Not found"
	};
}

type allowedMethods = "head" | "get" | "post" | "put" | "delete" | "options";
export const defaultAllowedMethods: Set<allowedMethods> = new Set(["head", "get", "options"]);
export const allAllowedMethods: Set<allowedMethods> = new Set(["head", "get", "post", "put", "delete", "options"]);

export const crudApiSimpleOptions = {
	default: <T extends {}>(allowedMethods: Set<allowedMethods | string> | "*" = "*") => ({
		allowedMethods,
		getNullPathFun(o: RequestObject<T>, getP: NodeJS.Dict<string | boolean>) {
			//o.dbAdapter.get;
		}
	})
};

export function crudApi<T extends {}>(dbAdapter: dbAdapter<T>, options?: {
	allowedMethods?: Set<allowedMethods | string> | "*";
	allowedOrigin?: string | string[];
	allowedHeaders?: string[] | "*";
	getNullPathFun?(o: RequestObject<T>, getP: NodeJS.Dict<string | boolean>): any;
	getNotNullPathFun?(o: RequestObject<T>, path: string): any;
	primiryKey?: string;
}, aditionalMethodsHandlers?: CurrentRouteObj) {
	options = Object.assign<typeof options, typeof options>({
		allowedMethods: defaultAllowedMethods,
		allowedHeaders: "*",
		allowedOrigin: "*"
	}, options);
	const allowedHeaders = typeof options.allowedHeaders === "string" ? options.allowedHeaders : options.allowedHeaders.join();
	const allowedMethods = typeof options.allowedMethods === "string" ? options.allowedMethods : Array.from(options.allowedMethods).join();
	const res: RouteObj = {
		[fromThere](o) {
			o.response.setHeader("Access-Control-Allow-Origin", Array.isArray(options.allowedOrigin) ?
				(o.request.headers.origin && options.allowedOrigin.includes(o.request.headers.origin) ?
					o.request.headers.origin
					: options.allowedOrigin[0])
				: options.allowedOrigin);
			o.response.setHeader("Access-Control-Allow-Headers", allowedHeaders);
			o.response.setHeader("Access-Control-Allow-Methods", allowedMethods);
		}
	};
	const primaryKey = options.primiryKey;
	const cur: CurrentRouteObj = res[current] = {};
	for (let method of allowedMethods === "*" ? allAllowedMethods : allowedMethods)
		switch (method = method.toUpperCase()) {
			case "GET":
				cur[method] = function (o, path) {
					return dbAdapter.getByKey(path, primaryKey);
				};
				break;
			case "POST":
				cur[method] = async function (o, path) {
					if (path === "")
						return dbAdapter.insert(JSON.parse(await o.request.body));
					else
						notFound(o);
				};
				break;
			case "PUT":
				cur[method] = async function (o, path) {
					const obj = JSON.parse(await o.request.body);
					return dbAdapter.update(obj, path, Object.keys(obj) as any, primaryKey);
				};
				break;
			case "DELETE":
				cur[method] = function (o, path) {
					return dbAdapter.delete(path, primaryKey);
				};
				break;
			case "HEAD":
			case "OPTIONS":
			default:
				cur[method] = function () { };
		}
	return Object.assign(res, aditionalMethodsHandlers);
}

/*export function crudApi<T extends MinimumTableObject>(handlers: {
	get?(path: string, o: RequestObject<T>): any;
	getAll?(o: RequestObject<T>): any;
	post?(): any;
	put?(): any;
	delete?(): any;
	options?(): any;
}, options?: {
	pre?(o: RequestObject<T>): any;
	optionsMethodGen?: boolean;
	getForOneItemGen?: boolean;
}): RouteObj;

export function crudApi(...args) {
	let obj;
	let options;
	if (typeof args[0] === "object") {
		obj = args[0];
		if (args[1])
			options = args[1];
		else
			options = {};
	} else {
		obj = {};
		let i = 0;
		while (i < args.length && typeof args[i] !== "object")
			obj[["getAll", "get", "add", "update", "delete", "options"][i]] = args[i++];
		if (i < args.length)
			options = args[i];
		else
			options = {};
	}
	Object.assign({
		pre: ({ response }) => {
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.setHeader("Access-Control-Allow-Headers", "*");
			response.setHeader("Access-Control-Allow-Methods", "*");
		},
		optionsMethodGen: false,
		getForOneItemGen: true
	}, options);
	const res: any = {
		[fromThere]: options.pre
	};
	const get = {
		all: null,
		s: null
	};
	const allow = [];
	for (const oname in obj) {
		const uoname = oname.toUpperCase();
		const oc = obj[oname];
		switch (uoname) {
			case "GETALL":
				get.all = oc;
				break;
			case "GET":
				get.s = oc;
				break;
			case "ADD":
			case "POST":
				Object.assign(res, {
					POST: async (o) =>
						oc(JSON.parse(await o.request.body), o)
				});
				allow.push("POST");
				break;
			case "PUT":
			case "UPDATE":
				Object.assign(res, {
					PUT: async (o, path) =>
						oc(path, JSON.parse(await o.request.body), o)
				});
				allow.push("PUT");
				break;
			case "DELETE":
				Object.assign(res, {
					"DELETE": (o, path) =>
						oc(path, o)
				});
				allow.push("DELETE");
				break;
			case "OPTIONS":
				Object.assign(res, {
					OPTIONS: (o, path) =>
						oc(allow, o, path)
				});
				allow.push("OPTIONS");
				break;
			default:
				Object.assign(res, {
					POST: async (o, path) =>
						oc(path, o)
				});
				allow.push(uoname);
		}
	}
	obj = null;
	if (get.all)
		if (get.s)
			obj = (get, o, path) => path === "" ? get.all(o) : get.s(path, o);
		else if (options.getForOneItemGen)
			obj = (get, o, path) => {
				const r = get.all(o);
				if (path === "")
					return r;
				if (path in r)
					return r[path];
				else
					notFound(o);
			}
		else
			obj = get.all;
	else
		if (get.s)
			obj = (get, o, path) => get.s(path, o);
	if (obj) {
		res.GET = obj.bind(null, get);
		allow.push("GET");
	}
	if (options.optionsMethodGen && !res.OPTIONS) {
		Object.assign(res, {
			OPTIONS: (o) => {
				o.response.setHeader("Allow", allow);
			}
		});
		allow.push("OPTIONS");
	}
	return {
		[current]: res
	};
}*/

export function printIPs(tabs = 0, printInternal: boolean = true) {
	const ips: NodeJS.Dict<string[]> = {
		//"IPv4": [],
		//"IPv6": []
	};
	if (printInternal)
		ips.Internal = [];
	let strtbs = "";
	while (tabs--)
		strtbs += "\t";
	const nets = networkInterfaces();
	for (const key in nets)
		for (const ip of nets[key].sort((a, b) => a.family.localeCompare(b.family) || a.address.localeCompare(b.address)))
			if (ip.internal) {
				if (printInternal)
					ips.Internal.push(`${ip.address} (${key})`);
			} else if (ips[ip.family])
				ips[ip.family].push(`${ip.address} (${key})`);
			else
				ips[ip.family] = [ip.address];
	for (const key in ips) {
		console.log(strtbs + key + ":");
		for (const ip of ips[key])
			console.log(strtbs + "\t" + ip);
	}
};

if (module === require.main) {
	console.log("SODS 0.16.0 \nargs:");
	console.log(args);
	console.log("Initializing...");
	defaultServerStart().then(() => {
		console.log("\nLocal IPs:");
		printIPs(1);
		console.log("Done");
	});
}
