import { utils } from ".";

/**
 * Cookie from client
 */
export class ReceivedCookie {
  /**
   * Create cookie object
   * 
   * @param name - cookie name
   * @param value - cookie value
   */
  constructor(name: string, value: string) {
    if (!(name && value))
      throw new TypeError("No " + (name ? "value" : "name") + " in cookie");
    this.name = name;
    this.value = value;
  }
  /**
   * @param cookieSrc - cookie header
   * @returns cookie
   */
  static fromString(cookieSrc: string) {
    return new ReceivedCookie(...utils.split(cookieSrc, "=", 2, {
      exact: true,
    }));
  }
  /**
   * Create or copy cookie
   * @param src - cookie to copy or cookie header
   */
  static from(src: string | ReceivedCookie) {
    if (typeof src === "string")
      return this.fromString(src);
    if (src instanceof ReceivedCookie)
      return new ReceivedCookie(src.name, src.value);
  }
  name: string;
  value: string;
  toString() {
    return `${this.name}=${this.value}`;
  }
}

/**
 * Cookie to client
 */
export class Cookie extends ReceivedCookie {
  /**
   * Create or copy cookie
   */
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

  /**
   * @param cookieSrc - cookie header
   * @returns cookie
   */
  static fromString(cookieSrc: string) {
    const cookieSplit = cookieSrc.split(";");
    const [name, value] = utils.split(cookieSplit.shift(), "=", 2);
    const cookie = {
      name,
      value,
    };
    const cookiePart = utils.mapArrayToObject<string, string | number | boolean | Date>(cookieSplit, {
      processor: line => {
        const [nameInCookie, value] = utils.split(line, "=", 2);
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
      },
    });
    Object.assign(cookie, cookiePart);
    return new Cookie(cookie);
  }
  /**
   * Create or copy cookie
   * @param src - cookie to copy or cookie header
   */
  static from(src: string | ReceivedCookie) {
    if (typeof src === "string")
      return this.fromString(src);
    if (src instanceof ReceivedCookie)
      return new Cookie(src);
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
