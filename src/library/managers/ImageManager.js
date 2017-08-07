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
		cdn : "",
		//imageCache : {},

		init :function() {
			var self = this;
			var originalAttr = jQuery.fn.attr;

			self.cdn = "https://raw.githubusercontent.com/KC3Kai/KC3Kai/" + (localStorage.lastestCommit || "1809dc3f110f694c52f9d89dc9404c726ef1f02e") + "/src/";
			self.checkForUpdate();

			jQuery.fn.attr = function() {
				var arg = arguments;
				var jQueryObject = this;

				if(arguments.length > 1 && arguments[0] === "src") {
					var url = arg[1].replace(/(\.\.\/)+/g, "");
					//arguments[1] = self.imageCache[url] || arguments[1];
					return originalAttr.apply(this, arguments).error(function() {
						// console.log(url);
						KC3Database.getImage(url, function( dataURL ) {
							jQueryObject.unbind("error");
							if (dataURL.length === 0) {
								originalAttr.apply(jQueryObject, ["src", self.cdn + url]).error(function() {
									jQueryObject.unbind("error");
									if(arguments.length > 2)
										jQueryObject.attr("src", arguments[2]);
									else
										jQueryObject.attr("src", self.errorImage);
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
								//self.imageCache[url] = dataURL;
								originalAttr.apply(jQueryObject, ["src", dataURL[0].image]);
							}
						});
					});
				} else
					return originalAttr.apply(this, arguments);
			};
		},

		checkForUpdate :function( ){
			// TODO: clear image cache (when files get edited); pseudo code:
			// for (var version = oldVersion; version < newVersion; version++)
			// 	 switch (version)
			// 		case 1: // delete caches that changed between v1 -> v2
			// etc 
			// for now, just some simple clear everything on update
			var self = this;
			$.ajax({
				url: "https://api.github.com/repos/KC3Kai/KC3Kai/commits",
				dataType: "JSON",
				success: function(response){
					if((localStorage.lastestCommit || "0") !== response[0].sha) {
						console.log("Updating image cache latest commit");
						localStorage.lastestCommit = response[0].sha;
						self.cdn = "https://raw.githubusercontent.com/KC3Kai/KC3Kai/" + localStorage.lastestCommit + "/src/";
						//self.imageCache = {};
						KC3Database.con.images.clear();
					} else {
						/*KC3Database.con.images.toArray(function(response) {
							for(var i = 0; i < response.length; i++)
								self.imageCache[response[i].id] = response[i].image;
						});*/
					}
				}
			});
		}
	};
	window.KC3ImageManager.init();
})();
