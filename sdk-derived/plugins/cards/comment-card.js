(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CommentCard", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.dependencies = [{
	"loaded": function() { return !!Echo.Conversations.NestedCard; },
	"url": "{%= baseURLs.prod %}/controls/nested-card.js"
}, {
	"loaded": function() { return !!Echo.Conversations.MediaContainer; },
	"url": "{%= baseURLs.prod %}/controls/media-container.js"
}];

plugin.init = function() {
	var self = this;
	this.component.registerModificator({
		"isEnabled": $.proxy(this.isEnabled, this),
		"init": function () {
			self.events.subscribe({
				"topic": "Echo.StreamServer.Controls.Card.onUpdate",
				"handler": function() {
					self.normalizer();
				}
			});
			self.normalizer();
			self.extendTemplate("insertAsLastChild", "data", plugin.templates.media);
		}
	});
};

plugin.methods.normalizer = function() {
	var content = $("<div/>").append(this.component.get("data.object.content"));
	var attachments = $("div[data-oembed]", content).map(function() {
		return $(this).data("oembed");
	}).get();

	if (attachments.length) {
		$("div[data-oembed]", content).remove();
	}

	this.component.set("data.content", content.html());
	this.component.set("data.attachments", attachments);
};

plugin.templates.media = '<div class="{plugin.class:mediaContent}"></div>';

plugin.component.renderers.body = function(element) {
	var item = this.component;

	var original = item.get("data.object.content");
	var content = this.component.get("data.content");
	item.set("data.object.content", content);
	this.parentRenderer("body", arguments);
	item.set("data.object.content", original);

	return element;
};

plugin.renderers.mediaContent = function(element) {
	var attachments = this.component.get("data.attachments");
	new Echo.Conversations.MediaContainer(this.config.assemble({
		"target": element.empty(),
		"data": attachments,
		"card": {
			"maxMediaWidth": this.component.config.get("limits.maxMediaWidth")
		}
	}));

	return element.addClass(this.cssPrefix + (attachments.length > 1 ? "multiple" : "single"));
};

plugin.methods.isEnabled = function() {
	var result = false;
	var availableTypes = {
		"all": [
			"http://activitystrea.ms/schema/1.0/note",
			"http://activitystrea.ms/schema/1.0/comment",
			"http://echoenabled.com/schema/1.0/link"
		],
		"child": [
			"http://activitystrea.ms/schema/1.0/article",
			"http://activitystrea.ms/schema/1.0/image",
			"http://activitystrea.ms/schema/1.0/video"
		]
	};
	var item = this.component;
	$.each(item.get("data.object.objectTypes", []), function(i, objectType) {
		if (~$.inArray(objectType, availableTypes.all) ||
				!item.isRoot() && ~$.inArray(objectType, availableTypes.child)
		) {
			result = true;
			return false;
		}
	});
	return result;
};

plugin.css =
	'.{class:depth-0} .{plugin.class:mediaContent}.{plugin.class:multiple} { margin-left: -16px; margin-right: -16px; }' +
	'.{class:depth-0} .{plugin.class:mediaContent} { margin-bottom: 0px; }' +
	'.{plugin.class:mediaContent}.{plugin.class:multiple} > div { border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
	'.{plugin.class:mediaContent} { margin-bottom: 8px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.CommentCard
 * Adds custom composer to CardComposer control allowing to post comments.
 *
 *		new Echo.StreamServer.Controls.CardComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "CommentCard"
 *			}]
 *		});
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("CommentCard", "Echo.StreamServer.Controls.CardComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.registerComposer({
		"id": "comment",
		"label": this.labels.get("comment"),
		"icon": "icon-comment",
		"composer": $.proxy(this.buildComposer, this),
		"getData": $.proxy(this.getData, this),
		"setData": $.proxy(this.setData, this),
		"objectType": "http://activitystrea.ms/schema/1.0/comment"
	});
};

plugin.vars = {
	"composer": null
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"comment": "Comment",
	/**
	 * @echo_label
	 */
	"textPlaceholder": "What's on your mind?"
};

plugin.methods.buildComposer = function() {
	var self = this, timer;
	this.composer = $("<div>").append(
		'<div class="echo-cardcomposer-field-wrapper">' +
			'<textarea class="echo-comment-composer-text" placeholder="' + this.labels.get("textPlaceholder") + '">' +
		'</div>'
	);
	this.composer.find(".echo-comment-composer-text").on("keyup paste", function() {
		clearTimeout(timer);
		var el = $(this);
		timer = setTimeout(function() {
			self.component.attachMedia({
				"fromElement": el
			});
		}, 1000);
	});
	return this.composer;
};

plugin.methods.getData = function() {
	return {
		"text": this.composer.find(".echo-comment-composer-text").val(),
		"media": this._getMediaContent()
	};
};

plugin.methods.setData = function(data) {
	this.composer.find(".echo-comment-composer-text").val(data.text);
};

plugin.methods._getMediaContent = function() {
	var self = this;
	var media = this.component.formData.media;
	if (!media.length) return "";
	return $.map(media, function(item) {
		return self.component.substitute({
			"template": self._mediaTemplate(),
			"data": $.extend(true, {}, item, {
				"oembed": self.component._htmlEncode(item)
			})
		});
	}).join("");
};

plugin.methods._mediaTemplate = function() {
	return '<div class="echo-media-item" data-oembed="{data:oembed}">' +
		'<div class="echo-item-article">' +
			'<div class="echo-item-template-article-thumbnail" style="width: 30%; float: left; max-width: 120px; max-height: 120px; text-align: center; overflow: hidden;">' +
				'<img src="{data:thumbnail_url}" style="width: auto; height: auto; max-height: 120px; max-width: 120px;">' +
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
	'</div>';
};

plugin.css =
	'.echo-sdk-ui textarea.echo-comment-composer-text { height: 75px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
