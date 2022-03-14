"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookie = exports.ReceivedCookie = void 0;
const utils_1 = require("./core/utils");
class ReceivedCookie {
    constructor(name, value) {
        if (!(name && value))
            throw new TypeError("No " + (name ? "value" : "name") + " in cookie");
        this.name = name;
        this.value = value;
    }
    static fromString(cookieSrc) {
        return new ReceivedCookie(...utils_1.split(cookieSrc, '=', 2, {
            exact: true
        }));
    }
    static from(src) {
        if (typeof src === "string")
            return this.fromString(src);
        if (src instanceof ReceivedCookie)
            return new ReceivedCookie(src.name, src.value);
    }
    toString() {
        return `${this.name}=${this.value}`;
    }
}
exports.ReceivedCookie = ReceivedCookie;
class Cookie extends ReceivedCookie {
    constructor(base) {
        super(base.name, base.value);
        this.expires = base.expires;
        this.maxAge = base.maxAge;
        this.secure = base.secure;
        this.httpOnly = base.httpOnly;
        this.domain = base.domain;
        this.path = base.path;
        this.sameSite = base.sameSite;
    }
    static fromString(cookieSrc) {
        const cookieSplit = cookieSrc.split(';');
        const [name, value] = utils_1.split(cookieSplit.shift(), '=', 2);
        const cookie = {
            name,
            value
        };
        const cookiePart = utils_1.mapArrayToObject(cookieSplit, {
            processor: line => {
                const [nameInCookie, value] = utils_1.split(line, '=', 2);
                const nameInCookieLowered = nameInCookie.toLowerCase();
                switch (nameInCookieLowered) {
                    case "expires":
                        return [nameInCookieLowered, new Date(value)];
                    case "max-age":
                        return ["maxAge", Number.parseInt(value)];
                    case "domain":
                    case "path":
                    case "samesite":
                        return [nameInCookieLowered, value];
                    case "secure":
                        return [nameInCookieLowered, true];
                    case "httponly":
                        return ["httpOnly", true];
                }
            }
        });
        Object.assign(cookie, cookiePart);
        return new Cookie(cookie);
    }
    static from(src) {
        if (typeof src === "string")
            return this.fromString(src);
        if (src instanceof ReceivedCookie)
            return new Cookie(src);
    }
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
exports.Cookie = Cookie;
//# sourceMappingURL=cookie.js.map