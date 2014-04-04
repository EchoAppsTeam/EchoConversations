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
	$.each(this.component.get("data.object.objectTypes", []), function(i, objectType) {
		if (objectType === "http://activitystrea.ms/schema/1.0/note" ||
				objectType === "http://activitystrea.ms/schema/1.0/comment" ||
				objectType === "http://echoenabled.com/schema/1.0/link"
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
