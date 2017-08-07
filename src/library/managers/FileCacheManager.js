/* FileCacheManager.js
KC3改 Files Manager

Saves and loads some assets/data files to db when they are updated on site but not locally

Does: intercept jquery source changes
Does not: edit already-existing src tags in HTML 
*/
(function(){
	"use strict";
	
	window.KC3FileCacheManager = {
		errorImage : "../../../../assets/img/ui/empty.png",
		cdn : "https://raw.githubusercontent.com/Tibo442/KC3Kai/master/src/",

		initImageHandler :function() {
			var self = this;
			var originalAttr = jQuery.fn.attr;

			jQuery.fn.attr = function() {
				var arg = arguments;
				var jqElem = this;

				if(arguments.length > 1 && arguments[0] === "src") {
					var url = arg[1].replace(/(\.\.\/)+/g, "");
					if(url.startsWith("assets/img/")) {
						if(url === jqElem.attr("osrc")) 
							// stops reloading of images that don't change (for dev panel, prevents "flashing")
							return jqElem;
						return originalAttr.apply(this, arguments).error(function() {
							// console.log(url);
							KC3Database.getCache(url, function( dataURL ) {
								jqElem.unbind("error");
								if (dataURL.length === 0) {
									originalAttr.apply(jqElem, ["src", self.cdn + url]).error(function() {
										jqElem.unbind("error");
										originalAttr.apply(jqElem, ["osrc", url]);
										if(arguments.length > 2)
											jqElem.attr("src", arguments[2]);
										else
											jqElem.attr("src", self.errorImage);
									}).load(function() {
										var canvas = document.createElement('CANVAS');
										var ctx = canvas.getContext('2d');
										var dataURL;
										canvas.height = this.naturalHeight;
										canvas.width = this.naturalWidth;
										ctx.drawImage(this, 0, 0);
										dataURL = canvas.toDataURL();
										KC3Database.addCache({
											id: url,
											data: dataURL
										});
									});
								} else {
									originalAttr.apply(jqElem, ["src", dataURL[0].data]);
									originalAttr.apply(jqElem, ["osrc", url]);
								}
							});
						});
					}
				} 
				return originalAttr.apply(this, arguments);
			};
		},

		loadSubMeta :function (meta, location, datalocation) {
			var self = this;

			KC3Database.getCache(datalocation, function( foundData ) {
				if (foundData.length === 0) {
					$.ajax({
						url: self.cdn + "data/" + datalocation,
						success: function(response) {
							meta[location] = JSON.parse(response);
							KC3Database.addCache({
								id: datalocation,
								data: response
							});
						}
					});
				} else {
					meta[location] = JSON.parse(foundData[0].data);
				}
			});
		},

		loadMeta :function ( meta ){
			var self = this;

			if(JSON.parse($.ajax('chrome-extension://'+chrome.runtime.id+'/data/version.json', { async: false }).responseText).version === localStorage.assetsVersion)
				return;

			KC3FileCacheManager.loadSubMeta(meta, "_icons", "icons.json");
			KC3FileCacheManager.loadSubMeta(meta, "_exp", "exp_hq.json");
			KC3FileCacheManager.loadSubMeta(meta, "_exp_ship", "exp_ship.json");
			KC3FileCacheManager.loadSubMeta(meta, "_gauges", "gauges.json");
			KC3FileCacheManager.loadSubMeta(meta, "_defeq", "defeq.json");
			KC3FileCacheManager.loadSubMeta(meta, "_edges", "edges.json");
			KC3FileCacheManager.loadSubMeta(meta, "_nodes", "nodes.json");
			KC3FileCacheManager.loadSubMeta(meta, "_tpmult", "tp_mult.json");
			KC3FileCacheManager.loadSubMeta(meta, "_gunfit", "gunfit.json");
		},

		checkForUpdate :function( assetsVersion ){
			var self = this;
			if((localStorage.assetsVersion || "0") === assetsVersion) 
				return;
			localStorage.assetsVersion = assetsVersion;

			console.log("Clearing file cache");
			KC3Database.con.filecaches.clear();
			// self.loadMeta(KC3Meta);
		}
	};
	window.KC3FileCacheManager.initImageHandler();
})();
