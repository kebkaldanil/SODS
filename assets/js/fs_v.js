//v1.1.0

const pathNormalizeRegExp = /^\/+|\/+$|\/+(?=\/)/g;

const formatpath = p => p.replace(pathNormalizeRegExp, "");

$(async () => {
	const viewer = $("#viewer");
	const viewer_container = $("#viewer_container");
	const viewer_close = $("#viewer_close");
	const viewer_move = $("#viewer_move");
	const viewer_resize = $("#viewer_resize");
	const files = $("#files");
	const back = $("#back");
	const back_row = $(".row");

	const loadpage = (path = location.pathname) => {
		path = formatpath(path);
		const pathInDir = path.replace("directory", "");
		window.history.pushState(path, `directory "${pathInDir}"`, path = `/${path}/`);
		$.getJSON(path + "?query=dir", jsonObj => {
			files.empty().append(back_row);
			jsonObj.sort((a, b) => (a.endsWith('/') && -1) + (b.endsWith('/') && 1));
			$.each(jsonObj, (index, file) => {
				const isDirectory = file.endsWith('/');
				const href = `/${isDirectory ? "directory" : "file"}${pathInDir}/${isDirectory ? file.slice(0, -1) : file}`;
				files.append(`<div class="row fr-${index & 1}"><div class="col"><a class="file" href="${href}">${file}</a></div><div class="col-auto download"><a href="${href}?download" download>Download</a></div><div class="col-auto">${isDirectory ? "" : `<a index="${index}" class="m3ugen" href>Generate m3u</a>`}</div></div>`);
			});

			$(".file").click(e => {
				e.preventDefault();

				const target = $(e.target);

				if (target.html().endsWith('/') || target.attr("id") == "back")
					return loadpage(target.attr("href"));
				viewer.attr("src", target.attr("href"));
				viewer_container.show();
				setTimeout(function () {
					if (!viewer[0].contentDocument.body || viewer[0].contentDocument.body === "")
						viewer_container.hide();
				}, 100);
			});

			/*$(".download > a").click(({ target }) => {
				target = $(target);
				const blob = new Blob();
				target.attr({
					href: URL.createObjectURL(blob),
					download: pathInDir.slice(pathInDir.lastIndexOf('/') + 1) + ".zip"
				});
			});*/

			$(".m3ugen").click(({ target }) => {
				target = $(target);
				const blob = new Blob([jsonObj.filter((x, i) => i >= +target.attr("index") && !x.endsWith('/')).map(x => (location.href.replace("directory", "file") + x).replace(/ /g, '%20').replace(/\[/g, '%5B').replace(/\]/g, '%5D')).join("\n")], { type: "application/octet-binary" });
				target.attr({
					href: URL.createObjectURL(blob),
					download: pathInDir.slice(pathInDir.lastIndexOf('/') + 1) + ".m3u"
				});
			});
		});
		if (pathInDir == "")
			back_row.hide();
		else {
			back.attr("href", "/directory" + pathInDir.slice(0, pathInDir.lastIndexOf('/')));
			back_row.show();
		}
	};

	const disableFrameEvents = (onenable = null) => {
		window.onmouseup = (() => {
			document.onmousemove = null;
			window.onmouseup = null;
			viewer.css("pointer-events", "auto");
			if (onenable)
				onenable();
		});
		viewer.css("pointer-events", "none");
	};

	const disableFrameEventsT = (onenable = null) => {
		window.ontouchend = (() => {
			document.ontouchmove = null;
			window.ontouchend = null;
			viewer.css("pointer-events", "auto");
			if (onenable)
				onenable();
		});
		viewer.css("pointer-events", "none");
	};

	const goBack = () => history.back();
	const goForward = () => history.forward();

	loadpage();
	window.addEventListener("popstate", e => loadpage(e.state));
	viewer_container.hide();
	if (/Mobi|Android/i.test(navigator.userAgent)) {
		viewer_move.on("touchstart", ev => {
			const t = ev.targetTouches[0];
			const ec = viewer_container.offset();
			const touchstart = {
				top: ec.top - t.clientY,
				left: ec.left - t.clientX
			};
			document.ontouchmove = ev => {
				viewer_container.offset(g = {
					top: touchstart.top + ev.changedTouches[0].clientY,
					left: touchstart.left + ev.changedTouches[0].clientX
				});
				disableFrameEventsT();
			}
		});
		viewer_resize.on("touchstart", ev => {
			const t = ev.targetTouches[0];
			const touchstart = {
				top: viewer_container.height() - t.clientY,
				left: viewer_container.width() - t.clientX
			};
			document.ontouchmove = ev => {
				viewer_container.width(touchstart.left + ev.changedTouches[0].clientX);
				viewer_container.height(touchstart.top + ev.changedTouches[0].clientY);
			};
			disableFrameEventsT();
		});
		viewer_container.on("touchstart", ev => ev.srcElement != viewer_move && ev.srcElement != viewer_resize && disableFrameEventsT());
	} else {
		viewer_move.mousedown(ev => {
			if (ev.button == 0)
				document.onmousemove = ev => {
					ev.preventDefault();
					const pos = viewer_container.offset();
					viewer_container.offset({
						top: pos.top + ev.movementY,
						left: pos.left + ev.movementX
					});
					disableFrameEvents();
				}
		});
		viewer_resize.mousedown(ev => {
			if (ev.button == 0) {
				document.onmousemove = ev => {
					ev.preventDefault();
					viewer_container.width(viewer_container.width() + ev.movementX);
					viewer_container.height(viewer_container.height() + ev.movementY);
				};
				disableFrameEvents();
			}
		});
		viewer_container.mousedown(ev => ev.button == 0 && ev.srcElement != viewer_move && ev.srcElement != viewer_resize && disableFrameEvents());
	}
	viewer_close.click(ev => {
		viewer_container.hide();
		viewer.attr("src", "");
	});
});
document.title = location.pathname.slice(location.pathname.lastIndexOf("/", location.pathname.length - 1) + 1);