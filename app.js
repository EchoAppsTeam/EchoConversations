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
		"confirmation": {
			"enable": true,
			"message": "Thanks, your post has been submitted for review",
			"timeout": 5000,
			"hidingTimeout": 300
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
		"confirmation": {
			"enable": true,
			"message": "Thanks, your post has been submitted for review",
			"timeout": 5000
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
		"events": {
			"onPostCountUpdate": null
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
		"events": {
			"onPostCountUpdate": null
		},
		"plugins": []
	},
	"moderationQueue": {
		"label": "Moderation Queue",
		"displayReplyIntent": false,
		"displaySharingIntent": false,
		"events": {
			"onPostCountUpdate": null
		}
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
	},
	"topMarkers": {
		"posts": {
			"add": "Conversations.TopPost",
			"remove": "Conversations.RemovedFromTopPosts"
		},
		"contributor": "Conversations.TopContributor"
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
		// TODO this code doesn't work if there is "moderationQueue" hash defined before "allPosts" in the app config.
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

conversations.events = {
	"Echo.StreamServer.Controls.Counter.onUpdate": function(_, data) {
		var app = this;
		$.each(["allPosts", "topPosts", "moderationQueue"], function(k, componentName) {
			var component = app.getComponent(componentName + "Counter");
			if (component && component.config.get("target").is(data.target)) {
				app._triggerCounterUpdateEvent({
					"component": componentName,
					"count": data.data.count
				});
				return false;
			}
		});
	}
};

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
	'<ul class="nav nav-tabs {class:tabs} {class:streamHeader}">' +
		'<li class="echo-primaryFont {class:streamTitle}"></li>' +
		'<li class="pull-right echo-primaryFont {class:streamSorter}"></li>' +
	'</ul>';

conversations.templates.tabs = {};
conversations.templates.tabs.nav =
	'<ul class="nav nav-tabs {class:tabs} {class:streamHeader}">';

conversations.templates.tabs.navItem =
	'<li class="{data:class}">' +
		'<a href="#{data:tabId}" data-toggle="{data:type}">{data:label}</a>' +
	'</li>';

conversations.templates.tabs.content =
	'<div class="tab-content {class:tabsContent}"></div>';

conversations.templates.tabs.contentItem =
	'<div class="tab-pane {data:class}" id="{data:tabId}"></div>';

conversations.templates.defaultQuery =
	'{data:filter}:{data:targetURL} sortOrder:{data:initialSortOrder} safeHTML:permissive ' +
	'itemsPerPage:{data:initialItemsPerPage} {data:markers} type:{data:types} ' +
	'{data:operators} children:{data:replyNestingLevels} {data:childrenOperators}';

conversations.templates.topConditions = {
	"onlyPosts": "markers:{data:itemMarkersToAdd} -markers:{data:itemMarkersToRemove}",
	"contributors": "(user.markers:{data:userMarkers} OR markers:{data:itemMarkersToAdd}) -markers:{data:itemMarkersToRemove}"
};

conversations.renderers.postComposer = function(element) {
	var config = this.config.get("postComposer");

	if (!this._isComposerVisible("postComposer")) {
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
				"name": "URLResolver",
				"enabled": this.config.get("postComposer.contentTypes.comments.resolveURLs")
			}, {
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}, $.extend(true, this.config.get("postComposer"), {
				"name": "CardUIShim",
				"submitPermissions": this._getSubmitPermissions(),
				"confirmation": {
					"enable": this._isModerationRequired() && this.config.get("postComposer.enable")
				},
				"auth": this.config.get("auth")
			})], config.plugins),
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
	if (this.config.get("topPosts.visible")) {
		this.view.render({
			"target": element,
			"name": "_streamHeader",
			"extra": {"id": "topPosts"}
		});
	}
	return element;
};

conversations.renderers.topPosts = function(element) {
	var self = this;
	if (this.config.get("topPosts.visible")) {
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
	}
	return element;
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

	var moderationExtraActions = this.config.get("topPosts.visible")
		? this.config.get("topPosts.includeTopContributors")
			? ["topPost", "topContributor"]
			: ["topPost"]
		: [];
	// component config
	var config = this.config.get(componentID);
	return $.extend(true, {
		"id": componentID,
		"appkey": ssConfig.appkey,
		"context": this.config.get("context"),
		"apiBaseURL": ssConfig.apiBaseURL,
		"liveUpdates": ssConfig.liveUpdates,
		"submissionProxyURL": ssConfig.submissionProxyURL,
		"asyncItemsRendering": true,
		"labels": {
			"emptyStream": config.noPostsMessage
		},
		"item": {
			"reTag": false,
			"limits": {
				"maxBodyCharacters": config.maxItemBodyCharacters
			}
		},
		"data": this.get("data." + componentID + "-search"),
		"query": this._assembleSearchQuery(componentID),
		"plugins": [].concat(this._getConditionalStreamPluginList(componentID), [{
			"name": "CardUIShim",
			"displayTopPostHighlight": config.displayTopPostHighlight,
			"includeTopContributors": this.config.get("topPosts.includeTopContributors"),
			"topMarkers": this.config.get("topMarkers")
		}, {
			"name": "ItemEventsProxy",
			"onAdd": function() {
				var counter = self.getComponent(componentID + "Counter");
				counter && counter.request.liveUpdates.start(true);
				overrides.onItemAdd && overrides.onItemAdd();
			},
			"onDelete": function() {
				var counter = self.getComponent(componentID + "Counter");
				counter && counter.request.liveUpdates.start(true);
				overrides.onItemDelete && overrides.onItemDelete();
			}
		}, {
			"name": "ModerationCardUI",
			"extraActions": moderationExtraActions,
			"topMarkers": this.config.get("topMarkers")
		}, {
			"name": "ItemsRollingWindow",
			"moreButton": true
		}, {
			"name": "URLResolver"
		}])
	}, this.config.get(componentID), overrides);
};

conversations.methods._getConditionalStreamPluginList = function(componentID) {
	var auth = this.config.get("auth");
	var config = this.config.get(componentID);

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
		"enabled": this._isComposerVisible("replyComposer"),
		"pauseTimeout": +this._isModerationRequired() && this.config.get("replyComposer.confirmation.timeout"),
		"actionString": this.config.get("replyComposer.contentTypes.comments.prompt"),
		"nestedPlugins": [].concat([{
				"name": "URLResolver",
				"enabled": this.config.get("replyComposer.contentTypes.comments.resolveURLs")
		}, {
			"name": "JanrainBackplaneHandler",
			"appId": this.config.get("dependencies.Janrain.appId"),
			"enabled": auth.enableBundledIdentity,
			"authWidgetConfig": auth.authWidgetConfig,
			"sharingWidgetConfig": auth.sharingWidgetConfig
		}, $.extend(true, this.config.get("replyComposer"), {
			"name": "CardUIShim",
			"auth": this.config.get("auth"),
			"confirmation": {
				"enable": this._isModerationRequired() && this.config.get("replyComposer.confirmation.timeout")
			},
			"submitPermissions": this._getSubmitPermissions()
		})], this.config.get("replyComposer.plugins"))
	}, {
		"intentID": "Sharing",
		"name": "CardUISocialSharing"
	}];

	return $.grep(plugins, function(plugin) {
		return !!config["display" + plugin.intentID + "Intent"];
	});
};

conversations.methods._isComposerVisible = function(composerID) {
	var config = this.config.get(composerID);
	return config.visible && !!$.map(config.contentTypes, function(type) {
		return type.visible ? type : undefined;
	}).length;
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
				"operators": self._assembleStates(componentID, true),
				"childrenOperators": (function() {
					var acc = [];
					acc.push(self._assembleStates(componentID));

					var moderation = self._assembleModerationOperators();
					if (moderation) {
						acc = acc.concat(moderation);
					}
					return self._operatorsToString(acc);
				})(),
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
			var operators = (function() {
				var acc = [];
				acc.push(self._assembleStates(componentID));

				// items for current user (if bozo filter enabled)
				var userId = self.user && self.user.get("identityUrl");
				if (self.config.get("bozoFilter") && userId) {
					acc.push("user.id:" + userId);
				}

				var moderation = self._assembleModerationOperators();
				if (moderation) {
					acc = acc.concat(moderation);
				}
				return self._operatorsToString(acc);
			})();
			return {
				"operators": operators,
				"childrenOperators": operators,
				"filter": "childrenof",
				"markers": config.itemMarkers.length
					? "markers:" + config.itemMarkers.join(",")
					: ""
			};
		},
		"moderationQueue": function() {
			var operators = "state:Untouched -user.roles:moderator,administrator -user.state:ModeratorApproved";
			return {
				"operators": operators,
				"childrenOperators": operators,
				"filter": "scope",
				"markers": config.itemMarkers.length
					? "markers:" + config.itemMarkers.join(",")
					: ""
			};
		}
	}[componentID];
};

conversations.methods._assembleStates = function(componentID, ignorePremoderation) {
	var config = this.config.get(componentID);
	var premoderation = this.config.get("allPosts.moderation.premoderation");

	var states = premoderation.enable && !ignorePremoderation
		? ["ModeratorApproved"]
		: config.itemStates;

	states = states.concat($.grep(["CommunityFlagged", "SystemFlagged"], function(state) {
		return Echo.Utils.get(config, "moderation.display" + state + "Posts");
	}));
	return "state:" + states.join(",");
};

conversations.methods._assembleModerationOperators = function() {
	var premoderation = this.config.get("allPosts.moderation.premoderation");
	if (!premoderation.enable) return "";

	var operators = [];
	if (premoderation.approvedUserByPass) {
		operators.push("user.state:ModeratorApproved AND -state:ModeratorDeleted");
	}
	operators.push("(user.roles:moderator,administrator AND -state:ModeratorDeleted)");
	return this._operatorsToString(operators);
};

conversations.methods._operatorsToString = function(operators) {
	return operators.length > 1
		? "(" + operators.join(" OR ") + ")"
		: operators.join("");
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
			app._triggerInitialCounterUpdateEvents(data);
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

conversations.methods._isModerationRequired = function() {
	var config = this.config.get("allPosts.moderation.premoderation");
	return config.enable &&
		!(this.user.is("admin") || (this.user.get("state") === "ModeratorApproved" && config.approvedUserBypass));
};

conversations.methods._getSubmitMarkers = function() {
	return this._isModerationRequired()
		? this.config.get("allPosts.moderation.premoderation.markers")
		: [];
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

conversations.methods._triggerInitialCounterUpdateEvents = function(data) {
	var app = this;
	$.map(["topPosts", "allPosts", "moderationQueue"], function(component) {
		var response = data[component + "-count"];
		if (response) {
			app._triggerCounterUpdateEvent({
				"component": component,
				"count": response.count
			});
		}
	});
};

conversations.methods._triggerCounterUpdateEvent = function(data) {
	var callback = this.config.get(data.component + ".events.onPostCountUpdate");
	callback && callback(data.count);
};

conversations.css =
	'.{class:streamHeader} { padding: 5px 0px; }' +
	'.{class:streamTitle} { font-size: 14px; }' +
	'.{class:streamCounter} { font-size: 14px; }' +

	// streamSorter dropdown
	'.{class:streamSorter} { font-size: 13px; }' +
	'.echo-sdk-ui .{class:streamSorter}:focus { outline: none; }' +
	'.{class:streamSorter} > ul > li > a { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }' +
	'.{class:streamSorter} ul.nav { margin-bottom: 0px; font-size: 13px; }' +
	'.{class:streamSorter} ul.nav > li > a { text-decoration: none; color: #C6C6C6; line-height: 18px; }' +
	'.{class:streamSorter} .dropdown-menu { float: right; left: auto; right: 0; }' +
	'.echo-sdk-ui .{class:streamSorter} .nav .dropdown .dropdown-toggle { background-color: transparent; border-color: transparent; color: #C6C6C6; }' +
	'.{class:streamSorter} ul.nav > li > a:hover,' +
		'.{class:streamSorter} ul.nav > li > a:focus { background-color: transparent}' +

	// tabs
	'.echo-sdk-ui .tab-content.{class:tabsContent} { overflow: visible; }' +
	'.echo-sdk-ui .nav.{class:tabs} { margin: 0px; padding: 5px 0px; }' +
	'.echo-sdk-ui .nav.{class:tabs} > li { height: 18px; line-height: 18px; }' +
	'.{class:tabs} > li > a, .{class:tabs} > li > a:hover { color: #C6C6C6; }' +
	'.echo-sdk-ui .nav.{class:tabs} { border: 0px; }' +
	'.echo-sdk-ui .nav.{class:tabs} > li > a { font-size: 14px; line-height: 18px; padding: 0px; margin-right: 15px; border: 0px; }' +
	'.echo-sdk-ui .nav.{class:tabs} > li.active > a,' +
		'.echo-sdk-ui .nav.{class:tabs} > li.active > a:hover,' +
		'.echo-sdk-ui .nav.{class:tabs} > li.active > a:focus,' +
		'.echo-sdk-ui .nav.{class:tabs} > li.active > a:active { border-bottom: 0px solid #d8d8d8; outline: none; color: black; }' +
	'.echo-sdk-ui .nav.{class:tabs} > .active > a,' +
		'.echo-sdk-ui .nav.{class:tabs} > .active > a:focus,' +
		'.echo-sdk-ui .nav.{class:tabs} > .active > a:hover { border: 0px; }' +
	'.echo-sdk-ui .{class:tabs} > li.pull-right > a { padding-right: 0px; margin-right: 0px; }' +
	'.echo-sdk-ui .nav.{class:tabs} > li > a:hover, .echo-sdk-ui .nav.{class:tabs} > li > a:focus { background-color: transparent; border: 0px; }' +
	'.echo-sdk-ui .{class:tabs} ul.nav { margin-bottom: 0px; }' +

	// common
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
