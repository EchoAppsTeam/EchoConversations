(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"targetURL": "",
	"allPostsQuery": "",
	"auth":{
		"allowAnonymousSubmission": false
	},
	"bozoFilter": false,
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"itemStates": "Untouched,ModeratorApproved",
	"liveUpdates": {
		"transport": "websockets"
	}
};

conversations.config.normalizer = {
	"appkey": function() {
		// We should move appkey to root level, otherwise user will not be initialized.
		return this.get("dependencies.StreamServer.appkey");
	},
	"targetURL": function(value) {
		return value
			|| $("link[rel='canonical']").attr('href')
			|| document.location.href.split("#")[0];
	}
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.Stream"
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

conversations.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

conversations.renderers.submit = function(element) {
	var targetURL = this.config.get("targetURL");
	var submitPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "stream",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": targetURL,
			"infoMessages": {"enabled": false},
			"liveUpdates": this.config.get("liveUpdates"),
			"plugins": [{
				"name": "JanrainAuth",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"submitPermissions": submitPermissions,
				"buttons": ["login", "signup"],
				"nestedPlugins": [{
					"name": "CardUIShim",
					"submitPermissions": submitPermissions
				}]
			}, {
				"name": "CardUIShim",
				"submitPermissions": submitPermissions
			}],
			"data": {
				"object": {
					"content": Echo.Utils.get(Echo.Variables, targetURL, "")
				}
			},
			"ready": function() {
				this.view.get("text").on("change", function() {
					Echo.Utils.set(Echo.Variables, targetURL, $(this).val());
				});
			}
		}
	});
};

conversations.renderers.stream = function(element) {
	var replyPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"query": this._buildSearchQuery(),
			"fadeTimeout": 0,
			"item": {
				"reTag": false
			},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "LikeCardUI"
			}, {
				"name": "ReplyCardUI",
				"nestedPlugins": [{
					"name": "JanrainAuth",
					"appId": this.config.get("dependencies.Janrain.appId"),
					"submitPermissions": replyPermissions,
					"buttons": ["login", "signup"],
					"nestedPlugins": [{
						"name": "CardUIShim",
						"submitPermissions": replyPermissions
					}]
				}, {
					"name": "CardUIShim",
					"submitPermissions": replyPermissions
				}]
			}, {
				"name": "ModerationCardUI"
			}]
		}
	});
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._buildSearchQuery = function() {
	var allPostsQuery = this.config.get("allPostsQuery");

	if (!allPostsQuery) {
		var states = this.config.get("itemStates");
		var userId = this.user && this.user.get("identityUrl");
		var operators = (this.config.get("bozoFilter") && userId)
			? "(state:" + states+ " OR user.id:" + userId+ ")"
			: "state: " + states;
		allPostsQuery = "childrenof:{data:targetURL}" +
			" type:comment " + operators +
			" children:2 " + operators;
	}

	return this.substitute({
		"template": allPostsQuery,
		"data": {
			"targetURL": this.config.get("targetURL")
		}
	});
};

conversations.css =
	// set box-sizing property for all nested elements to default (content-box) as its can be overwritten on the page.
	'.{class:container} * { box-sizing: content-box; -moz-box-sizing: content-box; }';

Echo.App.create(conversations);

})(Echo.jQuery);
