/* ImageManager.js
KC3改 Images Manager

Manages images, since they are too thicc for webstore
Saves and loads to db

Does: intercept jquery source changes
Does not: edit already-existing src tags in HTML 
*/
(function(){
	"use strict";
	
	window.KC3ImageManager = {
		errorImage : "../../../../assets/img/ui/empty.png",
		cdn : "https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/",

		init :function() {
			var self = this;
			var originalAttr = jQuery.fn.attr;

			jQuery.fn.attr = function() {
				var arg = arguments;
				var jqElem = this;

				if(arguments.length > 1 && arguments[0] === "src") {
					var url = arg[1].replace(/(\.\.\/)+/g, "");
					if(url.startsWith("assets/")) {
						if(url === jqElem.attr("osrc")) 
							// stops reloading of images that don't change (for dev panel, prevents "flashing")
							return jqElem;
						return originalAttr.apply(this, arguments).error(function() {
							// console.log(url);
							KC3Database.getImage(url, function( dataURL ) {
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
										KC3Database.addImage({
											id: url,
											image: dataURL
										});
									});
								} else {
									originalAttr.apply(jqElem, ["src", dataURL[0].image]);
									originalAttr.apply(jqElem, ["osrc", url]);
								}
							});
						});
					}
				} 
				return originalAttr.apply(this, arguments);
			};
		},

		checkForUpdate :function( assetsVersion ){
			var self = this;
			if((localStorage.assetsVersion || "0") === assetsVersion) 
				return;
			localStorage.assetsVersion = assetsVersion;

			console.log("Clearing image cache");
			KC3Database.con.images.clear();
		}
	};
	window.KC3ImageManager.init();
})();
