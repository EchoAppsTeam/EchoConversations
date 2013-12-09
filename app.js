(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"targetURL": "",
	"composer": {
		"visible": true,
		"displaySharingOnPost": true
	},
	"topPosts": {
		"visible": true,
		"label": "Top Posts",
		"queryOverride": undefined,
		"initialItemsPerPage": 5,
		"initialSortOrder": "reverseChronological",
		"itemStates": "Untouched,ModeratorApproved",
		"itemMarkers": ["Top"],
		"replyNestingLevels": 2,
		"displayCounter": true
	},
	"allPosts": {
		"visible": true,
		"label": "All Posts",
		"queryOverride": undefined,
		"initialItemsPerPage": 5,
		"initialSortOrder": "reverseChronological",
		"itemStates": "Untouched,ModeratorApproved",
		"itemMarkers": [],
		"replyNestingLevels": 2,
		"displayCounter": true
	},
	"auth":{
		"allowAnonymousSubmission": false
	},
	"bozoFilter": false,
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
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

conversations.init = function() {
	var app = this;
	this._retrieveData(function() {
		app.render();
		app.ready();
	});
};

conversations.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:composer}"></div>' +
		'<div class="{class:topPosts}"></div>' +
		'<div class="{class:allPosts}"></div>' +
	'</div>';

conversations.renderers.composer = function(element) {
	var config = this.config.get("composer");
	if (!config.visible) {
		return element;
	}
	var targetURL = this.config.get("targetURL");
	var submitPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "composer",
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
	return element;
};

conversations.renderers.topPosts = function(element) {
	var config = this.config.get("topPosts");
	if (!config.visible) {
		return element;
	}
	this.initComponent({
		"id": "topPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": this._assembleStreamConfig("topPosts", {"target": element})
	});
	return element;
};

conversations.renderers.allPosts = function(element) {
	var config = this.config.get("allPosts");
	if (!config.visible) {
		return element;
	}
	this.initComponent({
		"id": "allPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": this._assembleStreamConfig("allPosts", {"target": element})
	});
	return element;
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._assembleStreamConfig = function(componentID, overrides) {
	var replyPermissions = this._getSubmitPermissions();
	return $.extend(true, {}, {
		"appkey": this.config.get("dependencies.StreamServer.appkey"),
		"query": this._assembleSearchQuery(componentID),
		"data": this.get("response." + componentID + "-search"),
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
	}, overrides);
};

conversations.methods._assembleSearchQuery = function(componentID, overrides) {
	var config = this.config.get(componentID, {});
	var query = config.queryOverride;
	overrides = overrides || {};

	if (!query) {
		var states = config.itemStates;
		var userId = this.user && this.user.get("identityUrl");
		var markers = config.itemMarkers.length
			? "markers:" + config.itemMarkers.join(",")
			: "";
		var operators = (this.config.get("bozoFilter") && userId)
			? "(state:" + states + " OR user.id:" + userId + ")"
			: "state: " + states;
		query = "childrenof:{data:targetURL} " + markers +
			" type:comment " + operators +
			" children:" + config.replyNestingLevels + " " + operators;
	}

	return this.substitute({
		"template": query,
		"data": {"targetURL": this.config.get("targetURL")}
	});
};

conversations.methods._retrieveData = function(callback) {
	var app = this;
	var requests = Echo.Utils.foldl([], ["topPosts", "allPosts"], function(name, acc) {
		if (!app.config.get(name + ".visible")) return;
		var overrides = name === "topPosts" ? {"markers": ["Top"]} : {};
		var query = app._assembleSearchQuery(name, overrides);
		acc.push({
			"id": name + "-search",
			"method": "search",
			"q": query
		});
		if (app.config.get(name + ".displayCounter")) {
			acc.push({
				"id": name + "-count",
				"method": "count",
				"q": query
			});
		}
	});

	// if both Top Posts and All Posts are hidden
	if (!requests.length) {
		callback();
		return;
	}

	Echo.StreamServer.API.request({
		"endpoint": "mux",
		"data": {
			"requests": requests,
			"appkey": this.config.get("dependencies.StreamServer.appkey")
		},
		"onData": function(response) {
			app.set("response", response);
			callback();
		},
		"onError": function() {
			// TODO: need to handle error case...
		}
	}).send();
};

conversations.css =
	// set box-sizing property for all nested elements to default (content-box)
	// as its can be overwritten on the page.
	'.{class:container} * { box-sizing: content-box; -moz-box-sizing: content-box; }';

Echo.App.create(conversations);

})(Echo.jQuery);
