//TODO:
// 1. get rid of strange 'data:count.count'key
// 2. group params by components (stream, counter, sorter, etc.)

(function($) {
"use strict";

var entry = Echo.Control.manifest("Echo.Apps.Conversations.StreamEntry");

if (Echo.Control.isDefined(entry)) return;

entry.config = {
	"id": "",
	"auth": {},
	"janrainAppId": "",
	"visible": true,
	"label": "",
	"initialSortOrder": "reverseChronological",
	"includeTopContributors": false,
	"displayTopPostHighlight": true,
	"displaySharingIntent": true,
	"displayLikeIntent": true,
	"displayReplyIntent": true,
	"displayCommunityFlagIntent": true,
	"itemStates": "Untouched,ModeratorApproved",
	"itemMarkers": [""],
	"maxItemBodyCharacters": 200,
	"replyNestingLevels": 2,
	"displaySortOrderPulldown": true,
	"displayCounter": true,
	"displayEmptyStream": false,
	"noPostsMessage": "There are no posts yet.<br>Be the first to chime in!",
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
	"moderation": {
		"extraActions": ["topPost"]
	},
	"premoderation": {
		"markers": []
	}
};

entry.config.normalizer = {
	"moderation": function(value) {
		if (this.get("includeTopContributors")) {
			value.extraActions.push("topContributor");
		}
		return value;
	}
};

entry.vars = {
	"isEmpty": false
};

entry.events = {
	"Echo.StreamServer.Controls.Counter.onError": function(_, data) {
		var count = (data.data.errorCode === "more_than") ? data.data.errorMessage + "+" : "";
		this.set("count", count);
		this.view.render({"name": "counter"});
	},
	"Echo.StreamServer.Controls.Counter.onUpdate": function(_, data) {
		var count = Echo.Utils.get(data, "data.count", "");
		if (count !== this.get("count")) {
			this.set("count", count);
			this.view.render({"name": "counter"});
		}
	}
};

entry.init = function() {
	if (this.config.get("displayCounter")) {
		this.set("count", this.config.get("counter.data.count"));
		this.counter = new Echo.StreamServer.Controls.Counter({
			"target": $("<div>"),
			"appkey": this.config.get("appkey"),
			"context": this.config.get("context"),
			"apiBaseURL": this.config.get("apiBaseURL"),
			"query": this.config.get("counter.query"),
			"data": this.config.get("counter.data")
		});
		this.set("isEmpty", !this.get("count"));
	}
	this.render();
	this.ready();
};

entry.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:header}">' +
			'<div class="pull-right {class:sorter}"></div>' +
			'<span class="echo-primaryFont {class:caption}">{config:label}</span>&nbsp;' +
			'<span class="echo-primaryFont {class:counter}"></span>' +
		'</div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

entry.templates.sorterTitle =
	'<span class="{class:sorterTitle}">' +
		'{data:title}<span class="{class:dropdown}"></span>' +
	'</span>';

entry.renderers.container = function(element) {
	var hidden = !this.config.get("visible")
		|| this.get("isEmpty") && !this.config.get("displayEmptyStream");
	return hidden
		? element.hide()
		: element.show();
};

entry.renderers.counter = function(element) {
	if (!this.config.get("displayCounter") || !this.get("count")) {
		return element.hide();
	}
	var count = this.substitute({
		"template": "({data:count})",
		"data": {"count": this.get("count")}
	});
	return element
		.empty()
		.append(count)
		.show();
};

entry.renderers.stream = function(element) {
	this.stream = new Echo.StreamServer.Controls.Stream($.extend({
		"target": element
	}, this._getStreamConfig()));

	return element;
};

entry.renderers.sorter = function(element) {
	var self = this;

	if (!this.config.get("displaySortOrderPulldown")) {
		return element.hide();
	}

	var assembleTitle = function(title) {
		return self.substitute({
			"template": entry.templates.sorterTitle,
			"data": {"title": title}
		});
	};

	var getCurrentTitle = function() {
		var value = Echo.Cookie.get([self.config.get("id"), "sortOrder"].join("."))
			|| (function() {

				var query = self.stream
					? self.stream.config.get("query")
					: self.config.get("stream.query");

				var sortOrder = query.match(/sortOrder:(\S+)/);

				return $.isArray(sortOrder) && sortOrder.length
					? sortOrder.pop() : self.config.get("initialSortOrder");
			})();

		var values = $.grep(self.config.get("sortOrderEntries"), function(entry) {
			return entry.value === value;
		});
		return values.length ? values.pop().title : "";
	};

	var dropdown = new Echo.GUI.Dropdown({
		"target": element,
		"title": assembleTitle(getCurrentTitle()),
		"extraClass": "nav",
		"entries": $.map(this.config.get("sortOrderEntries", []), function(entry) {
			return {
				"title": entry.title,
				"handler": function() {
					Echo.Cookie.set([self.config.get("id"), "sortOrder"].join("."), entry.value);
					dropdown.setTitle(assembleTitle(entry.title));

					var query = self.stream.config.get("query");
					self.stream.config.set("query", query.replace(/sortOrder:\S+/, "sortOrder:" + entry.value));
					self.stream.config.remove("data");
					self.stream.refresh();
				}
			};
		})
	});
	// TODO: find a better solution to right-align the menu
	//       and/or extend the Echo.GUI.Dropdown class to support this
	element.find(".dropdown-menu").addClass("pull-right");
	return element;
};

entry.methods._getStreamConfig = function() {
	var self = this;

	var itemUpdatesHandler = function() {
		self.counter && self.counter.refresh();
		var items = $.grep(this.get("threads"), function(item) {
			return !item.deleted;
	        });
		self.set("isEmpty", !items.length);
		self.view.render({"name": "container"});
	};

	return {
		"appkey": this.config.get("appkey"),
		"context": this.config.get("context"),
		"apiBaseURL": this.config.get("apiBaseURL"),
		"liveUpdates": this.config.get("liveUpdates"),
		"submissionProxyURL": this.config.get("submissionProxyURL"),
		"query": this.config.get("stream.query"),
		"data": this.config.get("stream.data"),
		"asyncItemsRendering": true,
		"labels": {
			"emptyStream": this.config.get("noPostsMessage")
		},
		"item": {
			"reTag": false,
			"limits": {
				"maxBodyCharacters": this.config.get("maxItemBodyCharacters")
			}
		},
		"plugins": [].concat(this._getConditionalPluginList(), [{
			"name": "CardUIShim",
			"displayTopPostHighlight": this.config.get("displayTopPostHighlight")
		}, {
			"name": "ItemEventsProxy",
			"onAdd": itemUpdatesHandler,
			"onDelete": itemUpdatesHandler
		}, {
			"name": "ModerationCardUI",
			"extraActions": this.config.get("moderation.extraActions")
		}, {
			"name": "ItemsRollingWindow",
			"moreButton": true
		}], this.config.get("streamPlugins"))
	};
};

entry.methods._getConditionalPluginList = function(componentID) {
	var self = this, auth = this.config.get("auth");

	var visible = function() {
		var config = self.config.get("replyComposer");
		return config.visible && !!$.map(config.contentTypes, function(type) {
			return type.visible ? type : undefined;
		}).length;
	};

	var plugins = [{
		"intentID": "Like",
		"name": "LikeCardUI"
	}, {
		"intentID": "CommunityFlag",
		"name": "CommunityFlagCardUI"
	}, {
		"intentID": "Reply",
		"name": "ReplyCardUI",
		"enabled": visible(),
		// TODO: pass markers through data
		"extraMarkers": this.config.get("premoderation.markers"),
		"actionString": this.config.get("replyComposer.contentTypes.comments.prompt"),
		"nestedPlugins": [].concat([{
			"name": "JanrainBackplaneHandler",
			"appId": this.config.get("janrainAppId"),
			"enabled": auth.enableBundledIdentity,
			"authWidgetConfig": auth.authWidgetConfig,
			"sharingWidgetConfig": auth.sharingWidgetConfig
		}, $.extend({
			"name": "CardUIShim",
			"auth":	this.config.get("auth"),
			"submitPermissions": this._getSubmitPermissions()
		}, this.config.get("replyComposer"))], this.config.get("replyComposer.plugins"))
	}, {
		"intentID": "Sharing",
		"name": "CardUISocialSharing"
	}];

	return $.grep(plugins, function(plugin) {
		return !!self.config.get("display" + plugin.intentID + "Intent");
	});
};

entry.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

entry.css =
	'.{class:header} { padding: 5px 0px; }' +
	'.{class:caption} { line-height: 18px; font-size: 14px; }' +
	'.{class:counter} { line-height: 18px; font-size: 14px; }' +
	'.{class:sorter} ul.nav { margin-bottom: 0px; font-size: 13px; }' +
	'.{class:sorter} ul.nav > li > a { text-decoration: none; color: #7f7f7f; line-height: 22px; }' +
	'.{class:sorter} ul.nav > li > a:hover,' +
	'.{class:sorter} ul.nav > li > a:focus ' +
		'{ background-color: transparent}' +
	'.{class:dropdown} { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }';

Echo.Control.create(entry);

})(Echo.jQuery);
