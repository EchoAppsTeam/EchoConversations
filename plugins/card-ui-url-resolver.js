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
		width += card.outerWidth(true) + 30;
	});
	container.css("width", width);

	return element;
};

var prepareMediaContent = function(oembed) {
	var self = this;
	var templates = {
		"photo":
			'<div class="echo-media-item">' +
				'<div class="echo-item-photo">' +
					'<div class="echo-item-photo-avatar"><img src="{config:defaultAvatar}"/>{data:author_name}</div>' +
					'<a href="{data:url}" target="_blank">' +
						'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</a>' +
					'<div class="echo-item-photo-label">' +
						'<div class="echo-item-photo-label-container">' +
							'<div class="echo-item-title">{data:title}</div>' +
							'<div class="echo-item-description">{data:description}</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="echo-item-source-icon" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
			'</div>',
		"video":
			'<div class="echo-media-item">' +
				'<div class="echo-item-video">' +
					'<div class="echo-item-video-avatar"><img src="{config:defaultAvatar}"/>{data:author_name}</div>' +
					'<div class="echo-item-video-placeholder">' +
						'<div class="echo-item-play-button"></div>' +
						'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</div>' +
					'<div class="echo-item-title">{data:title}</div>' +
					'<div class="echo-item-description">{data:description}</div>' +
					'<div class="echo-item-source-icon" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
				'</div>' +
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

	var dimensions, item, ratio;
	var maxWidth = this.config.get("mediaWidth");

	if (oembed.thumbnail_width > maxWidth) {
		ratio = maxWidth / oembed.thumbnail_width;
		dimensions = {
			"width": maxWidth,
			"height": oembed.thumbnail_height * ratio
		};
	} else {
		ratio = maxWidth / oembed.width;
		dimensions = {
			"width": maxWidth,
			"height": oembed.height * ratio
		};
	}

	var getElementByType = function(oembed, dimensions) {
		return $(self.substitute({
			"template": templates[oembed.type],
			"data": oembed
		})).css({"width": dimensions.width});
	};

	if (oembed.type === "photo") {
		if (!oembed.thumbnail_url || oembed.thumbnail_width < maxWidth) {
			oembed.thumbnail_url = oembed.url;
		}
		item = getElementByType(oembed, dimensions);
	} else if (oembed.type === "video") {
		item = getElementByType(oembed, dimensions);
		if (oembed.thumbnail_url) {
			item.find(".echo-item-play-button").one("click", function() {
				item.find(".echo-item-video-placeholder").html($(oembed.html).css({
					"width": dimensions.width,
					"height": dimensions.height
				}));
			});
		} else {
			item.find(".echo-item-video-placeholder").html($(oembed.html).css({
				"width": dimensions.width,
				"height": dimensions.height
			}));
		}

	} else if (oembed.type === "link") {
		item = getElementByType(oembed, {
			"width": maxWidth,
			"height": ""
		});
	}

	return item;
};

var addMediaCSS = function() {
	var namespace = this.namespace + "shared";
	if (Echo.Utils.hasCSS(namespace)) return;

	var css =
		'.{plugin.class:MediaContainer} { position: relative; left: 0px; }' +
		'.{plugin.class.Media} .echo-item-source-icon {}' +
		'.{plugin.class:Media}:hover { overflow: auto; }' +
		'.{plugin.class:Media} { overflow: hidden; }' +
		'.{plugin.class:Media} { padding: 8px; border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
		'.{plugin.class:Media} .echo-media-item { width: 90%; background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; float: left; margin: 0 8px 0 0; }' +

		'.{plugin.class.Media} .echo-item-title { font-weight: bold; font-size: 13px; line-height: 16px; margin: 5px 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
		'.{plugin.class.Media} .echo-item-description { font-size: 13px; line-height: 16px; }' +

		// scrollbar
		'.{plugin.class:Media}::-webkit-scrollbar { height: 10px; }' +
		'.{plugin.class:Media}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
		'.{plugin.class:Media}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }' +

		// photo
		'.{plugin.class:Media} .echo-item-photo-avatar > img { width: 28px; height: 28px; border-radius: 50%; margin-right: 6px; }' +
		'.{plugin.class:Media} .echo-item-photo-avatar { position: absolute; padding: 12px; color: #FFF; }' +
		'.{plugin.class:Media} .echo-item-photo { position: relative; }' +
		'.{plugin.class:Media} .echo-item-photo-label { position: absolute; bottom: 0; color: #FFF; width: 100%; background: rgba(0, 0, 0, 0.5); }' +
		'.{plugin.class:Media} .echo-item-photo-label-container { padding: 10px; }' +

		// play btn
		'.{plugin.class:Media} .echo-item-video-placeholder { position: relative; }' +
		'.{plugin.class:Media} .echo-item-play-button-container { position: absolute; top: 0; left: 0; }' +
		'.{plugin.class:Media} .echo-item-play-button { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; }' +
		'.{plugin.class:Media} .echo-item-play-button:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
		'.{plugin.class:Media} .echo-item-play-button { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; background-color: rgba(0, 0, 0, 0.7); border-radius: 50%; }' +
		'.{plugin.class:Media} .echo-item-play-button:hover { background-color: #3498DB; }' +

		// video
		'.{plugin.class.Media} .echo-item-video { padding: 10px; }' +
		'.{plugin.class.Media} .echo-item-video-avatar { margin-bottom: 8px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
		'.{plugin.class.Media} .echo-item-video-avatar > img { width: 28px; height: 28px; border-radius: 50%; margin-right: 6px; }' +

		// article
		'.{plugin.class.Media} .echo-item-article { padding: 10px; }' +
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
var itemPlugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Stream.Item");

itemPlugin.events = {
	"Echo.StreamServer.Controls.Stream.onReady": function() {
		this._resizeMediaContent();
	},
	"Echo.StreamServer.Controls.Stream.Item.onRender": function() {
		this._resizeMediaContent();
	},
	"Echo.StreamServer.Controls.Stream.Item.onReady": function() {
		this._resizeMediaContent();
	}
};

itemPlugin.config = {
	"mediaWidth": 340
};

itemPlugin.vars = {
	"media": []
};

itemPlugin.templates.media =
	'<div class="{plugin.class:mediaContent}"></div>';

itemPlugin.init = function() {
	this.extendTemplate("insertAfter", "body", itemPlugin.templates.media);
	this._prepareMediaContent();
};

itemPlugin.component.renderers.body = function() {
	this._prepareMediaContent();
	return this.parentRenderer("body", arguments);
};

itemPlugin.renderers.mediaContent = function(element) {
	element.empty();
	if (this.get("media")) {
		element.append(normalizeMediaContent.call(this, this.get("media")));
	}
	return element;
};

itemPlugin.methods._prepareMediaContent = function() {
	var self = this;
	var item = this.component;
	Echo.Utils.safelyExecute(function() {
		var fragment = $("<div/>").append(item.get("data.object.content"));
		var attachments = fragment.find(".echo-item-files");
		var media = $.map(attachments.find("div[oembed]"), function(item) {
			return JSON.parse($(item).attr("oembed"));
		});
		if (media.length) {
			attachments.remove();
			item.set("data.object.content", fragment.html());
			self.set("media", media);
		}
	});

};

itemPlugin.methods._resizeMediaContent = function() {
	var media = this.view.get("mediaContent");
	if (media && media.is(":visible")) {
		this.config.set("mediaWidth", media.outerWidth() * 0.9);
		this.view.render({"name": "mediaContent"});
	}
};

itemPlugin.css =
	'.{plugin.class:mediaContent} { margin-left: -16px; margin-right: -16px; }';

Echo.Plugin.create(itemPlugin);

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolver
 * Extends Submit control to enable url media resoving.
 */
var submitPlugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Submit");

submitPlugin.config = {
	"apiKey": "8ded698289204c8c8348c08314a0c250",
	"maxDescriptionCharacters": "200",
	"mediaWidth": 230
};

submitPlugin.init = function() {
	$.embedly.defaults.key = this.config.get("apiKey");
	this.media = {};
	this.timer = null;

	this.extendTemplate("insertAfter", "content", submitPlugin.templates.preview);
};

submitPlugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this;
		var content = args.postData.content[0].object.content;

		var mediaContent = $.map(this.media, function(media) {
			if (!media.type) return null;
			return self.substitute({
				"template": submitPlugin.templates.media[media.type],
				"data": $.extend(true, {}, media, {
					"oembed": self.jsonEncode(media)
				})
			});
		});

		if (!mediaContent.length) return;

		args.postData.content[0].object.content = self.substitute({
			"template": submitPlugin.templates.message,
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

submitPlugin.dependencies = [{
	"url": "{%= baseURL %}/third-party/jquery.embedly.js",
	"loaded": function() { return !!$.fn.embedly; }
}];

submitPlugin.templates.preview =
	'<div class="{plugin.class:SubmitMedia}"></div>';

submitPlugin.templates.message =
  '<div class="echo-item-text">{data:text}</div>' +
	'<div class="echo-item-files">{data:media}</div>';


submitPlugin.templates.media = {
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

submitPlugin.component.renderers.text = function(element) {
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

submitPlugin.methods.getURLs = function(text) {
	return text.match(/(https?:\/\/[^\s]+)/g) || [];
};

submitPlugin.methods.resolveURLs = function(urls, callback) {
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

submitPlugin.methods.jsonEncode = function(json) {
	return JSON.stringify(json)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
};

submitPlugin.methods.attachMedia = function(data) {
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

submitPlugin.css =
	'.{class:body}.{plugin.class:EnabledMedia} .{class:content}.{class:border} { border-bottom: none; }' +
	'.{class:body}.{plugin.class:EnabledMedia} .{plugin.class:Media} { border: 1px solid #DEDEDE; border-top-style: dashed; }' +
	'.{class:body}.{plugin.class:EnabledMedia} .echo-media-item { position: relative; }' +
	'.{plugin.class:Media} .echo-item-template-article-title { margin-right: 25px; }' +
	'.{plugin.class:Close} { line-height: 1; opacity: 0.7; filter: alpha(opacity=70); font-size: 30px; font-weight: bold; position: absolute; top: 8px; right: 15px; cursor: pointer; color: #FFF; text-shadow: 0 0 1px #000; }' +
	'.{plugin.class:Close}:hover { opacity: 1; filter: alpha(opacity=100); }';

Echo.Plugin.create(submitPlugin);

})(Echo.jQuery);
