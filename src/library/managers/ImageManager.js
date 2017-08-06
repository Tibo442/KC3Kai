/* ImageManager.js
KC3改 Images Manager

Manages images, since they are too thicc for webstore
Saves and loads to db

TODO: 
- write update changing stuff
- check if file is from chrome


Does: intercept jquery source changes
Does not: edit already-existing src tags in HTML 

when update: 
 change commit to new/changed image commit to update cdn
 update a version number somewhere
 write some delete logic in onVersionChange
*/
(function(){
	"use strict";
	
	window.KC3ImageManager = {
		errorImage : "../../../../assets/img/ui/empty.png",
		cdn : "https://cdn.rawgit.com/KC3Kai/KC3Kai/bfb05177dcea38da894c3a7d63c521b7a4df9f51/src/",

		init :function() {
			var self = this;
			var originalAttr = jQuery.fn.attr;

			jQuery.fn.attr = function() {
				var arg = arguments;
				var jQueryObject = this;

				if(arguments.length > 1 && arguments[0] === "src" && !arguments[1].startsWith(self.cdn))
					return originalAttr.apply(this, arguments).error(function() {
						var url = arg[1].replace(/(\.\.\/)+/g, "");
						// console.log(url);
						KC3Database.getImage(url, function( dataURL ) {
							if (dataURL.length === 0) {
								jQueryObject.unbind("error").attr("src", self.cdn + url).error(function() {
									if(arguments.length > 2)
										jQueryObject.unbind("error").attr("src", arguments[2]);
									else
										jQueryObject.unbind("error").attr("src", self.errorImage);
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
								jQueryObject.unbind("error").attr("src", dataURL[0].image);
							}
						});
					});
				else
					return originalAttr.apply(this, arguments);
			};
		},

		onVersionChange :function( version ){
			// TODO: clear image cache (when files get edited); pseudo code:
			// for (var version = oldVersion; version < newVersion; version++)
			// 	 switch (version)
			// 		case 1: // delete caches that changed between v1 -> v2
			// etc 
		}
	};
	window.KC3ImageManager.init();
})();
