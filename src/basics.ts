import { IncomingMessage, ServerResponse } from "http";
import { ServerOptions } from "https";

export type processFunction = (o: RequestObject, path: string) => any | Promise<any>;

export type RequestMessage = IncomingMessage & {
	cookies: ReceivedCookie[];
	stringParams: NodeJS.ReadOnlyDict<string | boolean>;
	body: Promise<string>;
}

export type ResponseMessage = ServerResponse & {
	cookies: Cookie[];
}/*

export class MinimumTableObject {
	token: string;
	expires: number;
};*/

export type RequestObject = {
	request: RequestMessage;
	response: ResponseMessage;
	fpath: string;
	queue: ((o: RequestObject, path: string) => void)[];
	doLog: boolean;
};

export class ReceivedCookie {
	constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}
	name: string;
	value: string;
	toString() {
		return `${this.name}=${this.value}`;
	}
}

export class Cookie extends ReceivedCookie {
	constructor(base: Cookie) {
		super(base.name, base.value);
		this.expires = base.expires;
		this.maxAge = base.maxAge;
		this.secure = base.secure;
		this.httpOnly = base.httpOnly;
		this.domain = base.domain;
		this.path = base.path;
		this.sameSite = base.sameSite;
	}
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

export type PortsArr = (number[] | number | "*")[];

export type ServOptions = {
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
	split(str: string, separator: string, limit: 2, exact?: false): [string, string];
	split<T extends number>(str: string, separator: string, limit: T, exact?: false): string[] & { length: T };
	split(str: string, separator: string, limit: number, exact: true): string[];
	split(str: string, separator?: string, limit?: -1): string[];
	split(str: string, separator: string = ",", limit: number = -1, exact = false) {
		if (limit < 0)
			return str.split(separator);
		if (limit === 0)
			return [];
		str = "" + str;
		if (limit === 1)
			return [str];
		const res: string[] = [];
		let count = limit;
		while (count !== 1) {
			--count;
			separator = "" + separator;
			const si = str.indexOf(separator);
			if (si < 0)
				break;
			res.push(str.slice(0, si));
			str = str.slice(si + 1);
		}
		if (exact && res.length !== limit)
			throw Error("");
		res.push(str);
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
export const pathNormalizeRegExp = /^\/+|\/+$|\/+(?=\/)/g;
