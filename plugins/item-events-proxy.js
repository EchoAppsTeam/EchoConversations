(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("ItemEventsProxy", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"onAdd": $.noop,
	"onDelete": $.noop
};

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Item.onAdd": function() {
		var onAdd = this.config.get("onAdd");
		onAdd && onAdd.call(this.component);
	},
	"Echo.StreamServer.Controls.Stream.Item.onDelete": function() {
		var onDelete = this.config.get("onDelete");
		onDelete && onDelete.call(this.component);
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
