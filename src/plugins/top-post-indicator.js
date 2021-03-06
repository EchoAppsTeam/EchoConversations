(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("TopPostIndicator", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("insertAsFirstChild", "content", plugin.templates.main);
};

plugin.labels = {
	"title": "Top Post"
};

plugin.config = {
	"marker": "Conversations.TopPost"
};

plugin.templates.main =
	'<i class="icon-bookmark {plugin.class:indicator}" title="{plugin.label:title}"></i>';

plugin.renderers.indicator = function(element) {
	var item = this.component;

	var visible = !item.get("depth")
		&& ~$.inArray(this.config.get("marker"), item.get("data.object.markers", []));
        return visible
                ? element.show()
                : element.hide();
};

plugin.css =
	'.{plugin.class:indicator} { float: right; position: absolute; top: -4px; right: 15px; z-index: 10;}';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
