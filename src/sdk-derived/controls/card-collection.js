(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.CardCollection
 * Echo Stream control which encapsulates interaction with the
 * <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/search/" target="_blank">Echo Search API</a>
 * and displays live updating search results in a standard "news feed" style format.
 *
 * 	var collection = new Echo.StreamServer.Controls.CardCollection({
 * 		"target": document.getElementById("stream"),
 * 		"query": "childrenof:http://example.com/js-sdk",
 * 		"appkey": "echo.jssdk.demo.aboutecho.com"
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
 * Stream constructor initializing Echo.StreamServer.Controls.CardCollection class
 *
 * @param {Object} config
 * Configuration options
 */
var collection = Echo.Control.manifest("Echo.StreamServer.Controls.CardCollection");

if (Echo.Control.isDefined(collection)) return;

/** @hide @method placeImage */
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
 * @echo_event Echo.StreamServer.Controls.CardCollection.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.CardCollection.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.CardCollection.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.CardCollection.onRerender
 * Triggered when the app is rerendered.
 */

collection.init = function() {
	var self = this;
	if (!this.checkAppKey()) return;

	// picking up timeout value for backwards compatibility
	var timeout = this.config.get("liveUpdates.timeout");
	if (typeof timeout !== "undefined") {
		this.config.set("liveUpdates.polling.timeout", timeout);
	}

	this._recalcEffectsTimeouts();
	this.request = this._getRequestObject({
		"liveUpdates": $.extend(this.config.get("liveUpdates"), {
			"onData": function(data) {
				self._handleLiveUpdatesResponse(data);
			}
		}),
		"onOpen": function(data, options) {
			if (options.requestType === "initial") {
				self.showError({}, {
					"retryIn": 0,
					"request": self.request
				});
			}
		},
		"onError": function(data, options) {
			if (typeof options.critical === "undefined" || options.critical && options.requestType === "initial") {
				self.showError(data, $.extend(options, {
					"request": self.request
				}));
			}
		},
		"onData": function(data, options) {
			self._handleInitialResponse(data);
		}
	});

	// define default stream state based on the config parameters
	var state = this.config.get("state.layout") === "full"
		? "paused"
		: this.config.get("liveUpdates.enabled") ? "live" : "paused";
	this.activities.state = state;

	var data = this.config.get("data");
	if (data) {
		this._handleInitialResponse(data);
		this.request && this.request.send({
			"skipInitialRequest": true,
			"data": {
				"q": this.config.get("query"),
				"appkey": this.config.get("appkey"),
				"since": data.nextSince
			}
		});
	} else {
		this.request.send();
	}
};

collection.destroy = function() {
	$.map(this.items, function(item) {
		item.destroy();
	});
};

collection.config = {
	/**
	 * @cfg {String} query
	 * Specifies the search query to generate the necessary data set.
	 * It must be constructed according to the
	 * <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/search/" target="_blank">"search" API</a>
	 * method specification.
	 *
	 *		new Echo.StreamServer.Controls.CardCollection({
	 *			"target": document.getElementById("echo-stream"),
	 *			"appkey": "echo.jssdk.demo.aboutecho.com",
	 *			"query" : "childrenof:http://example.com/test/*"
	 *		});
	 */
	"query": "",

	/**
	 * @cfg {Object} children
	 * Specifies the children pagination feature behavior.
	 * It includes several options.
	 *
	 * @cfg {Number} children.additionalItemsPerPage
	 * Specifies how many items should be retrieved from server and
	 * rendered after clicking the "View more items" button.
	 *
	 * @cfg {Number} children.moreButtonSlideTimeout
	 * Specifies the duration of more button slide up animation in the
	 * situation when there are no more children items available and
	 * the button should be removed.
	 *
	 * @cfg {Number} children.itemsSlideTimeout
	 * Specifies the duration of the slide down animation of the items
	 * coming to the stream after the "View more items" button click. 
	 */
	"children": {
		"additionalItemsPerPage": 5,
		"displaySortOrder": "chronological",
		"sortOrder": "reverseChronological",
		"moreButtonSlideTimeout": 600,
		"itemsSlideTimeout": 600,
		"maxDepth": 1
	},

	/**
	 * @cfg {Object} item
	 * Specifies the configuration options to be passed to internal
	 * Echo.StreamServer.Controls.Card component.
	 */
	"item": {
		"manualRendering": true
	},

	/**
	 * @ignore
	 */
	"itemsPerPage": 15,

	/**
	 * @ignore
	 */
	"itemsRefreshInterval": 10,

	/**
	 * @cfg {Function} itemsComparator
	 * Function allowing to specify custom items sorting rules. It is used to find
	 * a correct place for a new item in the already existing list of items
	 * by comparing this item against each item in the list.
	 *
	 * **Note**: there is one restriction about how this function works.
	 * It allows to sort initial items list, puts new item from live update
	 * in the correct place. Although next page items (loaded after clicking
	 * "More" button) are sorted only for that page and not for the whole list
	 * of items.
	 *
	 *		// sorting items in the content lexicographical order
	 *		var collection = new Echo.StreamServer.Controls.CardCollection({
	 *			...
	 *			"itemsComparator": function(listedItem, newItem, sort) {
	 *				return listedItem.get("data.object.content") > newItem.get("data.object.content")
	 *					? 1;
	 *					: -1;
	 *			},
	 *			...
	 *		});
	 *
	 * @cfg {Echo.StreamServer.Controls.Card} itemsComparator.listedItem
	 * Item from the list which is compared with new item.
	 *
	 * @cfg {Echo.StreamServer.Controls.Card} itemsComparator.newItem
	 * Item we are trying to find place for.
	 *
	 * @cfg {String} itemsComparator.sort
	 * The existing list sort order.
	 * Depending on the item it's either root sort order or children sort order.
	 *
	 * @cfg {Number} itemsComparator.return
	 *
	 * + 1 - newItem will be injected into the list before listedItem
	 * + -1 - it's not the right place for the newItem
	 * + 0 - comparison result is undefined
	 */
	"itemsComparator": undefined,

	/**
	 * @cfg {Object} [liveUpdates]
	 * Live updating machinery configuration.
	 *
	 * @cfg {Boolean} [liveUpdates.enabled=true]
	 * Parameter to enable/disable live updates.
	 *
	 * @cfg {String} [liveUpdates.transport="websockets"]
	 * Preferred live updates receiving machinery transport.
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
	 * @cfg {Boolean} openLinksInNewWindow
	 * If this parameter value is set to true, each link will be opened
	 * in a new window. This is especially useful when using the control
	 * in a popup window.
	 */
	"openLinksInNewWindow": false,

	/**
	 * @cfg {Number} slideTimeout
	 * Specifies the duration of the sliding animation (in milliseconds)
	 * when an item comes to a stream as a live update.
	 */
	"slideTimeout": 700,

	/**
	 * @ignore
	 */
	"sortOrder": "reverseChronological",

	/**
	 * @cfg {Object} state
	 * Defines configurations for Stream Status
	 *
	 * @cfg {Object} state.label
	 * Hides the Pause/Play icon. Toggles the labels used in the Stream Status
	 * label. Contains a hash with two keys managing icon and text display modes.
	 *
	 * @cfg {Boolean} state.label.icon
	 * Toggles the icon visibility.
	 *
	 * @cfg {Boolean} state.label.text
	 * Toggles the text visibility.
	 *
	 * @cfg {String} state.toggleBy
	 * Specifies the method of changing stream live/paused state.
	 *
	 * The possible values are:
	 *
	 * + mouseover - the stream is paused when mouse is over it and live
	 * when mouse is out.
	 * + button - the stream changes state when user clicks on state.label
	 * (Live/Paused text). This mode would not work if neither state icon nor
	 * state text are displayed.
	 * + none - the stream will never be paused.
	 *
	 * Note that "mouseover" method is not available for mobile devices and will
	 * be forced to "button" method.
	 *
	 * @cfg {String} state.layout
	 * Specifies the Live/Pause button layout. This option is available only when
	 * the "state.toggleBy" option is set to "button". In other cases, this option
	 * will be ignored.
	 *
	 * The possible values are:
	 *
	 * + compact - the Live/Pause button (link) will be located at the top right corner
	 * of the Stream control, above the stream items list.
	 * + full - the button will appear above the stream when the new live updates are available.
	 * User will be able to click the button to apply live updates to the stream.
	 */
	"state": {
		"label": {
			"icon": true,
			"text": true
		},
		"toggleBy":  "mouseover", // mouseover | button | none,
		"layout": "compact" // compact | full
	},

	/**
	 * @cfg {Object} data
	 * Specifies predefined items data which should be rendered by the application.
	 * Stream control works with the data format used by the "search" API endpoint.
	 * More information about the data format can be found
	 * <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/search/#sect3" target="_blank">here</a>.
	 */

	/**
	 * @cfg {Boolean} asyncItemsRendering
	 * This parameter is used to enable Stream root items rendering in async mode during
	 * the first Stream control initialization and when extra items are received after
	 * the "More" button click.
	 */
	"asyncItemsRendering": false,
	"displayEmptyStream": true
};

collection.config.normalizer = {
	"showFlags": function(value) {
		return "off" !== value;
	},
	"state": function(object) {
		object["toggleBy"] =  object["toggleBy"] === "mouseover" && Echo.Utils.isMobileDevice()
			? "button"
			: object["toggleBy"];

		object["layout"] = object["toggleBy"] === "button"
			? object["layout"]
			: collection.config.state.layout;
		return object;
	}
};

collection.vars = {
	"activities": {
		"queue": [],
		"state": undefined,
		"lastState": "", // live0 | pausedN
		"animations": 0
	},
	"itemParentConfig": undefined,
	"hasInitialData": false,
	"items": {},   // items by unique key hash
	"threads": [], // items tree
	"lastRequest": null,
	"request": null,
	"moreRequest": null,
	"itemsRenderingComplete": true
};

collection.labels = {
	/**
	 * @echo_label
	 */
	"guest": "Guest",
	/**
	 * @echo_label
	 */
	"live": "Live",
	/**
	 * @echo_label
	 */
	"paused": "Paused",
	/**
	 * @echo_label
	 */
	"more": "More",
	/**
	 * @echo_label
	 */
	"noMoreItems": "No items at this time...",
	/**
	 * @echo_label
	 */
	"emptyStream": "No items at this time...",
	/**
	 * @echo_label
	 */
	"new": "new",
	/**
	 * @echo_label
	 */
	"newItem": "new item",
	/**
	 * @echo_label
	 */
	"newItems": "new items"
};

collection.dependencies = [{
	"loaded": function() { return !!Echo.StreamServer.Controls.Card; },
	"url": "{%= appBaseURLs.prod %}/sdk-derived/controls/card.js"
}];

collection.events = {
	"Echo.StreamServer.Controls.CardCollection.onItemsRenderingComplete": function() {
		this.view.render({"name": "more"});
		this._executeNextActivity();
	},
	"Echo.StreamServer.Controls.Card.onAdd": function(topic, data) {
		var self = this;
		var item = this.items[data.card.data.unique];
		item.config.get("target").hide();
		this.queueActivity({
			"action": "animation",
			"item": item,
			"priority": "highest",
			"handler": function() {
				item.render();
				item.set("added", false);
				self._animateSpotUpdate("add", item, data.config);
			}
		});
		return {"stop": ["bubble"]};
	},
	"Echo.StreamServer.Controls.Card.onDelete": function(topic, data) {
		var self = this;
		var item = this.items[data.card.data.unique];
		this.queueActivity({
			"action": "animation",
			"item": item,
			"priority": "highest",
			"handler": function() {
				item.set("deleted", false);
				self._animateSpotUpdate("remove", item, data.config);
			}
		});
		return {"stop": ["bubble"]};
	},
	"Echo.StreamServer.Controls.Card.onChildrenExpand": function(topic, args) {
		this._requestChildrenItems(args.data.unique);
		return {"stop": ["bubble"]};
	}
};

/**
 * @echo_template
 */
collection.templates.main =
	'<div class="{class:container} echo-primaryFont echo-primaryBackgroundColor">' +
		'<div class="{class:content}">' +
			'<div class="{class:body}"></div>' +
			'<div class="{class:more}"></div>' +
		'</div>' +
	'</div>';

/**
 * @echo_renderer
 */
collection.renderers.body = function(element) {
	var request = this.lastRequest;
	if (!request) {
		return element;
	}
	if (request.data.length) {
		if (request.initial) {
			element.empty();
		}
		this._appendRootItems(request.data, element);
	} else {
		this.showMessage({
			"type": "info",
			"message": this.labels.get("emptyStream"),
			"target": element
		});
	}
	return element;
};

/**
 * @echo_renderer
 */
collection.renderers.content = function(element) {
	var self = this, request = this.lastRequest;
	if (request && request.initial && this.config.get("liveUpdates.enabled") &&
		this.config.get("state.toggleBy") === "mouseover") {
			element.hover(
				function() { self.setState("paused"); },
				function() { self.setState("live"); }
			);
	}
	return element;
};

/**
* @echo_renderer
*/
collection.renderers.container = function(element) {
	var items = $.grep(this.get("threads"), function(item) {
		return !item.deleted;
	});
	return (items.length || this.config.get("displayEmptyStream"))
		? element.show()
		: element.hide();
};

/**
 * @echo_renderer
 */
collection.renderers.state = function(element) {
	var self = this;
	var label = this.config.get("state.label");
	var layout = this.config.get("state.layout");

	if (!label.icon && !label.text || !this.config.get("liveUpdates.enabled")) {
		return element;
	}

	var state = this.getState();
	var activitiesCount = 0;
	if (state === "paused") {
		activitiesCount = Echo.Utils.foldl(0, this.activities.queue,
			function(entry, acc) {
				if (entry.affectCounter) return ++acc;
			}
		);
	}
	var currentState = state + activitiesCount;

	if (currentState === this.activities.lastState) {
		return element;
	}

	element.empty().show();
	element.addClass(this.cssPrefix + layout + "StateLayout");
	if (layout === "compact") {
		element.addClass("echo-secondaryColor");
	}
	if (!this.activities.lastState && this.config.get("state.toggleBy") === "button") {
		if (layout === "compact") {
			element.addClass("echo-linkColor echo-clickable");
		}
		element.click(function() {
			self.setState(self.getState() === "paused" ? "live" : "paused");
		});
	}
	var templates = {
		"picture": '<span class="{class:state-picture} {class:state-picture}-' + state + '"></span>',
		"message": this.config.get("state.toggleBy") === "button"
			? '<a href="javascript:void(0)" class="{class:state-message}">' +
				'{label:' + state + '}' +
			  '</a>'
			: '<span class="{class:state-message}">{label:' + state + '}</span>',
		"count": ' <span class="{class:state-count}">({data:count} {label:new})</span>',
		"button": '<span class="{class:state-message}">{data:count} {data:label}</span>'
	};
	if (layout === "full") {
		if (activitiesCount) {
			element.append(this.substitute({
				"template": templates.button,
				"data": {
					"count": activitiesCount,
					"label": this.labels.get(activitiesCount === 1 ? "newItem" : "newItems")
				}
			}));
		} else {
			element.hide();
		}
	} else {
		if (label.icon) {
			element.append(this.substitute({"template": templates.picture}));
		}
		if (label.text) {
			element.append(this.substitute({"template": templates.message}));
			if (activitiesCount && state === "paused") {
				element.append(this.substitute({
					"template": templates.count,
					"data": {"count": activitiesCount}
				}));
			}
		}
	}
	this.activities.lastState = currentState;
	return element;
};

/**
 * @echo_renderer
 */
collection.renderers.more = function(element) {
	var self = this;
	if (this.isViewComplete || !this.threads.length) {
		return element.empty().hide();
	}
	if (!this.itemsRenderingComplete) {
		element.hide();
	} else {
		element.show();
	}
	return element.empty()
		.append(this.labels.get("more"))
		.off("click")
		.one("click", function() {
			/**
			 * @echo_event Echo.StreamServer.Controls.CardCollection.onMoreButtonPress
			 * Triggered when the "more" button is pressed.
			 */
			self.events.publish({"topic": "onMoreButtonPress"});
			element.html(self.labels.get("loading"));
			self._requestMoreItems(element);
		});
};

/**
 * Accessor method to get the current Stream state.
 *
 * @return {String}
 * stream state "live" or "paused".
 */
collection.methods.getState = function() {
	return this.activities.state;
};

/**
 * Setter method to define the Stream state.
 *
 * @param {String} state
 * stream state "live" or "paused".
 */
collection.methods.setState = function(state) {
	this.activities.state = state;
	if (state === "live") {
		this._executeNextActivity();
	}
	this.view.render({"name": "state"});
};

/**
 * Method used to add activity to Stream activities queue.
 *
 * @param {Object} params
 * Object with the following properties:
 *
 * @param {Object} params.item
 * Item for which the activity is added.
 *
 * @param {String} params.priority
 * The priority of the activity.
 * This parameter can be equal to "highest", "high", "medium", "low" or "lowest".
 *
 * @param {String} params.action
 * The action name of the activity.
 *
 * @param {Function} params.handler
 * The handler function of the activity.
 */
collection.methods.queueActivity = function(params) {
	if (!params.item) return;
	var actorID = params.item.get("data.actor.id");
	// we consider activity related to the current user if:
	//  - the corresponding item is blocked (moderation action in progress)
	//  - or the activity was performed by the current user
	var byCurrentUser = params.item.blocked || actorID && this.user.has("identity", actorID);
	var index = this._getActivityProjectedIndex(byCurrentUser, params);
	var data = {
		"action": params.action,
		"item": params.item,
		"affectCounter": params.action === "add" && !byCurrentUser,
		"priority": params.priority,
		"byCurrentUser": byCurrentUser,
		"handler": params.handler
	};
	if (typeof index !== "undefined") {
		this.activities.queue.splice(index, 0, data);
	} else {
		this.activities.queue.push(data);
	}
};

collection.methods._requestChildrenItems = function(unique) {
	var self = this;
	var item = this.items[unique];
	var target = item.view.get("expandChildren");
	var request = this._getRequestObject({
		"data": {
			"q": this._constructChildrenSearchQuery(item)
		},
		"onOpen": function() {
			self.showError({}, {
				"retryIn": 0,
				"target": target,
				"request": request
			});
		},
		"onError": function(data, options) {
			self.showError(data, $.extend(options, {
				"target": target,
				"request": request
			}));
		},
		"onData": function(data) {
			item.set("data.nextPageAfter", data.nextPageAfter);
			item.set("data.hasMoreChildren", data.hasMoreChildren);
			data.entries = self._actualizeChildrenList(item, data.entries);
			self._onDataReceive(data, "children", function(items) {
				var children = [];
				$.map(data.entries, function(entry) {
					var child = items[entry.unique];
					self._applyStructureUpdates("add", child);
					if (entry.parentUnique === item.get("data.unique")) {
						children.push(child);
					}
				});
				self._placeChildItems(item, children);
			});
		}
	});
	request.send();
};

collection.methods._requestInitialItems = function() {
	var self = this;
	if (!this.request) {
		this.request = Echo.StreamServer.API.request({
			"endpoint": "search",
			"apiBaseURL": this.config.get("apiBaseURL"),
			"liveUpdates": $.extend(this.config.get("liveUpdates"), {
				"onData": function(data) {
					self._handleLiveUpdatesResponse(data);
				}
			}),
			"data": {
				"q": this.config.get("query"),
				"appkey": this.config.get("appkey")
			},
			"onOpen": function(data, options) {
				if (options.requestType === "initial") {
					self.showError({}, {
						"retryIn": 0,
						"request": self.request
					});
				}
			},
			"onError": function(data, options) {
				if (typeof options.critical === "undefined" || options.critical && options.requestType === "initial") {
					self.showError(data, $.extend(options, {
						"request": self.request
					}));
				}
			},
			"onData": function(data, options) {
				self._handleInitialResponse(data);
			}
		});
	}
	this.request.send();
};

collection.methods._requestMoreItems = function(element) {
	var self = this;
	this.lastRequest = {"initial": false};
	if (!this.moreRequest) {
		this.moreRequest = this._getRequestObject({
			"onOpen": function() {
				self.showError({}, {
					"retryIn": 0,
					"target": element,
					"request": self.moreRequest
				});
			},
			"onError": function(data, options) {
				self.showError(data, $.extend(options, {
					"target": element,
					"request": self.moreRequest
				}));
			},
			"onData": function(data) {
				self._handleInitialResponse(data, function(data) {
					if (data.length) {
						self.lastRequest.data = data;
						self.view.render({"name": "body"});
						self.view.render({"name": "more"});
					} else {
						element.html(self.labels.get("noMoreItems"))
							.delay(1000)
							.fadeOut(1000);
					}
				});
			}
		});
	}

	// FIXME: "more" requests are always initial ones
	this.moreRequest.requestType = "initial";
	this.moreRequest.send({
		"data": {
			"q": this.config.get("query") + " pageAfter:" +
					"\"" + (this.get("nextPageAfter", "0")) + "\"",
			"appkey": this.config.get("appkey")
		}
	});
};

collection.methods._onDataReceive = function(data, type, callback) {
	var self = this;
	var items = {};
	/**
	 * @echo_event Echo.StreamServer.Controls.CardCollection.onDataReceive
	 * Triggered when new data is received.
	 *
	 * @param {Object} data
	 * Object which is returned by the search API endpoint
	 *
	 * @param {Array} data.entries
	 * Array which contains receieved entries if any
	 *
	 * @param {String} data.type
	 * Describe's specific subsystem which produced the event. Possible values:
	 *
	 * + "initial" - triggered by initial items request (stream loaded for the first time)
	 * + "more" - triggered by server response after "more" button click
	 * + "live" - triggered by liveUpdate mechanism (new items received in real-time)
	 * + "children" - triggered by server response after "View more items..." button click
	 * (children items were requested)
	 */
	this.events.publish({
		"topic": "onDataReceive",
		"data": {
			"entries": data.entries,
			"type": type
		},
		"propagation": false
	});
	var actions = $.map(data.entries, function(entry) {
		return function(cb) {
			self._initItem(entry, false, function() {
				items[this.get("data.unique")] = this;
				cb();
			});
		};
	});
	// items initialization is an async process, so we init
	// item instances first and append them into the structure later
	Echo.Utils.parallelCall(actions, function() {
		callback(items);
	});
};

collection.methods._prepareEventParams = function(params) {
	return $.extend(params, {
		"target": this.config.get("target").get(0),
		"query": this.config.get("query")
	});
};

collection.methods._applyLiveUpdates = function(entries, callback) {
	var self = this, data = {};
	data.entries = $.map(entries || [], function(entry) {
		return self.normalizeEntry(entry);
	});
	this.events.publish({
		"topic": "onDataReceive",
		"data": {
			"entries": data.entries,
			"type": "live"
		},
		"propagation": false
	});
	var actions = $.map(data.entries, function(entry) {
		return function(_callback) {
			var item = self.items[entry.unique];
			var action = self._classifyAction(entry);
			if (!item && action !== "post") {
				_callback();
				return;
			}
			if (action === "post") {
				if (item) {
					self._applySpotUpdates("replace", self._updateItem(entry));
					_callback();
					return;
				}
				self._initItem(entry, true, function() {
					item = this;
					var satisfies = item.isRoot()
						? self._withinVisibleFrame(item)
						: self._withinVisibleChildrenFrame(item);

					// do not filter out items from the current user
					// they should be displayed in a special container
					if (!satisfies && !item.isRoot() &&
						self.user.has("identity", item.data.actor.id)) {
							item.set("byCurrentUser", true);
					}

					if (satisfies || item.get("byCurrentUser")) {
						/**
						 * @echo_event Echo.StreamServer.Controls.Stream.onItemReceive
						 * Triggered when new item is received.
						 */
						self.events.publish({
							"topic": "onItemReceive",
							"data": {"item": {"data": item.data}},
							"propagation": false
						});
						self._applySpotUpdates("add", item);
					} else {
						item.destroy();
					}
					_callback();
				});
				return;
			}
			if (action === "delete") {
				self._applySpotUpdates("remove", item);
				_callback();
			}
		};
	});
	Echo.Utils.sequentialCall(actions, function() {
		self._recalcEffectsTimeouts();
		callback && callback.call(self);
	});
};

collection.methods._actualizeChildrenList = function(parent, entries) {
	var self = this;
	return $.map(entries, function(entry) {

		// we should change entry conversationID
		// according to the root item conversationID
		entry.targets = $.map(entry.targets, function(target) {
			target.conversationID = parent.get("data.target.conversationID");
			return target;
		});

		entry = self.normalizeEntry(entry);
		var item = self.items[entry.unique];

		// drop item from items list if the item already exists
		// in the tree, which means that it was posted by the current user
		// and arrived as a live update
		if (item && item.get("byCurrentUser")) {
			self._applyStructureUpdates("delete", item);
		}

		return entry;
	});
};

collection.methods._createChildrenItemsDomWrapper = function(children, parent) {
	var self = this;
	var wrapper = $('<div class="' + this.get("cssPrefix") + 'children-wrapper"></div>');
	var getIdx = function(item) {
		return self._getItemListIndex(item, parent.get("children"));
	};
	$.each(children, function(i, item) {
		var insertion = i > 0 && getIdx(children[i-1]) < getIdx(item)
			? "append"
			: "prepend";
		wrapper[insertion](item.config.get("target"));
		item.render();
	});
	return wrapper;
};

collection.methods._extractPresentationConfig = function(data) {
	var keys = ["sortOrder", "itemsPerPage", "safeHTML", "showFlags"];
	return Echo.Utils.foldl({}, keys, function(key, acc) {
		if (typeof data[key] !== "undefined") {
			acc[key] = data[key];
		}
	});
};

collection.methods._extractTimeframeConfig = function(data) {
	var getComparator = function(value) {
		var match = value.match(/^(<|>)(.*)$/);
		var operation = match[1];
		value = match[2].match(/^'([0-9]+) seconds ago'$/);
		var getTS = value
			? function() { return Math.floor((new Date()).getTime() / 1000) - value[1]; }
			: function() { return match[2]; };
		if (operation === '<') {
			return function(ts) { return ts < getTS(); };
		}
		if (operation === '>') {
			return function(ts) { return ts > getTS(); };
		}
	};
	var timeframe = Echo.Utils.foldl([], ["before", "after"], function(key, acc) {
		if (!data[key]) return;
		var cmp = getComparator(data[key]);
		if (cmp) acc.push(cmp);
	});
	return {"timeframe": timeframe};
};

collection.methods._getRespectiveAccumulator = function(item, sort) {
	var accBySort = {
		"likesDescending": "likesCount",
		"flagsDescending": "flagsCount",
		"repliesDescending": "repliesCount"
	};
	return item.getAccumulator(accBySort[sort]);
};

collection.methods._appendRootItems = function(items, container) {
	var self = this;
	if (!items || !items.length) return;
	this.itemsRenderingComplete = false;
	(function renderer(index) {
		index = index || 0;
		container.append(items[index].config.get("target"));
		items[index].render();
		if (items.length > ++index) {
			if (self.config.get("asyncItemsRendering")) {
				setTimeout($.proxy(renderer, self, index), 0);
			} else {
				renderer(index);
			}
		} else {
			self.itemsRenderingComplete = true;
			self.events.publish({
				"topic": "onItemsRenderingComplete",
				"global": false,
				"propagation": false
			});
		}
	})();
};

collection.methods._constructChildrenSearchQuery = function(item) {
	// depth for item children request
	var depth = this.config.get("children.maxDepth") - item.get("depth") - 1;
	var additionalItems = +this.config.get("children.additionalItemsPerPage");
	var pageAfter = item.getNextPageAfter();
	var filter = this.config.get("children.filter");
	var filterQuery = !filter || filter === "()" ? "" : filter + " ";
	return filterQuery + Echo.Utils.foldl("", {
		"childrenof": item.get("data.object.id"),
		"children": depth,
		"childrenItemsPerPage": depth
			? +this.config.get("children.itemsPerPage")
			: 0,
		"itemsPerPage": additionalItems,
		"sortOrder": this.config.get("children.sortOrder"),
		"childrenSortOrder": this.config.get("children.sortOrder"),
		"pageAfter": pageAfter ? '"' + (pageAfter || 0) + '"' : undefined,
		"safeHTML": this.config.get("safeHTML")
	}, function(value, acc, predicate) {
		return acc += (typeof value !== "undefined"
			? predicate + ":" + value + " "
			: ""
		);
	}) + filterQuery;
};

collection.methods._handleInitialResponse = function(data, visualizer) {
	var self = this, roots = [];
	this.config.get("target").show();
	this.nextSince = data.nextSince || 0;
	this.nextPageAfter = data.nextPageAfter;

	var presentation = this._extractPresentationConfig(data);
	presentation.itemsPerPage = +presentation.itemsPerPage;
	this.config.extend(presentation);

	data.entries = data.entries || [];

	data.children.itemsPerPage = +data.children.itemsPerPage;
	data.children.maxDepth = +data.children.maxDepth;
	this.config.set("children", $.extend(this.config.get("children"), data.children));

	this.config.extend(this._extractTimeframeConfig(data));
	var sortOrder = this.config.get("sortOrder");
	data.entries = $.map(data.entries, function(entry) {
		return self.normalizeEntry(entry);
	});
	var receivedDataType = this.hasInitialData ? "more" : "initial";
	this._onDataReceive(data, receivedDataType, function(items) {
		$.map(data.entries, function(entry) {
			var item = items[entry.unique];
			self._applyStructureUpdates("add", item);
			if (item.isRoot()) {
				self._addItemToList(roots, item, sortOrder);
			}
		});
		self.hasInitialData = true;
		self.isViewComplete = data.hasMoreChildren
			? data.hasMoreChildren === "false"
			: roots.length !== self.config.get("itemsPerPage");
		(visualizer || function(data) {
			self.lastRequest = {
				"initial": true,
				"data": data
			};
			self.render();
			self.ready();
		})(roots);

		// refresh items date and check if all items
		// satisfy search query timeframe criteria (if any);
		// cleanup interval if it was previously defined
		if (self.itemsRefreshInterval) {
			clearInterval(self.itemsRefreshInterval);
		}
		self.itemsRefreshInterval = setInterval(function() {
			self._refreshItemsDate();
			self._checkTimeframeSatisfy();
		}, self.config.get("itemsRefreshInterval") * 1000);
	});
};

collection.methods._checkTimeframeSatisfy = function() {
	var self = this;
	var timeframe = this.config.get("timeframe");
	if (!timeframe || !timeframe.length) return; // no timeframes defined in the search query
	var unsatisfying = Echo.Utils.foldl([], this.threads, function(thread, acc) {
		var satisfy = Echo.Utils.foldl(true, timeframe, function(p, a) {
			return a ? p(thread.get("timestamp")) : false;
		});
		if (!satisfy) acc.push(thread);
	});
	$.map(unsatisfying, function(item) {
		self._applySpotUpdates("remove", item);
	});
};

collection.methods._handleLiveUpdatesResponse = function(data) {
	var self = this;
	data = data || {};
	this._applyLiveUpdates(data.entries, function() {
		self.view.render({"name": "state"});
		self._executeNextActivity();
	});
};

collection.methods._getRequestObject = function(overrides) {
	var config = $.extend(true, {
		"endpoint": "search",
		"secure": this.config.get("useSecureAPI"),
		"apiBaseURL": this.config.get("apiBaseURL"),
		"data": {
			"q": this.config.get("query"),
			"appkey": this.config.get("appkey")
		}
	}, overrides);
	return Echo.StreamServer.API.request(config);
};

collection.methods._recalcEffectsTimeouts = function() {
	// recalculating timeouts based on amount of items in activities queue
	var s = this;
	var maxTimeouts = {
		"slide": s.config.get("slideTimeout")
	};
	s.timeouts = s.timeouts || {
		"slide": maxTimeouts.slide
	};
	if (!maxTimeouts.slide) {
		return;
	}
	s.timeouts.coeff = s.timeouts.coeff || {
		"slide": s.timeouts.slide / maxTimeouts.slide
	};
	var calc = function(timeout, value) {
		value = Math.round(value * s.timeouts.coeff[timeout]);
		if (value < 100) return 0; // no activities for small timeouts
		if (value > maxTimeouts[timeout]) return maxTimeouts[timeout];
		return value;
	};
	// reserving 80% of time between live updates for activities
	var frame = s.config.get("liveUpdates.polling.timeout") * 1000 * 0.8;
	var msPerItem = s.activities.queue.length ? frame / s.activities.queue.length : frame;
	s.timeouts.slide = calc("slide", msPerItem);
};

collection.methods._refreshItemsDate = function() {
	$.map(this.threads, function(item) {
		item.view.render({"name": "date"});
		item.traverse(item.get("children"), function(child) {
			child.view.render({"name": "date"});
		});
	});
};

collection.methods._executeNextActivity = function() {
	var acts = this.activities;

	// return stream state to "paused" when no more items
	// to visualize and the state button layout is set to "full"
	if (!acts.queue.length && this.config.get("state.layout") === "full") {
		acts.state = "paused";
	}

	if (acts.animations > 0 || !this.itemsRenderingComplete ||
			!acts.queue.length ||
			this.config.get("liveUpdates.enabled") &&
			acts.state === "paused" &&
			acts.queue[0].action !== "replace" &&
			!acts.queue[0].byCurrentUser) {
		return;
	}
	acts.queue.shift().handler();
};

// the list of spot update helpers, executed by the
// "_applySpotUpdates" and "_animateSpotUpdates" top level functions
collection.methods._spotUpdates = {"animate": {}};

collection.methods._spotUpdates.add = function(item, options) {
	// if we are trying to add an item which already exists,
	// we should change the operation to "replace"
	var _item = this.items[item.get("data.unique")];
	if (_item && _item.view.rendered() && options.priority !== "high") {
		this._applySpotUpdates("replace", this._updateItem(item.get("data")), {"priority": "highest"});
		// in case of "replace" operation we use incoming "item" object
		// as a source of information and destroy this object after update
		// application to cleanup the memory consumed by the object
		item.destroy();
		return;
	}
	this._applyStructureUpdates("add", item);
	item.set("added", true);
	if (item.isRoot()) {
		this._placeRootItem(item);
	} else {
		var parent = this._getParentItem(item);
		if (parent && parent.view.rendered()) {
			parent.view.render({"name": "content"});
			parent.view.render({"name": "children"});
			parent.view.render({"name": "childrenByCurrentActorLive"});
		}
	}
};

collection.methods._spotUpdates.replace = function(item, options) {
	item.unblock();
	if (this._maybeMoveItem(item)) {
		var parent = this._getParentItem(item);
		var sort = this.config.get(parent ? "children.sortOrder" : "sortOrder");
		var items = parent ? parent.get("children") : this.threads;
		var oldIdx = this._getItemListIndex(item, items);
		// We need to calculate the projected index of the item
		// after the "replace" action and compare it with the current one
		// to determine whether the item should be moved to the new place or not:
		//   - create a copy of the items list
		//   - remove the item from the copy
		//   - calculate the new index
		//   - compare the old and new indexes
		var container = $.extend([], items);
		container.splice(oldIdx, 1);
		var newIdx = this._getItemProjectedIndex(item, container, sort);
		if (oldIdx !== newIdx) {
			this._applySpotUpdates("remove", item, {
				"keepChildren": true,
				"priority": "high"
			});
			this._applySpotUpdates("add", item, {"priority": "high"});
		}
	}
	if (item && item.view.rendered()) {
		item.view.render({"name": "content", "recursive": true});
		/**
		 * @member Echo.StreamServer.Controls.Card
		 * @echo_event Echo.StreamServer.Controls.Card.onRerender
		 * Triggered when the item is rerendered.
		 */
		item.events.publish({"topic": "onRerender"});
	}
};

collection.methods._spotUpdates.remove = function(item, options) {
	item.set("deleted", true);
	if (item.isRoot()) {
		item.events.publish({
			"topic": "onDelete",
			"data": {"config": options},
			"global": false,
			"propagation": false
		});
	} else {
		var parent = this._getParentItem(item);
		if (parent) {
			parent.view.render({
				"name": "children",
				"target": parent.view.get("children"),
				"extra": options
			});
			parent.view.render({
				"name": "childrenByCurrentActorLive",
				"target": parent.view.get("childrenByCurrentActorLive"),
				"extra": options
			});
			parent.view.render({"name": "content"});
		}
	}
};

collection.methods._spotUpdates.animate.add = function(item) {
	var self = this;
	this.activities.animations++;

	var next = function() {
		self.events.publish({
			"topic": "onCardShown",
			"data": {"item": {"data": item.data}}
		});
		self.activities.animations--;
		self._executeNextActivity();
	};

	if (this.timeouts.slide) {
		// we should specify the element height explicitly
		// to avoid element jumping during the animation effect
		var height = item.config.get("target").show().css("height");
		item.config.get("target").css("overflow", "hidden");
		item.view.get("container")
			.css("margin-top", "-" + height)
			.animate(
				{"margin-top": "0px"},
				this.timeouts.slide,
				function() {
					// we should remove temporary set of css styles
					// as soon as the animation is complete
					item.config.get("target").css("overflow", "");
					item.view.get("container").css("margin-top", "");
					next();
				}
			);
	} else {
		item.config.get("target").show();
		next();
	}
};

collection.methods._spotUpdates.animate.remove = function(item, config) {
	var self = this;
	this.activities.animations++;
	config = config || {};
	var callback = $.isFunction(config) ? config : config.callback || function() {
		if (!item.config.get("target").length) return;
		// if the item is being moved, we should keep all jQuery handlers
		// for the nested elements (children), thus we use "detach" instead of "remove"
		item.config.get("target")[config.keepChildren ? "detach" : "remove"]();
		var itemsCount = Echo.Utils.foldl(0, self.items, function(_item, acc) {
			return acc + 1;
		});
		if (!itemsCount) {
			self.showMessage({
				"type": "info",
				"message": self.labels.get("emptyStream"),
				"target": self.view.get("body")
			});
		}
		self._applyStructureUpdates("delete", item, config);
		self.activities.animations--;
		self._executeNextActivity();
	};
	if (this.timeouts.slide) {
		item.config.get("target").slideUp(this.timeouts.slide, callback);
	} else {
		callback();
	}
};

collection.methods._applySpotUpdates = function(action, item, options) {
	var self = this;
	options = options || {};
	this.queueActivity({
		"action": action,
		"item": item,
		"priority": options.priority,
		"handler": function() {
			self._spotUpdates[action].call(self, item, options);
			self._executeNextActivity();
		}
	});
};

collection.methods._animateSpotUpdate = function(action, item, options) {
	this._spotUpdates.animate[action].call(this, item, options);
};

collection.methods._getActivityProjectedIndex = function(byCurrentUser, params) {
	var priorityWeights = {
		"highest": 0,
		"high": 10,
		"medium": 20,
		"low": 30,
		"lowest": 40
	};
	params.priority = params.priority === "highest" && "highest"
		|| byCurrentUser && "high"
		|| params.action === "replace" && "medium"
		|| params.priority
		|| "lowest";
	var index;
	if (params.action === "replace") {
		// in case we have "replace" activity for the item which was not added
		// to the stream yet but queued only we should set its priority the same
		// as that "add" activity so that to queue them in the right order
		$.each(this.activities.queue, function(i, activity) {
			if (activity.action === "add" && activity.itemUnique === params.itemUnique) {
				params.priority = activity.priority;
				return false; // break
			}
		});
	}
	$.each(this.activities.queue, function(i, activity) {
		if (priorityWeights[params.priority] < priorityWeights[activity.priority]) {
			index = i;
			return false; // break
		}
	});
	return index;
};

collection.methods._classifyAction = function(entry) {
	return entry.verbs[0] === "http://activitystrea.ms/schema/1.0/delete"
		? "delete"
		: "post";
};

collection.methods._maybeMoveItem = function(item) {
	return item.get("forceInject");
};

collection.methods._withinVisibleFrame = function(item, items, isViewComplete, sortOrder) {
	items = items || this.threads;
	isViewComplete = typeof isViewComplete === "undefined"
		? this.isViewComplete
		: isViewComplete;
	sortOrder = sortOrder || this.config.get("sortOrder");
	if (isViewComplete || !items.length) {
		return true;
	}
	return this._itemsComparator(items[items.length - 1], item, sortOrder) === 1;
};

collection.methods._withinVisibleChildrenFrame = function(item) {
	// Before checking if a child item satisfies visibility conditions,
	// we need to find its parent first. The parent might be already there
	// in the data structure or it might be in the activity queue at this moment,
	// for example if a root and child item arrive in a single live update request
	// or in different live update requests, but queued while the stream is paused
	var parent = this._getParentItem(item) || this._getParentItemFromActivityQueue(item);
	if (!parent) {
		return false;
	}
	return this._withinVisibleFrame(
		item,
		parent.get("children"),
		!parent.hasMoreChildren(),
		this.config.get("children.sortOrder")
	);
};

collection.methods._getParentItemFromActivityQueue = function(item) {
	if (item.isRoot()) return;
	// let's handle exceptions just in case something goes wrong (though it shouldn't)
	return Echo.Utils.safelyExecute(function(queue) {
		var parent;
		$.each(queue, function(i, activity) {
			if (activity.action === "add" && activity.item.get("data.unique") === item.get("data.parentUnique")) {
				parent = activity.item;
				return false;
			}
		});
		return parent;
	}, [this.activities.queue]);
};

collection.methods._getParentItem = function(item) {
	return item.isRoot() ? undefined : this.items[item.get("data.parentUnique")];
};

collection.methods._itemsComparator = function(listedItem, newItem, sort) {
	var self = this, result;
	var customComparator = this.config.get("itemsComparator");
	if (customComparator && $.isFunction(customComparator)) {
		return customComparator(listedItem, newItem, sort);
	}
	switch (sort) {
		case "chronological":
			result = listedItem.get("timestamp") > newItem.get("timestamp");
			break;
		case "reverseChronological":
			result = listedItem.get("timestamp") <= newItem.get("timestamp");
			break;
		case "likesDescending":
		case "repliesDescending":
		case "flagsDescending":
			var getCount = function(entry) {
				return self._getRespectiveAccumulator(entry, sort);
			};
			result = (getCount(listedItem) < getCount(newItem) ||
					(getCount(listedItem) === getCount(newItem) &&
						this._itemsComparator(listedItem, newItem, "reverseChronological") === 1));
			break;
	}
	return result ? 1 : (typeof result === "undefined" ? 0 : -1);
};

collection.methods._placeRootItem = function(item) {
	var content = item.config.get("target");
	if (this.threads.length > 1) {
		var id = this._getItemListIndex(item, this.threads);
		var next = this.threads[id + 1], prev = this.threads[id - 1];
		if (next) {
			next.config.get("target").before(content);
		} else {
			prev.config.get("target").after(content);
		}
	} else {
		this.view.get("body").empty().append(content);
	}
	item.events.publish({
		"topic": "onAdd",
		"global": false,
		"propagation": false
	});
};

collection.methods._placeChildItems = function(parent, children) {
	var self = this;
	var itemsWrapper = this._createChildrenItemsDomWrapper(children, parent);

	// we should calculate index of the sibling item for the responsed items
	var targetItemIdx = -1;
	$.each(parent.get("children"), function(i,_item) {
		if (self._isItemInList(_item, children)) {
			targetItemIdx = i - 1;
			return false;
		}
	});

	var targetItemDom = targetItemIdx >= 0
		? parent.get("children")[targetItemIdx].config.get("target")
		: parent.view.get("children");
	var action = targetItemIdx >= 0
		? "insertAfter"
		: this.config.get("children.sortOrder") !== "chronological"
			? "prependTo"
			: "appendTo";
	itemsWrapper[action]($(targetItemDom));
	parent.view.render({"name": "childrenByCurrentActorLive"});
	// we should specify the element height explicitly
	// to avoid element jumping during the animation effect
	itemsWrapper
		.css("height", itemsWrapper.show().css("height"))
		.hide()
		.animate({
			"height": "show",
			"marginTop": "show",
			"marginBottom": "show",
			"paddingTop": "show",
			"paddingBottom": "show"
		}, {
			"duration": this.config.get("children.itemsSlideTimeout"),
			"complete": function() {
				itemsWrapper.css("height", "");
				parent.view.render({"name": "expandChildren"});
				parent.view.render({"name": "expandChildrenLabel"});
				itemsWrapper.children().unwrap();
			}
		});
};

collection.methods._getItemListIndex = function(item, items) {
	var idx = -1;
	$.each(items || [], function(i, entry) {
		if (entry.get("data.unique") === item.get("data.unique")) {
			idx = i;
			return false;
		}
	});
	return idx;
};

collection.methods._isItemInList = function(item, items) {
	return this._getItemListIndex(item, items) >= 0;
};

collection.methods._initItem = function(entry, isLive, callback) {
	// there is no need to create a clone of the parent config every time,
	// we can do it only once and pass it into all Item constructor calls
	if (!this.itemParentConfig) {
		this.itemParentConfig = this.config.getAsHash();
	}
	var config = $.extend({
		"target": $("<div>"),
		"appkey": this.config.get("appkey"),
		"plugins": this.config.get("plugins"),
		"context": this.config.get("context"),
		"useSecureAPI": this.config.get("useSecureAPI"),
		"apiBaseURL": this.config.get("apiBaseURL"),
		"submissionProxyURL": this.config.get("submissionProxyURL"),
		"dependencies": this.config.get("dependencies"),
		"data": entry,
		"user": this.user,
		"live": isLive,
		"ready": callback
	}, this.itemParentConfig.item);

	// assign parent config and data outside
	// of the $.extend call for performance reasons
	config.parent = this.itemParentConfig;

	var init = function() { new Echo.StreamServer.Controls.Card(config); };
	this.config.get("asyncItemsRendering") ? setTimeout(init, 0) : init();
};

collection.methods._updateItem = function(entry) {
	var item = this.items[entry.unique];
	// forcing item re-injection if the published date or the respective accumulator was changed
	var sortOrder = this.config.get(item.isRoot() ? "sortOrder" : "children.sortOrder");
	var accRelatedSortOrder = sortOrder.match(/replies|likes|flags/);
	var acc = accRelatedSortOrder && this._getRespectiveAccumulator(item, sortOrder);
	if (item.data.object.published !== entry.object.published) {
		item.set("timestamp", Echo.Utils.timestampFromW3CDTF(entry.object.published));
		item.set("forceInject", true);
	}
	$.extend(item.data, entry);
	if (accRelatedSortOrder) {
		if (this._getRespectiveAccumulator(item, sortOrder) !== acc) {
			item.set("forceInject", true);
		}
	}
	item.parseContent();
	return item;
};

collection.methods._getItemProjectedIndex = function(item, items, sort) {
	var self = this;
	var index;
	if (item.config.get("live") || item.get("forceInject")) {
		$.each(items || [], function(i, entry) {
			if (self._itemsComparator(entry, item, sort) === 1) {
				index = i;
				return false;
			}
		});
	}
	return typeof index !== "undefined" ? index : items.length;
};

collection.methods._addItemToList = function(items, item, sort) {
	if (this.config.get("itemsComparator")) {
		item.set("forceInject", true);
	}
	items.splice(this._getItemProjectedIndex(item, items, sort), 0, item);
	item.set("forceInject", false);
	this.items[item.get("data.unique")] = item;
};

collection.methods._applyStructureUpdates = function(action, item, options) {
	var parent, self = this;
	options = options || {};
	switch (action) {
		case "add":
			// adding item into the list
			this.items[item.get("data.unique")] = item;
			if (!item.isRoot()) {
				parent = this._getParentItem(item);

				// avoiding problem with missing parent
				if (!parent) {
					delete this.items[item.get("data.unique")];
					return;
				}

				item.set("depth", parent.get("depth") + 1);
				parent.set("threading", true);
				item.set("forceInject", true);
				this._addItemToList(
					parent.get("children"),
					item,
					this.config.get("children.displaySortOrder")
				);
			} else {
				this._addItemToList(this.threads, item, this.config.get("sortOrder"));
			}
			break;
		case "delete":
			var container = item.isRoot()
				? this.threads
				: this.items[item.get("data.parentUnique")].get("children");
			if (!item.isRoot() && container.length === 1) {
				parent = this._getParentItem(item);
				if (parent) parent.set("threading", false);
			}
			container.splice(this._getItemListIndex(item, container), 1);
			if (!options.keepChildren) {
				var itemIndex = this._getItemListIndex(item, this.lastRequest.data);
				this.lastRequest.data.splice(itemIndex, 1);
				item.traverse(item.get("children"), function(child) {
					delete self.items[child.get("data.unique")];
					child.destroy();
				});
				item.destroy();
				item.set("children", []);
			}
			delete this.items[item.get("data.unique")];
			break;
	}
};

collection.methods.normalizeEntry = function(entry) {
	if (entry.normalized) return entry;
	var self = this;
	entry.normalized = true;

	// detecting actual target
	$.each(entry.targets || [], function(i, target) {
		if ((target.id === target.conversationID) ||
			(target.id === entry.object.id) ||
			(self.items[target.id + target.conversationID])) {
				entry.target = target;
		}
	});

	entry.object.content_type = entry.object.content_type || "text";
	entry.object.accumulators = entry.object.accumulators || {};
	$.each(["repliesCount", "flagsCount", "likesCount"], function(i, name) {
		entry.object.accumulators[name] = +(entry.object.accumulators[name] || 0);
	});
	entry.object.context = entry.object.context || [];
	entry.object.flags = entry.object.flags || [];
	entry.object.likes = entry.object.likes || [];
	entry.target = entry.target || entry.targets[0] || {};
	entry.target.conversationID = entry.target.conversationID || entry.object.id;
	entry.source = entry.source || {};
	entry.provider = entry.provider || {};
	entry.unique = entry.object.id + entry.target.conversationID;
	entry.parentUnique = entry.target.id + entry.target.conversationID;
	return entry;
};

collection.css =
	'.{class:message-wrapper} { padding: 15px 0px; text-align: center; -moz-border-radius: 0.5em; -webkit-border-radius: 0.5em; border: 1px solid #E4E4E4; }' +
	'.{class:message-empty}, .{class:message-loading}, .{class:message-error} { display: inline-block; height: 16px; padding-left: 21px; background: no-repeat left center; }' +
	'.{class:message-empty} { background-image: url({config:cdnBaseURL.sdk-assets}/images/information.png); }' +
	'.{class:message-loading} { background-image: url({config:cdnBaseURL.sdk-assets}/images/loading.gif); }' +
	'.{class:message-error} { background-image: url({config:cdnBaseURL.sdk-assets}/images/warning.gif); }' +
	'.{class:compactStateLayout} { float: right; }' +
	'.{class:fullStateLayout} { text-align: center; }' +
	'.{class:state-picture} { display: inline-block; height: 9px; width: 8px; }' +
	'.{class:state-picture-paused} { background: url({config:cdnBaseURL.sdk-assets}/images/control_pause.png) no-repeat center center; }' +
	'.{class:state-picture-live} { background: url({config:cdnBaseURL.sdk-assets}/images/control_play.png) no-repeat center center; }' +
	'.{class:state-message} { margin-left: 5px; text-decoration: none; }' +
	'.echo-clickable a.{class:state-message}:hover { text-decoration: underline; }' +
	'.{class:more}:hover, .{class:fullStateLayout}:hover { background-color: #E4E4E4; }' +
	'.{class:more}, .{class:fullStateLayout} { text-align: center; border: solid 1px #E4E4E4; margin-top: 10px; padding: 10px; cursor: pointer; font-weight: bold; }' +
	'div.{class:body} > div.echo-streamserver-controls-card:last-child ul.dropdown-menu { top: auto; bottom: 100%; }' +
	'.{class:more} .echo-control-message { padding: 0; border: none; border-radius: 0; font-size: 12px; line-height: 16px; }' +
	'.{class:more} { border: 1px solid #d8d8d8; }' +
	'.{class:messageText} { border: 1px solid #d8d8d8; border-radius: 3px; }' +
	'.{class:header} { padding: 5px 0px 5px 0px; margin: 0px; font-size: 14px; }' +
	'.{class:body} .echo-control-message { margin: 0px 0px 10px; border: 1px solid #d2d2d2; color: #c6c6c6; padding: 30px 0px 30px 0px; text-align: left; }' +
	'.{class:body} .echo-control-message .echo-control-message-info { height: 35px; display: block; font-size: 14px; line-height: 16px; font-weight: normal; font-style: normal; background: url({%= appBaseURLs.prod %}/sdk-derived/images/info.png) no-repeat; padding-left: 40px; width: 180px; margin: 0px auto; }' +
	'.echo-control-message-info { background: url({%= appBaseURLs.prod %}/sdk-derived/images/info.png) no-repeat; }';

Echo.Control.create(collection);

})(Echo.jQuery);
