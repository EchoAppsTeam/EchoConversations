(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.FaceCollection
 * Echo FaceCollection control displays users (actors) returned in any activity stream and displays a live updating collection of avatars and names.
 * It is either a static list formed by a predefined data set or live updated list constructed using the Echo Query Language.

 * 	new Echo.StreamServer.Controls.FaceCollection({
 * 		"target": document.getElementById("echo-facepile"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"query": "childrenof:http://example.com/* itemsPerPage:2 children:0",
 * 		"suffixText": " commented on aboutecho.com",
 * 		"item": {"avatar": true, "text": true}
 * 	});
 *
 * More information regarding the possible ways of the Control initialization
 * can be found in the ["How to initialize Echo components"](#!/guide/how_to_initialize_components-section-initializing-an-app) guide.
 *
 * @extends Echo.Control
 *
 * @package streamserver/controls.pack.js
 * @package streamserver.pack.js
 *
 * @constructor
 * FaceCollection constructor initializing Echo.StreamServer.Controls.FaceCollection class
 *
 * @param {Object} config
 * Configuration options
/*/
var collection = Echo.Control.manifest("Echo.StreamServer.Controls.FaceCollection");

if (Echo.Control.isDefined(collection)) return;

/** @hide @cfg defaultAvatar */
/** @hide @cfg submissionProxyURL */
/** @hide @method placeImage */
/** @hide @method getRelativeTime */
/** @hide @echo_label justNow */
/** @hide @echo_label today */
/** @hide @echo_label yesterday */
/** @hide @echo_label lastWeek */
/** @hide @echo_label lastMonth */
/** @hide @echo_label secondAgo */
/** @hide @echo_label secondsAgo */
/** @hide @echo_label minuteAgo */
/** @hide @echo_label minutesAgo */
/** @hide @echo_label hourAgo */
/** @hide @echo_label hoursAgo */
/** @hide @echo_label dayAgo */
/** @hide @echo_label daysAgo */
/** @hide @echo_label weekAgo */
/** @hide @echo_label weeksAgo */
/** @hide @echo_label monthAgo */
/** @hide @echo_label monthsAgo */

/**
 * @echo_event Echo.StreamServer.Controls.FaceCollection.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.FaceCollection.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.FaceCollection.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.FaceCollection.onRerender
 * Triggered when the app is rerendered.
 */
collection.init = function() {
	if (!this.checkAppKey()) return;

	// picking up timeout value for backwards compatibility
	var timeout = this.config.get("liveUpdates.timeout");
	if (typeof timeout !== "undefined") {
		this.config.set("liveUpdates.polling.timeout", timeout);
	}

	// data can be defined explicitly
	// in this case we do not make API requests
	if ($.isEmptyObject(this.get("data"))) {
		this._request();
	} else {
		this.set("data.itemsPerPage", this.get("data.itemsPerPage", 2));
		this.config.set("liveUpdates.enabled", false);
		this._initialResponseHandler(this.data);
	}
};

collection.config = {
	/**
	 * @cfg {Object} data
	 * Specifies static data for the face pile. It has the same format as returned
	 * by the <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/search/#sect3" target="_blank">
	 * "search" API endpoint</a>. If the "data" parameter is provided then the
	 * "query" parameter should be omitted. If "data" and "query" parameters are both
	 * provided "query" takes precedence over "data".
	 */
	"data": undefined,

	/**
	 * @cfg {String} initialUsersCount
	 * The number of users which will be shown when the FaceCollection is displayed
	 * for the first time. Default value is the value of `data.itemsPerPage`
	 * parameter. Note that the parameter is actual only for the list created
	 * using `data`.
	 */
	"initialUsersCount": undefined,

	/**
	 * @cfg {String} totalUsersCount
	 * The total number of users for the FaceCollection. If it's not defined it defaults to
	 * the length of the provided data.entries field. Note that the parameter is actual
	 * only for the list created using `data`.
	 */
	"totalUsersCount": undefined,

	/**
	 * @cfg {String} [maxUsersCount]
	 * The maximum number of users to be displayed. Each new added user is going to push out the oldest one.
	 */
	"maxUsersCount": undefined,

	/**
	 * @cfg {String} query
	 * Specifies the search query to generate the necessary data set.
	 * It must be constructed according to the
	 * <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/search/" target="_blank">"search" API</a>
	 * method specification.
	 *
	 *	new Echo.StreamServer.Controls.FaceCollection({
	 *		"target": document.getElementById("echo-facepile"),
	 *		"appkey": "echo.jssdk.demo.aboutecho.com",
	 *		"query" : "childrenof:http://example.com/test/*"
	 *	});
	 */
	"query": "",

	/**
	 * @cfg {String} suffixText
	 * Specifies the text being appended to the end of FaceCollection user's list.
	 */
	"suffixText": "",

	/**
	 * @cfg {Object} item
	 * Customizes the FaceCollection item
	 *
	 * @cfg {Boolean} item.avatar
	 * Specifies if the user avatar should be rendered within the FaceCollection item.
	 *
	 * @cfg {Boolean} item.text
	 * Specifies if the user name should be rendered within the FaceCollection item.
	 */
	"item": {
		"avatar": true,
		"text": true
	},

	/**
	 * @cfg {Object} [liveUpdates]
	 * Live updating machinery configuration.
	 *
	 * @cfg {Boolean} [liveUpdates.enabled=true]
	 * Parameter to enable/disable live updates.
	 *
	 * @cfg {String} [liveUpdates.transport="websockets"]
	 * Preferred live updates receiveing machinery transport.
	 * The following transports are supported:
	 *
	 * + "polling" - periodic requests to check for updates
	 * + "websockets" - transport based on the WebSocket technology
	 *
	 * If the end user's browser doesn't support the WebSockets technology,
	 * the "polling" transport will be used as a fallback.
	 *
	 * @cfg {Object} [liveUpdates.polling]
	 * Object which contains the configuration specific to the "polling"
	 * live updates transport.
	 *
	 * @cfg {Number} [liveUpdates.polling.timeout=10]
	 * Timeout between the live updates requests (in seconds).
	 *
	 * @cfg {Object} [liveUpdates.websockets]
	 * Object which contains the configuration specific to the "websockets"
	 * live updates transport.
	 *
	 * @cfg {Number} [liveUpdates.websockets.maxConnectRetries=3]
	 * Max connection retries for WebSocket transport. After the number of the
	 * failed connection attempts specified in this parameter is reached, the
	 * WebSocket transport is considered as non-supported: the client no longer
	 * tries to use the WebSockets on the page and the polling transport is used
	 * from now on.
	 *
	 * @cfg {Number} [liveUpdates.websockets.serverPingInterval=30]
	 * The timeout (in seconds) between the client-server ping-pong requests
	 * to keep the connection alive.
	 */
	"liveUpdates": {
		"transport": "websockets", // or "polling"
		"enabled": true,
		"polling": {
			"timeout": 10
		},
		"websockets": {
			"maxConnectRetries": 3,
			"serverPingInterval": 30
		}
	},

	/**
	 * @cfg {String} infoMessages
	 * Customizes the look and feel of info messages, for example "loading" and "error".
	 */
	"infoMessages": {
		"layout": "compact"
	}
};

collection.vars = {
	"users": [],
	"uniqueUsers": {},
	"isViewComplete": false,
	"moreRequestInProgress": false,
	"count": {
		"total": 0,
		"visible": 0
	}
};

collection.labels = {
	/**
	 * @echo_label
	 */
	"and": "and",
	/**
	 * @echo_label
	 */
	"more": "more"
};

/**
 * @echo_template
 */
collection.templates.main =
	'<span class="{class:container}">' +
		'<span class="{class:actors}"></span>' +
		'<span class="{class:more}"></span>' +
		'<span class="{class:suffixText}"></span>' +
	'</span>';

/**
 * @echo_renderer
 */
collection.renderers.more = function(element) {
	var self = this;
	if (!this._isMoreButtonVisible()) {
		return element.addClass(this.cssPrefix + "moreHidden");
	}
	element.empty().removeClass(this.cssPrefix + "moreHidden");
	var count = this.get("count.total") - this.get("count.visible");
	var caption = (count > 0 ? count + " " : "") + this.labels.get("more");
	var linkable = !this._fromExternalData() || this.get("count.visible") < this.get("users").length;
	if (linkable) {
		var link = Echo.Utils.hyperlink({"caption": caption});
		element.addClass("echo-linkColor").append(link);
	} else {
		element.removeClass("echo-linkColor").append(caption);
	}
	this.set("moreRequestInProgress", false);
	if (linkable) {
		element.one("click", function() {
			self._getMoreUsers();
		});
	}
	return element;
};

/**
 * @echo_renderer
 */
collection.renderers.actors = function(element) {
	var self = this, usersDOM = [];
	var cssPrefix = this.get("cssPrefix");
	var item = this.config.get("item");

	if (!this.get("users").length || !item.avatar && !item.text) {
		return element.empty();
	}

	var action = (item.avatar && !item.text ? "addClass" : "removeClass");
	element[action](cssPrefix + "only-avatars");
	var wrap = function(text, name) {
		return self.substitute({
			"template": "<span {data:classAttr}>{data:text}</span>",
			"data": {
				"classAttr": name ? 'class="' + cssPrefix + name + '"' : '',
				"text": text
			}
		});
	};
	$.map(this.get("users").slice(0, this.get("count.visible")), function(user) {
		user.instance.render();
		usersDOM.push(user.instance.config.get("target"));
	});
	var last;
	var delimiter = this.config.get("item.text") ? ", " : "";
	if (!this._isMoreButtonVisible()) {
		last = usersDOM.pop();
	}
	if (usersDOM.length) {
		usersDOM = delimiter
			? this._intersperse(usersDOM, wrap(delimiter, "delimiter"))
			: usersDOM;
		// use &nbsp; instead of simple space
		// because IE will cut off simple one after <span>
		usersDOM.push(wrap("&nbsp;" + this.labels.get("and") + " ", "and"));
	}
	if (!this._isMoreButtonVisible()) {
		usersDOM.push(last);
	}
	$.map(usersDOM, function(chunk) {
		element.append(chunk);
	});
	return element;
};

/**
 * @echo_renderer
 */
collection.renderers.suffixText = function(element) {
	return element.empty().append(this.config.get("suffixText", ""));
};

/**
 * Method to get the visible users count
 *
 * @return {Number}
 * visible users count
 */
collection.methods.getVisibleUsersCount = function() {
	return this.count.visible;
};

collection.methods._isMoreButtonVisible = function() {
	return !this._fromExternalData() && !this.isViewComplete || this.count.visible < this.count.total;
};

collection.methods._fromExternalData = function() {
	return !this.config.get("query") && !!this.data;
};

collection.methods._request = function() {
	var self = this;
	var request = this.get("request");
	if (!request) {
		request = Echo.StreamServer.API.request({
			"endpoint": "search",
			"data": {
				"q": this.config.get("query"),
				"appkey": this.config.get("appkey")
			},
			"liveUpdates": $.extend(this.config.get("liveUpdates"), {
				"onData": function(data) {
					self._secondaryResponseHandler(data);
				}
			}),
			"secure": this.config.get("useSecureAPI"),
			"apiBaseURL": this.config.get("apiBaseURL"),
			"onError": function(data, extra) {
				var needShowError = typeof extra.critical === "undefined" || extra.critical && extra.requestType === "initial";
				if (needShowError) {
					self.showError(data, {"critical": extra.critical});
				}
			},
			"onData": function(data, extra) {
				self._initialResponseHandler(data);
			}
		});
		this.set("request", request);
	}
	request.send();
};

collection.methods._requestMoreItems = function() {
	var self = this, query = this.config.get("query");
	var nextPageAfter = this.get("nextPageAfter");
	if (typeof nextPageAfter !== "undefined") {
		query = 'pageAfter:"' + nextPageAfter + '" ' + query;
	}
	var request = Echo.StreamServer.API.request({
		"endpoint": "search",
		"secure": this.config.get("useSecureAPI"),
		"apiBaseURL": this.config.get("apiBaseURL"),
		"data": {
			"q": query,
			"appkey": this.config.get("appkey")
		},
		"onError": function(data) {
			self.showMessage({"type": "error", "data": data});
		},
		"onData": function(data) {
			self._initialResponseHandler(data, "more");
		}
	});
	request.send();
};

collection.methods._initialResponseHandler = function(data, type) {
	// we are going to put new live items at the end for all sort orders except reverseChronological
	this.set("newestFirst", data.sortOrder === "reverseChronological");
	if (data.itemsPerPage) {
		data.itemsPerPage = +data.itemsPerPage;
		if (data.itemsPerPage !== this.config.get("itemsPerPage")) {
			this.config.set("itemsPerPage", data.itemsPerPage);
		}
	}
	if (this._fromExternalData()) {
		this.set("count.total", this.config.get("totalUsersCount", 0));
	}
	this.set("nextPageAfter", data.nextPageAfter);
	if (!data.entries.length) {
		if (!this.get("isViewComplete")) {
			this.set("isViewComplete", true);
			this.render();
			this.ready();
		}
		return;
	}
	if (!this.get("count.visible")) {
		this.set("count.visible", this._fromExternalData()
			? this.config.get("initialUsersCount", this.config.get("itemsPerPage"))
			: this.config.get("itemsPerPage")
		);
	}
	this._processResponse(data, type);
};

collection.methods._secondaryResponseHandler = function(data) {
	this._processResponse(data, "live");
};

collection.methods._processResponse = function(data, type) {
	var self = this, fetchMoreUsers = true;
	var newUsers = 0;
	var actions = $.map(data.entries, function(entry) {
		return function(callback) {
			if (self._isRemoveAction(entry)) {
				if (self._maybeRemoveItem(entry)) {
					newUsers--;
				}
				callback();
			} else {
				if (self._isUniqueUser(entry)) {
					fetchMoreUsers = false;
				}
				var user = self.get("uniqueUsers." + entry.actor.id);
				if (user) {
					// user is already in the list -> increment counter and return
					user.itemsCount++;
					callback();
				} else {
					newUsers++;
					self._initItem(entry, function() {
						self._updateStructure(this, type === "live");
						callback();
					});
				}
			}
		};
	});
	Echo.Utils.parallelCall(actions, function() {
		if (type === "more") {
			self.config.set(
				"maxUsersCount",
				self.config.get("maxUsersCount") + newUsers
			);
		}
		self._output(type === "live", fetchMoreUsers);
	});
};

collection.methods._isRemoveAction = function(entry) {
	return entry.verbs && entry.verbs[0] === "http://activitystrea.ms/schema/1.0/delete";
};

collection.methods._output = function(isLive, fetchMoreUsers) {
	var self = this;
	var max = this.config.get("maxUsersCount");
	var users = this.get("users");
	var toRemove = [];
	if (max) {
		if (this.get("newestFirst")) {
			toRemove = users.splice(max);
		} else {
			toRemove = users.splice(0, users.length - max);
		}
		this.set("users", users);
		var lastUser = users[users.length - 1];
		if (lastUser.instance.get("data.pageAfter")) {
			this.set("nextPageAfter", lastUser.instance.get("data.pageAfter"));
		}
		$.each(toRemove, function(i, user) {
			self._removeUser(user.instance.get("data.id"));
		});
	}
	if (this._fromExternalData()) {
		this.set("count.total", Math.max(users.length, this.get("count.total")));
	} else {
		this.set("count.total", users.length);
		this.set("count.visible", users.length);
	}
	this.set("count.visible", Math.min(this.get("count.visible"), users.length));
	if (!this.get("count.total")) {
		this.set("isViewComplete", false);
	}
	if (!isLive && fetchMoreUsers) {
		this._getMoreUsers();
	} else {
		this.render();
		this.ready();
	}
};

collection.methods._isUniqueUser = function(entry) {
	return !this.get("uniqueUsers." + entry.actor.id);
};

collection.methods._initItem = function(entry, callback) {
	var config = $.extend({
		"apiBaseURL": this.config.get("apiBaseURL"),
		"submissionProxyURL": this.config.get("submissionProxyURL"),
		"target": $("<span>"),
		"appkey": this.config.get("appkey"),
		"parent": this.config.getAsHash(),
		"plugins": this.config.get("plugins"),
		"context": this.config.get("context"),
		"useSecureAPI": this.config.get("useSecureAPI"),
		"data": $.extend(entry.actor, {
			"pageAfter": entry.pageAfter
		}),
		"user": this.user,
		"ready": callback
	}, this.config.get("item"));
	return new Echo.StreamServer.Controls.Face(config);
};

collection.methods._updateStructure = function(item, isLive) {
	this.set("uniqueUsers." + item.get("data.id"), {
		"itemsCount": 1,
		"instance": item
	});
	var user = this.get("uniqueUsers." + item.get("data.id"));
	var action = isLive && this.get("newestFirst") || user.instance.isYou()
		? "unshift"
		: "push";
	this.get("users")[action](user);
};

collection.methods._maybeRemoveItem = function(entry) {
	var user = this.get("uniqueUsers." + entry.actor.id);
	// if we have move than one item posted by the same user,
	// we decrement the counter, but leave the user in the list
	if (!user || --user.itemsCount) return false;
	var index;
	$.each(this.get("users"), function(i, u) {
		if (u.instance.data.id === entry.actor.id) {
			index = i;
			return false; // break
		}
	});
	this.get("users").splice(index, 1);
	this._removeUser(entry.actor.id);
	return true;
};

collection.methods._removeUser = function(uid) {
	var user = this.get("uniqueUsers." + uid);
	user.instance.destroy();
	this.remove("uniqueUsers." + uid);
};

collection.methods._getMoreUsers = function() {
	if (this._fromExternalData()) {
		var usersLength = this.get("users").length;
		var currentVisible = this.get("count.visible");
		this.set("count.visible", currentVisible += this.config.get("itemsPerPage"));
		if (this.get("count.visible") > usersLength) {
			this.set("count.visible", usersLength);
		}
		this.render();
	} else {
		if (!this.get("moreRequestInProgress")) {
			this.showMessage({
				"type": "loading",
				"target": this.view.get("more")
			});
			this.set("moreRequestInProgress", true);
		}
		this._requestMoreItems();
	}
};

collection.methods._intersperse = function(object, separator) {
	return Echo.Utils.foldl([], object, function(item, acc, key) {
		if (acc.length) acc.push(separator);
		acc.push(item);
	});
};

collection.css =
	'.{class:container} { vertical-align: top; line-height: 22px; white-space: normal; }' +
	'.{class:more} { white-space: nowrap; vertical-align: middle; }' +
	'.{class:moreHidden} { display: none; }' +
	'.{class:suffixText}, .{class:delimiter}, .{class:and} { vertical-align: middle; }' +
	'.{class:more}.echo-linkColor a, .{class:more}.echo-linkColor a:hover { color: #476CB8; text-decoration: underline; }' +
	'.{class:more} .echo-control-message-icon { display: inline; margin: 0px 5px; }';

Echo.Control.create(collection);

})(Echo.jQuery);
