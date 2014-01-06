(function($) {
"use strict";

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
	'<div class="{plugin.class:mediaContentContainer}">' +
		'<div class="{plugin.class:mediaContent}"></div>' +
	'</div>';

itemPlugin.init = function() {
	this.extendTemplate("insertAfter", "body", itemPlugin.templates.media);
	this._prepareMediaContent();
};

itemPlugin.component.renderers.body = function() {
	this._prepareMediaContent();
	return this.parentRenderer("body", arguments);
};

itemPlugin.renderers.mediaContent = function(element) {
	var self = this;
	var media = this.get("media", []);
	element
		.empty()
		.css("width", (this.config.get("mediaWidth") + 16) * media.length);
	$.map(media, function(item) {
		var container = $("<div>");
		new Echo.Conversations.NestedCard({
			"target": container,
			"data": item,
			"context": self.config.get("context"),
			"width": self.config.get("mediaWidth")
		});
		element.append(container);
	});
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
	var media = this.view.get("mediaContentContainer");
	if (media && media.is(":visible")) {
		this.config.set("mediaWidth", media.outerWidth() * 0.9);
		this.view.render({"name": "mediaContent"});
	}
};

itemPlugin.css =
	'.{plugin.class:mediaContentContainer} { overflow-y: hidden; overflow-x: auto; margin-bottom: 5px; }' +
	'.{class:depth-0} .{plugin.class:mediaContentContainer} { margin-left: -16px; margin-right: -16px; }' +

	'.{plugin.class:mediaContentContainer} { padding: 8px; border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +

	'.{plugin.class:mediaContent} > div { float: left; }' +

	// scrollbar
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar { height: 10px; }' +
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }';

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
				"text": args.postData.content[0].object.content,
				"media": mediaContent.join("")
			}
		});
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		this.media = {};
		this.view.get("mediaContent").empty();
		this.component.view.get("body").removeClass(this.cssPrefix + "enabledMedia");
	}
};

submitPlugin.dependencies = [{
	"url": "{%= baseURL %}/third-party/jquery.embedly.js",
	"loaded": function() { return !!$.fn.embedly; }
}];

submitPlugin.templates.preview =
	'<div class="{plugin.class:mediaContentContainer}">' +
		'<div class="{plugin.class:mediaContent}"></div>' +
	'</div>';

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

	var mediaContentContainer = this.view.get("mediaContentContainer");
	var container = this.view.get("mediaContent");
	var body = this.component.view.get("body");
	var maxWidth = mediaContentContainer.width() * 0.9;

	$.map(data, function(oembed) {
		body.addClass(self.cssPrefix + "enabledMedia");
		var html = $("<div>");
		var card = new Echo.Conversations.NestedCard({
			"target": html,
			"context": self.config.get("context"),
			"width": maxWidth,
			"data": oembed
		});
		var detachBtn = $(self.substitute({
			"template": '<div class="{plugin.class:Close}">&times;</div>'
		}));

		detachBtn.one("click", function() {
			self.media[oembed.original_url] = {};
			card.destroy();
			html.remove();
			if (container.is(":empty")) {
				body.removeClass(self.cssPrefix + "enabledMedia");
			}
		});
		if (container.is(":empty")) {
			container.css("width", maxWidth + 16); // + item margins
		} else {
			container.css("width", "+=" + (maxWidth + 16)); // + item margins
		}

		html.append(detachBtn);

		container.append(html);
	});
};

submitPlugin.css =
	'.{class:body}.{plugin.class:enabledMedia} .{class:content}.{class:border} { border-bottom: none; }' +
	'.{class:body}.{plugin.class:enabledMedia} .{plugin.class:mediaContentContainer} { overflow-y: hidden; overflow-x: auto; border: 1px solid #DEDEDE; border-top-style: dashed; background-color: #F1F1F1; padding: 10px 5px; }' +

	'.{plugin.class:Close} { line-height: 1; opacity: 0.7; filter: alpha(opacity=70); font-size: 30px; font-weight: bold; position: absolute; top: 4px; right: 8px; cursor: pointer; color: #FFF; text-shadow: 0 0 1px #000; }' +
	'.{plugin.class:Close}:hover { opacity: 1; filter: alpha(opacity=100); }' +

	'.{plugin.class:mediaContent} > div { float: left; position: relative; }' +

	// scrollbar
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar { height: 10px; }' +
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{plugin.class:mediaContentContainer}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }';

Echo.Plugin.create(submitPlugin);

})(Echo.jQuery);
