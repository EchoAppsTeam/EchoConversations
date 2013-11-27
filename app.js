(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.CardUIShim
 * Extends Auth control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream");

var getClass = function(name) {
	return ".echo-streamserver-controls-stream-plugin-CardUIShim " +
		".echo-streamserver-controls-stream-" + name + " ";
};

plugin.css =
	getClass("header") + "{ display: none; }" +
	getClass("item") + "{ margin: 10px 0px; padding: 5px 0px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }" +
	getClass("item-children > .echo-streamserver-controls-stream-item") + "{ margin: 0px; padding: 0px; box-shadow: 0 0 0; border: 0px; }";

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.CardUIShim
 * Extends Item control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream.Item");

var getClass = function(name) {
	return ".echo-streamserver-controls-stream-item-plugin-CardUIShim" +
		".echo-streamserver-controls-item-" + name + " ";
};

plugin.css = '';

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

var getClass = function(name) {
	return ".echo-identityserver-controls-auth-plugin-CardUIShim " +
		".echo-identityserver-controls-auth-" + name + " ";
};

plugin.css =
	".{plugin.class:via} { color: #C6C6C6; line-height: 18px; font-size: 12px; }" +
	getClass("avatar img") + "{ border-radius: 50%; }" +
	getClass("userAnonymous") + "{ margin-bottom: 7px; text-align: left; font-family: Arial; font-weight: bold; }" +
	getClass("userLogged") + "{ margin: 0px 0px 5px 3px; }" +
	getClass("name") + "{ margin: 3px 0px 0px 15px; font-family: Arial; font-weight: normal; }" +
	getClass("avatar") + "{ width: 48px !important; height: 48px !important; border-radius: 50%; }";

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.CardUIShim
 * Extends Submit control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Submit");

var getClass = function(name) {
	return ".echo-streamserver-controls-submit-plugin-CardUIShim " +
		".echo-streamserver-controls-submit-" + name + " ";
};

plugin.css =
	getClass("header") + "{ display: none; }" +
	getClass("postButton") + "{ color: #006DCC !important; font-weight: bold; }" +
	getClass("tagsContainer") + "{ display: none !important; }" +
	getClass("markersContainer") + "{ display: none !important; }" +
	getClass("content textarea.echo-streamserver-controls-submit-textArea") + "{ height: 75px; }" +
	getClass("controls") + "{ margin: 0px; padding: 7px; border: 1px solid #D2D2D2; border-top: 0px; }" +
	getClass("container") + "{ padding: 15px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }";

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
	return "childrenof:" + this.config.get("conversationID") +
		" type:comment " + states +
		" children:2 " + states;
};

Echo.App.create(conversations);

})(Echo.jQuery);
