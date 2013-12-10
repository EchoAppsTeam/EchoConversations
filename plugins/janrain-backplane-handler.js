(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("JanrainBackplaneHandler", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

// define global storage for this plugin
Echo.Variables.JanrainHandler = Echo.Variables.JanrainHandler || {};

plugin.config = {
	"appId": undefined,
	"eventsContext": undefined,
	"signinPopupConfig": {
		"title": "",
		"width": 400,
		"height": 240
	},
	"signinWidgetConfig": {},
	"sharingWidgetConfig": {}
};

plugin.init = function() {
	var plugin = this;
	var global = Echo.Variables.JanrainHandler;

	// subscribe only once!
	if (global.initialized) return;

	global.initialized = true;

	Backplane.subscribe(function(message) {
		var sourceMatch = message.source === plugin.config.get("eventsContext");
		// if login is requested
		if (message.type === "identity/login/request" && sourceMatch) {
			global.modal && global.modal.destroy();
			global.modal = plugin._openAuthDialog();
		}
		// when login/logout is complete
		if (message.type === "identity/ack") {
			global.modal && global.modal.destroy();
		}
		// if sharing is requested
		if (message.type === "post/share/request" && sourceMatch) {
			plugin._openShareDialog();
		}
	});
};

plugin.methods._openAuthDialog = function() {
	var plugin = this, config = this.config.get("signinPopupConfig");
	var sessionId = this.component.user.get("sessionID");
	var configStr = Echo.Utils.objectToJSON(plugin.config.get("signinWidgetConfig"));
	var url = this.component.config.get("cdnBaseURL.sdk") +
			"/third-party/janrain/auth.html?appId=" + plugin.config.get("appId") +
			"&signinConfig=" + encodeURIComponent(configStr) +
			"&bpChannel=" + encodeURIComponent(sessionId);
	var modal = new Echo.GUI.Modal({
		"data": {"title": config.title},
		"href": url,
		"width": config.width,
		"height": config.height,
		"padding": "0 0 5px 0",
		"footer": false,
		"fade": true,
		"onShow": function() {
			Backplane.expectMessages("identity/ack");
		},
		"onHide": function() {
			plugin.modal = null;
		}
	});
	modal.show();
	return modal;
};

plugin.methods._openSharingDialog = function() {
	// TODO: to be implemented...
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
