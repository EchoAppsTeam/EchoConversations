(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Card
 * Echo Stream.Item control which encapsulates Item mechanics.
 *
 * @extends Echo.Control
 *
 * @package streamserver/controls.pack.js
 * @package streamserver.pack.js
 *
 * @constructor
 * Item constructor initializing Echo.StreamServer.Controls.Card class
 *
 * @param {Object} config
 * Configuration options
 */
var card = Echo.Control.manifest("Echo.StreamServer.Controls.Card");

if (Echo.Control.isDefined(card)) return;

/** @hide @cfg appkey */
/** @hide @cfg defaultAvatar */
/** @hide @cfg plugins */
/** @hide @cfg target */
/** @hide @cfg cdnBaseURL */
/** @hide @cfg apiBaseURL */
/** @hide @cfg useSecureAPI */
/** @hide @cfg submissionProxyURL */
/** @hide @method placeImage */
/** @hide @method dependent */
/** @hide @echo_label loading */
/** @hide @echo_label retrying */
/** @hide @echo_label error_busy */
/** @hide @echo_label error_timeout */
/** @hide @echo_label error_waiting */
/** @hide @echo_label error_view_limit */
/** @hide @echo_label error_view_update_capacity_exceeded */
/** @hide @echo_label error_result_too_large */
/** @hide @echo_label error_wrong_query */
/** @hide @echo_label error_incorrect_appkey */
/** @hide @echo_label error_internal_error */
/** @hide @echo_label error_quota_exceeded */
/** @hide @echo_label error_incorrect_user_id */
/** @hide @echo_label error_unknown */

card.dependencies = [{
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

/**
 * @echo_event Echo.StreamServer.Controls.Card.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Card.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Card.onRender
 * Triggered when the app is rendered.
 */

card.events = {
	"Echo.StreamServer.Controls.Card.onRender": function() {
		this._pageLayoutChange();
	},
	"Echo.Apps.Conversations.onAppResize": function() {
		this._pageLayoutChange();
	},
	"Echo.StreamServer.Controls.CardCollection.onCardShown": function(topic, args) {
		// TODO check if we can get rig of this event handler ?
		if (args.item.data.unique !== this.get("data.unique")) return;
		this._pageLayoutChange();
		this._maybeRemoveLiveUpdateIndicator();
	},
	"Echo.Apps.Conversations.onViewportChange": function() {
		if (!this.get("isItemNew") || this.config.get("markAsRead") !== "viewportenter") {
			this.events.unsubscribe({"topic": "Echo.Apps.Conversations.onViewportChange"});
		} else {
			this._maybeRemoveLiveUpdateIndicator();
		}
	}
};

card.init = function() {
	this.timestamp = Echo.Utils.timestampFromW3CDTF(this.get("data.object.published"));
	this.set("isItemNew", this.config.get("live"));
	this._initModificator();
	this.ready();

	if (!this.config.get("manualRendering")) {
		this.render();
	}
};

card.config = {
	/**
	 * @cfg {Boolean} aggressiveSanitization
	 * If this parameter value is set to true, the entire item body will
	 * be replaced with the "I just shared this on Twitter..." text in the
	 * stream in case the item came from Twitter.
	 */
	"aggressiveSanitization": false,
	"buttonsOrder": undefined,

	/**
	 * @cfg {Object} contentTransformations
	 * Specifies the allowed item's content transformations for each content type.
	 * Contains a hash where keys are content types and values are arrays with
	 * formatting options enabled for the given content type. Available options are:
	 *
	 * + smileys - replaces textual smileys with images
	 * + hashtags - highlights hashtags in text
	 * + urls - highlights urls represented as plain text
	 * + newlines - replaces newlines with \<br> tags
	 */
	"contentTransformations": {
		"text": ["smileys", "urls", "newlines"],
		"html": ["smileys", "urls", "newlines"],
		"xhtml": ["smileys", "urls"]
	},

	/**
	 * @cfg {String} infoMessages
	 * Customizes the look and feel of info messages,
	 * for example "loading" and "error".
	 */
	"infoMessages": {
		"enabled": false
	},

	/**
	 * @cfg {Object} limits
	 * Defines the limits for different metrics.
	 *
	 * @cfg {Number} [limits.maxBodyCharacters]
	 * Allows to truncate the number of characters of the body.
	 * The value of this parameter should be integer and represents the 
	 * number of visible characters that need to be displayed.
	 *
	 * @cfg {Number} [limits.maxBodyLines]
	 * Allows to truncate the number of lines of the body. The value of
	 * this parameter should be integer and represents the number of lines
	 * that need to be displayed. Note: the definition of "Line" here is the
	 * sequence of characters separated by the "End Of Line" character
	 * ("\n" for plain text or \<br> for HTML format).
	 *
	 * @cfg {Number} [limits.maxBodyLinkLength=50]
	 * Allows to truncate the number of characters of the hyperlinks in the
	 * item body. The value of this parameter should be integer and represents
	 * the number of visible characters that need to be displayed.
	 *
	 * @cfg {Number} [limits.maxMarkerLength=16]
	 * Allows to truncate the number of characters of markers in the item body.
	 * The value of this parameter should be integer and represents the number
	 * of visible characters that need to be displayed.
	 *
	 * @cfg {Number} [limits.maxReLinkLength=30]
	 * Allows to truncate the number of characters of hyperlinks in the "reTag"
	 * section of an item. The value of this parameter should be integer and
	 * represents the number of visible characters that need to be displayed.
	 *
	 * @cfg {Number} [limits.maxReTitleLength=143]
	 * Allows to truncate the number of characters of titles in "reTag" section
	 * of an item. The value of this parameter should be integer and represents
	 * the number of visible characters that need to be displayed.
	 *
	 * @cfg {Number} [limits.maxTagLength=16]
	 * Allows to truncate the number of characters of tags in the item body.
	 * The value of this parameter should be integer and represents the number
	 * of visible characters that need to be displayed.
	 */
	"limits": {
		"maxBodyCharacters": undefined,
		"maxBodyLines": undefined,
		"maxBodyHeight": undefined,
		"maxBodyLinkLength": 50,
		"maxMarkerLength": 16,
		"maxReLinkLength": 30,
		"maxReTitleLength": 143,
		"maxTagLength": 16
	},

	/**
	 * @cfg {Boolean} [optimizedContext=true]
	 * Allows to configure the context mode of the "reTag" section of an item.
	 * If set to true the context is turned into optimized mode. The "reTag" section
	 * contains only one hyperlink in this case (the same current domain is a priority).
	 * Otherwise all hyperlinks in the item body will be resolved and converted into reTags.
	 */
	"optimizedContext": true,

	/**
	 * @cfg {String} providerIcon
	 * Specifies the URL to the icon representing data provider.
	 */
	"providerIcon": Echo.Loader.getURL("images/favicons/comments.png", false),

	/**
	 * @cfg {Boolean} [reTag=true]
	 * Allows to show/hide the "reTag" section of an item.
	 */
	"reTag": true,

	/**
	 * @cfg {Object} [viaLabel]
	 * Allows to show/hide parts or the whole "via" tag. Contains a hash with two keys
	 * managing icon and text display modes.
	 *
	 * @cfg {Boolean} [viaLabel.icon=false]
	 *
	 * @cfg {Boolean} [viaLabel.text=false]
	 */
	"viaLabel": {
		"icon": false,
		"text": false
	},
	"fadeTimeout": 5000, // 5 seconds
	"mediaWidth": 340,
	"manualRendering": false
};

card.config.normalizer = {
	"contentTransformations": function(object) {
		$.each(object, function(contentType, options) {
			object[contentType] = Echo.Utils.foldl({}, options || [],
				function(option, acc) {
					acc[option] = true;
				}
			);
		});
		return object;
	},
	"data": function(entry) {
		$.each(entry.targets || [], function(i, target) {
			if ((target.id === target.conversationID) ||
				(target.id === entry.object.id)) {
					entry.target = target;
			}
		});

		entry.object.content_type = entry.object.content_type || "text";
		entry.object.accumulators = entry.object.accumulators || {};
		$.each(["repliesCount", "flagsCount", "likesCount"], function(i, name) {
			entry.object.accumulators[name] = parseInt(entry.object.accumulators[name] || "0", 10);
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
	}
};

card.vars = {
	"children": [],
	"depth": 0,
	"threading": false,
	"textExpanded": false,
	"timestamp": undefined,
	"blocked": false,
	"buttonsOrder": [],
	"buttonSpecs": {},
	"buttons": {},
	"buttonsLayout": "inline",
	"content": undefined,
	"modificatorList": [],
	"modificator": undefined
};

card.labels = {
	/**
	 * @echo_label
	 */
	"defaultModeSwitchTitle": "Switch to metadata view",
	/**
	 * @echo_label
	 */
	"guest": "Guest",
	/**
	 * @echo_label
	 */
	"metadataModeSwitchTitle": "Return to default view",
	/**
	 * @echo_label
	 */
	"sharedThisOn": "I shared this on {service}...",
	/**
	 * @echo_label
	 */
	"userID": "User ID:",
	/**
	 * @echo_label
	 */
	"userIP": "User IP:",
	/**
	 * @echo_label
	 */
	"textToggleTruncatedMore": "more",
	/**
	 * @echo_label
	 */
	"textToggleTruncatedLess": "less",
	/**
	 * @echo_label
	 */
	"fromLabel": "from",
	/**
	 * @echo_label
	 */
	"viaLabel": "via",
	/**
	 * @echo_label
	 */
	"childrenMoreItems": "View more items",
	/**
	 * @echo_label
	 */
	"re": "Re",
	"actions": "Actions",
	"seeMore": "See more"
};

card.templates.metadata = {
	/**
	 * @echo_template
	 */
	"userID":
		'<div class="{class:metadata-userID}">' +
			'<span class="{class:metadata-title} {class:metadata-icon}">' +
				'{label:userID}' +
			'</span>' +
			'<span class="{class:metadata-value}">{data:actor.id}</span>' +
		'</div>',
	/**
	 * @echo_template
	 */
	"userIP":
		'<div class="{class:metadata-userIP}">' +
			'<span class="{class:metadata-title} {class:metadata-icon}">' +
				'{label:userIP}' +
			'</span>' +
			'<span class="{class:metadata-value}">{data:ip}</span>' +
		'</div>'
};

/**
 * @echo_template
 */
card.templates.mainHeader =
	'<div class="{class:container}">' +
		'<div class="{class:subcontainer}">' +
			'<div class="{class:content}">' +
				'<div class="{class:indicator}"></div>' +
				'<div class="{class:avatar-wrapper}">' +
					'<div class="{class:avatar}"></div>' +
				'</div>' +
				'<div class="{class:wrapper}">' +
					'<div class="{class:subwrapper}">' +
						'<div class="{class:header-container}">' +
							'<div class="{class:header-centered}">' +
								'<div class="{class:authorName}"></div>' +
								'<div class="{class:date}"></div>' +
								'<div class="echo-clear"></div>' +
							'</div>' +
						'</div>' +
						'<div class="{class:modeSwitch} echo-clickable"></div>' +
						'<div class="{class:data}">' +
							'<div class="{class:re}"></div>' +
							'<div class="{class:body} echo-primaryColor"> ' +
								'<span class="{class:text}"></span>' +
								'<span class="{class:textEllipses}">...</span>' +
								'<span class="{class:textToggleTruncated} echo-linkColor echo-clickable"></span>' +
							'</div>' +
							'<div class="{class:seeMore}">{label:seeMore}</div>' +
						'</div>' +
						'<div class="{class:metadata}"></div>' +
						'<div class="{class:footer} echo-secondaryColor echo-secondaryFont">' +
							'<img class="{class:sourceIcon} echo-clickable">' +
							'<div class="{class:from}"></div>' +
							'<div class="{class:via}"></div>' +
							'<div class="{class:buttons}"></div>' +
							'<div class="echo-clear"></div>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
				'<div class="{class:childrenMarker}"></div>' +
			'</div>' +
		'</div>';

/**
 * @echo_template
 */
card.templates.mainFooter =
		'<div class="{class:childrenByCurrentActorLive}"></div>' +
	'</div>';

/**
 * @echo_template
 */
card.templates.childrenTop =
	'<div class="{class:children}"></div>' +
	'<div class="{class:expandChildren} {class:container-child} echo-trinaryBackgroundColor echo-clickable">' +
		'<span class="{class:expandChildrenLabel}"></span>' +
		'<span class="{class:chevron} icon-chevron-down"></span>' +
	'</div>';

/**
 * @echo_template
 */
card.templates.childrenBottom =
	'<div class="{class:expandChildren} {class:container-child} echo-trinaryBackgroundColor echo-clickable">' +
		'<span class="{class:expandChildrenLabel}"></span>' +
		'<span class="{class:chevron} icon-chevron-down"></span>' +
	'</div>' +
	'<div class="{class:children}"></div>';

card.templates.button =
	'<a class="{class:button} {class:button}-{data:name}">' +
		'<i class="{class:buttonIcon} {data:icon}"></i>' +
		'<span class="echo-primaryFont {class:buttonLabel}">{data:label}</span>' +
	'</a>';

card.templates.dropdownButtons =
	'<div class="dropdown">' +
		'<a class="dropdown-toggle {class:button}" data-toggle="dropdown" href="#">' +
			'<i class="{class:buttonIcon} icon-list"></i>' +
			'<span class="echo-primaryFont {class:buttonLabel}">{label:actions}</span>' +
		'</a>' +
	'</div>';

card.templates.compactButtons =
	'<a title="{data:label}" class="{class:button} {class:compactButton} {class:button}-{data:name}">' +
		'<i class="{class:buttonIcon} {data:icon}"></i>' +
		'<span class="echo-primaryFont {class:buttonLabel}"></span>' +
	'</a>';

card.methods.template = function() {
	return this.templates.mainHeader +
	(this.config.get("parent.children.sortOrder") === "chronological"
		? this.templates.childrenTop
		: this.templates.childrenBottom
	) +
	this.templates.mainFooter;
};

/**
 * @echo_renderer
 */
card.renderers.authorName = function(element) {
	var author = this.get("data.actor.title") || this.labels.get("guest");
	return Echo.Utils.safelyExecute(element.html, author, element) || element;
};

/**
 * @echo_renderer
 */
card.renderers.date = function(element) {
	// TODO: use parentRenderer here
	this.age = this.getRelativeTime(this.timestamp);
	return element.html(this.age);
};

card.renderers.indicator = function(element) {
	var transition = "background-color " + this.config.get("fadeTimeout") + "ms linear";
	element.css({
		"transition": transition,
		"-o-transition": transition,
		"-ms-transition": transition,
		"-moz-transition": transition,
		"-webkit-transition": transition
	});
	return element;
};

/**
 * @echo_renderer
 */
card.renderers.content = function(element) {
	var self = this;
	if (this.get("isItemNew")) {
		var liveUpdate = this.cssPrefix + "new";
		element.addClass(liveUpdate);
		if (this.config.get("markAsRead") === "mouseenter") {
			element.one("mouseenter", function() {
				element.removeClass(liveUpdate);
			});
		}
	}

	element.removeClass(
		$.map(["child", "root", "child-thread", "root-thread"],	function(suffix) {
			return self.cssPrefix + "container-" + suffix;
		}).join(" ")
	);
	var suffix = this.threading ? "-thread" : "";
	var cssClass = this.depth
		? "container-child" + suffix + " echo-trinaryBackgroundColor"
		: "container-root" + suffix;
	element.addClass(
		this.cssPrefix + "depth-" + this.depth + " " +
		this.cssPrefix + cssClass
	);
	var switchClasses = function(action) {
		$.map(self.buttonsOrder, function(name) {
			var clickables = self.get("buttons." + name + ".clickableElements");
			if (!self.get("buttons." + name + ".view") || !clickables) return;
			clickables[action + "Class"]("echo-linkColor");
		});
	};
	if (!Echo.Utils.isMobileDevice()) {
		element.off(["mouseleave", "mouseenter"]).hover(function() {
			if (self.user.is("admin")) {
				self.view.get("modeSwitch").show();
			}
			switchClasses("add");
		}, function() {
			if (self.user.is("admin")) {
				self.view.get("modeSwitch").hide();
			}
			switchClasses("remove");
		});
	}
	return element;
};

/**
 * @echo_renderer
 */
card.renderers.metadata = function(element) {
	element.empty();
	if (this.user.is("admin")) {
		var view = this.view.fork();
		var addSection = function(section) {
			element.append(view.render({
				"template": card.templates.metadata[section]
			}));
		};
		addSection("userID");
		if (this.get("data.ip")) {
			addSection("userIP");
		}
	}
	return element.hide();
};

/**
 * @echo_renderer
 */
card.renderers.modeSwitch = function(element) {
	var self = this;
	element.hide();
	if (!this.user.is("admin")) {
		return element;
	}
	var mode = "default";
	var setTitle = function(el) {
		element.attr("title", self.labels.get(mode + "ModeSwitchTitle"));
	};
	setTitle();
	element.click(function() {
		mode = (mode === "default" ? "metadata" : "default");
		setTitle();
		self.view.get("data").toggle();
		self.view.get("metadata").toggle();
	});
	if (Echo.Utils.isMobileDevice()) {
		element.show();
	}
	return element;
};

/**
 * @echo_renderer
 */
card.renderers.wrapper = function(element) {
	return element.addClass(this.cssPrefix + "wrapper" + (this.depth ? "-child" : "-root"));
};

/**
 * @echo_renderer
 */
card.renderers.avatar = function(element) {
	return Echo.Utils.placeAvatar({
		"target": element,
		"avatar": this.get("data.actor.avatar", ""),
		"defaultAvatar": this.config.get("defaultAvatar")
	});
};

/**
 * @echo_renderer
 */
card.renderers.children = function(element, config) {
	return this.view.render({
		"name": "_childrenContainer",
		"target": element,
		"extra": {
			"filter": function(card) { return !card.byCurrentUser; },
			"keepChildren": config && config.keepChildren
		}
	});
};

/**
 * @echo_renderer
 */
card.renderers.childrenByCurrentActorLive = function(element, config) {
	return this.view.render({
		"name": "_childrenContainer",
		"target": element,
		"extra": {
			"filter": function(card) { return card.byCurrentUser; },
			"keepChildren": config && config.keepChildren
		}
	});
};

/**
 * @echo_renderer
 */
card.renderers.buttons = function(element) {
	this._assembleButtons();
	this._sortButtons();
	element.empty();
	this.view.render({
		"name": "_" + this.get("buttonsLayout") + "Buttons",
		"target": element
	});
	return element;
};

/**
 * @echo_renderer
 */
card.renderers.re = function(element) {
	var self = this;
	if (!this.config.get("reTag") || this.depth) {
		return element.hide();
	}

	// TODO: use normalized permalink and location instead
	var pageHref = document.location.href;
	var context = this.get("data.object.context");
	var permalink = this.get("data.object.permalink");
	if (permalink === pageHref || !context || !context.length) {
		return element.hide();
	}

	var fromCurrentPage = false;
	$.map(context, function(ctx) {
		// TODO: use normalized uri here
		if (ctx.uri === pageHref) {
			fromCurrentPage = true;
			return false; // break
		}
	});
	if (fromCurrentPage) return element.hide();

	var re;
	var config = {
		"limits": this.config.get("limits"),
		"openLinksInNewWindow": this.config.get("parent.openLinksInNewWindow")
	};
	var pageDomain = this._getDomain(pageHref);

	if (this.config.get("optimizedContext")) {
		var primary;
		$.map(context, function(ctx) {
			if (self._getDomain(ctx.uri) === pageDomain) {
				primary = ctx;
				return false; // break
			}
		});
		re = this._reOfContext(primary || context[0], config);
	} else {
		re = $.map(context, function(ctx) {
			return self._reOfContext(ctx, config);
		});
	}
	return element.empty().append(re).show();
};

/**
 * @echo_renderer
 */
card.renderers.sourceIcon = function(element) {
	if (!this.config.get("viaLabel.icon") ||
			this.get("data.source.name") === "jskit" ||
			this.get("data.source.name") === "echo") {
		return element.hide();
	}
	var url = this.get("data.source.icon", this.config.get("providerIcon"));
	var data = {
		"class": this.cssPrefix + "sourceIconLink",
		"href": this.get("data.source.uri", this.get("data.object.permalink"))
	};
	var config = {"openInNewWindow": this.config.get("parent.openLinksInNewWindow")};
	element.hide()
		.attr("src", Echo.Utils.htmlize(url))
		.one("error", function() { element.hide(); })
		.one("load", function() {
			element.show().wrap(Echo.Utils.hyperlink(data, config));
		});
	return element;
};

/**
 * @echo_renderer
 */
card.renderers.via = function(element) {
	var self = this;
	var get = function(field) {
		return (self.data[field].name || "").toLowerCase();
	};
	if (get("source") === get("provider")) {
		return element;
	}
	return this.view.render({
		"name": "_viaText",
		"target": element,
		"extra": {
			"label": "via",
			"field": "provider"
		}
	});
};

/**
 * @echo_renderer
 */
card.renderers.from = function(element) {
	return this.view.render({
		"name": "_viaText",
		"target": element,
		"extra": {
			"label": "from",
			"field": "source"
		}
	});
};

/**
 * @echo_renderer
 */
card.renderers.textToggleTruncated = function(element) {
	var self = this;
	element.off("click").click(function() {
		self.textExpanded = !self.textExpanded;
		self.view.render({"name": "body"});
		self.view.render({"name": "textToggleTruncated"});
	});
	return element.empty().append(
		this.labels.get("textToggleTruncated" + (this.textExpanded ? "Less" : "More"))
	);
};

/**
 * @echo_renderer
 */
card.renderers.body = function(element) {
	var self = this;
	var itemContent = this.get("data.object.content");

	var data = [itemContent, {
		"source": this.get("data.source.name"),
		"limits": this.config.get("limits"),
		"contentTransformations": this.config.get("contentTransformations." + this.get("data.object.content_type"), {}),
		"openLinksInNewWindow": this.config.get("parent.openLinksInNewWindow")
	}];
	$.each(this._getBodyTransformations(), function(i, trasformation) {
		data = trasformation.apply(self, data);
		if (!/\S/.test(data[0])) {
			if (data[1].source === "Twitter") {
				data[0] = self.labels.get("sharedThisOn", {"service": data[1].source});
			}
			return false;
		}
	});
	var text = data[0];
	var truncated = data[1].truncated;
	var textElement = this.view.get("text").empty();
	Echo.Utils.safelyExecute(textElement.append, text, textElement);
	this.view.get("textEllipses")[!truncated || this.textExpanded ? "hide" : "show"]();
	this.view.get("textToggleTruncated")[truncated || this.textExpanded ? "show" : "hide"]();
	return element;
};

card.renderers.seeMore = function(element) {
	var self = this;
	return element.one("click", function() {
		self.view.remove("seeMore");
		self.view.get("body").css("max-height", "");
	});
};

/**
 * @echo_renderer
 */
card.renderers.date = function(element) {
	// is used to preserve backwards compatibility
	this.age = this.getRelativeTime(this.timestamp);
	return element.html(this.age);
};

/**
 * @echo_renderer
 */
card.renderers.expandChildrenLabel = function(element, extra) {
	if (!this.children.length || !this.hasMoreChildren()) {
		return element;
	}
	extra = extra || {};
	extra.state = extra.state || "regular";
	var states = {
		"loading": {
			"css": this.cssPrefix + "message-loading",
			"label": "loading"
		},
		"regular": {
			"css": "echo-linkColor echo-message-icon",
			"label": "childrenMoreItems"
		}
	};
	return element
		.removeClass(states[extra.state === "loading" ? "regular" : "loading"].css)
		.addClass(states[extra.state].css)
		.html(this.labels.get(states[extra.state].label));
};

/**
 * @echo_renderer
 */
card.renderers.expandChildren = function(element, extra) {
	var self = this;
	if (!this.children.length) {
		return element;
	}
	if (!this.hasMoreChildren()) {
		element.slideUp(this.config.get("children.moreButtonSlideTimeout"));
		return element;
	}
	extra = extra || {};

	return element.addClass(this.cssPrefix + "depth-" + (this.depth + 1))
		.show()
		.off("click")
		.one("click", function() {
			self.view.render({
				"name": "expandChildrenLabel",
				"target": self.view.get("expandChildrenLabel"),
				"extra": {"state": "loading"}
			});
			/**
			 * @echo_event Echo.StreamServer.Controls.Card.onChildrenExpand
			 * Triggered when the children block is expanded.
			 */
			self.events.publish({
				"topic": "onChildrenExpand",
				"data": {"data": self.data},
				"global": false,
				"propagation": false
			});
		});
};

card.methods._maybeRemoveLiveUpdateIndicator = function() {
	var self = this;
	var content = this.view.get("content");
	// Item can be created but not rendered. So we check if item content exists here.
	if (
		this.config.get("markAsRead") !== "viewportenter"
		|| !content
		|| !$.inviewport(content, {"threshold": 0})
	) {
		return;
	}
	this.set("isItemNew", false);
	if (this._transitionSupported()) {
		content.removeClass(this.cssPrefix + "new");
	} else {
		setTimeout(function() {
			// IE 8-9 doesn't support transition, so we just remove the highlighting.
			// Maybe we should use jquery.animate (animating colors requires jQuery UI) ?
			content.removeClass(self.cssPrefix + "new");
		}, this.config.get("fadeTimeout"));
	}
};

card.renderers._childrenContainer = function(element, config) {
	// we cannot use element.empty() because it will remove children's event handlers
	$.each(element.children(), function(i, child) {
		$(child).detach();
	});
	$.map(this.children, function(child) {
		if (config && config.filter && !config.filter(child)) return;
		element.append(child.config.get("target"));
		if (!child.view.rendered() && !child.added) {
			child.render();
		}
		if (child.deleted || child.added) {
			/**
			 * @echo_event Echo.StreamServer.Controls.Card.onDelete
			 * Triggered when the child item is deleted.
			 */
			/**
			 * @echo_event Echo.StreamServer.Controls.Card.onAdd
			 * Triggered when the child item is added.
			 */
			child.events.publish({
				"topic": child.deleted ? "onDelete" : "onAdd",
				"data": {"config": config},
				"global": false,
				"propagation": false
			});
		}
	});
	return element;
};

card.renderers._extraField = function(element, extra) {
	var self = this;
	var type = (extra || {}).type;
	if (!this.data.object[type] || !this.user.is("admin")) {
		return element.hide();
	}
	var name = type === "markers" ? "maxMarkerLength" : "maxTagLength";
	var limit = this.config.get("limits." + name);
	var items = Echo.Utils.foldl([], this.data.object[type], function(item, acc) {
		var template = item.length > limit
			? '<span title="{data:item}">{data:truncatedItem}</span>'
			: '<span>{data:item}</span>';
		var truncatedItem = Echo.Utils.htmlTextTruncate(item, limit, "...");
		acc.push(self.substitute({
			"template": template,
			"data": {"item": item, "truncatedItem": truncatedItem}
		}));
	});
	return (
		Echo.Utils.safelyExecute(
			element.prepend,
			items.sort().join(", "),
			element
		) || element).show();
};

card.renderers._viaText = function(element, extra) {
	extra = extra || {};
	var data = this.data[extra.field];
	if (!this.config.get("viaLabel.text") ||
			!data.name ||
			data.name === "jskit" ||
			data.name === "echo") {
		return element;
	}
	var a = Echo.Utils.hyperlink({
		"class": "echo-secondaryColor",
		"href": data.uri || this.get("data.object.permalink"),
		"caption": data.name
	}, {
		"openInNewWindow": this.config.get("parent.openLinksInNewWindow")
	});
	return element.html("&nbsp;" + this.labels.get(extra.label + "Label") + "&nbsp;").append(a);
};

card.renderers._inlineButtons = function(element) {
	var self = this;
	var buttons = $.map(this.buttonsOrder, function(name) {
		return self.get("buttons." + name);
	});
	$.map(buttons, function(button) {
		if (!button || !Echo.Utils.invoke(button.visible)) {
			return;
		}
		self.view.render({
			"name": "_button",
			"target": element,
			"extra": button
		});
	});
};

card.renderers._compactButtons = function(element) {
	var self = this;
	var buttons = $.map(this.buttonsOrder, function(name) {
		return self.get("buttons." + name);
	});
	$.map(buttons, function(button) {
		if (!button || !Echo.Utils.invoke(button.visible)) {
			return;
		}
		button.template = card.templates.compactButtons;
		self.view.render({
			"name": "_button",
			"target": element,
			"extra": button
		});
	});
};

card.renderers._dropdownButtons = function(element) {
	var self = this;
	var elem = $(this.substitute({
		"template": card.templates.dropdownButtons
	}));

	var buttons = $.map(this.buttonsOrder, function(name) { return self.get("buttons." + name); });

	var closeDropdown = function(callback) {
		return function() {
			elem.find(".dropdown-toggle").dropdown("toggle");
			callback && callback();
		};
	};
	var footer = this.view.get("footer");
	var dropdownCallback = function(ev) {
		var buttonOffset = footer.width() - $(this).position().left;
		var minOffset = 10; // this is minimum offset for dropdown
		var dropdownMenu = $(this).find(".dropdown-menu");
		var dropdownWidth = dropdownMenu.outerWidth();
		if (dropdownWidth > buttonOffset) {
			var shifting = Math.min(buttonOffset - dropdownWidth - minOffset, 0);
			dropdownMenu.css({"left": shifting + "px"});
		}
		elem.find(".dropdown-toggle").dropdown("toggle");
		ev.preventDefault();
	};
	elem.click(dropdownCallback);

	(function assembleCards(container, buttons, inner) {
		var menu = $('<ul class="dropdown-menu" role="menu">');
		$.map(buttons, function(button) {
			if (!button || !Echo.Utils.invoke(button.visible)) {
				return;
			}
			var menuItem = $("<li>");
			if (button.entries && button.entries.length) {
				button.icon = "none";
			}
			self.view.render({
				"name": "_button",
				"target": menuItem,
				"extra": $.extend({}, button, {
					"inner": inner,
					"clickable": !(button.entries && button.entries.length),
					"callback": closeDropdown(button.callback)
				})
			});
			menu.append(menuItem);
			if (button.entries && button.entries.length) {
				menuItem.addClass("dropdown-header");
				$.map(button.entries, function(nestedButton) {
					nestedButton.plugin = button.plugin;
					nestedButton.name = button.name;
					nestedButton.icon = "none";
					var subItem = $("<li>");
					self.view.render({
						"name": "_button",
						"target": subItem,
						"extra": $.extend({}, nestedButton, {
							"inner": inner,
							"clickable": true,
							"callback": closeDropdown(nestedButton.callback)
						})
					});
					menu.append(subItem);
				});
			}
		});
		container.append(menu);
	})(elem, buttons);

	return element.append(elem);
};

card.renderers._button = function(element, extra) {
	var view = this.view.fork();
	var template = extra.template || card.templates.button;

	var data = {
		"label": extra.label || "",
		"name": extra.name,
		"icon": extra.icon || (!extra.inner && "icon-comment")
	};

	var button = view.render({
		"template": template,
		"data": data
	});

	if (extra.inner) {
		button.addClass("echo-clickable");
	}
	var clickables = $(".echo-clickable", button);
	if (!extra.clickable) return element.append(button);
	if (extra.entries) {
		var entries = $.map(extra.entries, function(entry) {
			return Echo.Utils.invoke(entry.visible)
				? {"title": entry.label, "handler": entry.callback}
				: null;
		});
		new Echo.GUI.Dropdown({
			"target": button.find("span"),
			"extraClass": this.cssPrefix + "dropdownButton",
			"entries": $.map(entries, function(entry) { return $.extend({"handler": entry.callback}, entry); }),
			"title": this.get("buttonsLayout") !== "compact" ? extra.label : ""
		});
		var footer = this.view.get("footer");
		extra.callback = function(ev) {
			var buttonOffset = footer.width() - button.position().left;
			var minOffset = 10; // this is minimum offset for dropdown
			var dropdownMenu = button.find(".dropdown-menu");
			var dropdownWidth = dropdownMenu.outerWidth();
			if (dropdownWidth > buttonOffset) {
				var shifting = Math.min(buttonOffset - dropdownWidth - minOffset, 0);
				dropdownMenu.css({"left": shifting + "px"});
			}
			button.find(".dropdown-toggle").dropdown("toggle");
			ev.preventDefault();
		};
	} else if (this.get("buttonsLayout") === "compact") {
		button.children("span").first().css("display", "none");
	}

	if (!clickables.length) {
		clickables = button;
		button.addClass("echo-clickable");
	}
	clickables[extra.once ? "one" : "on"]({
		"click": function(event) {
			event.stopPropagation();
			if (extra.callback) extra.callback(event);
		}
	});

	if (!extra.inner) {
		var _data = this.get("buttons." + extra.plugin + "." + extra.name);
		_data.view = view;
		_data.clickableElements = clickables;
		if (Echo.Utils.isMobileDevice()) {
			clickables.addClass("echo-linkColor");
		}
	}
	return element.append(button);
};

card.methods._pageLayoutChange = function() {
	var footer = this.view.get("footer");
	var buttons = this.view.get("buttons");
	var buttonsStates = [
		"inline",
		"compact",
		"dropdown"
	];
	if (!this.get("buttonsStates")) {
		this.set("buttonsStates", buttonsStates);
	}
	var configuredButtonsState = this.config.get("initialIntentsDisplayMode") ||  buttonsStates[0];

	var currentState = this.get("buttonsLayout");
	if (!currentState) {
		currentState = configuredButtonsState;
		this.set("buttonsLayout", currentState);
	}
	if (!footer || !buttons || !footer.is(":visible")) {
		this._checkItemContentHeight();
		return;
	}
	var footerWidth = footer.width();
	var buttonsWidth = buttons.width();

	var prevFreeSpace = this.get("prevFreeSpace") || 0;
	var freeSpace = footerWidth - footer.children().eq(0).width() - footer.children().eq(1).width();
	if (prevFreeSpace !== freeSpace || footerWidth < buttonsWidth) {
		this.set("prevFreeSpace", freeSpace);
		var index = $.inArray(currentState, buttonsStates);
		if (freeSpace < buttonsWidth) {
			if (buttonsStates[index + 1]) {
				currentState = buttonsStates[index + 1];
			}
			this.set("buttonsLayout", currentState);
			this.view.render({"name": "buttons"});
		} else if (freeSpace > (2 * buttonsWidth)) {
			var indexOfConfiguredState = $.inArray(configuredButtonsState, buttonsStates);
			if (indexOfConfiguredState < index && buttonsStates[index - 1]) {
				currentState = buttonsStates[index - 1];
			} else {
				currentState = configuredButtonsState;
			}
			this.set("buttonsLayout", currentState);
			this.view.render({"name": "buttons"});
		}
	}

	this._checkItemContentHeight();
};

card.methods._checkItemContentHeight = function() {
	var body = this.view.get("body");
	var text = this.view.get("text");
	var button = this.view.get("seeMore");

	if (body && button) {
		var maxBodyHeight = this.config.get("limits.maxBodyHeight");
		var lineHeight = parseInt(text.css("line-height"), 10);
		var fontSize = parseInt(text.css("font-size"), 10);

		var lineCount = Math.round(maxBodyHeight / lineHeight);
		var realMaxHeight = lineCount * lineHeight - fontSize / 2;
		var coeffToShow = 1.2; // we don't need to hide text if it's height <= 120% of maxBodyHeight
		if (text.height() > realMaxHeight * coeffToShow && !button.is(":visible")) {
			body.css("max-height", realMaxHeight);
			button.show();
		} else if (text.height() < realMaxHeight && button.is(":visible")) {
			body.css("max-height", "");
			button.hide();
		}
	}
};

var cache = {};
card.methods._transitionSupported = function() {
	if (!cache.transitionSupported) {
		var s = document.createElement('p').style;
		cache.transitionSupported = 'transition' in s ||
			'WebkitTransition' in s ||
			'MozTransition' in s ||
			'msTransition' in s ||
			'OTransition' in s;
	}
	return cache.transitionSupported;
};

card.methods._getItemRenderType = function() {
	var availableTypes = ["article", "image", "video"];
	var result;
	$.each(this.get("data.object.objectTypes", []), function(i, objectType) {
		var type = (objectType.match("[^/]+$") || []).pop();
		if (~$.inArray(type, availableTypes)) {
			result = type;
			return false;
		}
	});

	return result;
};

card.methods._getActiveModificator = function() {
	var self = this;
	if (!this.modificator) {
		$.each(this.modificatorList, function(_, modificator) {
			if (modificator.isEnabled()) {
				self.modificator = modificator;
				return false;
			}
		});
	}
	return this.modificator;
};

card.methods._initModificator = function() {
	var modificator = this._getActiveModificator();
	if (modificator) {
		modificator.init();
	}
};

/**
 * Method allows register custom item content modificato
 *
 * @param {object} config
 *
 */
card.methods.registerModificator = function(config) {
	this.modificatorList.push(config);
};

/**
 * Method checking if the item has more children.
 *
 * @return {Boolean}
 */
card.methods.hasMoreChildren = function() {
	return this.get("data.hasMoreChildren") === "true";
};

/**
 * Accessor method to get the correct `pageAfter` property value
 * according to the defined `sortOrder`.
 *
 * return {String}
 */
card.methods.getNextPageAfter = function() {
	var children = $.grep(this.children, function(child) {
		return !child.config.get("live");
	});
	var index = this.config.get("parent.children.sortOrder") === "chronological"
		? children.length - 1
		: 0;
	return children.length
		? children[index].data.pageAfter
		: undefined;
};

/**
 * Method implementing the children tree traversal
 *
 * @param {Array} tree
 * List of nodes to traverse through.
 *
 * @param {Function} callback
 * Callback function to be applied to the tree node.
 *
 * @param {Array} acc
 * Accumulator.
 *
 * @return {Array}
 * Acumulator.
 */
card.methods.traverse = function(tree, callback, acc) {
	var self = this;
	$.each(tree || [], function(i, card) {
		acc = self.traverse(card.children, callback, callback(card, acc));
	});
	return acc;
};

/**
 * Method which blocks the particular item during data processing.
 * For example while changing its status.
 *
 * @param {String} label
 * Text label to be shown as a block message
 */
card.methods.block = function(label) {
	if (this.blocked) return;
	this.blocked = true;
	// Due to item content element have padding and we can't calculate width, we should take its parent (wrapper) instead.
	var content = this.view.get("content").parent();
	var width = content.width();
	// we should take into account that the item content element has a 10px 0px padding value
	var height = content.outerHeight();
	this.blockers = {
		"backdrop": $('<div class="' + this.cssPrefix + 'blocker-backdrop"></div>').css({
			"width": width, "height": height
		}),
		"message": $(this.substitute({
			"template": '<div class="{class:blocker-message}">{data:label}</div>',
			"data": {"label": label}
		})).css({
			"left": ((parseInt(width, 10) - 200)/2) + 'px',
			"top": ((parseInt(height, 10) - 20)/2) + 'px'
		})
	};
	content.addClass("echo-relative")
		.prepend(this.blockers.backdrop)
		.prepend(this.blockers.message);
};

/**
 * Method which unblocks the particular blocked item.
 */
card.methods.unblock = function() {
	if (!this.blocked) return;
	this.blocked = false;
	this.blockers.backdrop.remove();
	this.blockers.message.remove();
	this.view.get("content").removeClass("echo-relative");
};

/**
 * Accessor method to get the item accumulator value by type.
 *
 * @param {String} type
 * Accumulator type.
 *
 * @return {String}
 * Accumulator value.
 */
card.methods.getAccumulator = function(type) {
	return this.data.object.accumulators[type];
};

/**
 * Method to check if item is a root one.
 *
 * @return {Boolean}
 */
card.methods.isRoot = function() {
	return !this.config.get("parent.children.maxDepth") ||
		this.get("data.object.id") === this.get("data.target.conversationID");
};

/**
 * Method to add the item control button specification.
 *
 * @param {String} plugin
 * Plugin name.
 *
 * @param {Function} spec
 * Function describing the control specification.
 */
card.methods.addButtonSpec = function(plugin, spec) {
	if (!this.buttonSpecs[plugin]) {
		this.buttonSpecs[plugin] = [];
	}
	this.buttonSpecs[plugin].push(spec);
};

card.methods._getDomain = function(url) {
	var parts = Echo.Utils.parseURL(url);
	return parts && parts.domain ? parts.domain : url;
};

card.methods._reOfContext = function(context, config) {
	var title = context.title || context.uri.replace(/^https?:\/\/(.*)/ig, '$1');
	var maxLength = config.limits[title ? "maxReTitleLength" : "maxReLinkLength"];
	if (title.length > maxLength) {
		title = title.substring(0, maxLength) + "...";
	}
	var hyperlink = Echo.Utils.hyperlink({
		"class": "echo-primaryColor",
		"href": context.uri,
		"caption": this.labels.get("re") + ": " + Echo.Utils.stripTags(title)
	}, {
		"openInNewWindow": config.openLinksInNewWindow
	});
	return $(this.substitute({
		"template": '<div class="{class:re-container}">{data:hyperlink}</div>',
		"data": {"hyperlink": hyperlink}
	}));
};

card.methods._prepareEventParams = function(params) {
	return $.extend(params, {
		"query": this.config.get("parent.query"),
		"card": {
			"data": this.data,
			"target": this.config.get("target").get(0)
		}
	});
};

var _smileys = {
	"codes": [],
	"regexps": [],
	"hash": {
		":)": {file: "smile.png", title: "Smile"},
		":-)": {file: "smile.png", title: "Smile"},
		";)": {file: "wink.png", title: "Wink"},
		";-)": {file: "wink.png", title: "Wink"},
		":(": {file: "unhappy.png", title: "Frown"},
		":-(": {file: "unhappy.png", title: "Frown"},
		"=-O": {file: "surprised.png", title: "Surprised"},
		":-D": {file: "grin.png", title: "Laughing"},
		":-P": {file: "tongue.png", title: "Tongue out"},
		"=)": {file: "happy.png", title: "Happy"},
		"B-)": {file: "evilgrin.png", title: "Evil grin"}
	}
};

card.methods._initSmileysConfig = function() {
	var self = this;
	if (_smileys.codes.length) {
		return _smileys;
	}
	var esc = function(v) { return v.replace(/([\W])/g, "\\$1"); };
	var escapedCodes = [];
	$.each(_smileys.hash, function(code) {
		var escaped = esc(code);
		escapedCodes.push(escaped);
		_smileys.codes.push(code);
		_smileys.regexps[code] = new RegExp(escaped, "g");
	});
	_smileys.regexps.test = new RegExp(escapedCodes.join("|"));
	_smileys.tag = function(smiley) {
		return self.substitute({"template": '<img class="{class:smiley-icon}" src="{config:cdnBaseURL.sdk-assets}/images/smileys/emoticon_' + smiley.file + '" title="' + smiley.title + '" alt="' + smiley.title + '">'});
	};
	return _smileys;
};

card.methods._assembleButtons = function() {
	var self = this;
	var buttonsOrder = [];
	$.each(this.buttonSpecs, function(plugin, specs) {
		$.map(specs, function(spec) {
			var data = $.isFunction(spec)
				? spec.call(self)
				: $.extend({}, spec);
			if (!data.name) return;
			var callback = data.callback || function() {};
			data.callback = function() {
				callback.call(self);
				/**
				 * @echo_event Echo.StreamServer.Controls.Card.onButtonClick
				 * Triggered when the item control button is clicked.
				 */
				self.events.publish({
					"topic": "onButtonClick",
					"data": {
						"name": data.name,
						"plugin": plugin,
						"card": {
							"data": self.data,
							"target": self.config.get("target")
						}
					}
				});
			};
			data.label = data.label || data.name;
			data.plugin = plugin;
			if (typeof data.clickable === "undefined") {
				data.clickable = true;
			}
			if (typeof data.visible === "undefined") {
				data.visible = true;
			}
			var visible = data.visible;
			data.visible = $.isFunction(visible)
				? visible
				: function() { return visible; };
			var name = plugin + "." + data.name;
			self.set("buttons." + name, data);
			if ($.inArray(name, self.buttonsOrder) < 0) {
				buttonsOrder.push(name);
			}
		});
	});
	// keep correct order of plugins and buttons
	self.buttonsOrder = buttonsOrder.concat(self.buttonsOrder);
};

card.methods._sortButtons = function() {
	var self = this;
	var defaultOrder = this.buttonsOrder;
	var requiredOrder = this.config.get("buttonsOrder");
	// if buttons order is not specified in application config, use default order
	if (!requiredOrder) {
		this.config.set("buttonsOrder", defaultOrder);
	} else if (requiredOrder !== defaultOrder) {
		var push = function(name, acc, pos) {
			if (!self.get("buttons." + name)) return;
			acc.push(name);
			pos = pos || $.inArray(name, defaultOrder);
			if (pos >= 0) {
				delete defaultOrder[pos];
			}
		};
		var order = Echo.Utils.foldl([], requiredOrder, function(name, acc) {
			if (/^(.*)\./.test(name)) {
				push(name, acc);
			} else {
				var re = new RegExp("^" + name + "\\.");
				$.map(defaultOrder, function(n, i) {
					if (n && n.match(re)) {
						push(n, acc, i);
					}
				});
			}
		});
		this.buttonsOrder = order;
		this.config.set("buttonsOrder", order);
	// if application config tells not to use buttons
	} else if (!requiredOrder.length) {
		this.buttonsOrder = [];
	}
};

(function() {
	card.methods._getBodyTransformations = function() {
		return [
			_aggressiveSanitization,
			_replaceLinkedHashtags,
			_tags2meta,
			_replacePlainHashtags,
			_autoLinking,
			_replaceSmileys,
			_replaceNewLines,
			_meta2tags,
			_normalizeLinks,
			_applyLimits
		];
	};

	var _urlMatcher = "((?:http|ftp|https):\\/\\/(?:[a-z0-9#:\\/\\;\\?\\-\\.\\+,@&=%!\\*\\'(){}\\[\\]$_|^~`](?!gt;|lt;))+)";

	var _wrapTag = function(tag, limits) {
		var template = tag.length > limits.maxTagLength
			? '<span class="{class:tag}" title="{data:tag}">{data:truncatedTag}</span>'
			: '<span class="{class:tag}">{data:tag}</span>';
		var truncatedTag = tag.substring(0, limits.maxTagLength) + "...";
		return this.substitute({
			"template": template,
			"data": {"tag": tag, "truncatedTag": truncatedTag}
		});
	};

	var _aggressiveSanitization = function(text, extra) {
		if (extra.source && extra.source === "Twitter" && this.config.get("aggressiveSanitization")) {
			text = "";
		}
		return [text, extra];
	};

	var _replaceLinkedHashtags = function(text, extra) {
		var self = this;
		if (extra.contentTransformations.hashtags) {
			text = text.replace(/(?:#|\uff03)(<a[^>]*>[^<]*<\/a>)/ig, function($0, $1, $2){
				return _wrapTag.call(self, $1, extra.limits);
			});
		}
		return [text, extra];
	};

	var _replacePlainHashtags = function(text, extra) {
		var self = this;
		if (extra.contentTransformations.hashtags) {
			text = text.replace(/(^|[^\w&\/])(?:#|\uff03)([^\s\.,;:'"#@\$%<>!\?\(\)\[\]]+)/ig, function($0, $1, $2) {
				return $1 + _wrapTag.call(self, $2, extra.limits);
			});
		}
		return [text, extra];
	};

	var _tags2meta = function(text, extra) {
		var self = this, tags = [];
		text = text.replace(/((<a\s+[^>]*>)(.*?)(<\/a>))|<.*?>/ig, function($0, $1, $2, $3, $4) {
			//we are cutting and pushing <a> tags to acc to avoid potential html issues after autolinking
			if ($1) {
				var data = _tags2meta.call(self, $3, extra);
				data = _replacePlainHashtags.apply(self, data);
				data = _meta2tags.apply(self, data);
				$0 = $2 + data[0] + $4;
			}
			tags.push($0);
			return " %%HTML_TAG%% ";
		});
		extra.tags = tags;
		return [text, extra];
	};

	var _meta2tags = function(text, extra) {
		$.each(extra.tags, function(i, v) {
			text = text.replace(" %%HTML_TAG%% ", v);
		});
		return [text, extra];
	};

	var _normalizeLinks = function(text, extra) {
		text = text.replace(/(<a\s+[^>]*>)(.*?)(<\/a>)/ig, function($0, $1, $2, $3) {
			if (new RegExp("^" + _urlMatcher + "$", "i").test($2)) {
				$2 = $2.length > extra.limits.maxBodyLinkLength ? $2.substring(0, extra.limits.maxBodyLinkLength) + "..." : $2;
			}
			if (extra.openLinksInNewWindow && !/\s+target=("[^<>"]*"|'[^<>']*'|\w+)/.test($1)) {
				$1 = $1.replace(/(^<a\s+[^>]*)(>$)/, '$1 target="_blank"$2');
			}
			return $1 + $2 + $3;
		});
		return [text, extra];
	};

	var _autoLinking = function(text, extra) {
		extra.textBeforeAutoLinking = text;
		var url;
		if (extra.source && extra.source !== "jskit" && extra.source !== "echo") {
			url = this.depth
				? this.get("data.target.id")
				: this.config.get("reTag")
					? this.get("data.object.permalink") || this.get("data.target.id")
					: undefined;
		}
		text = text.replace(new RegExp(_urlMatcher, "ig"), function($0, $1) {
			// cut out URL to current item
			if (url === $1) return "";
			if (!extra.contentTransformations.urls) return $0;
			return Echo.Utils.hyperlink({
				"href": $1,
				"caption": $1
			}, {
				"skipEscaping": true,
				"openInNewWindow": extra.openLinksInNewWindow
			});
		});
		return [text, extra];
	};

	var _replaceSmileys = function(text, extra) {
		if (extra.contentTransformations.smileys) {
			if (text !== extra.textBeforeAutoLinking) {
				var data = _meta2tags.call(this, text, extra);
				data = _tags2meta.apply(this, data);
				text = data[0];
				extra = data[1];
			}
			var smileys = this._initSmileysConfig();
			if (text.match(smileys.regexps.test)) {
				$.each(smileys.codes, function(i, code) {
					text = text.replace(smileys.regexps[code], smileys.tag(smileys.hash[code]));
				});
			}
		}
		return [text, extra];
	};

	var _replaceNewLines = function(text, extra) {
		if (extra.contentTransformations.newlines) {
			text = text.replace(/\n\n+/g, "\n\n");
			text = text.replace(/\n/g, "&nbsp;<br>");
		}
		return [text, extra];
	};

	var _applyLimits = function(text, extra) {
		var truncated = false;
		if ((extra.limits.maxBodyCharacters || extra.limits.maxBodyLines) && !this.textExpanded) {
			if (extra.limits.maxBodyLines) {
				var splitter = extra.contentTransformations.newlines ? "<br>" : "\n";
				var chunks = text.split(splitter);
				if (chunks.length > extra.limits.maxBodyLines) {
					text = chunks.splice(0, extra.limits.maxBodyLines).join(splitter);
					truncated = true;
				}
			}
			var limit = extra.limits.maxBodyCharacters && text.length > extra.limits.maxBodyCharacters
				? extra.limits.maxBodyCharacters
				: truncated
					? text.length
					: undefined;
			// we should call Echo.Utils.htmlTextTruncate to close all tags
			// which might remain unclosed after lines truncation
			var truncatedText = Echo.Utils.htmlTextTruncate(text, limit, "", true);
			if (truncatedText.length !== text.length) {
				truncated = true;
			}
			text = truncatedText;
		}
		extra.truncated = truncated;
		return [text, extra];
	};
})();

var cardDepthRules = [];
// 100 is a maximum level of children in query, but we can apply styles for ~20
for (var i = 0; i <= 20; i++) {
	cardDepthRules.push('.{class:container} .{class:depth}-' + i + ' { margin-left: 0px; padding-left: ' + (i ? 12 + (i - 1) * 39 : 16) + 'px; }');
}

card.css =
	'.{class:container} { word-wrap: break-word; }' +
	'.{class:container-root} { padding: 10px 0px 10px 10px; }' +
	'.{class:container-root-thread} { padding: 10px 0px 0px 10px; }' +
	'.{class:container-child} { padding: 10px; margin: 0px 20px 2px 0px; }' +
	'.{class:container-child-thread} { padding: 10px; margin: 0px 20px 2px 0px; }' +
	'.{class:avatar-wrapper} { margin-right: -58px; float: left; position: relative; }' +
	'.{class:children} .{class:avatar-wrapper}, .{class:childrenByCurrentActorLive} .{class:avatar-wrapper} { margin-right: -34px; }' +
	'.{class:wrapper} { float: left; width: 100%; }' +
	'.{class:subwrapper} { position: relative; }' +
	'.{class:children} .{class:subwrapper}, .{class:childrenByCurrentActorLive} .{class:subwrapper} { margin-left: 34px; }' +
	'.{class:markers} { line-height: 16px; background: url("{config:cdnBaseURL.sdk-assets}/images/curation/metadata/marker.png") no-repeat; padding: 0px 0px 4px 21px; margin-top: 7px; }' +
	'.{class:tags} { line-height: 16px; background: url("{config:cdnBaseURL.sdk-assets}/images/tag_blue.png") no-repeat; padding: 0px 0px 4px 21px; }' +
	'.{class:metadata-title} { font-weight: bold; line-height: 25px; height: 25px; margin-right: 5px; }' +
	'.{class:metadata-icon} { display: inline-block; padding-left: 26px; }' +
	'.{class:metadata-userID} { border-bottom: 1px solid #e1e1e1; border-top: 1px solid #e1e1e1;}' +
	'.{class:metadata-userID} .{class:metadata-icon} { background: url("{config:cdnBaseURL.sdk-assets}/images/curation/metadata/user.png") no-repeat left center; }' +
	'.{class:metadata-userIP} { border-bottom: 1px solid #e1e1e1; }' +
	'.{class:metadata-userIP} .{class:metadata-icon} { background: url("{config:cdnBaseURL.sdk-assets}/images/curation/metadata/computer.png") no-repeat left center; }' +
	'.{class:modeSwitch} { float: right; width: 16px; height: 16px; background:url("{config:cdnBaseURL.sdk-assets}/images/curation/metadata/flip.png") no-repeat 0px 3px; }' +
	'.{class:childrenMarker} { border-color: transparent transparent #ECEFF5; border-width: 0px 11px 11px; border-style: solid; margin: 3px 0px 0px 77px; height: 1px; width: 0px; display: none; }' + // This is magic "arrow up". Only color and margins could be changed
	'.{class:container-root-thread} .{class:childrenMarker} { display: block; }' +
	'.{class:authorName} { float: left; font-size: 15px; font-family: Arial, sans-serif; font-weight: bold; }' +
	'.{class:re} { font-weight: bold; }' +
	'.{class:re} a:link, .{class:re} a:visited, .{class:re} a:active { text-decoration: none; }' +
	'.{class:re} a:hover { text-decoration: underline; }' +
	'.{class:body} { padding-top: 4px; }' +
	'.{class:buttons} a.{class:button} { color: #C6C6C6; }' +
	'.{class:buttons} a.{class:button}.echo-linkColor, .{class:buttons} a.{class:button}:hover { color: #476CB8; text-decoration: none; }' +
	'.{class:sourceIcon} { height: 16px; width: 16px; }' +
	'.{class:sourceIconLink} { float: left; display: block; line-height: 20px; margin-right: 10px; }' +
	'.{class:date}, .{class:from}, .{class:via} { float: left; }' +
	'.{class:from} a, .{class:via} a { text-decoration: none; color: #C6C6C6; }' +
	'.{class:from} a:hover, .{class:via} a:hover { color: #476CB8; }' +
	'.{class:tag} { display: inline-block; height: 16px; background: url("{config:cdnBaseURL.sdk-assets}/images/tag_blue.png") no-repeat; padding-left: 18px; }' +
	'.{class:smiley-icon} { border: 0px; }' +
	'.{class:textToggleTruncated} { margin-left: 5px; }' +
	'.{class:blocker-backdrop} { position: absolute; left: 0px; top: 0px; background: #FFFFFF; opacity: 0.7; z-index: 100; }' +
	'.{class:blocker-message} { position: absolute; z-index: 200; width: 200px; height: 20px; line-height: 20px; text-align: center; background-color: #FFFF99; border: 1px solid #C6C677; opacity: 0.7; -moz-border-radius: 0.5em 0.5em 0.5em 0.5em; }' +
	'.{class:expandChildren} { display: none; text-align: center; padding: 8px 0px; margin-bottom: 0px;  font-size: 12px;}' +
	'.{class:expandChildren} .{class:expandChildrenLabel} { display: inline-block; padding-left: 22px; }' +
	'.{class:expandChildren} .echo-message-icon { background: url("{config:cdnBaseURL.sdk-assets}/images/whirlpool.png") no-repeat 5px 4px; }' +
	'.{class:expandChildren} .{class:message-loading} { background: no-repeat left top url("{config:cdnBaseURL.sdk-assets}/images/loading.gif"); }' +
	'.echo-sdk-ui .{class:dropdownButton} { display: inline; margin-left: 0px; }' +
	'.echo-sdk-ui .{class:dropdownButton} > .dropdown { display: inline; }' +
	'.echo-sdk-ui .{class:dropdownButton} > .dropdown a { color: inherit; text-decoration: inherit; }' +
	'.{class:subcontainer} { background: #ffffff; border-bottom: 1px solid #e5e5e5; border-radius: 3px 3px 0px 0px; }' +
	'.{class:content} { background: #ffffff; position: relative; }' +
	'.{class:content}.{class:depth-0} { border-radius: 2px 3px 0px 0px; }' +

	'.echo-trinaryBackgroundColor { background-color: #f8f8f8; }' +
	'.{class:date} { font-size: 12px; float: left; color: #d3d3d3; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; word-wrap: normal; max-width: 100%; }' +

	'.{class:avatar} { width: 36px; height: 36px; display:inline-block; }' +
	'.{class:children} .{class:avatar}, .{class:childrenByCurrentActorLive} .{class:avatar} { width: 28px; height: 28px; }' +

	'.{class:container} { background: #f8f8f8; border-radius: 3px; }' +
	'.{class:buttons} { white-space: nowrap; float: left; height: 23px; }' +
	'.{class:metadata} { margin-bottom: 8px; }' +
	'.{class:body} { padding-top: 0px; margin-bottom: 8px; overflow: hidden; }' +
	'.{class:body} .{class:text} { color: #42474A; font-size: 15px; line-height: 21px; }' +
	'.{class:authorName} { float: left; color: #595959; font-weight: normal; font-size: 14px; line-height: 16px; max-width: 100%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; word-wrap: normal; }' +
	'.{class:authorName}:after { content: ""; display: inline; padding-right: 5px; }' +

	'.{class:container-child} { padding-bottom: 8px; padding-right: 0px; margin: 0px 16px 2px 0px; }' +
	'.{class:children} .{class} { margin: 0px; padding: 0px; box-shadow: 0 0 0; border: 0px; background: #F8F8F8; }' +
	'.{class:children} .{class} { padding-top: 0px; background: none; border: none; }' +

	'.{class:container} .{class:container-child-thread} { padding: 8px 0px 10px 8px; margin: 0px 16px 2px 0px; }' +

	'.{class:children} .{class:avatar-wrapper} { margin-top: 5px; }' +
	'.{class:children} .{class:data} { margin-top: 2px; padding-top: 0px; }' +
	'.{class:children} .{class:subcontainer} { padding-top: 0px; background: none; border: none; }' +

	'.echo-sdk-ui .{class:buttons} a:focus { outline: none; }' +
	'.{class:button} { margin-right: 10px; line-height: 22px; }' +
	'.{class:buttons} .dropdown .{class:button} { margin-right: 0px; }' +
	'.{class:button-delim} { display: none; }' +
	'.echo-sdk-ui .{class:buttonIcon}[class*=" icon-"] { margin-right: 4px; margin-top: 0px; }' +
	'.{class:dropdownButton} ul.dropdown-menu { left: -20px; }' +
	'.{class:buttons} ul.dropdown-menu li.dropdown-header { padding: 3px 0px; border-top: 1px solid #E5E5E5; margin-top: 10px; }' +
	'.{class:buttons} ul.dropdown-menu li.dropdown-header > a:hover { background: none; color: #999; }' +
	'.{class:buttons} ul.dropdown-menu li.dropdown-header > a > i { background: none; }' +
	'.{class:buttons} ul.dropdown-menu li.dropdown-header > a > span { color: #999; }' +
	'.{class:buttonIcon} { opacity: 0.3; }' +
		'.{class:buttons} a.{class:button}.echo-linkColor,' +
		'.echo-sdk-ui .{class:button}:active,' +
		'.echo-sdk-ui .{class:button}:focus { text-decoration: none; color: #c6c6c6; }' +
	'.{class:content}:hover a.{class:button} { color: #262626; text-decoration: none; }' +
	'.{class:buttonLabel} { vertical-align: middle; font-size: 12px; }' +
	'.{class:buttons} a.{class:button}.echo-linkColor .{class:buttonIcon},' +
		'.{class:content}:hover .{class:buttonIcon},' +
		'.{class:buttons} a.{class:button}:hover .{class:buttonIcon} { opacity: 0.8; }' +

	'.{class:depth-0} .{class:date} { line-height: 40px; }' +
	'.{class:chevron} { margin-top: 0px !important; }' +
	'.{class:expandChildrenLabel} { margin-right: 5px; }' +
	'.{class:expandChildren} .{class:expandChildrenLabel} { color: #D3D3D3; }' +
	'.{class:expandChildren}:hover .{class:expandChildrenLabel} { color: #262626; }' +
	'.{class:expandChildren} .{class:chevron} { opacity: 0.3; }' +
	'.{class:expandChildren}:hover .{class:chevron} { opacity: 0.8; }' +
	'.{class:expandChildren} .echo-message-icon { padding-left: 0px; background: none; }' +
	'.{class:expandChildren} .{class:message-loading} { background: none; }' +
	'.echo-sdk-ui .{class:mediaAvatar} > img { width: 28px; height: 28px; border-radius: 50%; margin-right: 6px; }' +
	'.{class:depth-0} .{class:footer} { padding: 8px 0px 10px; }' +
	'.{class:depth-0} .{class:body} { padding-top: 0px; }' +
	'.{class:depth-0} .{class:authorName} { font-weight: normal; font-size: 17px; line-height: 18px; }' +
	'.{class:depth-0} .{class:subwrapper} { margin-left: 0px; }' +
	'.{class:depth-0} .{class:childrenMarker} { display: none; }' +

	'.{class:depth-0} .{class:header-container} { height: 36px; margin-right: 18px; margin-left: 45px; }' +
	'.{class:depth-0} .{class:header-container}:before { content: ""; display: inline-block; height: 100%; vertical-align: middle; }' +
	'.{class:depth-0} .{class:header-centered} { display: inline-block; vertical-align: middle; max-width: 100%; max-width: 90%\\9; }' +
	'.{class:depth-0} .{class:date} { line-height: 18px; }' +

	'.{class:data} { padding: 7px 0px 0px 0px; }' +
	'.{class:container} .{class:depth-0} { padding: 15px 16px 0px 16px; }' +
	'.{class} { background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; margin: 0px; font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; }' +
	'.{class} { margin: 0px 0px 10px 0px; padding: 0px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; background: #ffffff; }' +

	// see more
	'.{class:seeMore}:before { content: ""; display: block; height: 3px; box-shadow: 0 -3px 3px rgba(0, 0, 0, 0.08); position: relative; top: 0px; }' +
	'.{class:seeMore} { margin-top: -8px; display: none; padding: 0 0 15px 0; border-top: 1px solid #D8D8D8; text-align: center; font-size: 12px; cursor: pointer; color: #C6C6C6; }' +
	'.{class:seeMore}:hover { color: #262626; }' +

	// hide switch for now
	'.{class:modeSwitch} { width: 0px; height: 0px; display: none !important; }' +

	// indicator
	'.{class:content} { position: relative; }' +
	'.{class:indicator} { position: absolute; left: 0px; top: 0px; bottom: 0px; width: 4px; background-color: transparent; z-index: 10; }' +
	'.{class:new} .{class:indicator} { background-color: #f5ba47; }' +

	cardDepthRules.join("\n");

Echo.Control.create(card);

})(Echo.jQuery);
