import { ReadStream } from "fs";

/*export async function pipeFile(istream: ReadStream, ostream: NodeJS.WritableStream) {
	/*return new Promise((resolve, reject) => {
		try {
			istream.pipe(ostream, { end: false });
			istream.on("error", reject);
			istream.on("end", () => resolve(ostream));
			istream.on("close", () => istream.destroy());
		}
		catch (e) {
			reject(e);
		}
	});*/

//}
