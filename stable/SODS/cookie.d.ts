export declare class ReceivedCookie {
    constructor(name: string, value: string);
    static fromString(cookieSrc: string): ReceivedCookie;
    static from(src: string | ReceivedCookie): ReceivedCookie;
    name: string;
    value: string;
    toString(): string;
}
export declare class Cookie extends ReceivedCookie {
    constructor(base: Cookie);
    static fromString(cookieSrc: string): Cookie;
    static from(src: string | ReceivedCookie): Cookie;
    expires?: Date;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
    domain?: string;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
    toString(): string;
}
