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
	var self = this;
	var media = this.get("media");

	if (!media || !media.length) return element.hide();

	// TODO calculate width here
	var wrapper = $("<div>")
		.css("width", media.length * this.config.get("mediaWidth"));
	$.map(media, function(item) {
		var container = $("<div>");
		new Echo.Conversations.NestedCard({
			"target": container,
			"data": item,
			"width": self.config.get("mediaWidth")
		});
		wrapper.append(container);
	});
	return element.empty().append(wrapper);
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
	'.{plugin.class:mediaContent} { overflow: hidden; margin-bottom: 5px; }' +
	'.{class:depth-0} .{plugin.class:mediaContent} { margin-left: -16px; margin-right: -16px; }' +
	'.{plugin.class:mediaContent}:hover { overflow: auto; }' +

	'.{plugin.class:mediaContent} { padding: 8px; border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +

	'.{plugin.class:mediaContent} > div > div { float: left; }' +

	// scrollbar
	'.{plugin.class:mediaContent}::-webkit-scrollbar { height: 10px; }' +
	'.{plugin.class:mediaContent}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{plugin.class:mediaContent}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }';

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
		var mediaContainer = $("<div>"); //createMediaContainer.call(this);
		this.view.get("SubmitMedia").append(mediaContainer);
		this.component.view.get("body").addClass(this.cssPrefix + "EnabledMedia");
	}

	var container = submitMediaContainer.find("." + this.cssPrefix + "MediaContainer");

	$.map(data, function(oembed) {
		// TODO
		var html = $("<div>"); //prepareMediaContent.call(self, oembed);
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
