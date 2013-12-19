(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"targetURL": "",
	"bozoFilter": false,
	"postComposer": {
		"visible": true,
		"displaySharingOnPost": true,
		"contentTypes": {
			"comments": {
				"visible": true,
				"prompt": "What's on your mind?",
				"resolveURLs": true
			}
		}
	},
	"replyComposer": {
		"visible": true,
		"displaySharingOnPost": true,
		"contentTypes": {
			"comments": {
				"visible": true,
				"prompt": "What's on your mind?",
				"resolveURLs": true
			}
		}
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
		"itemMarkers": ["Conversations.TopPost"],
		"maxItemBodyCharacters": 200,
		"sortOrderEntries": [{
			"title": "Newest First",
			"value": "reverseChronological"
		}, {
			"title": "Oldest First",
			"value": "chronological"
		}, {
			"title": "Most popular",
			"value": "repliesDescending"
		}, {
			"title": "Most likes",
			"value": "likesDescending"
		}]
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
		"maxItemBodyCharacters": 200,
		"sortOrderEntries": [{
			"title": "Newest First",
			"value": "reverseChronological"
		}, {
			"title": "Oldest First",
			"value": "chronological"
		}, {
			"title": "Most popular",
			"value": "repliesDescending"
		}, {
			"title": "Most likes",
			"value": "likesDescending"
		}]
	},
	"auth": {
		"enableBundledIdentity": true,
		"hideLoginButtons": false,
		"allowAnonymousSubmission": false,
		"authWidgetConfig": {},
		"sharingWidgetConfig": {}
	},
	"dependencies": {
		"Janrain": {
			"appId": undefined
		},
		"StreamServer": {
			"appkey": undefined,
			"apiBaseURL": "//api.echoenabled.com/v1/",
			"submissionProxyURL": "https://apps.echoenabled.com/v2/esp/activity",
			"liveUpdates": {
				"transport": "websockets",
				"websockets": {
					"URL": "//live.echoenabled.com/v1/"
				}
			}
		}
	}
};

conversations.config.normalizer = {
	"dependencies": function(value) {
		// we should keep "appkey" and "apiBaseURL" at the root level
		// to let the Echo.UserSession class initialize correctly
		var ssConfig = value.StreamServer || {};
		this.set("appkey", ssConfig.appkey);
		this.set("apiBaseURL", ssConfig.apiBaseURL);
		return value;
	},
	"targetURL": function(value) {
		return value
			|| $("link[rel='canonical']").attr('href')
			|| document.location.href.split("#")[0];
	},
	"auth": function(value) {
		value.buttons = !!value.hideLoginButtons ? [] : ["login", "signup"];
		return value;
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
		'<div class="{class:postComposer}"></div>' +
		'<div class="{class:topPosts}"></div>' +
		'<div class="{class:allPosts}"></div>' +
	'</div>';

conversations.templates.defaultQuery =
	'childrenof:{data:targetURL} sortOrder:{data:initialSortOrder} ' +
	'itemsPerPage:{data:initialItemsPerPage} {data:markers} type:comment ' +
	'{data:operators} children:{data:replyNestingLevels} {data:operators}';

conversations.renderers.postComposer = function(element) {
	var config = this.config.get("postComposer");

	var visible = function() {
		return config.visible && !!$.map(config.contentTypes, function(type) {
			return type.visible ? type : undefined;
		}).length;
	};
	if (!visible()) {
		return element;
	}

	var targetURL = this.config.get("targetURL");
	var enableBundledIdentity = this.config.get("auth.enableBundledIdentity");
	var ssConfig = this.config.get("dependencies.StreamServer");
	this.initComponent({
		"id": "postComposer",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": ssConfig.appkey,
			"apiBaseURL": ssConfig.apiBaseURL,
			"submissionProxyURL": ssConfig.submissionProxyURL,
			"target": element,
			"targetURL": targetURL,
			"infoMessages": {"enabled": false},
			"plugins": [{
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}, $.extend({
				"name": "CardUIShim",
				"submitPermissions": this._getSubmitPermissions(),
				"auth": this.config.get("auth")
			}, this.config.get("postComposer"))],
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
	this.view.render({
		"target": element,
		"name": "_stream",
		"extra": {"id": "topPosts"}
	});
};

conversations.renderers.allPosts = function(element) {
	this.view.render({
		"target": element,
		"name": "_stream",
		"extra": {"id": "allPosts"}
	});
};

conversations.renderers._stream = function(element, extra) {
	this.initComponent({
		"id": extra.id,
		"component": "Echo.Apps.Conversations.StreamEntry",
		"config": this._assembleStreamConfig(extra.id, {
			"target": element
		})
	});
	return element;
};

conversations.methods._assembleStreamConfig = function(componentID, overrides) {
	var ssConfig = this.config.get("dependencies.StreamServer");
	var queryOverrides = componentID === "topPosts" ? {"replyNestingLevels": 0} : {};
	return $.extend({
		"id": componentID,
		"auth": this.config.get("auth"),
		"appkey": ssConfig.appkey,
		"apiBaseURL": ssConfig.apiBaseURL,
		"liveUpdates": ssConfig.liveUpdates,
		"submissionProxyURL": ssConfig.submissionProxyURL,
		"janrainAppId": this.config.get("dependencies.Janrain.appId"),
		"stream": {
			"data": this.get("data." + componentID + "-search"),
			"query": this._assembleSearchQuery(componentID)
		},
		"counter": {
			"data": this.get("data." + componentID + "-count"),
			"query": this._assembleSearchQuery(componentID, queryOverrides)
		},
		"displayEmptyStream": componentID === "allPosts",
		"replyComposer": this.config.get("replyComposer")
	}, this.config.get(componentID), overrides);
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
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

	var ssConfig = this.config.get("dependencies.StreamServer");
	Echo.StreamServer.API.request({
		"endpoint": "mux",
		"apiBaseURL": ssConfig.apiBaseURL,
		"data": {
			"appkey": ssConfig.appkey,
			"requests": requests
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
	'.{class:container} { min-height: 200px; }' +
	'.{class:container} li > a, ' +
	'.{class:container} .echo-primaryFont,' +
	'.{class:container} .echo-secondaryFont,' +
	'.{class:container} .echo-linkColor ' +
		'{ font-family: "Helvetica Neue", arial, sans-serif; }' +
	'.{class:postComposer} { margin-bottom: 10px; }' +
	'.{class:topPosts} > div { margin-bottom: 25px; }' +
	// set box-sizing property for all nested elements to default (content-box)
	// as its can be overwritten on the page.
	// TODO: get rid of these rules at all!
	'.{class:container} * { box-sizing: content-box !important; -moz-box-sizing: content-box; }' +
	'.{class:container} ul, .{class:container} li { list-style: inherit; }';

Echo.App.create(conversations);

})(Echo.jQuery);
