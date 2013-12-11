(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"targetURL": "",
	"bozoFilter": false,
	"composer": {
		"visible": true,
		"displaySharingOnPost": true
	},
	"topPosts": {
		"visible": true,
		"label": "Top Posts",
		"queryOverride": "",
		"initialItemsPerPage": 5,
		"initialSortOrder": "reverseChronological",
		"displaySortOrderPulldown": true,
		"displayCounter": true,
		"displayTopPostHighlight": true,
		"displaySharingIntent": true,
		"displayLikeIntent": true,
		"displayReplyIntent": true,
		"replyNestingLevels": 2,
		"itemStates": "Untouched,ModeratorApproved",
		"itemMarkers": ["Top"],
		"maxItemBodyCharacters": 200
	},
	"allPosts": {
		"visible": true,
		"label": "All Posts",
		"queryOverride": "",
		"initialItemsPerPage": 15,
		"initialSortOrder": "reverseChronological",
		"displaySortOrderPulldown": true,
		"displayCounter": true,
		"displayTopPostHighlight": true,
		"displaySharingIntent": true,
		"displayLikeIntent": true,
		"displayReplyIntent": true,
		"replyNestingLevels": 2,
		"noPostsMessage": "There are no posts yet.<br>Be the first to chime in!",
		"itemStates": "Untouched,ModeratorApproved",
		"itemMarkers": [],
		"maxItemBodyCharacters": 200
	},
	"auth": {
		"enableBundledIdentity": true,
		"allowAnonymousSubmission": false,
		"authWidgetConfig": {},
		"sharingWidgetConfig": {}
	},
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
	this._removeUserInvalidationFrom(this);
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

conversations.templates.defaultQuery =
	'childrenof:{data:targetURL} sortOrder:{data:initialSortOrder} ' +
	'itemsPerPage:{data:initialItemsPerPage} {data:markers} type:comment ' +
	'{data:operators} children:{data:replyNestingLevels} {data:operators}';

conversations.renderers.composer = function(element) {
	var config = this.config.get("composer");
	if (!config.visible) {
		return element;
	}
	var targetURL = this.config.get("targetURL");
	var enableBundledIdentity = this.config.get("auth.enableBundledIdentity");
	this.initComponent({
		"id": "composer",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": targetURL,
			"infoMessages": {"enabled": false},
			"plugins": [{
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}, {
				"name": "CardUIShim",
				"submitPermissions": this._getSubmitPermissions(),
				"buttons": ["login", "signup"],
				"displaySharingOnPost": config.displaySharingOnPost
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
		"config": this._assembleStreamConfig("topPosts", {
			"target": element
		})
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
		"config": this._assembleStreamConfig("allPosts", {
			"target": element,
			"labels": {
				"emptyStream": config.noPostsMessage
			}
		})
	});
	return element;
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._assembleStreamConfig = function(componentID, overrides) {
	var config = this.config.get(componentID);
	var queryOverrides = componentID === "topPosts" ? {"replyNestingLevels": 0} : {};
	return $.extend(true, {}, {
		"appkey": this.config.get("dependencies.StreamServer.appkey"),
		"query": this._assembleSearchQuery(componentID),
		"data": this.get("data." + componentID + "-search"),
		"asyncItemsRendering": true,
		"item": {
			"reTag": false,
			"limits": {
				"maxBodyCharacters": config.maxItemBodyCharacters
			}
		},
		"plugins": [].concat(this._getConditionalPluginList(componentID), [{
			"name": "CardUIShim",
			"counter": {
				"data": this.get("data." + componentID + "-count"),
				"query": this._assembleSearchQuery(componentID, queryOverrides)
			},
			"displayEmptyStream": componentID !== "topPosts",
			"displayTopPostHighlight": config.displayTopPostHighlight
		}, {
			"name": "ModerationCardUI"
		}, {
			"name": "ItemsRollingWindow",
			"moreButton": true
		}])
	}, config, overrides);
};

conversations.methods._getConditionalPluginList = function(componentID) {
	var config = this.config.get(componentID);
	var enableBundledIdentity = this.config.get("auth.enableBundledIdentity");
	var plugins = {
		"displayLikeIntent": {
			"name": "LikeCardUI"
		},
		"displayReplyIntent": {
			"name": "ReplyCardUI",
			"nestedPlugins": [{
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}, {
				"name": "CardUIShim",
				"buttons": ["login", "signup"],
				"submitPermissions": this._getSubmitPermissions()
			}]
		},
		"displaySharingIntent": {
			"name": "CardUISocialSharing"
		},
		"displaySortOrderPulldown": {
			"name": "Sorter",
			"parentID": componentID,
			"initialValue": config.initialSortOrder
		}
	};

	return Echo.Utils.foldl([], plugins, function(value, acc, name) {
		if (!!config[name]) {
			acc.push(value);
		}
	});
};

conversations.methods._assembleSearchQuery = function(componentID, overrides) {
	var operators, markers;
	var config = this.config.get(componentID, {});
	var query = config.queryOverride;

	if (!query) {
		var states = config.itemStates;
		var userId = this.user && this.user.get("identityUrl");

		markers = config.itemMarkers.length
			? "markers:" + config.itemMarkers.join(",")
			: "";
		operators = (this.config.get("bozoFilter") && userId)
			? "(state:" + states + " OR user.id:" + userId + ")"
			: "state: " + states;
	}
	return this.substitute({
		"template": query || conversations.templates.defaultQuery,
		"data": $.extend({}, config, {
			"markers": markers || "",
			"operators": operators || "",
			"targetURL": this.config.get("targetURL"),
			"initialSortOrder": Echo.Cookie.get([componentID, "sortOrder"].join(".")) || config.initialSortOrder
		}, overrides)
	});
};

conversations.methods._retrieveData = function(callback) {
	var app = this;
	var requests = Echo.Utils.foldl([], ["topPosts", "allPosts"], function(name, acc) {
		if (!app.config.get(name + ".visible")) return;
		acc.push({
			"id": name + "-search",
			"method": "search",
			"q": app._assembleSearchQuery(name)
		});
		if (app.config.get(name + ".displayCounter")) {
			// for Top Posts we need to count only root items...
			var overrides = name === "topPosts" ? {"replyNestingLevels": 0} : {};
			acc.push({
				"id": name + "-count",
				"method": "count",
				"q": app._assembleSearchQuery(name, overrides)
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
		"apiBaseURL": this.config.get("apiBaseURL"),
		"data": {
			"requests": requests,
			"appkey": this.config.get("dependencies.StreamServer.appkey")
		},
		"onData": function(data) {
			$.each(data, function(key, value) {
				// Ignore errors.
				// In this case streams/counters will try to fetch initial data by yourself.
				if (!value || value.result === "error") delete data[key];
			});
			app.set("data", data);
			callback();
		},
		"onError": function() {
			// Ignore mux error also.
			callback();
		}
	}).send();
};

// removing "Echo.UserSession.onInvalidate" subscription from an app
// to avoid double-handling of the same evernt (by Canvas and by the widget itself)
conversations.methods._removeUserInvalidationFrom = function() {
	var topic = "Echo.UserSession.onInvalidate";
	$.map(Array.prototype.slice.call(arguments), function(inst) {
		$.each(inst.subscriptionIDs, function(id) {
			var obj = $.grep(Echo.Events._subscriptions[topic].global.handlers, function(o) {
				return o.id === id;
			})[0];
			if (obj && obj.id) {
				Echo.Events.unsubscribe({"handlerId": obj.id});
				return false;
			}
		});
	});
};

conversations.css =
	'.{class:container} .echo-primaryFont, .{class:container} .echo-secondaryFont { font-family: "Helvetica Neue", arial, sans-serif; }' +
	'.{class:composer} { margin-bottom: 10px; }' +
	'.{class:topPosts} > div { margin-bottom: 25px; }' +
	// set box-sizing property for all nested elements to default (content-box)
	// as its can be overwritten on the page.
	// TODO: get rid of these rules at all!
	'.{class:container} * { box-sizing: content-box !important; -moz-box-sizing: content-box; }' +
	'.{class:container} ul, .{class:container} li { list-style: inherit; }';

Echo.App.create(conversations);

})(Echo.jQuery);
