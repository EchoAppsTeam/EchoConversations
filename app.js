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
		'<div class="{class:topPosts}"></div>' +
		'<div class="{class:allPosts}"></div>' +
	'</div>';

conversations.renderers.submit = function(element) {
	var targetURL = this.config.get("targetURL");
	var submitPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "Composer",
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

conversations.renderers.topPosts = function(element) {
	this.initComponent({
		"id": "TopPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": $.extend(true, {}, this._getStreamConfig("topPosts"), {
			"target": element
		})
	});
};

conversations.renderers.allPosts = function(element) {
	this.initComponent({
		"id": "AllPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": $.extend(true, {}, this._getStreamConfig(), {
			"target": element
		})
	});
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._getStreamConfig = function(section) {
	var queryParams = {
		"topPosts": {
			"markers": ["Top"]
		}
	};
	var replyPermissions = this._getSubmitPermissions();
	return {
		"appkey": this.config.get("dependencies.StreamServer.appkey"),
		"query": this._buildSearchQuery(queryParams[section] || {}),
		"fadeTimeout": 0,
			"item": {
				"reTag": false,
				"limits": {
					// TODO: make configurable in v1.2
					"maxBodyCharacters": 200
				}
			},
			"plugins": [{
				"name": "ItemsRollingWindow",
				"moreButton": true
			}, {
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
	};
};

conversations.methods._buildSearchQuery = function(query) {
	var allPostsQuery = this.config.get("allPostsQuery");
	query = query || {};

	// TODO need more general solution to build query
	var markers = query.markers
		? (" markers:" + query.markers.join(","))
		: "";

	if (!allPostsQuery) {
		var states = this.config.get("itemStates");
		var userId = this.user && this.user.get("identityUrl");
		var operators = (this.config.get("bozoFilter") && userId)
			? "(state:" + states+ " OR user.id:" + userId+ ")"
			: "state: " + states;
		allPostsQuery = "childrenof:{data:targetURL}" +
			markers +
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
