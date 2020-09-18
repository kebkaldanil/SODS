const fs = require("fs");
const child_process = require("child_process");
const JsZip = require("jszip");
const MAX_ZIP_SRC_SIZE = 4 * 1024 * 1024 * 1024;

({
	".": function (o, path) {
		if (path === "") {
			redirect(o, "/directory", true);
		}
		else
			notFound(o, true);
	},
	"...": o => {
	},
	"assets": fileAsResponse(process.args.assetsDir, { useRange: false, doLog: false, logErrors: false }),
	"file": fileAsResponse(process.args.filesDir, { useRange: true, doLog: true, logErrors: true }),
	"directory": async (o, path) => {
		const filesRoot = `${process.args.filesDir}${path}/`;
		if (o.stringParams.query === "dir" || o.request.headers.query === "dir")
			return new Promise((resolve, reject) => {
				fs.readdir(filesRoot, function (err, files) {
					if (err) {
						return reject({ code: 404, text: "Not found" });
					}
					o.response.writeHead(200, "OK");
					if (err)
						throw err;
					resolve(JSON.stringify(files, (k, v) => {
						try {
							return typeof v === "string" && fs.statSync(`${filesRoot}${v}`).isDirectory() ? v + '/' : v;
						}
						finally{}
					}));
				});
			});
		else if (o.stringParams.download) {
			const zip = new JsZip();
			let src_size = 0;

			await addDirs(zip, filesRoot);
			const tmpname = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
			o.response.setHeader("Content-Type", "application/zip");
			zip.generateNodeStream({ compression: "DEFLATE", compressionOptions: { level: 6 } }).pipe(o.response).on("close", () => fs.unlink(tmpname, () => { }));
			/*zip.generateNodeStream({ compression: "DEFLATE", compressionOptions: { level: 6 } }).pipe(fs.createWriteStream(tmpname)).on("finish", () => 
				fs.createReadStream(tmpname).pipe(o.response).on("close", () => fs.unlink(tmpname, () => { })));*/

			function addDirs(zip = new JsZip(), path = "") {
				if (typeof path !== "string")
					throw Error(`path must be string (${typeof path} except)`);
				if (!(zip instanceof JsZip))
					throw Error("use sjzip object as first parametr");
				if (!path.endsWith('/') && path !== "")
					path += '/';
				const waiter = [];
				return new Promise((resolve, reject) => {
					fs.readdir(path, async (err, files) => {
						if (err) {
							console.log(err);
							return reject({ code: 404, text: "Not Found" });
						}
						for (let file of files) {
							const fp = path + file;
							waiter.push(new Promise((resolve, reject) =>
								fs.stat(fp, (err, stats) => {
									if (err)
										return reject(err);
									if (stats.isDirectory())
										addDirs(zip.folder(file), fp).then(resolve).catch(reject);
									else {
										if ((src_size += stats.size) > MAX_ZIP_SRC_SIZE)
											reject({ code: 400, text: "Requested folder is too large" });
										resolve(zip.file(file, fs.createReadStream(fp)));
									}
								})));
						}
						try {
							await Promise.all(waiter);
						}
						catch (e) {
							reject(e);
						}
						resolve(zip);
					});
				});
			}
		}
		else
			await file2response(o.response, process.args.assetsDir + "fs_v.html");
	},
	"..": (e, o) => {
		if ("code" in e && e.code / 100 % 10 === 4)
			o.doLog = true;
		throw e;
	},
	"test": "##<h3>test</h3>",
	"shutdown": o => {
		child_process.exec("shutdown /s");
		return "success";
	},
	"hybernate": o => {
		child_process.exec("shutdown /h");
		return "success";
	}
});
