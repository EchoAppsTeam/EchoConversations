(function($) {
"use strict";

// TODO: move this class into Echo.GUI library
Echo.Apps.Conversations.RollingCounter = function(config) {
	if (!config || !config.target) return;
	this.config = new Echo.Configuration(config);
};

Echo.Apps.Conversations.RollingCounter.prototype.roll = function(element, count) {
	var self = this;
	var countNode = $("<div>")
		.css({
			"position": "relative"
		})
		.append(this.config.get("count") || "&nbsp;")
		.appendTo(element.empty());

	if (count === this.config.get("count")) {
		return !!count ? element : element.hide();
	}

	var newCountNode = $("<div>")
		.css({
			"position": "relative"
		})
		.append(count || "&nbsp;")
		.appendTo(element);

	var animated = 0;
	var nodes = [countNode, newCountNode];
	var complete = function() {
		animated++;
		if (animated !== nodes.length) return;
		countNode.remove();
		newCountNode.css({
			"top": 0
		});
		!count && element.hide();
	};
	$.map(nodes, function(node) {
		node.animate({"top": "-=22"}, self.config.get("speed"), complete);
	});
	
	this.config.set("count", count);
	return element;
};

})(Echo.jQuery);
