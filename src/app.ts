import { readFileSync, existsSync, mkdirSync } from "fs";
import * as SODS from "./SODS";

SODS.args.assetsDir = SODS.args.assetsDir || "assets/";
SODS.args.filesDir = SODS.args.filesDir || "files/";
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

(async () => {

	const servers = await SODS.defaultServerStart(route, function (l) {
		return eval(l);
	}, httpsCert, [[80], [8080], '*'], [[443], [8443], '*']);

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

	const changeRouteObj = obj => {
		servers.processor.changeRouteObj(obj);
	};

	const changeFilesDir = (dir, onObj = "route.js") => {
		SODS.args.filesDir = dir;
		changeRouteObj(onObj);
	};

	console.log("\nLocal IPs:");
	SODS.printIPs(1);
})().catch(console.error);
