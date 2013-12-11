(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CardUISocialSharing", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.addButtonSpec("CardUISocialSharing", this._assembleButton("Share"));
};

plugin.config = {
	"appId": "",
	"sharingWidgetConfig": {}
};

plugin.labels = {
	"share": "Share"
};

plugin.methods._prepareData = function(item) {
	return {
		"origin": "item",
		"actor": {
			"id": item.actor.id,
			"name": item.actor.title,
			"avatar": item.actor.avatar
		},
		"object": {
			"id": item.object.id,
			"content": item.object.content
		},
		"source": item.source,
		"target": item.target.id
	};
};

plugin.methods._share = function(data, config) {
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": "content/share/request",
			"source": config.eventsContext || "bundled",
			"payload": {"data": data || {}, "config": config || {}}
		}
	}]);
};

plugin.methods._assembleButton = function(name) {
	var self = this;
	var callback = function() {
		var item = this;
		self._share(self._prepareData(item.data), {
			"eventsContext": self.config.get("eventsContext"),
			"sharingWidgetConfig": self.config.get("sharingWidgetConfig")
		});
	};
	return function() {
		return {
			"name": name,
			"icon": "icon-share",
			"label": self.labels.get("share"),
			"visible": true,
			"callback": callback
		};
	};
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
