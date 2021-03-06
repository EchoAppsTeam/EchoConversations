(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

var sortOrderEntries = [{
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
}];

var cardContentTypes = {
	"comments": {
		"renderer": "CommentCard",
		"enabled": true
	},
	"photos": {
		"renderer": "PhotoCard",
		"enabled": true
	},
	"links": {
		"renderer": "LinkCard",
		"enabled": true
	},
	"articles": {
		"renderer": "ArticleCard",
		"enabled": true
	},
	"videos": {
		"renderer": "VideoCard",
		"enabled": true
	}
};

conversations.config = {
	"refreshOnUserInvalidate": false,
	"targetURL": "",
	"bozoFilter": false,
	"viewportChangeTimeout": 50,
	"streamingControl": {
		"pauseOnHover": true,
		"displayStreamingStateHeader": false,
		"enablePausePlayToggle": true
	},
	"postComposer": {
		"visible": true,
		"displaySharingOnPost": true,
		"contentTypes": {
			"comments": {
				"renderer": "CommentCard",
				"enabled": true,
				"resolveURLs": true,
				"attachments": {
					"visible": true,
					"sources": "COMPUTER, IMAGE_SEARCH, INSTAGRAM, PICASA, FLICKR, FACEBOOK, DROPBOX, URL, WEBCAM"
				}
			},
			"photos": {
				"renderer": "PhotoCard",
				"enabled": true,
				"sources": "COMPUTER, IMAGE_SEARCH, INSTAGRAM, PICASA, FLICKR, FACEBOOK, DROPBOX, URL, WEBCAM"
			},
			"links": {
				"renderer": "LinkCard",
				"enabled": true,
				"blockedDomains": []
			}
		},
		"confirmation": {
			"enabled": true,
			"message": "Thanks, your post has been submitted for review",
			"timeout": 5000,
			"hidingTimeout": 300
		},
		"plugins": []
	},
	"replyComposer": {
		"visible": true,
		"displaySharingOnPost": true,
		"displayCompactForm": true,
		"compact": {
			"layout": "inline",
			"prompt": "What's on your mind?"
		},
		"contentTypes": {
			"comments": {
				"renderer": "CommentCard",
				"enabled": true,
				"prompt": "What's on your mind?",
				"resolveURLs": true,
				"attachments": {
					"visible": true,
					"sources": "COMPUTER, IMAGE_SEARCH, INSTAGRAM, PICASA, FLICKR, FACEBOOK, DROPBOX, URL, WEBCAM"
				}
			},
			"photos": {
				"renderer": "PhotoCard",
				"enabled": true,
				"sources": "COMPUTER, IMAGE_SEARCH, INSTAGRAM, PICASA, FLICKR, FACEBOOK, DROPBOX, URL, WEBCAM"
			},
			"links": {
				"renderer": "LinkCard",
				"enabled": true,
				"blockedDomains": []
			}
		},
		"confirmation": {
			"enabled": true,
			"message": "Thanks, your post has been submitted for review",
			"timeout": 5000
		},
		"plugins": []
	},
	"topPosts": {
		"visible": false,
		"label": "Top Posts",
		"markItemsAsReadOn": "viewportenter", // "viewportenter" or "mouseenter"
		"queryOverride": "",
		"maxMediaWidth": undefined,
		"maxItemBodyHeight": 110, // px
		"initialItemsPerPage": 5,
		"initialSortOrder": "reverseChronological",
		"includeTopContributors": true,
		"displaySourceIcons": true,
		"displaySortOrderPulldown": true,
		"displayCounter": true,
		"displayTopPostHighlight": true,
		"displaySharingIntent": true,
		"displayLikeIntent": true,
		"displayReplyIntent": true,
		"displayEditIntent": true,
		"displayCommunityFlagIntent": false,
		"displayTweets": true,
		"likesDisplayStyle": "facepile",
		"replyNestingLevels": 2,
		"itemStates": ["Untouched", "ModeratorApproved"],
		"itemMarkers": [],
		"itemTypes": [],
		"openLinksInNewWindow": true,
		"sortOrderEntries": sortOrderEntries,
		"moderation": {
			"displayCommunityFlaggedPosts": true,
			"displaySystemFlaggedPosts": true
		},
		"events": {
			"onPostCountUpdate": null
		},
		"plugins": [],
		"contentTypes": cardContentTypes
	},
	"allPosts": {
		"visible": true,
		"label": "All Posts",
		"markItemsAsReadOn": "viewportenter", // "viewportenter" or "mouseenter"
		"queryOverride": "",
		"maxMediaWidth": undefined,
		"maxItemBodyHeight": 110, // px
		"initialItemsPerPage": 15,
		"initialSortOrder": "reverseChronological",
		"displaySourceIcons": true,
		"displaySortOrderPulldown": true,
		"displayCounter": true,
		"displayTopPostHighlight": true,
		"displaySharingIntent": true,
		"displayLikeIntent": true,
		"displayReplyIntent": true,
		"displayEditIntent": true,
		"displayCommunityFlagIntent": true,
		"displayTweets": true,
		"likesDisplayStyle": "facepile",
		"replyNestingLevels": 2,
		"noPostsMessage": "There are no posts yet.<br>Be the first to chime in!",
		"itemStates": ["Untouched", "ModeratorApproved"],
		"itemMarkers": [],
		"itemTypes": [],
		"openLinksInNewWindow": true,
		"sortOrderEntries": sortOrderEntries,
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
		"plugins": [],
		"contentTypes": cardContentTypes
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
			"apiBaseURL": "{%= apiBaseURLs.StreamServer.apiBaseURL %}/",
			"submissionProxyURL": "{%= apiBaseURLs.StreamServer.submissionProxyURL %}",
			"liveUpdates": {
				"transport": "websockets",
				"websockets": {
					"URL": "{%= apiBaseURLs.StreamServer.websockets %}/"
				}
			}
		},
		"FilePicker": {
			"apiKey": undefined
		},
		"embedly": {
			"apiKey": undefined
		}
	},
	"topMarkers": {
		"item": "Conversations.TopPost",
		"user": "Conversations.TopContributor"
	},
	"presentation": {
		"minWidth": 320,
		"maxHeight": undefined,
		"maxWidth": undefined
	}
};

conversations.vars = {
	"streamingState": "live",
	"changeStateOnHover": true,
	"activitiesCount": 0
};

conversations.labels = {
	"paused": "Paused",
	"live": "Streaming...",
	"itemsWaiting": "({count} new items waiting)"
};

conversations.config.normalizer = {
	"dependencies": function(value) {
		// Parameters order in a config might be different,
		// so we are handling all possible situations to make sure
		// that all required params are defined.
		var streamServer = Echo.Utils.get(value, "StreamServer", {});
		this.set("appkey", streamServer.appkey);
		this.set("apiBaseURL", streamServer.apiBaseURL);
		this.set("submissionProxyURL", streamServer.submissionProxyURL);
		return value;
	},
	"appkey": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.appkey", value);
	},
	"apiBaseURL": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.apiBaseURL", value);
	},
	"submissionProxyURL": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.submissionProxyURL", value);
	},
	"moderationQueue": function(value) {
		// TODO this code doesn't work if there is "moderationQueue" hash defined before "allPosts" in the app config.
		return $.extend(true, {}, this.get("allPosts"), value);
	},
	"targetURL": function(value) {
		if (value) {
			return value;
		}
		var pageURL = $("link[rel='canonical']").attr('href');
		if (!pageURL || !Echo.Utils.parseURL(pageURL).domain) {
			pageURL =  document.location.href.split("#")[0];
		}
		return pageURL;
	},
	"auth": function(value) {
		value.buttons = !!value.hideLoginButtons ? [] : ["login", "signup"];
		return value;
	}
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/api.pack.js",
	"control": "Echo.StreamServer.API"
}, {
	"url": "{%= appBaseURLs.prod %}/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.CardComposer"
}, {
	"url": "{%= appBaseURLs.prod %}/third-party/jquery.placeholder.js",
	"loaded": function() { return !!$.placeholder; }
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

conversations.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() {
			// re-render allPosts to show moderationQueue if it is enabled.
			if (this._moderationQueueEnabled()) {
				this.view.render({"name": "allPosts"});
			}
		}
	},
	"Echo.StreamServer.Controls.CardCollection.onActivitiesCountChange": function(_, data) {
		var allPosts = this.getComponent("allPosts");
		// display activities for 'allPosts' section only.
		if (allPosts && allPosts.config.get("context") === data.context) {
			this.set("activitiesCount", data.count);
			this.view.render({"name": "itemsWaiting"});
		}
	},
	"Echo.StreamServer.Controls.PostCounter.onUpdate": function(_, data) {
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
	this._retrieveData(function() {
		app.render();
		app.ready();
	});
	this._viewportChangeHandler = Echo.Utils.debounce(function() {
		app.events.publish({
			"topic": "onViewportChange",
			"global": false,
			"bubble": false
		});
	}, this.config.get("viewportChangeTimeout"));
	if (
		this.config.get("allPosts.markItemsAsReadOn") === "viewportenter"
		|| this.config.get("topPosts.markItemsAsReadOn") === "viewportenter"
	) {
		$(window).on("scroll resize", this._viewportChangeHandler);
	}
};

conversations.destroy = function() {
	$(window).off("scroll resize", this._viewportChangeHandler);
};

conversations.templates.main =
	'<div class="{class:container}">' +
		'<iframe class="{class:resizeFrame}" width="100%" height="100%" frameBorder="0" allowTransparency="true"></iframe>' +
		'<div class="{class:streamingStateContainer}">' +
			'<div class="pull-right {class:itemsWaiting}"></div>' +
			'<div class="{class:streamingState}"></div>' +
			'<div class="clearfix"></div>' +
		'</div>' +
		'<div class="{class:content}">' +
			'<div class="{class:postComposer}"></div>' +
			'<div class="{class:topPostsContainer}">' +
				'<div class="{class:topPostsHeader}"></div>' +
				'<div class="{class:topPosts}"></div>' +
			'</div>' +
			'<div class="{class:allPostsContainer}">' +
				'<div class="active {class:allPosts}"></div>' +
			'</div>' +
		'</div>' +
	'</div>';

conversations.templates.streamHeader =
	'<ul class="nav nav-tabs {class:tabs} {class:streamHeader}">' +
		'<li class="echo-primaryFont {class:streamTitle}"></li>' +
		'<li class="pull-right echo-primaryFont {class:streamSorter}"></li>' +
	'</ul>';

conversations.templates.streamTitle =
	'<span class="{class:streamTitle}">' +
		'<span class="{class:streamCaption}">{data:label}</span>' +
		'<span class="{class:streamCounter}"></span>' +
	'</span>';

conversations.templates.tabs = {};
conversations.templates.tabs.nav =
	'<ul class="nav nav-tabs {class:tabs} {class:streamHeader}">';

conversations.templates.tabs.navItem =
	'<li class="{data:class}">' +
		'<a href="#{data:tabId}" data-toggle="{data:type}"></a>' +
	'</li>';

conversations.templates.tabs.content =
	'<div class="tab-content {class:tabsContent}"></div>';

conversations.templates.tabs.contentItem =
	'<div class="tab-pane {data:class}" id="{data:tabId}"></div>';

conversations.templates.defaultQuery =
	'{data:filter}:\'{data:targetURL}\' {data:excludedSources} sortOrder:{data:initialSortOrder} safeHTML:permissive ' +
	'itemsPerPage:{data:initialItemsPerPage} {data:markers} {data:type} {data:operators} {data:userState} ' +
	'children:{data:replyNestingLevels} {data:childrenOperators} {data:userState}';

conversations.renderers.streamingStateContainer = function(element) {
	if (!this.config.get("streamingControl.displayStreamingStateHeader")) {
		element.hide();
	}
	return element;
};

conversations.renderers.resizeFrame = function(element) {
	var self = this;
	element.on("load", function() {
		$(this.contentWindow).on(
			"resize",
			Echo.Utils.debounce(function() {
				self.events.publish({
					"topic": "onAppResize"
				});
			}, 50)
		);
	});
	return element;
};

conversations.renderers.streamingState = function(element) {
	var self = this;
	var state = this.get("streamingState");
	var oldState = {"paused": "live", "live": "paused"}[state];
	if (this.config.get("streamingControl.enablePausePlayToggle")) {
		element.addClass("echo-clickable");
		element
			.off("click.streamingState")
			.on("click.streamingState", function() {
			self.setStreamingState(oldState, true);
		});
	}
	return element
		.empty()
		.removeClass(this.cssPrefix + "streamingState-" + oldState)
		.addClass(this.cssPrefix + "streamingState-" + state)
		.append(this.labels.get(state));
};

conversations.renderers.itemsWaiting = function(element) {
	var streamingState = this.get("streamingState");
	var activitiesCount = this.get("activitiesCount");
	element.empty();
	if (streamingState === "paused" && activitiesCount) {
		return element
			.append(this.labels.get("itemsWaiting", {"count": activitiesCount}))
			.show();
	} else {
		element.hide();
	}
	return element;
};

conversations.renderers.container = function(element) {
	var presentation = this.config.get("presentation");
	element.css({
		"max-width": presentation.maxWidth,
		"min-width": presentation.minWidth,
		"max-height": presentation.maxHeight,
		"overflow-y": presentation.maxHeight ? "auto" : "none"
	});
	return element;
};

conversations.renderers.content = function(element) {
	var self = this;
	if (this.config.get("streamingControl.pauseOnHover")) {
		element
			.on("mouseenter", function() { self.setStreamingState("paused"); })
			.on("mouseleave", function() { self.setStreamingState("live"); });
	}
	return element;
};

conversations.renderers.postComposer = function(element) {
	var postComposer = $.extend(true, {}, this.config.get("postComposer"));
	var contentTypePlugins = this._getContentTypePlugins("postComposer");
	if (!postComposer.visible || !contentTypePlugins.length) {
		return element;
	}

	var targetURL = this.config.get("targetURL");
	var enableBundledIdentity = this.config.get("auth.enableBundledIdentity");
	var ssConfig = this.config.get("dependencies.StreamServer");

	var plugins = postComposer.plugins;
	delete postComposer.plugins;

	this.initComponent({
		"id": "postComposer",
		"component": "Echo.StreamServer.Controls.CardComposer",
		"config": $.extend(true, postComposer, {
			"appkey": ssConfig.appkey,
			"apiBaseURL": ssConfig.apiBaseURL,
			"submissionProxyURL": ssConfig.submissionProxyURL,
			"requestMethod": "POST",
			"target": element,
			"targetURL": targetURL,
			"infoMessages": {"enabled": false},
			"markers": this._getSubmitMarkers(),
			"confirmation": {
				"enabled": this._isModerationRequired() && postComposer.confirmation.enabled
			},
			"auth": this.config.get("auth"),
			"submitPermissions": this._getSubmitPermissions(),
			"dependencies": this.config.get("dependencies"),
			"plugins": this._mergeSpecsByName([{
				"name": "JanrainBackplaneHandler",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"enabled": enableBundledIdentity,
				"authWidgetConfig": this.config.get("auth.authWidgetConfig"),
				"sharingWidgetConfig": this.config.get("auth.sharingWidgetConfig")
			}].concat(contentTypePlugins), plugins)
		})
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
			"component": "Echo.StreamServer.Controls.CardCollection",
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
	if (!this.config.get("allPosts.visible")) {
		return element;
	}
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
		"component": "Echo.StreamServer.Controls.CardCollection",
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
		tab.id = tab.id || (tab.name + "-" + Echo.Utils.getUniqueString());
		var li = $(self.substitute({
			"template": tpls.navItem,
			"data": {
				"class": (tab.active ? "active echo-active" : "") + " " + (tab.extraClass || ""),
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
				self.events.publish({
					"topic": "onTabShown",
					"data": tab
				});
			});
		}
		nav.append(li);

		if (tab.type === "tab") {
			var container = $(self.substitute({
				"template": tpls.contentItem,
				"data": {
					"tabId": tab.id,
					"class": tab.active ? "active echo-active": ""
				}
			}));
			var component = self.initComponent({
				"id": tab.name,
				"component": "Echo.StreamServer.Controls.CardCollection",
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
		var value = Echo.Cookie.get([extra.id, self.config.get("targetURL"), "sortOrder"].join("."))
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
					Echo.Cookie.set([extra.id, self.config.get("targetURL"), "sortOrder"].join("."), entry.value);
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

	// TODO: find a better solution to right-align the menu
	//       and/or extend the Echo.GUI.Dropdown class to support this
	element.find(".dropdown-menu").addClass("pull-right");
	return element.addClass(this.cssPrefix + "streamSorter");
};

conversations.renderers._streamTitle = function(element, extra) {
	var config = this.config.get(extra.id);
	var view = this.view.fork();
	var title = view.render({
		"template": conversations.templates.streamTitle,
		"data": {
			"label": config.label
		}
	});
	if (config.displayCounter) {
		this.initComponent({
			"id": extra.id + "Counter",
			"component": "Echo.StreamServer.Controls.PostCounter",
			"config": {
				"target": view.get("streamCounter"),
				"infoMessages": {
					"layout": "compact"
				},
				"plugins": [{"name": "CountVisualization"}],
				"query": this._assembleCounterQuery(extra.id),
				"data": this.get("data." + extra.id + "-count")
			}
		});
	}

	return element.append(title);
};

conversations.methods.setStreamingState = function(state, permanent) {
	var self = this;
	if (!this.get("changeStateOnHover") && !permanent) {
		return;
	}
	this.set("streamingState", state);
	// prohibit to change state on mouse enter/leave container if user set 'pause' state using button
	this.set("changeStateOnHover", !(permanent && state === "paused"));

	// change state of all streams
	$.map(["topPosts", "allPosts", "moderationQueue"], function(streamName) {
		var stream = self.getComponent(streamName);
		if (stream) {
			stream.setState(state);
		}
	});
	this.view.render({"name": "streamingState"});
};

conversations.methods._assembleStreamConfig = function(componentID, overrides) {
	// StreamServer config
	var ssConfig = this.config.get("dependencies.StreamServer");

	// component config
	var config = $.extend(true, {}, this.config.get(componentID));
	config.plugins = this._getStreamPluginList(componentID, overrides);

	return $.extend(true, {
		"id": componentID,
		"appkey": ssConfig.appkey,
		"context": this.config.get("context"),
		"apiBaseURL": ssConfig.apiBaseURL,
		"liveUpdates": ssConfig.liveUpdates,
		"submissionProxyURL": ssConfig.submissionProxyURL,
		"asyncItemsRendering": true,
		"state": {
			"toggleBy": "none"
		},
		"labels": {
			"emptyStream": config.noPostsMessage
		},
		"item": {
			"limits": {
				"maxBodyHeight": config.maxItemBodyHeight,
				"maxMediaWidth": config.maxMediaWidth
			},
			"reTag": false,
			"markAsRead": config.markItemsAsReadOn,
			"viaLabel": {
				"icon": config.displaySourceIcons
			},
			"initialIntentsDisplayMode": config.initialIntentsDisplayMode,
			"enableIntentsResponsiveness": config.enableIntentsResponsiveness
		},
		"data": this.get("data." + componentID + "-search"),
		"query": this._assembleSearchQuery(componentID)
	}, config, overrides);
};

conversations.methods._getStreamPluginList = function(componentID, overrides) {
	var auth = this.config.get("auth");
	var config = this.config.get(componentID);
	var moderationExtraActions = this.config.get("topPosts.visible")
		? this.config.get("topPosts.includeTopContributors")
			? ["topPost", "topContributor"]
			: ["topPost"]
		: [];

	var plugins = [].concat([{
		"name": "JanrainBackplaneHandler",
		"appId": this.config.get("dependencies.Janrain.appId"),
		"enabled": auth.enableBundledIdentity,
		"authWidgetConfig": auth.authWidgetConfig,
		"sharingWidgetConfig": auth.sharingWidgetConfig
	}, {
		"name": "TopPostIndicator",
		"enabled": config.displayTopPostHighlight,
		"marker": this.config.get("topMarkers.item")
	}, {
		"name": "TweetDisplay"
	}, {
		"name": "CardEventsProxy",
		"onAdd": function() {
			overrides.onItemAdd && overrides.onItemAdd();
		},
		"onDelete": function() {
			overrides.onItemDelete && overrides.onItemDelete();
		}
	}, {
		"name": "CardsRollingWindow",
		"moreButton": true
	}], this._getConditionalStreamPluginList(componentID), [{
		"name": "Moderation",
		"extraActions": moderationExtraActions,
		"topMarkers": this.config.get("topMarkers")
	}], this._getContentTypePlugins(componentID));

	return this._mergeSpecsByName(plugins, config.plugins);
};

conversations.methods._getConditionalStreamPluginList = function(componentID) {
	var auth = this.config.get("auth");
	var config = this.config.get(componentID);
	var replyContentTypePlugins = this._getContentTypePlugins("replyComposer");

	var replyComposer = $.extend(true, {}, this.config.get("replyComposer"));
	var composerPlugins = replyComposer.plugins;
	delete replyComposer.plugins;

	var plugins = [{
		"intentID": "Like",
		"name": "Like",
		"item": {
			"avatar": true,
			"text": false
		},
		"displayStyle": config.likesDisplayStyle
	}, {
		"intentID": "CommunityFlag",
		"name": "CommunityFlag",
		"showUserList": false
	}, $.extend(true, replyComposer, {
		"intentID": "Reply",
		"name": "Reply",
		"enabled": replyComposer.visible && replyContentTypePlugins.length && config.replyNestingLevels,
		"displayCompactForm": this.config.get("replyComposer.displayCompactForm"),
		"pauseTimeout": +(this._isModerationRequired() && replyComposer.confirmation.timeout),
		"requestMethod": "POST",
		"auth": this.config.get("auth"),
		"confirmation": {
			"enabled": this._isModerationRequired() && replyComposer.confirmation.enabled
		},
		"submitPermissions": this._getSubmitPermissions(),
		"nestedPlugins": this._mergeSpecsByName([{
			"name": "JanrainBackplaneHandler",
			"appId": this.config.get("dependencies.Janrain.appId"),
			"enabled": auth.enableBundledIdentity,
			"authWidgetConfig": auth.authWidgetConfig,
			"sharingWidgetConfig": auth.sharingWidgetConfig
		}].concat(replyContentTypePlugins), composerPlugins)
	}), {
		"intentID": "Sharing",
		"name": "SocialSharing"
	}, {
		"intentID": "Edit",
		"name": "Edit",
		"rootNestedPlugins": this._getContentTypePlugins("postComposer"),
		"childNestedPlugins": replyContentTypePlugins,
		"requestMethod": "POST"
	}];

	return $.grep(plugins, function(plugin) {
		return !!config["display" + plugin.intentID + "Intent"];
	});
};

conversations.methods._getContentTypePlugins = function(componentID) {
	//TODO: we should somehow determine order of content type plugins
	return $.map(this.config.get(componentID + ".contentTypes"), function(value) {
		if (!value.enabled && !!value.renderer) return;
		value.name = value.renderer;
		return value;
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
			"excludedSources": config.displayTweets === false ? "-source:Twitter" : "",
			"type": config.itemTypes.length ? "type:" + config.itemTypes.join(",") : "",
			"initialSortOrder": Echo.Cookie.get([componentID, this.config.get("targetURL"), "sortOrder"].join(".")) || config.initialSortOrder
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
				"userState": "-user.state:ModeratorBanned",
				"filter": "childrenof",
				"markers": (function() {
					var markers = $.map(
						[self.config.get("topMarkers.item"), config.itemMarkers],
						function(marker) {
							if (!marker || !marker.length) return null;
							return "markers:" + ($.type(marker) === "array" ? marker.join(",") : marker);
						}
					).join(" AND ");
					return "(" + markers + ")";
				})()
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
				"userState": "-user.state:ModeratorBanned",
				"filter": "childrenof",
				"markers": config.itemMarkers.length
					? "markers:" + config.itemMarkers.join(",")
					: ""
			};
		},
		"moderationQueue": function() {
			var operators = "state:Untouched -user.roles:moderator,administrator";
			return {
				"operators": operators,
				"childrenOperators": operators,
				"userState": "-user.state:ModeratorBanned" + (self._getPremoderationConfig()["approvedUserBypass"]
					? ",ModeratorApproved"
					: ""),
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
	var premoderation = this._getPremoderationConfig();

	var states = premoderation.enable && !ignorePremoderation
		? ["ModeratorApproved"]
		: config.itemStates;

	states = states.concat($.grep(["CommunityFlagged", "SystemFlagged"], function(state) {
		return Echo.Utils.get(config, "moderation.display" + state + "Posts");
	}));
	return "state:" + states.join(",");
};

conversations.methods._assembleModerationOperators = function() {
	var premoderation = this._getPremoderationConfig();
	if (!premoderation.enable) return "";

	var operators = [];
	if (premoderation.approvedUserBypass) {
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
	return this.user.is("admin") && this._getPremoderationConfig()["enable"];
};

conversations.methods._isModerationRequired = function() {
	var config = this._getPremoderationConfig();
	return config.enable &&
		!(this.user.is("admin") || (this.user.get("state") === "ModeratorApproved" && config.approvedUserBypass));
};

conversations.methods._getSubmitMarkers = function(excludes) {
	var self = this;
	excludes = excludes || [];
	var groups = {
		"topPost": function() {
			return ~$.inArray(self.config.get("topMarkers.user"), self.user.get("markers", []))
				? self.config.get("topMarkers.item") : [];
		},
		"premoderation": function() {
			return self._isModerationRequired()
				? self._getPremoderationConfig()["markers"] : [];
		}
	};
	var markers = Echo.Utils.foldl([], groups, function(handler, acc, key) {
		if (!~$.inArray(key, excludes)) {
			acc.push(handler());
		}
	});
	return Array.prototype.concat.apply([], markers);
};

conversations.methods._getPremoderationConfig = function() {
	return this.config.get("allPosts.moderation.premoderation");
};

// borrowed from Echo.App
conversations.methods._mergeSpecsByName = function(specs) {
	var self = this;
	var getSpecIndex = function(spec, specs) {
		var idx = -1;
		$.each(specs, function(i, _spec) {
			if (spec.name === _spec.name) {
				idx = i;
				return false;
			}
		});
		return idx;
	};
	// flatten update specs list
	var updateSpecs = $.map(Array.prototype.slice.call(arguments, 1) || [], function(spec) {
		return spec;
	});
	return Echo.Utils.foldl(specs, updateSpecs, function(extender) {
		var id = getSpecIndex(extender, specs);
		if (!~id) {
			specs.push(extender);
			return;
		}
		if (extender.name === specs[id].name) {
			if (extender.nestedPlugins) {
				specs[id].nestedPlugins = specs[id].nestedPlugins || [];
				self._mergeSpecsByName(specs[id].nestedPlugins, extender.nestedPlugins);
				// delete nested plugins in the extender to avoid override effect after extend below
				delete extender.nestedPlugins;
			}
		}
		specs[id] = $.extend(true, {}, specs[id], extender);
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
	'.{class:streamHeader} { padding: 5px 0px; position: relative; z-index: 20; }' +
	'.{class:streamTitle} { font-size: 14px; }' +
	'.{class:streamCounter} { font-size: 14px; }' +

	// streaming state
	'.{class:streamingStateContainer} { text-align: left; margin-bottom: 5px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }' +
	'.{class:streamingState} { padding-left: 15px; float: right; font-size: 13px; color: #c6c6c6; }' +
	'.{class:streamingState-live} { background: url({config:cdnBaseURL.sdk-assets}/images/control_play.png) no-repeat left 3px; }' +
	'.{class:streamingState-paused} { background: url({config:cdnBaseURL.sdk-assets}/images/control_pause.png) no-repeat left 3px; }' +
	'.{class:itemsWaiting} { font-size: 13px; color: #c6c6c6; margin-left: 5px; }' +

	// streamSorter dropdown
	'.{class:streamSorter} { font-size: 13px; }' +
	'.echo-sdk-ui .{class:streamSorter}:focus { outline: none; }' +
	'.{class:streamSorter} > ul > li > a { background: url("{%= appBaseURLs.prod %}/sdk-derived/images/marker.png") no-repeat right center; padding-right: 20px; }' +
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
	'.echo-sdk-ui .nav.{class:tabs} .dropdown-menu { border-radius: 6px; }' +

	// post composer
	'.{class:postComposer}, .{class:container} .echo-control-message { background-color: #ffffff; border: 0 none; }' +

	// common
	'.{class:container} .echo-control-message { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #42474A; font-size: 15px; line-height: 21px; }' +
	'.{class:container} { position:relative; }' +
	'.{class:resizeFrame} { position:absolute; z-index:-1; border:0; padding:0; }' +
	'.{class:container} li > a, ' +
	'.{class:container} .echo-primaryFont,' +
	'.{class:container} .echo-secondaryFont,' +
	'.{class:container} .echo-linkColor ' +
		'{ font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }' +
	'.{class:postComposer} { margin-bottom: 10px; }' +
	'.{class:topPosts} > div { margin-bottom: 25px; }' +
	// set box-sizing property for all nested elements to default (content-box)
	// as its can be overwritten on the page.
	// TODO: get rid of these rules at all!
	'.{class:container} * { box-sizing: content-box !important; -moz-box-sizing: content-box; }' +
	'.{class:container} ul, .{class:container} li { list-style: inherit; }';

Echo.App.create(conversations);

})(Echo.jQuery);
