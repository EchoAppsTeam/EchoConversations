(function($) {
"use strict";


// TODO: move this class into Echo.GUI libraryr
Echo.Apps.Conversations.RollingCounter = function(config) {
	if (!config || !config.target) return;
	this.config = new Echo.Configuration(config);
};

Echo.Apps.Conversations.RollingCounter.prototype.roll = function(element, count) {
	var countNode = $("<div>")
		.css({
			"position": "relative"
		})
		.append(this.config.get("count"))
		.appendTo(element);

	if (count === this.config.get("count")) {
		 return element;
	}

	$("<div>")
		.css({
			"position": "relative"
		})
		.append(count)
		.appendTo(element);

	countNode.animate({"top": "-=22"}, this.config.get("speed"), function() {
		countNode.remove();
	});
	this.config.set("count", count);

	return element;
};

})(Echo.jQuery);
