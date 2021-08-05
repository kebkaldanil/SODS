import { createReadStream, PathLike, ReadStream, Stats, promises as fsPromises } from "fs";
import { createServer as createHttpServer, ServerResponse, IncomingMessage, OutgoingHttpHeaders, RequestListener, Server } from "http";
import { networkInterfaces } from "os";
import * as mime from "mime";
import { ServerOptions, createServer as createHttpsServer } from "https";
import { Cookie, current, fromThere, onError, pathNormalizeRegExp, PortsArr, processFunction, ReceivedCookie, RequestMessage, RequestObject, ResponseMessage, resultProcessor, RouteObj, ServOptions, tools } from "./basics";

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
				this.setHeader("Set-Cookie", this.cookies.map((v: Cookie) => Cookie.prototype.toString.call(v)));
			return _writeHead.call(this, ...args);
		};
		let path = decodeURI(request.url);
		const spsi = path.indexOf('?');
		request.stringParams = spsi > 0 ? tools.map2obj(path.substr(spsi + 1).split('&'), l => tools.split(l, "=", 2, false)) : {};
		if (spsi > 0)
			path = path.slice(0, spsi);
		request.cookies = (request.headers.cookie
			? request.headers.cookie.split(';').map(c => {
				const ca = tools.split(c, "=", 2);
				return new ReceivedCookie(ca[0].trim(), ca[1].trim());
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
				if (typeof res === "string")
					o.response.end(res);
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
}/*

export function host(path, options) {
	if (!path)
		path = "/";
	if (!path.endsWith('/'))
		path += '/';

}*/

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

export async function defaultServerStart(routeObj: string | RouteObj = "route.js", evalF = (0, eval), serverOptions?: ServerOptions, httpPort?: PortsArr | number, httpsPort?: PortsArr | number): Promise<{ [port: number]: Server, processor: (request: RequestMessage, response: ResponseMessage) => void }> {
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
			return this.post((path, body, o) => cb(path, tools.map2obj(body.split("&"), l => tools.split(l, "=", 2), { code: 404 }), o), priority);
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
