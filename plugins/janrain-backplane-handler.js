(function($) {
"use strict";

var createPlugin = function(component) {

	var plugin = Echo.Plugin.manifest("JanrainBackplaneHandler", component);

	if (Echo.Plugin.isDefined(plugin)) return;

	// define global storage for this plugin
	Echo.Variables.JanrainHandler = Echo.Variables.JanrainHandler || {};

	plugin.config = {
		"appId": undefined,
		"authWidgetConfig": {},
		"sharingWidgetConfig": {}
	};

	plugin.init = function() {
		var plugin = this;
		var global = Echo.Variables.JanrainHandler;

		// subscribe only once!
		if (global.initialized) return;

		global.initialized = true;

		Backplane.subscribe(function(message) {
			// if login is requested
			if (message.type === "identity/login/request") {
				global.modal && global.modal.destroy();
				global.modal = plugin._openAuthDialog();
			}
			// when login/logout is complete
			if (message.type === "identity/ack") {
				global.modal && global.modal.destroy();
			}
			// if sharing is requested
			if (message.type === "content/share/request") {
				plugin._openSharingDialog(message.payload);
			}
		});
	};

	plugin.methods._openAuthDialog = function() {
		var plugin = this, config = plugin.config.get("authWidgetConfig");
		var configStr = Echo.Utils.objectToJSON(config);
		var url = this.component.config.get("cdnBaseURL.sdk") +
				"/third-party/janrain/auth.html?appId=" + plugin.config.get("appId") +
				"&signinConfig=" + encodeURIComponent(configStr) +
				"&bpChannel=" + encodeURIComponent(Backplane.getChannelID());
		var modal = new Echo.GUI.Modal({
			"data": {"title": config.title || ""},
			"href": url,
			"width": config.width || 400,
			"height": config.height || 240,
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

	// copied over from JanrainSharing plugin with a slight modification...
	plugin.methods._openSharingDialog = function(data) {
		var url, plugin = this;
		var config = plugin.config.get("sharingWidgetConfig");
		var callback = function() {
			plugin.set("foreignConfig", $.extend(true, {}, janrain.engage.share.getState()));
			plugin._showPopup(data, config);
		};
		if (window.janrain && janrain.engage && janrain.engage.share || plugin.get("janrainInitialized")) {
			callback();
			return;
		}
		plugin.set("janrainInitialized", true);

		if (typeof window.janrain !== "object") window.janrain = {};
		if (typeof janrain.settings !== "object") janrain.settings = {};
		if (typeof janrain.settings.share !== "object") janrain.settings.share = {};
		if (typeof janrain.settings.packages !== "object") janrain.settings.packages = [];
		janrain.settings.packages.push("share");
		// we can reach this line only after DOM is loaded so no need to use "onload" event
		janrain.ready = true;

		var foreignOnload = window.janrainShareOnload;
		window.janrainShareOnload = function() {
			// let the previous onload handler do its stuff first
			if (foreignOnload) {
				foreignOnload();
				window.janrainShareOnload = foreignOnload;
			}
			callback();
		};

		url = "https:" === document.location.protocol
			? "https://rpxnow.com/js/lib/" + plugin.config.get("appId") + "/widget.js"
			: "http://widget-cdn.rpxnow.com/js/lib/" + plugin.config.get("appId") + "/widget.js";
		Echo.Loader.download([{"url": url}]);
	};

	// copied over from JanrainSharing plugin with a slight modification...
	plugin.methods._showPopup = function(data, config) {
		var image, plugin = this;
		var share = janrain.engage.share;
		var idx = janrain.events.onModalClose.addHandler(function() {
			janrain.events.onModalClose.removeHandler(idx);
			share.reset();
			share.setState(plugin.get("foreignConfig"));
			plugin.remove("foreignConfig");
		});
		var getOG = function(field) {
			return $("meta[property=\"og:" + field + "\"]").attr("content");
		};
		share.reset();
		share.setState(config);
		share.setTitle(config.title || getOG("title") || document.title);
		share.setDescription(config.description || getOG("description") || "");
		share.setMessage(config.message || Echo.Utils.stripTags(data.object.content));
		share.setUrl(config.url || getOG("url") || location.href.replace(/([#\?][^#\?]*)+$/, ""));
		image = config.image || getOG("image") || "";
		image && share.setImage(image);
		share.show();
	};

	Echo.Plugin.create(plugin);
};

$.map(["Echo.StreamServer.Controls.Stream", "Echo.StreamServer.Controls.Submit"], createPlugin);

})(Echo.jQuery);
