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
		this.config.get("onAdd").call(this.component);
	},
	"Echo.StreamServer.Controls.Stream.Item.onDelete": function() {
		this.config.get("onDelete").call(this.component);
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
