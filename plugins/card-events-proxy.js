(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CardEventsProxy", "Echo.StreamServer.Controls.CardCollection");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"onAdd": $.noop,
	"onDelete": $.noop
};

plugin.events = {
	"Echo.StreamServer.Controls.Card.onAdd": function() {
		var onAdd = this.config.get("onAdd");
		onAdd && onAdd.apply(this.component, arguments);
	},
	"Echo.StreamServer.Controls.Card.onDelete": function() {
		var onDelete = this.config.get("onDelete");
		onDelete && onDelete.apply(this.component, arguments);
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
