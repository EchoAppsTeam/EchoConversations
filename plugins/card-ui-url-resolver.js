(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolving
 * Extends Stream Item control to enable url media resoving.
 */
var plugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Stream.Item");

plugin.component.renderers.body = function(element) {
	var contentParts = this.component.get("data.object.content")
		.match(/(.*)(<div.+class="echo-item-files".*)/);

	this.component.set("data.object.content", contentParts[1]);
	this.component.parentRenderer("body", arguments);

	var textElement = this.component.view.get("text");
	Echo.Utils.safelyExecute(textElement.append, contentParts[2], textElement);

	return element;
};

plugin.css =
	'.echo-streamserver-controls-stream-item-body .echo-media-item { margin: 5px 0px; }' +
	'.echo-streamserver-controls-stream-item-body .echo-item-video { position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px; }' +
	'.echo-streamserver-controls-stream-item-body .echo-item-video > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.echo-streamserver-controls-stream-item-body .echo-item-video > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
  '.echo-streamserver-controls-stream-item-body .echo-item-video > object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolving
 * Extends Submit control to enable url media resoving.
 */
var plugin = Echo.Plugin.manifest("URLResolving", "Echo.StreamServer.Controls.Submit");

plugin.config = {
	"apiKey": "8ded698289204c8c8348c08314a0c250",
	"maxDescriptionCharacters": "200",
	"mediaHeight": 230
};

plugin.init = function() {
	$.embedly.defaults.key = this.config.get("apiKey");
	this.media = {};
	this.timer = null;

	this.extendTemplate("insertAfter", "content", plugin.templates.preview);
	//JSON.parse(Echo.jQuery(".echo-media-item").eq(0).attr("oembed"));
};

plugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this;
		var content = args.postData.content[0].object.content;

		var mediaContent = $.map(this.media, function(media) {
			return self.substitute({
				"template": plugin.templates.media[media.data.type],
				"data": $.extend(true, {}, media.data, {
					"oembed": self.jsonEncode(media.data)
				})
			});
		}).join("");

		args.postData.content[0].object.content = self.substitute({
			"template": plugin.templates.message,
			"data": {
				"text": content,
				"media": mediaContent
			}
		});
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		this.media = {};
		this.view.get("MediaContainer").empty();
		this.component.view.get("body").removeClass(this.cssPrefix + "EnabledMedia");
	}
};

plugin.dependencies = [{
	"url": "{%= baseURL %}/third-party/jquery.embedly.js",
	"loaded": function() { return !!$.fn.embedly; }
}, {
	"url": "{%= baseURL %}/third-party/jquery.mousewheel.js",
	"loaded": function() { return !!$.fn.mousewheel; }
}];

plugin.templates.preview =
	'<div class="{plugin.class:Media}">' +
		'<div class="{plugin.class:MediaContainer}"></div>' +
	'</div>';

plugin.templates.message =
  '<div class="echo-item-text">{data:text}</div>' +
	'<div class="echo-item-files">{data:media}</div>';


plugin.templates.media = {
	"link": 
		'<div class="echo-media-item" oembed="{data:oembed}">' +
			'<div class="echo-item-article" style="width: {plugin.config:linkWidth}">' +
				'<div class="echo-item-template-article-thumbnail" style="width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden;">' +
					'<img src="{data:thumbnail_url}" style="width: auto; height: auto; max-height:120px; max-width:120px;" />' +
				'</div>' +
				'<div class="echo-item-template-article" style="width: 70%; float: left;">' +
					'<div class="echo-item-template-article-title" style="margin-left: 10px;">' +
						'<a href="{data:url}" target="_blank">{data:title}</a>' +
					'</div>' +
					'<div class="echo-item-template-article-descriptionContainer">' +
						'<div class="echo-item-template-article-description" style="margin-left: 10px;">{data:description}</div>' +
					'</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
		'</div>',

	"photo":
		'<div class="echo-media-item" oembed="{data:oembed}">' +
			'<a href="{data:original_url}" target="_blank">' +
				'<img src="{data:thumbnail_url}"/>' +
			'</a>' +
		'</div>',

	"video":
		'<div class="echo-media-item" oembed="{data:oembed}">' +
			'<div class="echo-item-video">{data:html}</div>' +
		'</div>'
};

plugin.renderers.MediaPreview = function(element) {
	var self = this;
	var container = self.view.get("MediaContainer");

	element.on("mousewheel", function(e) {
		var viewWidth = element.width();
		var cotentWidth = container.width();

		if (cotentWidth > viewWidth) {
			container.css("left", function(index, style) {
				var pos = parseInt(style);
				var k = e.deltaY > 0 ? 60 : -60;

				if (pos + k > 0) {
					return 0;
				} else if(pos + k < viewWidth - cotentWidth) {
					return viewWidth - cotentWidth;
				} else {
					return pos + k;
				}
			});
		}

		return false;
	});
};

plugin.component.renderers.text = function(element) {
	var self = this;

	element.on("keyup paste", function() {
		self._URLResolver(element.val());
	});

	this.parentRenderer("text", arguments);
	return element;
};

plugin.methods.jsonEncode = function(json) {
	return JSON.stringify(json).replace(/"/g, "&quot;");
};

plugin.methods._URLResolver= function(text) {
	var self = this;
	var urlRegex = /(https?:\/\/[^\s]+)/g;

	clearTimeout(this.timer);

	this.timer = setTimeout(function() {
		var matchedURLs = text.match(urlRegex);
		if (matchedURLs) {
			var unprocessedURLs = $.map(matchedURLs, function(url) {
				if (typeof self.media[url] === "undefined") {
					self.media[url] = {};
					return url;
				} else {
					return null;
				}
			});

			self.view.get("MediaPreview")
			$.embedly.oembed(unprocessedURLs, {
				"query": {
					"chars": self.config.get("maxDescriptionCharacters"),
					//"maxwidth": 300,
					//"height": 200
				}
			}).progress($.proxy(self._attachMedia, self)).done(function() {

			});
			//$.embedly.extract(unprocessedURLs).progress(function(data) {
				//console.log(data);
			//});
		}
	}, 1000);
};

plugin.methods._attachMedia = function(data) {
	var html = this._prepareMediaContent(data);
	var mediaContainer = this.view.get("MediaContainer");

	this.media[data.original_url] = {
		"data": data,
		"html": html
	};

	this.component.view.get("body").addClass(this.cssPrefix + "EnabledMedia");

	var isFirstAttachments = !!mediaContainer.find(">*").length;

	mediaContainer.prepend(html);
	//mediaContainer.css({
		//"postion": "absolute",
		//"visibility": "hidden",
		//"display": "block"
	//});
	//var width = html.outerWidth(true);
	//mediaContainer.css({
		//"postion": "",
		//"visibility": "",
		//"display": ""
	//});

	
	if (isFirstAttachments) {
		//mediaContainer.css("width", "+=" + width);
		//console.log("+", width);
	} else {
		//mediaContainer.css("width", width);
		//console.log("=", width);
	}
};

plugin.methods._prepareMediaContent = function(media) {
	this.substitute({
		"template": plugin.templates.media[media.type],
		"data": media
	});

	var mediaHeight = this.config.get("mediaHeight");
	var mediaItem, ratio;

	if (media.type === "video") {
		if (media.thumbnail_height > mediaHeight) {
			ratio = mediaHeight / media.thumbnail_height;
			media = $.extend(true, {}, media, {
				"thumbnail_width": media.thumbnail_width * ratio,
				"thumbnail_height": mediaHeight
			});
		}
		mediaItem = $(this.substitute({
			"template": plugin.templates.media["video"],
			"data": media
		}));
	}

	if (media.type === "photo") {
		if (media.thumbnail_height > mediaHeight) {
			ratio = mediaHeight / media.thumbnail_height;
			media = $.extend(true, {}, media, {
				"thumbnail_width": media.thumbnail_width * ratio,
				"thumbnail_height": mediaHeight
			});
		}
		mediaItem = $(this.substitute({
			"template": plugin.templates.media["photo"],
			"data": media
		}));
	}

	if (media.type === "link") {
		mediaItem = $(this.substitute({
			"template": plugin.templates.media["link"],
			"data": media
		}));
	}

	return mediaItem;
};

plugin.css =
	'.{class:body}.{plugin.class:EnabledMedia} .{class:content}.{class:border} { border-bottom: none; }' +
	'.{class:body}.{plugin.class:EnabledMedia} .{plugin.class:Media} { padding: 5px; border: 1px solid #D2D2D2; background-color: #E7E7E7; }' +
	'.{plugin.class:Media} { overflow: hidden; }' +
	'.{plugin.class:Media} .echo-media-item { background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom: 2px solid #D2D2D2; }' +
	//'.{plugin.class:MediaPreview} .echo-media-item:last-child { margin-right: 0px; }' +
	'.{plugin.class:MediaContainer} { position: relative; left: 0px; transition: left 0.2s; -webkit-transition: left 0.2s }' +
	'.{plugin.class:EnabledMedia} .echo-item-template-article-title { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding: 0 0 5px 0; }' +
	'.{plugin.class:EnabledMedia} { font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 15px; line-height: 21px;}' +
	'.{plugin.class:EnabledMedia} .echo-item-template-article-title a { color: #42474A; font-weight: bold; }' +
	'.{plugin.class:EnabledMedia} .echo-item-template-article-title a:hover { color: #42474A; }' +
	
	'.{plugin.class:EnabledMedia} .echo-media-item { margin: 5px 0px; }' +
	'.{plugin.class:EnabledMedia} .echo-item-video { position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px; }' +
	'.{plugin.class:EnabledMedia} .echo-item-video > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class:EnabledMedia} .echo-item-video > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
  '.{plugin.class:EnabledMedia} .echo-item-video > object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }';

//'.{plugin.class:EnabledMedia} .echo-item-video { position: relative; cursor: pointer; }' +
	// play btn
	//'.echo-item-video:after { content: ""; position: absolute; top: 43%; left: 46%; border-width: 12.5px 0px 12.5px 24px; border-color: rgba(0, 0, 0, 0) rgba(0, 0, 0, 0) rgba(0, 0, 0, 0) #FFF; border-style: solid;}' +
	//'.echo-item-video:before { content: ""; position: absolute; top: 40%; left: 40%; width: 60px; height: 40px; background-color: rgba(0, 0, 0, 0.7); border-radius: 5px; }' +
	//'.echo-item-video:hover:before { background-color: #3498DB; }' +

Echo.Plugin.create(plugin);

})(Echo.jQuery);
