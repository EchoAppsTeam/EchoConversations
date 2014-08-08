(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CountVisualization", "Echo.StreamServer.Controls.PostCounter");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
	"Echo.StreamServer.Controls.PostCounter.onUpdate": function() {
		this.view.render({"name": "count"});
	}
};

plugin.init = function() {
	this.extendTemplate("replace", "count", plugin.templates.main);
};

plugin.templates.main =
	'<span class="{plugin.class:count}">' +
		' (<span class="{class:count}"></span>)' +
	'</span>';

plugin.renderers.count = function(element) {
	var count = this.component.get("data.count");
	var visible = (typeof count === "string" && count === "5000+")
		|| (typeof count === "number" && count > 0);

	return visible
		? element.show()
		: element.hide();
};

plugin.css =
	'.{plugin.class} .echo-control-message { display: none; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
