import { createReadStream, PathLike, ReadStream, Stats, promises as fsPromises } from "fs";
import { createServer as createHttpServer, ServerResponse, IncomingMessage, OutgoingHttpHeaders, RequestListener, Server } from "http";
import { networkInterfaces } from "os";
import * as mime from "mime";
import { ServerOptions, createServer as createHttpsServer } from "https";
import { Database } from "sqlite3";
import { promisify } from "util";

//const parrent = Symbol("parrent");

type processFunction = (o: RequestObject, path: string) => any | Promise<any>;

export interface dbAdapter {
	table: string;
	getByKey(key: number | string, pk?: string): Promise<any>;
	getWhere(condition: string, limit?: number, skip?: number): Promise<any[]>;
	insert(obj: any): Promise<void>;
	insert(obj: any[]): Promise<void>;
	updateWhere(obj: any, where: string, editedProps: string[]): Promise<void>;
	update(obj: any, key: string | number, editedProps: string[], pk?: string): Promise<void>;
	deleteWhere(where: string): Promise<void>;
	delete(key: string | number, pk?: string): Promise<void>;

	run?(sql: string): Promise<any>;
	db?: any;
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

export class RequestMessage extends IncomingMessage {
	cookies: ReceivedCookie[];
	stringParams: NodeJS.ReadOnlyDict<string | boolean>;
	body: Promise<string>;
}

export class ResponseMessage extends ServerResponse {
	cookies: Cookie[];
}/*

export class MinimumTableObject {
	token: string;
	expires: number;
};*/

export class RequestObject {
	request: RequestMessage;
	response: ResponseMessage;
	fpath: string;
	queue: ((o: RequestObject, path: string) => void)[];
	doLog: boolean;
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
export const resultProcessor = Symbol("Callback for return values");

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
	[fromThere]?: (o: RequestObject, path: string, declaredPath: string) => any | Promise<any>,
	[resultProcessor]?: (ret: any, o: RequestObject) => any
} & NodeJS.Dict<RouteObj> | string | processFunction;

class Tools {
	time(strings: TemplateStringsArray, ...params: any[]) {
		let res = "";
		let i = 0;
		while (i < params.length) {
			const tmp = params[i];
			res += strings[i] + (typeof tmp === "number" ? tools._lengthOpti(2, tmp) : tmp);
			i++;
		}
		return res + strings[i];
	}
	_lengthOpti(length: number, be: number) {
		const bs = "" + Math.trunc(be);
		return "000000000000".slice(12 + bs.length - length) + bs;
	}
	get formatedTime() {
		const p = new Date();
		return tools.time`${p.getHours()}:${p.getMinutes()}:${p.getSeconds()}.${tools._lengthOpti(3, p.getMilliseconds())}`;
	}
	_rand(start: number, lngth: number) {
		return Math.floor(Math.random() * lngth + start);
	}
	random(start: number, end: number) {
		return tools._rand(start, end - start);
	}
	split(str: string, separator: string, count: 2, min?: false): [string, string];
	split<T extends number>(str: string, separator: string, count: T, min?: false): string[] & { length: T };
	split(str: string, separator: string, count: number, min: true): string[];
	split(str: string, separator?: string, count?: -1): string[];
	split(str: string, separator: string = "", count: number = -1, min = false) {
		if (count < 0)
			return str.split(separator);
		if (count === 0)
			return [];
		str = "" + str;
		if (count === 1)
			return [str];
		const res: string[] = min ? [] : Array.from({ length: count });
		let i = 0;
		while (count !== 1) {
			count--;
			separator = "" + separator;
			const si = str.indexOf(separator);
			if (si < 0)
				break;
			res[i++] = str.slice(0, si);
			str = str.slice(si + 1);
		}
		if (i + 1 !== res.length)
			throw Error("");
		res[i] = str;
		return res;
	}
	deepCopy<T extends NodeJS.Dict<any>>(obj: T): T {
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
	map2obj<T1, T2>(arr: T1[], l: (l: T1) => [T1, T2], throwable: Error | { code: number }): NodeJS.Dict<T2>;
	map2obj<T1, T2>(arr: T1[], l: (l: T1) => [T1, T2]): NodeJS.Dict<T2 | boolean>;
	map2obj(arr: string[]): NodeJS.Dict<string | boolean>;
	map2obj(arr: string[], throwable: Error | { code: number }): NodeJS.Dict<string>;
	map2obj(arr: any[], l: any = (l: any) => tools.split(l, '=', 2), throwable?: any) {
		const res = {};
		if (!(typeof l === "function" || l instanceof Function)) {
			throwable = l;
			l = (l: any) => tools.split(l, '=', 2);
		}
		arr.forEach(s => {
			const a = l(s);
			if (a && a.length > 0)
				if (a.length < 2)
					if (throwable)
						throw throwable;
					else
						res[a[0]] = true;
				else
					res[a[0]] = a[1];
			else if (throwable)
				throw throwable;
		});
		return res;
	}
}
export const tools = new Tools();


const pathNormalizeRegExp = /^\/+|\/+$|\/+(?=\/)/g;

let inpLine = "";
export const args = tools.map2obj(process.argv.slice(2));

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

async function processRequest(o: RequestObject, path: string, sect: RouteObj): Promise<any> {
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
					if (sect[resultProcessor])
						res = sect[resultProcessor](res, o);
					if (res || res === false) {
						return res;
					}
					else
						return true;
				}
				else {
					return proc;
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

export function createProcessor(routeObj: RouteObj) {
	return (request: RequestMessage, response: ResponseMessage) => {
		const _writeHead = response.writeHead;
		response.cookies = [];
		response.writeHead = function (...args: any[]) {
			if (this.cookies.length !== 0)
				this.setHeader("Set-Cookie", this.cookies.map((v: Cookie) => v.toString()));
			return _writeHead.call(this, ...args);
		};
		let path = decodeURI(request.url);
		const spsi = path.indexOf('?');
		request.stringParams = spsi > 0 ? tools.map2obj(path.substr(spsi + 1).split('&')) : {};
		if (spsi > 0)
			path = path.slice(0, spsi);
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
		const o: RequestObject = {
			request: request,
			response: response,
			fpath: path,
			queue: [],
			doLog: true
		};
		processRequest(o, path, routeObj).catch(e => {
			if (!response.writableEnded) {
				if (typeof e.code === "number") {
					if (o.doLog && !e.usual) {
						console.log(`${e.code} ${e.text}`);
					}
					response.writeHead(e.code, e.text);
					return response.end();
				}
				else {
					response.writeHead(500, "Internal Server Error");
					response.end();
				}
			}
			if (o.doLog)
				console.error(e);
		}).then(res => {
			if (!o.response.writableEnded) {
				if (typeof res === "object") {
					res = JSON.stringify(res);
					if (!o.response.hasHeader("Content-Type") && !o.response.headersSent)
						o.response.setHeader("Content-Type", "application/json; charset=UTF-8");
				}
				else if (!o.response.hasHeader("Content-Type") && !o.response.headersSent)
					o.response.setHeader("Content-Type", "text/html; charset=UTF-8");
				o.response.end(typeof res === "string" ? res : undefined);
			}
		});
		if (o.doLog) {
			console.log(`${startTime} -> request ${request.method} "${path}"`);
			response.on("close", () => console.log(`${startTime} - ${tools.formatedTime} -> closed ${request.method} "${path}"`));
			response.on("finish", () => console.log(`${startTime} - ${tools.formatedTime} -> finished ${request.method} "${path}"`));
		}
	};
};

export function crt(processor: RequestListener, port: number, options?: ServOptions) {
	const silense = options && options.silense;
	const mode = options && options.mode || (typeof options === "string" && options) || "http";
	const serverOptions = options && options.serverOptions || {};
	return new Promise<Server>((resolve, reject) => {
		if (!silense)
			console.log(`Starting listener (${mode}) on port ${port}`);
		let server: Server;
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
		const res: { [port: number]: Server } = {};
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

export async function defaultServerStart(routeObj: string | RouteObj = "route.js", evalF = (0, eval), serverOptions?: ServerOptions, httpPort?: PortsArr | number, httpsPort?: PortsArr | number): Promise<{ [port: number]: Server, processor: typeof processor }> {
	if (serverOptions && (typeof serverOptions !== "object" || Array.isArray(serverOptions) && !httpPort)) {
		httpPort = serverOptions;
		serverOptions = undefined;
	} else if (httpPort)
		httpPort = normPort(httpPort);
	else
		httpPort = [[80], [8080], "*"];
	if (typeof routeObj === "string")
		routeObj = await loadRouteObj(routeObj);
	const processor = createProcessor(routeObj);
	initConcoleProcessor(evalF);
	const res: any = await createSubServer(processor, httpPort);
	if (serverOptions) {
		httpsPort = httpsPort ? normPort(httpsPort) : [[443], [8443], "*"];
		Object.assign(res, await createSubServer(processor, httpsPort, { mode: "https", serverOptions }));
	}
	res.processor = processor;
	return res;
}

export function redirect(o: RequestObject, to: string, dl?: boolean) {
	if (dl !== null && dl !== undefined)
		o.doLog = dl;
	o.response.setHeader("Location", to);
	throw {
		code: 307,
		text: "Temporary Redirect"
	};
}

export function notFound(o: RequestObject, dl?: boolean) {
	if (dl !== null && dl !== undefined)
		o.doLog = dl;
	throw {
		code: 404,
		text: "Not found"
	};
}

class OnlyOneProcessorError extends Error {
	constructor(method: string) {
		super(`Only one ${method} callback allowed`);
		this.name = "OnlyOneProcessorError";
	}
}

/*export const crud = function (): Builder {
	const crudP: CurrentRouteObj = {};
	const usedMethods;
	let returnProcessor = (ret: any, o: RequestObject) => ret;
	const builder = {
		get(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: { dbAdapter: dbAdapter } & RequestObject) => any) {
			if (check.get)
				throw new OnlyOneProcessorError("get");
			check.get = true;
			crudP.GET = (o: RequestObject, path: string) => returnProcessor(cb(path, o.request.stringParams, Object.assign({ dbAdapter }, o)), o);
			return builder;
		},
		postForm(cb: (path: string, post: NodeJS.Dict<string | boolean>, o: { dbAdapter: dbAdapter } & RequestObject) => any) {
			if (check.post)
				throw new OnlyOneProcessorError("post");
			check.post = true;
			crudP.POST = async (o: RequestObject, path: string) => returnProcessor(cb(path, tools.map2obj((await o.request.body).split('&')), Object.assign({ dbAdapter }, o)), o);
			return builder;
		},
		postJson(cb: (path: string, obj: any, o: { dbAdapter: dbAdapter } & RequestObject) => any) {
			if (check.post)
				throw new OnlyOneProcessorError("post");
			check.post = true;
			crudP.POST = async (o: RequestObject, path: string) => returnProcessor(cb(path, JSON.parse(await o.request.body), Object.assign({ dbAdapter }, o)), o);
			return builder;
		},
		put(cb: (path: string, obj: any, o: { dbAdapter: dbAdapter } & RequestObject) => any) {
			if (check.put)
				throw new OnlyOneProcessorError("put");
			check.put = true;
			crudP.PUT = async (o: RequestObject, path: string) => returnProcessor(cb(path, tools.map2obj((await o.request.body).split('&')), Object.assign({ dbAdapter }, o)), o);
			return builder;
		},
		delete(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: { dbAdapter: dbAdapter } & RequestObject) => any) {
			if (check.delete)
				throw new OnlyOneProcessorError("delete");
			check.delete = true;
			crudP.DELETE = (o: RequestObject, path: string) => returnProcessor(cb(path, o.request.stringParams, Object.assign({ dbAdapter }, o)), o);
			return builder;
		},
		setReturnProcessor(cb: (ret: any, o: RequestObject) => any) {
			returnProcessor = cb;
			return builder;
		}
	};
	return builder;
}*/

export class crud {
	static Builder = class Builder {
		private usedMethods: Set<string>;
		private processors: NodeJS.Dict<{ cb: (o: RequestObject, path: string) => any, priority: number }[]>;
		constructor() {
			this.usedMethods = new Set(["OPTIONS"]);
			this.processors = {
				OPTIONS: [{ cb: o => o.response.setHeader("Allow", Array.from(this.usedMethods).join(", ")), priority: Infinity }]
			};
		}
		useMethod(method: string, cb: (o: RequestObject, path: string) => any, priority = 50) {
			method = method.toUpperCase();
			if (!this.usedMethods.has(method)) {
				this.usedMethods.add(method);
				this.processors[method] = [];
			}
			this.processors[method].push({ cb: cb, priority });
			return this;
		}
		get(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority = 50) {
			return this.useMethod("get", (o, path) => cb(path, o.request.stringParams, o), priority);
		}
		getRoot(cb: (get: NodeJS.Dict<string | boolean>, o: RequestObject) => any) {
			return this.useMethod("get", (o, path) => path === "" && cb(o.request.stringParams, o), 0);
		}
		post(cb: (path: string, body: string, o: RequestObject) => any, priority = 50) {
			return this.useMethod("post", async (o, path) => cb(path, await o.request.body, o), priority);
		}
		postForm(cb: (path: string, post: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority = 50) {
			return this.post((path, body, o) => cb(path, tools.map2obj(body.split("&"), l => tools.split(l, "=", 2), { code: 404 }), o), priority);
		}
		postJson(cb: (path: string, obj: any, o: RequestObject) => any, priority = 50) {
			return this.post((path, body, o) => cb(path, JSON.parse(body), o), priority);
		}
		put(cb: (path: string, body: string, o: RequestObject) => any, priority = 50): Builder {
			return this.useMethod("put", async (o, path) => cb(path, await o.request.body, o), priority);
		}
		delete(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority = 50): Builder {
			return this.useMethod("delete", (o, path) => cb(path, o.request.stringParams, o), priority);
		}
		build(): RouteObj {
			const res: RouteObj = {
				[current]: tools.map2obj(Array.from(this.usedMethods), m => {
					const procs = this.processors[m].sort((a, b) => a.priority - b.priority).map(v => v.cb);
					return [m, async (o, path) => {
						let error = { code: 404 };
						for (const proc of procs) {
							try {
								const res = await proc(o, path);
								if (res)
									return res;
							} catch (e) {
								if (Number.isInteger(e.code))
									error = e;
							}
						}
						throw error;
					}];
				}, { code: 404 })
			};
			this.usedMethods = null;
			this.processors = null;
			return res;
		}
	}
}

export function printIPs(tabs = 0, printInternal = false) {
	const ips: NodeJS.Dict<string[]> = {
		"IPv4": [],
		"IPv6": []
	};
	if (printInternal)
		ips.Internal = [];
	let strtbs = "";
	while (tabs--)
		strtbs += "\t";
	const nets = networkInterfaces();
	for (const key in nets)
		for (const ip of nets[key])
			if (ip.internal) {
				if (printInternal)
					ips.Internal.push(`${ip.address} (${key})`);
			} else if (ips[ip.family])
				ips[ip.family].push(`${ip.address} (${key})`);
			else
				ips[ip.family] = [`${ip.address} (${key})`];
	for (const key in ips) {
		if (ips[key].length === 0)
			continue;
		console.log(strtbs + key + ":");
		for (const ip of ips[key])
			console.log(strtbs + "\t" + ip);
	}
};
