(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CommentCard", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.dependencies = [{
	"loaded": function() { return !!Echo.Conversations.NestedCard; },
	"url": "{%= baseURL %}/controls/nested-card.js"
}, {
	"loaded": function() { return !!Echo.Conversations.MediaContainer; },
	"url": "{%= baseURL %}/controls/media-container.js"
}];

plugin.init = function() {
	this.extendTemplate("insertAsLastChild", "data", plugin.templates.media);
};

plugin.templates.media = '<div class="{plugin.class:mediaContent}"></div>';

plugin.component.renderers.body = function(element) {
	var self = this;
	var item = this.component;

	var original = item.get("data.object.content");
	var content = $("<div/>").append(original);
	var media = self._getMediaAttachments();
	$("div[oembed], div[data-oembed]", content).remove();

	Echo.Utils.safelyExecute(function() {
		var text = $(".echo-item-text", content);
		if (media.length && text.length) {
			item.set("data.object.content", text.html());
		} else if (media.length) {
			item.set("data.object.content", content.html());
		}
	});

	this.parentRenderer("body", arguments);

	item.set("data.object.content", original);

	return element;
};

plugin.renderers.mediaContent = function(element) {
	var media = this._getMediaAttachments();
	var cardConfig = {
		"maximumMediaWidth": this.config.get("presentation.maximumMediaWidth")
	};
	new Echo.Conversations.MediaContainer(this.config.assemble({
		"target": element.empty(),
		"data": media,
		"card": cardConfig
	}));

	return element.addClass(this.cssPrefix + (media.length > 1 ? "multiple" : "single"));
};

plugin.enabled = function() {
	var result = false;
	$.each(this.component.get("data.object.objectTypes", []), function(i, objectType) {
		if (objectType === "http://activitystrea.ms/schema/1.0/note" ||
				objectType === "http://activitystrea.ms/schema/1.0/comment"
		) {
			result = true;
			return false;
		}
	});
	return result;
};

plugin.methods._getMediaAttachments = function() {
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

plugin.css =
	'.{class:depth-0} .{plugin.class:mediaContent}.{plugin.class:multiple} { margin-left: -16px; margin-right: -16px; }' +
	'.{class:depth-0} .{plugin.class:mediaContent} { margin-bottom: 0px; }' +
	'.{plugin.class:mediaContent}.{plugin.class:multiple} > div { border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
	'.{plugin.class:mediaContent} { margin-bottom: 8px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
