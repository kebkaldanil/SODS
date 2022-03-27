const child_process = require("child_process");
const fs = require("fs").promises;
const buildCommand = "npx tsc";

(async () => {
  const tsconfig = await fs.readFile("tsconfig.json", "utf-8").then(json => JSON.parse(json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)));
  const buildPath = tsconfig.compilerOptions.outDir;
  if (!buildPath)
    throw new Error("no build path");
  try {
    if (!await fs.access("node_modules"))
      throw new Error();
    console.log(buildCommand);
    await exec(buildCommand, {});
    const _package = JSON.parse(await fs.readFile("package.json", "utf-8"));
    delete _package.devDependencies;
    await fs.writeFile(buildPath + "/package.json", JSON.stringify(_package));
  } catch (_) {
    console.log("npm i");
    await exec("npm i");
    console.log(buildCommand);
    await exec(buildCommand);
    const package = JSON.parse(await fs.readFile("package.json", "utf-8"));
    delete package.devDependencies;
    await fs.writeFile(buildPath + "/package.json", JSON.stringify(package));
  }
})().catch(e => {
  throw e;
});

/**
 * @param {string} command
 * @param {{[src: string]: string} | boolean} pipe
 * @param {{[src: string]: string} | boolean} backpipe
 * @returns {Promise<void>}
*/
function exec(
  command,

  pipe = {
    stdout: "stdout",
    stderr: "stderr"
  },

  backpipe = {
    stdin: "stdin"
  }
) {
  if (typeof pipe !== "object" && pipe)
    pipe = {
      stdout: "stdout",
      stderr: "stderr"
    };
  if (typeof backpipe !== "object" && backpipe)
    backpipe = {
      stdout: "stdout",
      stderr: "stderr"
    };
  return new Promise((res, rej) => {
    const cp = child_process.exec(command, (err) => {
      if (err)
        rej(err);
      else
        res();
    }).on("spawn", () => {
      for (const name of Object.keys(pipe)) {
        let pn = pipe[name];
        if (typeof pn !== "string")
          pn = name;
        cp[name].pipe(process[pn]);
      }
      for (const name of Object.keys(backpipe)) {
        let pn = backpipe[name];
        if (typeof pn !== "string")
          pn = name;
        process[pn].pipe(cp[name]);
      }
    }).on("close", () => {
      try {
        for (const name of Object.keys(pipe)) {
          let pn = pipe[name];
          if (typeof pn !== "string")
            pn = name;
          cp[name].unpipe(process[pn]);
        }
        for (const name of Object.keys(backpipe)) {
          let pn = backpipe[name];
          if (typeof pn !== "string")
            pn = name;
          process[pn].unpipe(cp[name]);
        }
      } catch (_) { }
    });
  });
}
