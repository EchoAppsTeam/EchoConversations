(function($) {
"use strict";

var createMediaContainer = function() {
	var template =
		'<div class="{plugin.class:Media}">' +
			'<div class="{plugin.class:MediaContainer}"></div>' +
		'</div>';

	addMediaCSS.call(this);

	return $(this.substitute({"template": template}));
};

var normalizeMediaContent = function(items) {
	var self = this;
	var element = createMediaContainer.call(this);
	var width = 0;

	var container = element.find("." + this.cssPrefix + "MediaContainer");
	$.map(items, function(oembed) {
		var card = prepareMediaContent.call(self, oembed);
		container.append(card);
		width += card.outerWidth(true) + 15;
	});

	container.css("width", width);

	return element;
};

var prepareMediaContent = function(oembed) {
	var templates = {
		"photo":
			'<div class="echo-media-item">' +
				'<a href="{data:url}" target="_blank">' +
					'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
				'</a>' +
			'</div>',
		"video":
			'<div class="echo-media-item">' +
				'<div class="echo-item-video-placeholder">' +
					'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
				'</div>' +
				'<div class="echo-item-play-button"></div>' +
			'</div>',
		"link":
			'<div class="echo-media-item">' +
				'<div class="echo-item-article">' +
					'<div class="echo-item-template-article-thumbnail">' +
						'<img src="{data:thumbnail_url}"/>' +
					'</div>' +
					'<div class="echo-item-template-article">' +
						'<div class="echo-item-template-article-title">' +
							'<a href="{data:url}" target="_blank">{data:title}</a>' +
						'</div>' +
						'<div class="echo-item-template-article-descriptionContainer">' +
							'<div class="echo-item-template-article-description">{data:description}</div>' +
						'</div>' +
					'</div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
			'</div>'
	};

	var height, width, item;
	var maxHeight = this.config.get("mediaHeight");

	if (oembed.type === "photo") {
		if (oembed.thumbnail_height > maxHeight) {
			var ratio = maxHeight / oembed.thumbnail_height;
			width = oembed.thumbnail_width * ratio;
			height = maxHeight;
		} else {
			width = oembed.thumbnail_width;
			height = oembed.thumbnail_height;
		}
		item = $(this.substitute({
			"template": templates[oembed.type],
			"data": oembed
		}));
	} else if (oembed.type === "video") {
		var oembedWidth = oembed.thumbnail_width || oembed.width;
		var oembedHeight = oembed.thumbnail_height || oembed.height;
		if (oembedHeight > maxHeight) {
			var ratio = maxHeight / oembedHeight;
			width = oembedWidth * ratio;
			height = maxHeight;
		} else {
			width = oembedWidth;
			height = oembedHeight;
		}

		item = $(this.substitute({
			"template": templates[oembed.type],
			"data": oembed
		}));

		if (oembed.thumbnail_url) {
			item.find(".echo-item-play-button").css({
				// TODO: get rid of this magic munbers
				"margin-top": (height / -2 -30)
			});
			item.find(".echo-item-play-button").one("click", function() {
				item.find(".echo-item-video-placeholder").html($(oembed.html).css({
					"width": width,
					"height": height
				}));
				$(this).remove();
			});
		} else {
				item.find(".echo-item-video-placeholder").html($(oembed.html).css({
					"width": width,
					"height": height
				}));
				item.find(".echo-item-play-button").remove();
		}

	} else if (oembed.type === "link") {
		height = maxHeight;
		width = maxHeight * 1.3;
		item = $(this.substitute({
			"template": templates[oembed.type],
			"data": oembed
		}));
	}

	item.css({"width": width, "height": height});

	return item;
};

var addMediaCSS = function() {
	var namespace = this.namespace + "shared";
	if (Echo.Utils.hasCSS(namespace)) return;

	var css =
		'.{plugin.class:MediaContainer} { position: relative; left: 0px; }' +
		'.{plugin.class:Media}:hover { overflow: auto; }' +
		'.{plugin.class:Media} { overflow: hidden; }' +
		'.{plugin.class:Media} { padding: 10px 5px; border: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
		'.{plugin.class:Media} .echo-media-item { background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; float: left; margin: 0 5px 0 0; padding: 4px; }' +

		// scrollbar
		'.{plugin.class:Media}::-webkit-scrollbar { height: 10px; }' +
		'.{plugin.class:Media}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
		'.{plugin.class:Media}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }' +

		// play btn
		'.{plugin.class:Media} .echo-item-play-button { position: relative; cursor: pointer; }' +
		'.{plugin.class:Media} .echo-item-play-button:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
		'.{plugin.class:Media} .echo-item-play-button { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; background-color: rgba(0, 0, 0, 0.7); border-radius: 50%; }' +
		'.{plugin.class:Media} .echo-item-play-button:hover { background-color: #3498DB; }' +

		// article
		'.{plugin.class:Media} { font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 15px; line-height: 21px;}' +
		'.{plugin.class:Media} .echo-item-template-article-title { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding: 0 0 5px 0; margin-left: 10px; }' +
		'.{plugin.class:Media} .echo-item-template-article-title a { color: #42474A; font-weight: bold; }' +
		'.{plugin.class:Media} .echo-item-template-article-title a:hover { color: #42474A; }' +
		'.{plugin.class:Media} .echo-item-template-article-thumbnail { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
		'.{plugin.class:Media} .echo-item-template-article-thumbnail img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
		'.{plugin.class:Media} .echo-item-template-article-description { margin-left: 10px; }' +
		'.{plugin.class:Media} .echo-item-template-article { width: 70%; float: left; }' +
		'.{plugin.class:Media} .echo-item-article { max-width: 300px; min-width: 200px; }';

	Echo.Utils.addCSS(this.substitute({
		"template": css
	}), namespace);
};

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolver
 * Extends Stream Item control to enable url media resoving.
 */
var plugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Stream.Item");

plugin.config = {
	"mediaHeight": 230
};

plugin.component.renderers.body = function(element) {
	var contentParts = this.component.get("data.object.content")
		.match(/(.*)(<div.+class="echo-item-files".*)/);

	if (!contentParts) {
		return this.component.parentRenderer("body", arguments);
	}

	this.component.set("data.object.content", contentParts[1]);
	this.component.parentRenderer("body", arguments);

	var fragment = $("<div/>").append(contentParts[2]);
	var media = $.map(fragment.find("div[oembed]"), function(item) {
		return JSON.parse($(item).attr("oembed"));
	});

	var textElement = this.component.view.get("text");
	if (media.length) {
		Echo.Utils.safelyExecute(textElement.append, normalizeMediaContent.call(this, media), textElement);
	} else {
		Echo.Utils.safelyExecute(textElement.append, contentParts[1], textElement);
	}

	return element;
};

plugin.methods.jsonDecode = function(text) {
	return JSON.parse(text.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;'));
};

Echo.Plugin.create(plugin);

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolver
 * Extends Submit control to enable url media resoving.
 */
var plugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Submit");

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
};

plugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this;
		var content = args.postData.content[0].object.content;

		var mediaContent = $.map(this.media, function(media) {
			if (!media.type) return null;
			return self.substitute({
				"template": plugin.templates.media[media.type],
				"data": $.extend(true, {}, media, {
					"oembed": self.jsonEncode(media)
				})
			});
		});

		if (!mediaContent.length) return;

		args.postData.content[0].object.content = self.substitute({
			"template": plugin.templates.message,
			"data": {
				"text": content,
				"media": mediaContent.join("")
			}
		});
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		this.media = {};
		this.view.get("SubmitMedia").empty();
		this.component.view.get("body").removeClass(this.cssPrefix + "EnabledMedia");
	}
};

plugin.dependencies = [{
	"url": "{%= baseURL %}/third-party/jquery.embedly.js",
	"loaded": function() { return !!$.fn.embedly; }
}];

plugin.templates.preview =
	'<div class="{plugin.class:SubmitMedia}"></div>';

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

plugin.component.renderers.text = function(element) {
	var self = this;
	element.on("keyup paste", function() {
		clearTimeout(self.timer);
		self.timer = setTimeout(function() {
			var urls = self.getURLs(element.val());
			self.resolveURLs(urls, $.proxy(self.attachMedia, self));
		}, 1000);
	});

	this.parentRenderer("text", arguments);
	return element;
};

plugin.methods.getURLs = function(text) {
	return text.match(/(https?:\/\/[^\s]+)/g) || [];
};

plugin.methods.resolveURLs = function(urls, callback) {
	var self = this;
	var unresolvedURLs = $.grep(urls, function(url) {
		if(!self.media[url]) {
			self.media[url] = {};
			return true;
		} else {
			return false;
		}
	});

	if (unresolvedURLs.length) {
		$.embedly.oembed(unresolvedURLs, {
			"query": {
				"chars": self.config.get("maxDescriptionCharacters")
				}
		}).progress(function(data) {
			self.media[data.original_url] = data;
		}).done($.proxy(callback, this));
	} else {
		callback();
	}
};

plugin.methods.jsonEncode = function(json) {
	return JSON.stringify(json)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
};

plugin.methods.attachMedia = function(data) {
	if (!data) return;
	var self = this;
	var submitMediaContainer = this.view.get("SubmitMedia");

	if (submitMediaContainer.is(":empty")) {
		var mediaContainer = createMediaContainer.call(this);
		this.view.get("SubmitMedia").append(mediaContainer);
		this.component.view.get("body").addClass(this.cssPrefix + "EnabledMedia");
	}

	var container = submitMediaContainer.find("." + this.cssPrefix + "MediaContainer");

	$.map(data, function(oembed) {
		var html = prepareMediaContent.call(self, oembed);
		var detachBtn = $(self.substitute({
			"template": '<div class="{plugin.class:Close}">&times;</div>'
		}));

		detachBtn.one("click", function() {
			var width = html.outerWidth(true);
			self.media[oembed.original_url] = {};
			html.remove();
			if (container.is(":empty")) {
				submitMediaContainer.empty();
				self.component.view.get("body").removeClass(self.cssPrefix + "EnabledMedia");
			} else {
				container.css("width", "-=" + width);
			}
		});

		html.append(detachBtn);
		var isFirstAttachments = !!container.is(":empty");
		container.prepend(html);

		var width = html.outerWidth(true);
		if (isFirstAttachments) {
			container.css("width", width);
		} else {
			container.css("width", "+=" + width);
		}
	});
};

plugin.css =
	'.{class:body}.{plugin.class:EnabledMedia} .{class:content}.{class:border} { border-bottom: none; }' +
	'.{class:body}.{plugin.class:EnabledMedia} .{plugin.class:Media} { border-top-style: dashed; }' +
	'.{class:body}.{plugin.class:EnabledMedia} .echo-media-item { position: relative; }' +
	'.{plugin.class:Close} { width: 33px; height: 33px; background: rgba(0, 0, 0, 0.7); line-height: 28px; text-align: center; font-size: 30px; border-radius: 50%; font-weight: bold; position: absolute; top: 8px; right: 8px; cursor: pointer; color: #FFF; }' +
	'.{plugin.class:Close}:hover { background: #3498DB; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
