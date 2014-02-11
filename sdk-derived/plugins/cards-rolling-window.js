(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("CardsRollingWindow", "Echo.StreamServer.Controls.CardCollection");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"moreButton": false
};

plugin.events = {
	"Echo.StreamServer.Controls.Card.onRender": function() {
		var self = this;
		var maxCount = this.get("maxCount");
		$.map(this.component.get("threads").slice(maxCount), function(item) {
			self.component._spotUpdates.remove.call(self.component, item);
		});
		if (this.config.get("moreButton")) {
			this._updateNextPageAfter();
		}
	},
	"Echo.StreamServer.Controls.CardCollection.onRerender": function() {
		this._setMaxCount();
	},
	"Echo.StreamServer.Controls.CardCollection.onDataReceive": function(topic, args) {
		if (args.type === "children" || args.type === "live") return;
		this._setMaxCount(args.type === "more");
	}
};

plugin.component.renderers.more = function(element) {
	var item = this.component;
	if (!this.config.get("moreButton")) {
		return element.empty().hide();
	}
	return item.parentRenderer("more", arguments);
};

plugin.methods._setMaxCount = function(incremental) {
	var maxCount = +this.component.config.get("itemsPerPage");
	if (incremental) {
		maxCount += this.get("maxCount");
	}
	this.set("maxCount", maxCount);
};

plugin.methods._updateNextPageAfter = function() {
	var lastItem = this.component.get("threads")[this.component.threads.length - 1];
	if (lastItem.get("data.pageAfter")) {
		this.component.set("nextPageAfter", lastItem.get("data.pageAfter"));
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
