(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolver
 * Extends Stream Item control to enable url media resoving.
 */
var itemPlugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Stream.Item");

itemPlugin.vars = {
	"media": [],
	"content": undefined
};

itemPlugin.templates.media = '<div class="{plugin.class:mediaContent}"></div>';

itemPlugin.init = function() {
	this.extendTemplate("insertAsLastChild", "data", itemPlugin.templates.media);
};

itemPlugin.component.renderers.body = function(element) {
	var self = this;
	var item = this.component;
	var original = item.get("data.object.content");

	var needToRemoveCards  = false;

	$.map(item.config.get("data.object.objectTypes"), function(type) {
		if (type && /\/(article|image)$/.test(type)) {
			needToRemoveCards = true;
		}
	});

	var content = $("<div/>").append(original);

	if (needToRemoveCards) {
		var truncatedContent = $(original);
		$.map(truncatedContent.children("div[oembed], div[data-oembed]"), function(child) {
			child.remove();
		});
		content = $("<div/>").append(truncatedContent);
	}

	Echo.Utils.safelyExecute(function() {
		var media = self._getMediaAttachments();
		var text = $(".echo-item-text", content);
		if (media.length && text.length) {
			item.set("data.object.content", text.html());
		} else if (needToRemoveCards && !text.length) {
			// TODO: This is handler for situation then we have
			// <media:content type="image/jpeg" ...> in article.
			// In this case we shelln`t display any attachments
			item.set("data.object.content", content.html());
		}
	});

	this.parentRenderer("body", arguments);

	item.set("data.object.content", original);

	return element;
};

itemPlugin.renderers.mediaContent = function(element) {
	var media = this._getMediaAttachments();
	new Echo.Conversations.MediaContainer(this.config.assemble({
		"target": element.empty(),
		"data": media
	}));
	return element.addClass(this.cssPrefix + (media.length > 1 ? "multiple" : "single"));
};

itemPlugin.methods._getMediaAttachments = function() {
	var item = this.component;
	if (this.get("content") !== item.get("data.object.content") || typeof this.get("media") === "undefined") {
		var result = [];
		Echo.Utils.safelyExecute(function() {
			var content = $("<div/>").append(item.get("data.object.content"));
			result = $("div[oembed], div[data-oembed]", content).map(function() {
				return $.parseJSON($(this).attr("oembed") || $(this).attr("data-oembed"));
			}).get();
		});
		this.set("content", item.get("data.object.content"));
		this.set("media", result);
	}
	return this.get("media", []);
};

itemPlugin.css =
	'.{class:depth-0} .{plugin.class:mediaContent}.{plugin.class:multiple} { margin-left: -16px; margin-right: -16px; }' +
	'.{class:depth-0} .{plugin.class:mediaContent} { margin-bottom: 0px; }' +
	'.{plugin.class:mediaContent}.{plugin.class:multiple} > div { border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
	'.{plugin.class:mediaContent} { margin-bottom: 8px; }';

Echo.Plugin.create(itemPlugin);

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.URLResolver
 * Extends Submit control to enable url media resoving.
 */
var submitPlugin = Echo.Plugin.manifest("URLResolver", "Echo.StreamServer.Controls.Submit");

submitPlugin.config = {
	"embedlyAPIKey": "5945901611864679a8761b0fcaa56f87",
	"maxDescriptionCharacters": "200",
	"resolveURLs": "all" // all, disabled, only-roots, only-children
};

submitPlugin.init = function() {
	var self = this;
	this.set("resolvedMedia", {});
	this.set("definedMedia", []);
	this.set("timer", null);

	$.embedly.defaults.key = this.config.get("embedlyAPIKey");

	self.set("definedMedia", this._getMediaAttachments());

	this.extendTemplate("insertAfter", "content", submitPlugin.templates.preview);
};

submitPlugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostError": function(topic, args) {
		this._restoreTextarea();
	},
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this;
		var mediaContent = $.map($.extend({}, this.get("resolvedMedia"), this.get("definedMedia")), function(media) {
			var template = submitPlugin.templates.media[media.type];
			if (!template) return null;
			return self.substitute({
				"template": template,
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
		this._replaceTextarea();
		this.component.view.get("text").val(args.postData.content[0].object.content);
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		this.set("resolvedMedia", {});
		this.set("definedMedia", []);
		this.view.get("mediaContent").empty();
		this.component.view.get("body").removeClass(this.cssPrefix + "enabledMedia");
		this._restoreTextarea();
	}
};

submitPlugin.dependencies = [{
	"url": "{%= baseURL %}/third-party/jquery.embedly.js",
	"loaded": function() { return !!$.fn.embedly; }
}];

submitPlugin.templates.preview = '<div class="{plugin.class:mediaContent}"></div>';

submitPlugin.templates.message =
  '<div class="echo-item-text">{data:text}</div>' +
	'<div class="echo-item-files">{data:media}</div>';


submitPlugin.templates.media = {
	"link":
		'<div class="echo-media-item" data-oembed="{data:oembed}">' +
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
		'<div class="echo-media-item" data-oembed="{data:oembed}">' +
			'<a href="{data:original_url}" target="_blank">' +
				'<img src="{data:thumbnail_url}"/>' +
			'</a>' +
		'</div>',

	"video":
		'<div class="echo-media-item" data-oembed="{data:oembed}">' +
			'<div class="echo-item-video">{data:html}</div>' +
		'</div>'
};

submitPlugin.component.renderers.text = function(element) {
	var self = this;
	var item = this.component;

	function isRootItem() {
		return item.get("data.object.id") === item.get("data.target.conversationID");
	}

	if (this.config.get("resolveURLs") === "all" ||
			this.config.get("resolveURLs") === "only-roots" && isRootItem() ||
			this.config.get("resolveURLs") === "only-children" && !isRootItem()) {
		element.on("keyup paste", function() {
			clearTimeout(self.timer);
			self.timer = setTimeout(function() {
				var urls = self.getURLs(element.val());
				self.resolveURLs(urls, $.proxy(self.attachMedia, self));
			}, 1000);
		});
	}

	var original = item.get("data.object.content");

	Echo.Utils.safelyExecute(function() {
		var content = $("<div/>").append(item.get("data.object.content"));
		var media = self._getMediaAttachments();
		var text = $(".echo-item-text", content);
		if (media.length && text.length) {
			item.set("data.object.content", text.html());
		}
	});

	this.parentRenderer("text", arguments);
	item.set("data.object.content", original);

	return element;
};

function oembedInArray(oembed, array) {
	var result = -1;
	var oembedJSON = JSON.stringify(oembed);
	$.each(array, function(i, val) {
		if (oembedJSON === JSON.stringify(val)) {
			result = i;
			return false;
		}
	});
	return result;
}

submitPlugin.renderers.mediaContent = function(element) {
	element.empty();
	this.attachMedia(this.get("definedMedia"));
	return element;
};

submitPlugin.methods._replaceTextarea = function() {
	// workflow for Edit Plugin
	var content = this.component.view.get("text").val();
	var clone = this.component.view.get("text").clone().val(content);
	this.component.view.get("text").hide().parent().append(clone);
	this.set("textareaClone", clone);
};

submitPlugin.methods._restoreTextarea = function() {
	var clone = this.get("textareaClone");
	if (clone) {
		this.component.view.get("text").val(clone.val()).show();
		this.set("textareaClone", null);
		clone.remove();
	}
};

submitPlugin.methods._getMediaAttachments = function() {
	var item = this.component;
	if (this.get("content") !== item.get("data.object.content") || typeof this.get("media") === "undefined") {
		var result = [];
		Echo.Utils.safelyExecute(function() {
			var content = $("<div/>").append(item.get("data.object.content"));
			result = $("div[oembed], div[data-oembed]", content).map(function() {
				return $.parseJSON($(this).attr("oembed") || $(this).attr("data-oembed"));
			}).get();
		});
		this.set("content", item.get("data.object.content"));
		this.set("media", result);
	}
	return this.get("media", []);
};

submitPlugin.methods.getURLs = function(text) {
	return text.match(/(https?:\/\/[^\s]+)/g) || [];
};

submitPlugin.methods.resolveURLs = function(urls, callback) {
	var self = this;
	var unresolvedURLs = $.grep(urls, function(url) {
		var media = self.get("resolvedMedia");
		if (!media[url]) {
			media[url] = {};
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
			var media = self.get("resolvedMedia");
			media[data.original_url] = data;
		}).done(function(data) {
			// check if resolved media already defined
			// and try to move it in resolved media
			var definedMedia = self.get("definedMedia");
			data = $.grep(data, function(oembed) {
				var index = oembedInArray(oembed, definedMedia);
				if (~index) {
					delete definedMedia[index];
					return false;
				} else {
					return true;
				}
			});
			callback(data);
		});
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
	var container = this.view.get("mediaContent");
	var body = this.component.view.get("body");

	$.map(data, function(oembed) {
		// TODO get rig of available types list here (move it into NestedCard?)
		if (!~$.inArray(oembed.type, ["link", "photo", "video"])) { return false; }
		body.addClass(self.cssPrefix + "enabledMedia");
		var html = $("<div>");
		var card = new Echo.Conversations.NestedCard({
			"target": html,
			"context": self.config.get("context"),
			"width":  self.config.get("mediaWidth"),
			"data": oembed
		});
		var detachBtn = $(self.substitute({
			"template": '<div class="echo-primaryFont {plugin.class:Close}">&times;</div>'
		})).one("click", function() {
			var media = self.get("resolvedMedia");
			if (media[oembed.original_url]) {
				media[oembed.original_url] = {};
			} else {
				// remove from defined media
				var definedMedia = self.get("definedMedia");
				var index = oembedInArray(oembed, definedMedia);
				if (~index) {
					delete definedMedia[index];
				}
			}
			card.destroy();
			html.remove();
			if (container.is(":empty")) {
				body.removeClass(self.cssPrefix + "enabledMedia");
			}
		});
		html.append(detachBtn).appendTo(container);
	});
};

submitPlugin.css =
	'.{class:body}.{plugin.class:enabledMedia} .{class:content}.{class:border} { border-bottom: none; }' +
	'.{class:body}.{plugin.class:enabledMedia} .{plugin.class:mediaContent} { overflow: auto; border: 1px solid #DEDEDE; border-top-style: dashed; background-color: #F1F1F1; padding: 10px 5px; }' +

	'.{plugin.class:Close} { line-height: 1; opacity: 0.5; filter: alpha(opacity=70); font-size: 30px; font-weight: bold; position: absolute; top: 4px; right: 8px; cursor: pointer; color: #D2D2D2; text-shadow: 0 0 1px #000; }' +
	'.{plugin.class:Close}:hover { opacity: 1; filter: alpha(opacity=100); }' +
	'.{plugin.class:mediaContent} .echo-conversations-nestedcard-videoAvatar { margin-right: 20px; }' +
	'.{plugin.class:mediaContent} .echo-conversations-nestedcard-articleTitle { margin-right: 15px; }' +
	'.{plugin.class:mediaContent} .echo-conversations-nestedcard-photoAvatar { margin-right: 15px; }' +

	'.{plugin.class:mediaContent} { white-space: nowrap; word-wrap: normal; }' +
	'.{plugin.class:mediaContent} > div { display: inline-block; white-space: normal; margin-right: 8px; position: relative; vertical-align: top; max-width: 90%; }' +

	// scrollbar
	'.{plugin.class:mediaContent}::-webkit-scrollbar { height: 10px; }' +
	'.{plugin.class:mediaContent}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{plugin.class:mediaContent}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }';

Echo.Plugin.create(submitPlugin);

})(Echo.jQuery);
