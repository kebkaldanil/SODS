import * as fs from "fs";
import { exec } from "child_process";
import * as JsZip from "jszip";
import { redirect, notFound, fileAsResponse, file2response, args, RequestObject, RouteObj, onError, current, fromThere, sqlite3_dbAdapter, crud } from "./SODS";
import { Database, verbose } from "sqlite3";
const MAX_ZIP_SRC_SIZE = 4 * 1024 * 1024 * 1024;

const sqlite3 = verbose();
const db = new sqlite3.Database(":memory:");
db.serialize();
db.run("create table students(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INT NOT NULL)");
db.parallelize();

class Student {
	id: number;
	name: string;
	age: number;

	constructor(name, age) {
		this.name = name;
		this.age = age;
	}
}

const dbaStudents = new sqlite3_dbAdapter(db, "students", "id");

const exp: RouteObj = {
	[current]: function (o: RequestObject, path: string) {
		if (path === "") {
			redirect(o, "/directory", false);
		}
		else
			notFound(o, false);
	},
	[fromThere]: (o: RequestObject) => {
	},
	"assets": fileAsResponse(typeof args.assetsDir === "string" ? args.assetsDir : "", { useRange: false, doLog: false, logErrors: false }),
	"file": fileAsResponse(typeof args.filesDir === "string" ? args.filesDir : "", { useRange: true, doLog: true, logErrors: true }),
	"directory": async ({ request, response }: RequestObject, path) => {
		const filesRoot = `${args.filesDir}${path}/`;
		if (request.stringParams.query === "dir" || request.headers.query === "dir")
			return new Promise((resolve, reject) => {
				fs.readdir(filesRoot, function (err, files) {
					if (err) {
						return reject({ code: 404, text: "Not found" });
					}
					response.writeHead(200, "OK");
					if (err)
						throw err;
					resolve(JSON.stringify(files, (k, v) => {
						try {
							return typeof v === "string" && fs.statSync(`${filesRoot}${v}`).isDirectory() ? v + '/' : v;
						}
						finally { }
					}));
				});
			});
		else if (request.stringParams.download) {
			const zip = new JsZip();
			let src_size = 0;

			await addDirs(zip, filesRoot);
			//const tmpname = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
			response.setHeader("Content-Type", "application/zip");
			zip.generateNodeStream({ compression: "DEFLATE", compressionOptions: { level: 3 } }).pipe(response);//.on("close", () => fs.unlink(tmpname, () => { }));
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
			await file2response(response, args.assetsDir + "fs_v.html");
	},
	[onError]: (e: Error | { code: number }, o: RequestObject) => {
		if ("code" in e && e.code / 100 % 10 === 4)
			o.doLog = true;
		throw e;
	},
	"shutdown": (o: RequestObject) => {
		exec("shutdown /s");
		return "success";
	},
	"hybernate": (o: RequestObject) => {
		exec("shutdown /h");
		return "success";
	},
	"students": new crud.Builder()
		.getRoot(() => `<form method="post" action=""><div>Name:<input name="name"></div><div>Age:<input name="age"></div><button type="submit">Submit</button></form>` as any)
		.get(path => path === "all" && (dbaStudents as any).dbAll("select * from students"))
		.get(path => dbaStudents.getByKey(path))
		.postForm((path, post, o) => {
			dbaStudents.insert(post);
			o.response.setHeader("Location", "student_created");
			throw {code: 301};
		})
		.delete(index => dbaStudents.delete(index))
		.build(),
	"student_created": {
		GET: o => redirect(o, "students")
	},
	"fallout_easy_hack": fileAsResponse("fallout 3&4 easy hack", {
		hostingLike: true,
		useRange: false
	})
};

export default exp;
