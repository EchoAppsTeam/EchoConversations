(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"targetURL": ""
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"loaded": function() {
		return Echo.App.isDefined("Echo.StreamServer.Controls.Submit")
			&& Echo.Control.isDefined("Echo.StreamServer.Controls.Stream");
	}
}];

conversations.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

conversations.renderers.submit = function(element) {
	this.initComponent({
		"id": "stream",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"target": element
		}
	});
};

conversations.renderers.stream = function(element) {
	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"target": element,
			"query": this._buildSearchQuery()
		}
	});
};

conversations.methods._buildSearchQuery = function() {
	return "childrenof:" + this.config.get("targetURL") + " type:comment state:Approved,Untouched";
};

Echo.App.create(conversations);

})(Echo.jQuery);
