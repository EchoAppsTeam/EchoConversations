(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.CardUIShim
 * Extends Auth control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream");

plugin.css =
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:item} { margin: 10px 0px; padding: 5px 0px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }' +
	'.{plugin.class} .{class:item-children} > .echo-streamserver-controls-stream-item { margin: 0px; padding: 0px; box-shadow: 0 0 0; border: 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.CardUIShim
 * Extends Item control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream.Item");

plugin.css =
	'.{plugin.class} .{class:avatar} { border-radius: 50%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.IdentityServer.Controls.Auth.Plugins.CardUIShim
 * Extends Auth control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.IdentityServer.Controls.Auth");

plugin.component.renderers.login = function(element) {
	element.addClass("btn");
	return this.parentRenderer("login", arguments);
};

plugin.component.renderers.name = function(element) {
	this.parentRenderer("name", arguments);
	// TODO: get social provider name from identityURL...
	var template = '<div class="{plugin.class:via}">via Twitter</div>';
	element.append(this.substitute({"template": template}));
	return element;
};

plugin.css =
	'.{plugin.class:via} { color: #C6C6C6; line-height: 18px; font-size: 12px; }' +
	'.{plugin.class} .{class:avatar} img { border-radius: 50%; }' +
	'.{plugin.class} .{class:userAnonymous} { margin-bottom: 7px; text-align: left; font-family: Arial; font-weight: bold; }' +
	'.{plugin.class} .{class:userLogged} { margin: 0px 0px 5px 3px; }' +
	'.{plugin.class} .{class:name} { margin: 3px 0px 0px 15px; font-family: Arial; font-weight: normal; }' +
	'.{plugin.class} .{class:avatar} { width: 48px; height: 48px; border-radius: 50%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.CardUIShim
 * Extends Submit control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Submit");

plugin.css =
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:postButton} { color: #006DCC !important; font-weight: bold; }' +
	'.{plugin.class} .{class:tagsContainer} { display: none !important; }' +
	'.{plugin.class} .{class:markersContainer} { display: none !important; }' +
	'.{plugin.class} .{class:content} textarea.{class:textArea} { height: 75px; }' +
	'.{plugin.class} .{class:controls} { margin: 0px; padding: 7px; border: 1px solid #D2D2D2; border-top: 0px; }' +
	'.{plugin.class} .{class:container} { padding: 15px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	// TODO: add WebSockets config, make WS on by default
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"conversationID": "", // TODO: make auto-detectable by default
	"itemStates": "Untouched,ModeratorApproved"
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.Stream"
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
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": this.config.get("conversationID"),
			"infoMessages": {"enabled": false},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "JanrainAuth",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"nestedPlugins": [{
					"name": "CardUIShim"
				}]
			}]
		}
	});
};

conversations.renderers.stream = function(element) {
	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"query": this._buildSearchQuery(),
			"item": {
				"reTag": false
			},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "Reply",
				"nestedPlugins": [{
					"name": "CardUIShim"
				}, {
					"name": "JanrainAuth",
					"appId": this.config.get("dependencies.Janrain.appId"),
					"nestedPlugins": [{
						"name": "CardUIShim"
					}]
				}]
			}, {
				"name": "Like"
			}]
		}
	});
};

conversations.methods._buildSearchQuery = function() {
	// TODO: think about more scalable approach to override query predicates...
	var states = "state:" + this.config.get("itemStates");
	var conversationId = this.config.get("conversationID")
		|| $("link[rel='canonical']").attr('href')
		|| document.location.href.split("#")[0];

	return "childrenof:" + conversationId +
		" type:comment " + states +
		" children:2 " + states;
};

Echo.App.create(conversations);

})(Echo.jQuery);
