(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("SocialSharing", "Echo.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.addButtonSpec("SocialSharing", this._assembleButton("Share"));
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

plugin.methods._share = function(data) {
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": "content/share/request",
			"payload": data
		}
	}]);
};

plugin.methods._assembleButton = function(name) {
	var self = this;
	return function() {
		var item = this;
		return {
			"name": name,
			"icon": "icon-share",
			"label": self.labels.get("share"),
			"visible": true,
			"callback": function() {
				self._share(self._prepareData(item.data));
			}
		};
	};
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
