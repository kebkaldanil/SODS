import { readFileSync, existsSync, mkdirSync } from "fs";
import * as SODS from "./SODS";

if (typeof SODS.args.assetsDir !== "string")
	SODS.args.assetsDir = "assets/";
if (typeof SODS.args.filesDir !== "string")
	SODS.args.filesDir = "files/";
if (!SODS.args.assetsDir.endsWith('/'))
	SODS.args.assetsDir += '/';
if (!SODS.args.filesDir.endsWith('/'))
	SODS.args.filesDir += '/';

import route from "./route";

const exit = process.exit;

let httpsCert;
try {
	httpsCert = {
		key: readFileSync("private/client-key.pem"),
		cert: readFileSync("private/client-cert.pem")
	};
}
catch (e) { }

if (!existsSync(SODS.args.filesDir))
	mkdirSync(SODS.args.filesDir, { recursive: true });
function tmp(l) {
	return eval(l);
}

(async () => {

	const servers = await SODS.defaultServerStart(route, tmp, httpsCert, [[80], [8080], '*'], [[443], [8443], '*']);

	/*for (const port in servers) {
		if (port !== "processor") {
			servers[port].addListener("connection", socket => {
				const rport = socket.remotePort;
				socket.addListener("close", () => {
					console.log(`Socket closed on port ${port} to ${rport}`);
				});
			});
		}
	}*/

	console.log("\nLocal IPs:");
	SODS.printIPs(1);
})().catch(console.error);
