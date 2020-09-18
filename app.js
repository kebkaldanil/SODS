"use strict"

const SODS = require("./SODS");
const fs = require("fs");

const exit = process.exit;

let httpsCert;
try {
	httpsCert = {
		key: fs.readFileSync("private/client-key.pem"),
		cert: fs.readFileSync("private/client-cert.pem")
	};
}
catch (e) { }

process.args.assetsDir = process.args.assetsDir || "assets/";
process.args.filesDir = process.args.filesDir || "files/";
if (!process.args.assetsDir.endsWith('/'))
	process.args.assetsDir += '/';
if (!process.args.filesDir.endsWith('/'))
	process.args.filesDir += '/';

if (!fs.existsSync(process.args.filesDir))
	fs.mkdirSync(process.args.filesDir, { recursive: true });

(async () => {
	const servers = await SODS.defaultServerStart("./route.js", function (l) {
		return eval(l);
	}, httpsCert, [[80], [8080], '*'], [[443], [8443], '*']);

	const changeRouteObj = obj => {
		servers.processor.changeRouteObj(obj);
	};

	const changeFilesDir = (dir, onObj = "route.js") => {
		process.args.filesDir = dir;
		changeRouteObj(onObj);
	};

	console.log("\nLocal IPs:");
	SODS.printIPs(1);
})().catch(console.error);
