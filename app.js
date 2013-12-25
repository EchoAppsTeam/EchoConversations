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
		},
		"plugins": []
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
		},
		"plugins": []
	},
	"topPosts": {
		"visible": true,
		"label": "Top Posts",
		"queryOverride": "",
		"initialItemsPerPage": 5,
		"initialSortOrder": "reverseChronological",
		"includeTopContributors": true,
		"displaySortOrderPulldown": true,
		"displayCounter": true,
		"displayTopPostHighlight": true,
		"displaySharingIntent": true,
		"displayLikeIntent": true,
		"displayReplyIntent": true,
		"displayCommunityFlagIntent": false,
		"replyNestingLevels": 2,
		"itemStates": ["Untouched", "ModeratorApproved"],
		"itemMarkers": [],
		"itemTypes": ["comment"],
		"userMarkers": ["Conversations.TopContributor"],
		"itemMarkersToAdd": ["Conversations.TopPost"],
		"itemMarkersToRemove": ["Conversations.RemovedFromTopPosts"],
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
		}],
		"moderation": {
			"displayCommunityFlaggedPosts": true,
			"displaySystemFlaggedPosts": true
		},
		"plugins": []
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
		"displayCommunityFlagIntent": true,
		"replyNestingLevels": 2,
		"noPostsMessage": "There are no posts yet.<br>Be the first to chime in!",
		"itemStates": ["Untouched", "ModeratorApproved"],
		"itemMarkers": [],
		"itemTypes": ["comment"],
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
		}],
		"moderation": {
			"displayCommunityFlaggedPosts": false,
			"displaySystemFlaggedPosts": false,
			"premoderation": {
				"enable": false,
				"approvedUserBypass": true,
				"markers": ["Conversations.Premoderation"]
			}
		},
		"plugins": []
	},
	"moderationQueue": {
		"label": "Moderation Queue",
		"displayReplyIntent": false,
		"displaySharingIntent": false
	},
	"auth": {
		"enableBundledIdentity": true,
		"hideLoginButtons": false,
		"allowAnonymousSubmission": false,
		"authWidgetConfig": {},
		"sharingWidgetConfig": {},
		"plugins": []
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
	"appkey": function() {
		return this.get("dependencies.StreamServer.appkey");
	},
	"apiBaseURL": function() {
		return this.get("dependencies.StreamServer.apiBaseURL");
	},
	"submissionProxyURL": function() {
		return this.get("dependencies.StreamServer.submissionProxyURL");
	},
	"moderationQueue": function(value) {
		return $.extend(true, {}, this.get("allPosts"), value);
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
		'<div class="{class:topPostsContainer}">' +
			'<div class="{class:topPostsHeader}"></div>' +
			'<div class="{class:topPosts}"></div>' +
		'</div>' +
		'<div class="{class:allPostsContainer}">' +
			'<div class="active {class:allPosts}"></div>' +
		'</div>' +
	'</div>';

conversations.templates.streamHeader =
	'<div class="{class:streamHeader}">' +
		'<span class="echo-primaryFont {class:streamTitle}"></span>' +
		'<div class="pull-right echo-primaryFont {class:streamSorter}"></div>' +
	'</div>';

conversations.templates.tabs = {};
conversations.templates.tabs.nav =
	'<ul class="nav nav-tabs {class:tabs}">';

conversations.templates.tabs.navItem =
		'<li class="{data:class}">' +
			'<a href="#{data:tabId}" data-toggle="{data:type}">{data:label}</a>' +
		'</li>';

conversations.templates.tabs.content =
		'<div class="tab-content {class:tabsContent}"></div>';

conversations.templates.tabs.contentItem =
	'<div class="tab-pane {data:class}" id="{data:tabId}"></div>';

conversations.templates.defaultQuery =
	'{data:filter}:{data:targetURL} sortOrder:{data:initialSortOrder} ' +
	'itemsPerPage:{data:initialItemsPerPage} {data:markers} type:{data:types} ' +
	'{data:operators} children:{data:replyNestingLevels} {data:operators}';

conversations.templates.topConditions = {
	"onlyPosts": "markers:{data:itemMarkersToAdd} -markers:{data:itemMarkersToRemove}",
	"contributors": "(user.markers:{data:userMarkers} OR markers:{data:itemMarkersToAdd}) -markers:{data:itemMarkersToRemove}"
};

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
			"markers": this._getSubmitMarkers(),
			"plugins": [].concat([{
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}, $.extend({
				"name": "CardUIShim",
				"submitPermissions": this._getSubmitPermissions(),
				"auth": this.config.get("auth")
			}, this.config.get("postComposer"))], config.plugins),
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

conversations.renderers.topPostsContainer = function(element) {
	var topPosts = this.getComponent("topPosts");

	var visible = this.config.get("topPosts.visible")
		&& topPosts
		&& $.grep(topPosts.get("threads"), function(item) { return !item.deleted; }).length > 0;

	return visible
		? element.show()
		: element.hide();
};

conversations.renderers.topPostsHeader = function(element) {
	this.view.render({
		"target": element,
		"name": "_streamHeader",
		"extra": {"id": "topPosts"}
	});
};

conversations.renderers.topPosts = function(element) {
	var self = this;
	this.initComponent({
		"id": "topPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": this._assembleStreamConfig("topPosts", {
			"onItemAdd": function() {
				self.view.render({"name": "topPostsContainer"});
			},
			"onItemDelete": function() {
				self.view.render({"name": "topPostsContainer"});
			},
			"ready": function() {
				self.view.render({"name": "topPostsContainer"});
			},
			"target": element
		})
	});
};

conversations.renderers.allPosts = function(element) {
	if (this._moderationQueueEnabled()) {
		this.view.render({
			"name": "_tabs",
			"target": element,
			"extra": {
				"tabs": [{
					"name": "allPosts",
					"active": true,
					"renderer": "_streamTitle"
					}, {
					"name": "moderationQueue",
					"renderer": "_streamTitle"
				}, {
					"name": "sorter",
					"type": "dropdown",
					"extraClass": "pull-right",
					"renderer": "_streamSorter"
				}]
			}
		});
	} else {
		this.view.render({
			"name": "_allPosts",
			"target": element
		});
	}
	return element;
};


conversations.renderers._allPosts = function(element, extra) {
	element.empty();
	this.view.render({
		"target": element,
		"name": "_streamHeader",
		"extra": {"id": "allPosts"}
	});
	var component = this.initComponent({
		"id": "allPosts",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": this._assembleStreamConfig("allPosts", {
			"target": $("<div>")
		})
	});
	element.append(component.config.get("target"));
	return element;
};

conversations.renderers._tabs = function(element, extra) {
	var self = this;

	var tpls = conversations.templates.tabs;

	var nav = $(this.substitute({"template": tpls.nav}));
	var content = $(this.substitute({"template": tpls.content}));

	$.map(extra.tabs, function(tab) {
		tab.type = tab.type || "tab"; // tab || dropdown
		tab.id = tab.id || (tab.name + "-" + self.config.get("context"));
		var li = $(self.substitute({
			"template": tpls.navItem,
			"data": {
				"label": tab.name,
				"class": (tab.active ? "active" : "") + " " + (tab.extraClass || ""),
				"type": tab.type,
				"tabId": tab.id
			}
		}));
		if (tab.renderer) {
			self.view.render({
				"target": li.find("a"),
				"name": tab.renderer,
				"extra": {"id": tab.name}
			});
			li.on("shown", function(ev) {
				var sorter = element.find("." + self.cssPrefix + "streamSorter");
				if (sorter) {
					// re-render sorter dropdown in case if customer switched tab
					self.view.render({
						"target": sorter,
						"name": "_streamSorter",
						"extra": {"id": tab.name}
					});
				}
			});
		}
		nav.append(li);

		if (tab.type === "tab") {
			var container = $(self.substitute({
				"template": tpls.contentItem,
				"data": {
					"tabId": tab.id,
					"class": tab.active ? "active": ""
				}
			}));
			var component = self.initComponent({
				"id": tab.name,
				"component": "Echo.StreamServer.Controls.Stream",
				"config": self._assembleStreamConfig(tab.name, {
					"target": $("<div>")
				})
			});

			content.append(container.append(component.config.get("target")));
		}
	});
	return element.empty().append(nav).append(content);
};

conversations.renderers._streamHeader = function(element, extra) {
	var view = this.view.fork();
	var header = view.render({
		"template": conversations.templates.streamHeader
	});
	this.view.render({
		"target": view.get("streamTitle"),
		"name": "_streamTitle",
		"extra": {"id": extra.id}
	});
	if (this.config.get(extra.id + ".displaySortOrderPulldown")) {
		this.view.render({
			"target": view.get("streamSorter"),
			"name": "_streamSorter",
			"extra": {"id": extra.id}
		});
	}
	return element.empty().append(header);
};

conversations.renderers._streamSorter = function(element, extra) {
	var self = this;
	if (!~$.inArray(extra.id, ["allPosts", "topPosts", "moderationQueue"])) {
		extra.id = "allPosts";
	}
	var config = this.config.get(extra.id);

	var getCurrentTitle = function() {
		var value = Echo.Cookie.get([extra.id, "sortOrder"].join("."))
			|| (function() {

				var stream = self.getComponent(extra.id);
				var query = stream
					? stream.config.get("query")
					: self._assembleSearchQuery(extra.id);

				var sortOrder = query.match(/sortOrder:(\S+)/);

				return $.isArray(sortOrder) && sortOrder.length
					? sortOrder.pop() : config.initialSortOrder;
			})();

		var values = $.grep(config.sortOrderEntries || [], function(entry) {
			return entry.value === value;
		});
		return values.length ? values.pop().title : "";
	};

	var dropdown = new Echo.GUI.Dropdown({
		"target": element,
		"title": getCurrentTitle(),
		"extraClass": "nav",
		"entries": $.map(config.sortOrderEntries || [], function(entry) {
			return {
				"title": entry.title,
				"handler": function() {
					Echo.Cookie.set([extra.id, "sortOrder"].join("."), entry.value);
					dropdown.setTitle(entry.title);

					var stream = self.getComponent(extra.id);
					if (stream) {
						var query = stream.config.get("query");
						stream.config.set("query", query.replace(/sortOrder:\S+/, "sortOrder:" + entry.value));
						stream.config.remove("data");
						stream.refresh();
					}
				}
			};
		})
	});
	return element.addClass(this.cssPrefix + "streamSorter");
};

conversations.renderers._streamTitle = function(element, extra) {
	var config = this.config.get(extra.id);
	element.empty().append(config.label);
	if (config.displayCounter) {
		var counterContainer = $("<span>");
		this.initComponent({
			"id": extra.id + "Counter",
			"component": "Echo.StreamServer.Controls.Counter",
			"config": {
				"target": counterContainer,
				"infoMessages": {
					"layout": "compact"
				},
				"query": this._assembleCounterQuery(extra.id),
				"data": this.get("data." + extra.id + "-count")
			}
		});
		element
			.append("&nbsp;(")
			.append(counterContainer)
			.append(")");
	}

	return element.addClass(this.cssPrefix + "streamTitle");
};


conversations.methods._assembleStreamConfig = function(componentID, overrides) {
	var self = this;
	// StreamServer config
	var ssConfig = this.config.get("dependencies.StreamServer");

	// component config
	var config = this.config.get(componentID);
	config.get = function(name) {
		return Echo.Utils.get(this, name);
	};
	return $.extend(true, {
		"id": componentID,
		"appkey": ssConfig.appkey,
		"context": this.config.get("context"),
		"apiBaseURL": ssConfig.apiBaseURL,
		"liveUpdates": ssConfig.liveUpdates,
		"submissionProxyURL": ssConfig.submissionProxyURL,
		"asyncItemsRendering": true,
		"labels": {
			"emptyStream": config.get("noPostsMessage")
		},
		"item": {
			"reTag": false,
			"limits": {
				"maxBodyCharacters": config.get("maxItemBodyCharacters")
			}
		},
		"data": this.get("data." + componentID + "-search"),
		"query": this._assembleSearchQuery(componentID),
		"plugins": [].concat(this._getConditionalStreamPluginList(componentID), [{
			"name": "CardUIShim",
			"displayTopPostHighlight": config.get("displayTopPostHighlight")
		}, {
			"name": "ItemEventsProxy",
			"onAdd": overrides.onItemAdd,
			"onDelete": overrides.onItemDelete
		}, {
			"name": "ModerationCardUI",
			"extraActions": $.map({
					"topPost": "topPosts.visible",
					"topContributor": componentID + ".includeTopContributors"
				}, function(configKey, action) {
					return self.config.get(configKey)
						? action
						: undefined;
				})
		}, {
			"name": "ItemsRollingWindow",
			"moreButton": true
		}])
	}, this.config.get(componentID), overrides);
};

conversations.methods._getConditionalStreamPluginList = function(componentID) {
	var auth = this.config.get("auth");

	var config = this.config.get(componentID);
	config.get = function(name) {
		return Echo.Utils.get(this, name);
	};

	var replyComposerConfig = this.config.get("replyComposer");
	var displayReplyComposer = replyComposerConfig.visible && !!$.map(replyComposerConfig.contentTypes, function(type) {
		return type.visible ? type : undefined;
	}).length;
	var plugins = [{
		"intentID": "Like",
		"name": "LikeCardUI"
	}, {
		"intentID": "CommunityFlag",
		"name": "CommunityFlagCardUI"
	}, {
		"intentID": "Reply",
		"name": "ReplyCardUI",
		// TODO: pass markers through data
		"extraMarkers": this._getSubmitMarkers(),
		"enabled": displayReplyComposer,
		"actionString": this.config.get("replyComposer.contentTypes.comments.prompt"),
		"nestedPlugins": [].concat([{
			"name": "JanrainBackplaneHandler",
			"appId": this.config.get("dependencies.Janrain.appId"),
			"enabled": auth.enableBundledIdentity,
			"authWidgetConfig": auth.authWidgetConfig,
			"sharingWidgetConfig": auth.sharingWidgetConfig
		}, $.extend({
			"name": "CardUIShim",
			"auth": this.config.get("auth"),
			"submitPermissions": this._getSubmitPermissions()
		}, this.config.get("replyComposer"))], this.config.get("replyComposer.plugins"))
	}, {
		"intentID": "Sharing",
		"name": "CardUISocialSharing"
	}];

	return $.grep(plugins, function(plugin) {
		return !!config.get("display" + plugin.intentID + "Intent");
	});
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._assembleCounterQuery = function(componentID) {
	var overrides = name !== "allPosts" ? {"replyNestingLevels": 0} : {};
	return this._assembleSearchQuery(componentID, overrides);
};

conversations.methods._assembleSearchQuery = function(componentID, overrides) {
	var config = this.config.get(componentID, {});
	var query = config.queryOverride;
	var args = query ? {} : this._getQueryArgsBuilder(componentID)();

	return this.substitute({
		"template": query || conversations.templates.defaultQuery,
		"data": $.extend({}, config, {
			"targetURL": this.config.get("targetURL"),
			"types": config.itemTypes.join(","),
			"initialSortOrder": Echo.Cookie.get([componentID, "sortOrder"].join(".")) || config.initialSortOrder
		}, args, overrides)
	});
};

conversations.methods._getQueryArgsBuilder = function(componentID) {
	var self = this;
	var config = this.config.get(componentID, {});

	return {
		"topPosts": function() {
			return {
				"operators": self._assembleTopPostsOperators(componentID),
				"filter": "childrenof",
				"markers": self.substitute({
					"template": conversations.templates.topConditions[
						config.includeTopContributors ? "contributors" : "onlyPosts"
					],
					"data": {
						"userMarkers": config.userMarkers.join(","),
						"itemMarkersToAdd": config.itemMarkersToAdd.join(","),
						"itemMarkersToRemove": config.itemMarkersToRemove.join(",")
					}
				})
			};
		},
		"allPosts": function() {
			return {
				"operators": self._assembleAllPostsOperators(componentID),
				"filter": "childrenof",
				"markers": config.itemMarkers.length
					? "markers:" + config.itemMarkers.join(",")
					: ""
			};
		},
		"moderationQueue": function() {
			return {
				"operators": "state:Untouched -user.roles:moderator,administrator -user.state:ModeratorApproved",
				"filter": "scope",
				"markers": config.itemMarkers.length
						? "markers:" + config.itemMarkers.join(",")
						: ""
			};
		}
	}[componentID];
};

conversations.methods._assembleTopPostsOperators = function() {
	var config = this.config.get("topPosts");
	var states = $.map(["CommunityFlagged", "SystemFlagged"], function(state) {
		return !Echo.Utils.get(config, "moderation.display" + state + "Posts")
			? "-state:" + state
			: null;
	});
	return states.join(" ") + " -state:ModeratorDeleted";
};

conversations.methods._assembleAllPostsOperators = function() {
	var operators = [];
	var config = this.config.get("allPosts");

	// items with specific status
	var states = !Echo.Utils.get(config, "moderation.premoderation.enable")
		? config.itemStates
		: ["ModeratorApproved"];

	states = states.concat($.grep(["CommunityFlagged", "SystemFlagged"], function(state) {
		return Echo.Utils.get(config, "moderation.display" + state + "Posts");
	}));
	operators.push("state:" + states.join(","));

	// items for current user (if bozo filter enabled)
	var userId = this.user && this.user.get("identityUrl");
	if (this.config.get("bozoFilter") && userId) {
		operators.push("user.id:" + userId);
	}

	// approved users (if approvedUserBypass enabled)
	if (
		Echo.Utils.get(config, "moderation.premoderation.enable")
		&& Echo.Utils.get(config, "moderation.premoderation.approvedUserBypass")
	) {
		operators.push("(user.state:ModeratorApproved AND -state:ModeratorDeleted)");
	}

	// always display admin/moderator posts if they are not deleted
	operators.push("(user.roles:moderator,administrator AND -state:ModeratorDeleted)");

	return "(" + operators.join(" OR ") + ")";
};

conversations.methods._retrieveData = function(callback) {
	var app = this;
	var ids = ["topPosts", "allPosts"];
	if (this._moderationQueueEnabled()) {
		ids.push("moderationQueue");
	}
	var requests = Echo.Utils.foldl([], ids, function(name, acc) {
		if (!app.config.get(name + ".visible")) return;
		acc.push({
			"id": name + "-search",
			"method": "search",
			"q": app._assembleSearchQuery(name)
		});
		if (app.config.get(name + ".displayCounter")) {
			// for Top Posts we need to count only root items...
			acc.push({
				"id": name + "-count",
				"method": "count",
				"q": app._assembleCounterQuery(name)
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

conversations.methods._moderationQueueEnabled = function() {
	return this.user.is("admin") && this.config.get("allPosts.moderation.premoderation.enable");
};

conversations.methods._getSubmitMarkers = function() {
	var config = this.config.get("allPosts.moderation.premoderation");
	return config.enable &&
		!(this.user.is("admin") || (this.user.get("state") === "ModeratorApproved" && config.approvedUserBypass))
		? config.markers : [];
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
	'.{class:streamHeader} { padding: 5px 0px; }' +
	'.{class:streamTitle} { line-height: 18px; font-size: 14px; }' +
	'.{class:streamCounter} { line-height: 18px; font-size: 14px; }' +

	'.{class:streamSorter} { font-size: 13px; }' +
	'.echo-sdk-ui .{class:streamSorter}:focus { outline: none; }' +
	'.{class:streamSorter} > ul > li > a { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }' +
	'.{class:streamSorter} ul.nav { margin-bottom: 0px; font-size: 13px; }' +
	'.{class:streamSorter} ul.nav > li > a { text-decoration: none; color: #7f7f7f; line-height: 22px; }' +
	'.{class:streamSorter} ul.nav > li > a:hover,' +
		'.{class:streamSorter} ul.nav > li > a:focus { background-color: transparent}' +

	'.echo-sdk-ui .tab-content.{class:tabsContent} { overflow: visible; }' +
	'.echo-sdk-ui .nav.{class:tabs} { margin-bottom: 5px; }' +
	'.{class:tabs} > li > a { font-size: 13px; }' +
	'.echo-sdk-ui .nav.{class:tabs} > li > a:hover,' +
		'.echo-sdk-ui .nav.{class:tabs} > li > a:focus { background-color: transparent; border: 1px solid transparent; }' +

	'.echo-sdk-ui .{class:streamSorter} .nav .dropdown .dropdown-toggle { background-color: transparent; border-color: transparent; color: #7f7f7f; }' +

	'.echo-sdk-ui .{class:tabs} ul.nav { margin-bottom: 0px; }' +
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
