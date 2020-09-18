#SODS
Object Server V0.1.1
functionality:

process.args - arguments object (property port by default is 80`) (dupticated to export)
console.initRead(onLine) - start reading from console and each line to function onLine (if onLine is not a function use eval) (dupticated to export)

export.dk_tools:
	formatedTime - "HH:MM:SS"

export.onRequest - pass it to http.createServer (".listen(process.args.port)")
export.create(http) - pass "require("http") as argument
export.on - object for request processing
ex:
{
	GET: {
		".": function(request, response, path, stringParams, fpath) { // yoursite.com with method GET
			responce.end("Hello, world!");
		}
	}
}

"." - root
".." - path not found
export.readOnFromFile(file)

