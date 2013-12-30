(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("CounterCardUI", "Echo.StreamServer.Controls.Counter");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
	"Echo.StreamServer.Controls.Counter.onUpdate": function() {
		this.component.render({"name": "count"});
	}
};

plugin.templates.main =
	'<span class="{class:count}">({data:count})</span>';

plugin.init = function() {
	this.component.templates.main = plugin.templates.main;
};

plugin.component.renderers.count = function(element) {
	var count = this.component.get("data.count");
	var visible = (typeof count === "string" && count === "5000+")
		|| (typeof count === "number" && count > 0);
	return visible
		? element.show()
		: element.hide();
};

plugin.css =
	'.{plugin.class} { margin-left: 5px; }' +
	'.{plugin.class} .echo-control-message { display: none; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
