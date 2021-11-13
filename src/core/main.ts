import { createReadStream, Stats, promises as fsPromises } from "fs";
import { createServer as createHttpServer, OutgoingHttpHeaders, RequestListener, Server } from "http";
import { networkInterfaces } from "os";
let mime: any;
try {
	mime = require("mime");
} catch(e) {}
import * as utils from "./utils";
import { ServerOptions, createServer as createHttpsServer } from "https";
import { PortsArr, processFunction, RequestMessage, RequestObject, ResponseMessage, RouteObj, ServOptions } from "./types";
import { Cookie, ReceivedCookie } from "../cookie";
import { fromThere, current, onError, resultProcessor } from "./constants";

const pathNormalizeRegExp = /^\/+|\/+$|\/+(?=\/)/g;

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
					if (dab)
						o.queue.pop();
					if (res)
						return res;
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
					if (res === undefined || res === null)
						return true;
					else
						return res;
				}
				else {
					return proc;
				}
			} else
				await notFound(o);
		}
		return false;
	}
	catch (e) {
		if (sect[onError])
			sect[onError](e, o, o.fullPath.slice(0, path.length - 1));
		else
			throw e;
	}
}

export function json(o: RequestObject, data: any) {
	const json = JSON.stringify(data);
	const buffer = Buffer.from(json);
	if (!o.response.headersSent) {
		if (!o.response.hasHeader("Content-Type"))
			o.response.setHeader("Content-Type", "application/json; charset=UTF-8");
		if (!o.response.hasHeader("Content-Length"))
			o.response.setHeader("Content-Length", buffer.byteLength);
	}
	return buffer;
}

export function createProcessor(routeObj: RouteObj): RequestListener {
	return (request: RequestMessage, response: ResponseMessage) => {
		const startTime = utils.formatedTime();
		const _writeHead = response.writeHead;
		response.cookies = [];
		response.writeHead = function (...args: any[]) {
			if (this.cookies.length !== 0)
				this.setHeader("Set-Cookie", this.cookies.map((v: Cookie) => Cookie.prototype.toString.call(v)));
			return _writeHead.call(this, ...args);
		};
		let path = decodeURI(request.url);
		const spsi = path.indexOf('?');
		request.stringParams = spsi > 0 ? utils.mapArrayToObject(path.substr(spsi + 1).split('&'), {
			processor: l => utils.split(l, "=", 2, {
				exact: false
			}),
			allowBooleanIfOnlyKey: true
		}) : {};
		if (spsi > 0)
			path = path.slice(0, spsi);
		utils.computeOnce(request.headers, "cookie", () =>
		(request.headers.cookie
			? request.headers.cookie.split(';').map(c => {
				const ca = utils.split(c, "=", 2);
				return new ReceivedCookie(ca[0].trim(), ca[1].trim());
			})
			: []));
		path = path.replace(pathNormalizeRegExp, "");
		utils.computeOnce(request, "body", () =>
			new Promise((resolve, reject) => {
				let body = "";
				request.on("end", () => resolve(body));
				request.on("error", reject);
				request.on("data", data => body += data);
			}));
		const o: RequestObject = {
			request: request,
			response: response,
			fullPath: path,
			queue: [],
			doLog: true
		};
		processRequest(o, path, routeObj).catch(e => {
			if (!o.response.headersSent) {
				response.writeHead(500, "Internal Server Error");
				response.end();
			}
			if (!o.response.writableEnded)
				o.response.end();
			//if (o.doLog)
			console.error(e);
		}).then(res => {
			if (!o.response.writableEnded) {
				if (typeof res === "object" || typeof res === "string") {
					if (!o.response.hasHeader("Content-Type") && !o.response.headersSent)
						o.response.setHeader("Content-Type", "text/html; charset=UTF-8");
					o.response.end(res);
				}
			}
		});
		if (o.doLog) {
			console.log(`${startTime} -> request ${request.method} "${path}"`);
			response.on("close", () => console.log(`${startTime} - ${utils.formatedTime()} -> closed ${request.method} "${path}"`));
			response.on("finish", () => console.log(`${startTime} - ${utils.formatedTime()} -> finished ${request.method} "${path}"`));
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

export async function file2response(o: RequestObject, path: string, ranges?: string | { start?: number, end?: number }[], type?: string, head?: OutgoingHttpHeaders, filestat?: Stats) {
	const response = o.response;
	if (!filestat)
		filestat = await fsPromises.stat(path);
	if (filestat.isDirectory())
		throw new Error(`"${path}" is directory`);
	if (!type)
		type = mime.getType(path);
	if (typeof ranges === "string") {
		ranges = ranges.slice(6).split(",").map((r: any) => {
			if (!r.match(/^(?:\d+-\d*|-\d+)$/)) {
				//if (r.length != 2)
				fastResponse(o, { code: 400, statusText: "Bad Request" });
				throw new Error("Bad request: bad range: " + r);
			}
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
	if (ranges.length == 1) {
		const stream = createReadStream(path, ranges[0]);
		await utils.pipeFile(stream, response).finally(() => stream.close());
	}
	else {
		for (let i = 0; i < ranges.length; i++) {
			const range = ranges[i];
			response.write(`\n--3d6b6a416f9b5\nContent-Type: ${type}\nContent-Range: bytes ${range.start || 0}-${range.end === 0 ? 0 : (range.end || (filestat.size - 1))}/${filestat.size}\n\n`);
			const stream = createReadStream(path, range);
			await utils.pipeFile(stream, response).finally(() => {
				stream.destroy();
				console.log("check");
			});

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
			if (o.doLog && o.request.headers.range && !options.logRanges)
				o.doLog = false;
			await file2response(o, fp, options.useRange && o.request.headers.range, undefined, undefined, filestat);
		} catch (e) {
			if (options.logErrors)
				console.log(e);
			await notFound(o, options.logErrors);
		}
	}
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
			let err: unknown;
			while (countout--) {
				try {
					const prt = utils.intRandbyLength(10000, 40000);
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

export async function defaultServerStart(routeObj: RouteObj, evalF = (0, eval), serverOptions?: ServerOptions, httpPort?: PortsArr | number, httpsPort?: PortsArr | number): Promise<{ [port: number]: Server, processor: (request: RequestMessage, response: ResponseMessage) => void }> {
	if (serverOptions && (typeof serverOptions !== "object" || Array.isArray(serverOptions) && !httpPort)) {
		httpPort = serverOptions;
		serverOptions = undefined;
	} else if (httpPort)
		httpPort = normPort(httpPort);
	else
		httpPort = [[80], [8080], "*"];
	const processor = createProcessor(routeObj);
	utils.initConsoleProcessor(evalF);
	const res: any = await createSubServer(processor, httpPort);
	if (serverOptions) {
		httpsPort = httpsPort ? normPort(httpsPort) : [[443], [8443], "*"];
		Object.assign(res, await createSubServer(processor, httpsPort, { mode: "https", serverOptions }));
	}
	res.processor = processor;
	return res;
}

type fastResponseOptions = {
	code?: number;
	headers?: OutgoingHttpHeaders;
	body?: any;
	doLog?: boolean;
	statusText?: string;
};
export async function fastResponse(o: RequestObject, code: number): Promise<void>;
export async function fastResponse(o: RequestObject, options: fastResponseOptions): Promise<void>;

export function fastResponse(o: RequestObject, options: fastResponseOptions | number) {
	if (typeof options === "number")
		options = {
			code: options
		};
	const code = utils.notNullOrDefault(options.code, 200);
	const headers = utils.notNullOrDefault(options.headers, {});
	const body = options.body;
	const statusText = options.statusText;
	const doLog = utils.notNullOrDefault(options.doLog, o.doLog);
	return new Promise<void>((response, reject) => {
		try {
			o.doLog = doLog;
			o.response.writeHead(code, statusText, headers);
			o.response.end(body, response);
		} catch (e) {
			reject(e);
		}
	});
}

export function ok(o: RequestObject, body?: any, doLog?: boolean) {
	return fastResponse(o, { code: 200, body, doLog });
}

export function redirect(o: RequestObject, to: string, doLog?: boolean) {
	return fastResponse(o, {
		code: 307,
		statusText: "Temporary Redirect",
		headers: { location: to },
		doLog
	});
}

export function notFound(o: RequestObject, doLog?: boolean) {
	return fastResponse(o, {
		code: 404,
		statusText: "Not found",
		doLog
	});
}

export class crudBuilder {
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
		return this.post((path, body, o) => cb(path, utils.mapArrayToObject(body.split("&")), o), priority);
	}
	postJson(cb: (path: string, obj: any, o: RequestObject) => any, priority = 50) {
		return this.post((path, body, o) => cb(path, JSON.parse(body), o), priority);
	}
	put(cb: (path: string, body: string, o: RequestObject) => any, priority = 50) {
		return this.useMethod("put", async (o, path) => cb(path, await o.request.body, o), priority);
	}
	delete(cb: (path: string, get: NodeJS.Dict<string | boolean>, o: RequestObject) => any, priority = 50) {
		return this.useMethod("delete", (o, path) => cb(path, o.request.stringParams, o), priority);
	}
	build(): RouteObj {
		const res: RouteObj = {
			[current]: utils.mapArrayToObject(Array.from(this.usedMethods), {
				processor: m => {
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
				},
				throwIfError: true
			})
		};
		this.usedMethods = null;
		this.processors = null;
		return res;
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
