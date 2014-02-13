(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.SubmitComposer
 * Echo Submit control which encapsulates interaction with the
 * <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/submit/" target="_blank">Echo Submit API</a>.
 *
 *		new Echo.StreamServer.Controls.SubmitComposer({
 *			"target": document.getElementById("composer"),
 *			"targetURL": "http://example.com/composer",
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *		});
 *
 * More information regarding the possible ways of the Control initialization
 * can be found in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-an-app) guide.
 *
 * @extends Echo.Control
 *
 * @package streamserver/controls.pack.js
 * @package streamserver.pack.js
 *
 * @constructor
 * Submit constructor initializing Echo.StreamServer.Controls.SubmitComposer class
 *
 * @param {Object} config
 * Configuration options
 */
var composer = Echo.Control.manifest("Echo.StreamServer.Controls.SubmitComposer");

if (Echo.Control.isDefined(composer)) return;

/** @hide @cfg apiBaseURL */
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

/**
 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onRerender
 * Triggered when the app is rerendered.
 */

composer.init = function() {
	var self = this;
	if (!this.checkAppKey()) return;

	this.addPostValidator(function() {
		if (self.user.is("logged")) return true;
		var isGuestAllowed = self.config.get("submitPermissions") === "allowGuest";
		if (!isGuestAllowed) {
			self.set("_deferredActivity", $.proxy(self.posting.action, self));
			self._requestLoginPrompt();
			return false;
		}
		return true;
	}, "low");
	var tabsUniqueId = Echo.Utils.getUniqueString();
	$.each(this.composers, function(i, tab) {
		tab.index = i;
		tab.uniqueId = tab.id + "-" + tabsUniqueId;
		if (!$.isFunction(tab.isValid)) return;
		self.addPostValidator(function() {
			if (self.currentComposer.id !== tab.id) return true;
			return tab.isValid();
		}, "low");
	});
	this.resolver = new Echo.URLResolver({
		"embedly": this.config.get("embedly")
	});
	this.collapsed = this.config.get("compact.mode") !== "none";
	this._extractInfoFromExternalData();
	this.render();
	this.ready();
};

composer.destroy = function() {
	this.auth && this.auth.destroy();
	this.tabs && this.tabs.destroy();
	this.mediaContainer && this.mediaContainer.destroy();
	this.toggleModeHandler && $(document).off("mousedown", this.toggleModeHandler);
};

composer.config = {
	/**
	 * @cfg {String} [targetURL=document.location.href]
	 * Specifies the URI to which the submitted Echo item is related. 
	 * This parameter will be used as a activity target value for the item.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"targetURL": "http://somedomain.com/some_article.html",
	 *			...
	 *		});
	 */
	"targetURL": document.location.href,

	/**
	 * @cfg {Object} contentTypes
	 *
	 * @cfg {Object} contentTypes.comments
	 *
	 * @cfg {String} contentTypes.comments.prompt
	 * Is used to define the default call to action phrase.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"contentTypes": {
	 *				"comments": {
	 *					"prompt": "Type your comment here..."
	 *				}
	 *			}
	 *			...
	 *		});
	 */
	"contentTypes": {
		"comments": {
			"visible": true,
			"prompt": "What's on your mind?",
			"resolveURLs": true
		}
	},

	/**
	 * @cfg {Array} markers
	 * This parameter is used to attach the markers metadata to the item
	 * during the item submission. The format of the value is the array
	 * with the string values. Markers will also be displayed in the "Markers"
	 * field in the Submit form UI for Moderators and Administrators.
	 * For non-admin users the markers value will be submitted along with
	 * other item content when the "Post" button is pressed.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"markers": ["marker1", "marker2", "marker3"],
	 *			...
	 *		});
	 */
	"markers": [],

	/**
	 * @cfg {Object} source
	 * Designates the initial item source (E.g. Twitter). You can override
	 * source name, URI and the corresponding icon.
	 *
	 * @cfg {String} source.name
	 * Source name.
	 *
	 * @cfg {String} source.uri
	 * Source uri.
	 *
	 * @cfg {String} source.icon
	 * Source icon.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"source": {
	 *				"name": "ExampleSource",
	 *				"uri": "http://example.com/",
	 *				"icon": "http://example.com/images/source.png"
	 *			},
	 *			...
	 *		});
	 */
	"source": {},

	/**
	 * @cfg {Array} tags
	 * This parameter is used to attach the tags metadata to the item during
	 * the item submission. The format of the value is the array array with
	 * the string values. Tags will be also displayed in the "Tags" field in
	 * the Submit form UI for Moderators and Administrators. For non-admin
	 * users the tags value will be submitted along with the other item
	 * content when the "Post" button is pressed.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"tags": ["tag1", "tag2", "tag3"],
	 *			...
	 *		});
	 */
	"tags": [],

	/**
	 * @cfg {String} requestMethod
	 * This parameter is used to specify the request method. Possible values
	 * are "GET" and "POST". Setting parameter to "POST" has some restrictions.
	 * We can't handle server response, UI won't show any waiting for the
	 * server responses actions.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"requestMethod": "POST",
	 *			...
	 *		});
	 */
	"requestMethod": "GET",

	/**
	 * @cfg {String} itemURIPattern
	 * Allows to define item id pattern. The value of this parameter should be
	 * a valid URI with "{id}" placeholder which will indicate the place where
	 * unique id should be inserted. If this parameter is ommited in
	 * configuration or the URI is invalid it'll be ignored.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"itemURIPattern": "http://your-domain.com/path/{id}",
	 *			...
	 *		});
	 */
	"itemURIPattern": undefined,

	/**
	 * @cfg {Number} postingTimeout
	 * Is used to specify the number of seconds after which the Submit Form will show
	 * the timeout error dialog if the server does not return anything. If the parameter
	 * value is 0 then the mentioned dialog will never be shown.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"postingTimeout": 15,
	 *			...
	 *		});
	 */
	"postingTimeout": 30,

	/**
	 * @cfg {Object} errorPopup
	 * Is used to define dimensions of error message popup. The value of this parameter
	 * is an object with the following fields:
	 *
	 * @cfg {Number} errorPopup.minHeight
	 * The minimum height of error message popup.
	 *
	 * @cfg {Number} errorPopup.maxHeight
	 * The maximum height of error message popup.
	 *
	 * @cfg {Number} errorPopup.width
	 * The width of error message popup.
	 *
	 *		new Echo.StreamServer.Controls.SubmitComposer({
	 *			...
	 *			"errorPopup": {
	 *				"minHeight": 70,
	 *				"maxHeight": 150,
	 *				"width": 390
	 *			}
	 *			...
	 *		});
	 */
	"errorPopup": {
		"minHeight": 70,
		"maxHeight": 150,
		"width": 390
	},

	/**
	 * @cfg {Object} auth
	 * Configuration options as described in Echo.IdentityServer.Controls.Auth documentation.
	 */
	"auth": {},

	"embedly": {
		"apiKey": "5945901611864679a8761b0fcaa56f87",
		"maxDescriptionCharacters": "200"
	},
	"compact": {
		"mode": "none", // none || small || smallest || inline
		"prompt": "Contribute here"
	},
	"displaySharingOnPost": true,
	"submitPermissions": "forceLogin",
	"confirmation": {
		"enabled": false,
		"message": "Thanks, your post has been submitted for review",
		"timeout": 5000,
		"hidingTimeout": 200
	},
	"targetQuery": undefined
};

composer.vars = {
	"collapsed": false,
	"toggleModeHandler": undefined,
	"postButtonState": "disabled",
	"formData": {
		"text": "",
		"media": []
	},
	"composers": [],
	"validators": []
};

composer.dependencies = [{
	"url": "{%=baseURL%}/controls/nested-card.js",
	"loaded": function() { return !!Echo.Conversations.NestedCard; }
}, {
	"url": "{%=baseURL%}/controls/media-container.js",
	"loaded": function() { return !!Echo.Conversations.MediaContainer; }
}, {
	"url": "{%=baseURL%}/third-party/jquery.placeholder.js",
	"loaded": function() { return !!$.placeholder; }
}, {
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

composer.labels = {
	/**
	 * @echo_label
	 */
	"markers": "Markers:",
	/**
	 * @echo_label
	 */
	"markersHint": "Marker1, marker2, marker3, ...",
	/**
	 * @echo_label
	 * Label for the button allowing to submit form
	 */
	"post": "Post",
	/**
	 * @echo_label
	 */
	"postAndShare": "Post and Share",
	/**
	 * @echo_label
	 */
	"posting": "Posting...",
	/**
	 * @echo_label
	 */
	"postingFailed": "There was a server error while trying to submit your item. Please try again in a few minutes. <b>Error: \"{error}\"</b>.",
	/**
	 * @echo_label
	 */
	"postingTimeout": "There was a network issue while trying to submit your item. Please try again in a few minutes.",
	/**
	 * @echo_label
	 */
	"tagsHint": "Tag1, tag2, tag3, ...",
	/**
	 * @echo_label
	 */
	"tags": "Tags:",
	/**
	 * @echo_label
	 */
	"yourName": "Your Name",
	/**
	 * @echo_label
	 */
	"required": " (required)"
};

composer.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() {
			if (this.get("_deferredActivity")) {
				this.get("_deferredActivity")();
				this.remove("_deferredActivity");
				// clearing up saved text...
				var targetURL = this.config.get("targetURL");
				Echo.Utils.set(Echo.Variables, targetURL, "");
			}
		}
	},
	"Echo.StreamServer.Controls.SubmitComposer.onAutoSharingToggle": {
		"context": "global",
		"handler": function() {
			this.view.render({"name": "postButton"});
		}
	}
};

/**
 * @echo_template
 */
composer.templates.main =
	'<div class="{class:container}">' +
		'<div class="alert alert-success echo-primaryFont {class:confirmation}">' +
			'{config:confirmation.message}' +
		'</div>' +
		'<div class="{class:header}">' +
			'<div class="{class:auth}"></div>' +
			'<div class="{class:nameContainer} {class:border}">' +
				'<input type="text" class="echo-primaryFont echo-primaryColor {class:name}" placeholder="{label:yourName}" required>' +
			'</div>' +
		'</div>' +
		'<div class="{class:tabs}"></div>' +
		'<div class="{class:compactFieldWrapper} {class:border}">' +
			'<input type="text" class="echo-primaryFont {class:compactField}" placeholder="{config:compact.prompt}">' +
		'</div>' +
		'<div class="{class:formWrapper}">' +
			'<div class="{class:composers}"></div>' +
			'<div class="{class:media}"></div>' +
			'<div class="{class:metadata}">' +
				'<div class="echo-primaryFont echo-primaryColor {class:markersContainer} {class:metadataContainer}">' +
					'<div class="{class:metadataLabel}">{label:markers}</div>' +
					'<div class="{class:metadataWrapper}">' +
						'<div class="{class:metadataSubwrapper} {class:border}">' +
							'<input type="text" class="echo-primaryFont {class:markers}">' +
						'</div>' +
					'</div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<div class="echo-primaryFont echo-primaryColor {class:tagsContainer} {class:metadataContainer}">' +
					'<div class="{class:metadataLabel}">{label:tags}</div>' +
					'<div class="{class:metadataWrapper}">' +
						'<div class="{class:metadataSubwrapper} {class:border}">' +
							'<input type="text" class="echo-primaryFont {class:tags} {class:border}">' +
						'</div>' +
					'</div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
			'</div>' +
			'<div class="{class:controls}">' +
				'<div class="{class:postButtonWrapper}">' +
					'<div class="btn btn-primary {class:postButton}"></div>' +
					'<div class="btn btn-primary dropdown-toggle {class:postButtonSwitcher}" data-toggle="dropdown">' +
						'<span class="caret"></span>' +
					'</div>' +
					'<ul class="dropdown-menu pull-right">' +
						'<li><a href="#" class="{class:switchToPost}">{label:post}</a></li>' +
						'<li><a href="#" class="{class:switchToPostAndShare}">{label:postAndShare}</a></li>' +
					'</ul>' +
				'</div>' +
				'<div class="{class:attachers}">' +
					'<img class="{class:attachPic}" src="{%= baseURL %}/images/attach.png">' +
				'</div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

/**
 * @echo_template
 */
composer.templates.post =
	'<div class="echo-item-text">{data:text}</div>' +
	'<div class="echo-item-files" data-composer="{data:composer}">{data:media}</div>';

/**
 * @echo_renderer
 */
composer.renderers.container = function(element) {
	var self = this;
	var classes = $.map(["normal", "small", "smallest", "inline"], function(_class) {
		return self.cssPrefix + _class;
	});
	element.removeClass(classes.join(" "));
	var _class = !this.collapsed || this.config.get("compact.mode") === "none"
		? "normal"
		: this.config.get("compact.mode");
	element.addClass(this.cssPrefix + _class);
	_class = this.substitute({"template": "{class:logged} {class:anonymous} {class:forcedLogin}"});
	element
		.removeClass(_class)
		.addClass(this.cssPrefix + this._userStatus());
	if (this.collapsed) {
		if (!this.toggleModeHandler) {
			this.toggleModeHandler = function(event) {
				if (self.collapsed) return;
				var target = self.config.get("target");
				var isInTarget = target && target.find(event.target).length;
				if (isInTarget) return;
				self._collapse();
			};
			$(document).on("mousedown", this.toggleModeHandler);
		}
	}
	return element;
};

/**
 * @echo_renderer
 */
composer.renderers.tabs = function(element) {
	// TODO: support URL in icons
	var self = this;
	element.empty();
	if (!this.composers.length) {
		this.log({"message": "No composer plugins are found"});
		return element;
	}
	this.tabs = new Echo.GUI.Tabs({
		"target": element,
		"classPrefix": this.cssPrefix + "tabs-",
		"selected": this.currentComposer && this.currentComposer.index,
		"entries": $.map(this.composers, function(tab) {
			return {
				"id": tab.id,
				"extraClass": "echo-primaryFont",
				"panel": tab.composer(),
				"label": self.substitute({
					"template": '<span class="{class:icon} {data:icon}"></span>' +
						'<span class="{class:label}">{data:label}</span>',
					"data": tab
				})
			};
		}),
		"panels": this.view.get("composers").empty(),
		"shown": function(tab, panel, id, index) {
			self.currentComposer = self.composers[index];
			// timeout allows form fields to be added to target element DOM
			setTimeout(function() {
				self._initFormFields();
			}, 0);
			if (self.collapsed) return;
			self.currentComposer.fill($.extend(true, {}, self.formData));
		}
	});
};

/**
 * @echo_renderer
 */
composer.renderers.media = function(element) {
	var self = this;
	this.mediaContainer && this.mediaContainer.destroy();
	if (!this.formData.media.length) return element;

	this.mediaContainer = new Echo.Conversations.MediaContainer({
		"target": element.empty(),
		"data": this.formData.media,
		"card": {
			"displaySourceIcon": false,
			"displayAuthor": false,
			"onRemove": function(data) {
				self.removeMedia(self._getDefinedMediaIndex(data));
			}
		}
	});
	return element;
};

/**
 * @echo_renderer
 */
composer.renderers.tagsContainer = function(element) {
	return this.user.is("admin") ? element.show() : element.hide();
};

/**
 * @method
 * @echo_renderer
 * @param element
 */
composer.renderers.markersContainer = composer.renderers.tagsContainer;

/**
 * @echo_renderer
 */
composer.renderers.markers = function(element) {
	return this.view.render({
		"name": "_metaFields",
		"target": element,
		"extra": {"type": "markers"}
	});
};

/**
 * @echo_renderer
 */
composer.renderers.tags = function(element) {
	return this.view.render({
		"name": "_metaFields",
		"target": element,
		"extra": {"type": "tags"}
	});
};

/**
 * @echo_renderer
 */
composer.renderers.compactField = function(element) {
	var self = this;
	if (this.config.get("compact.mode") === "none") return element;
	return element.on("focus", function() {
		self._expand();
	});
};

/**
 * @echo_renderer
 */
composer.renderers.auth = function(element) {
	var config = $.extend(true, {
		"target": element.show(),
		"appkey": this.config.get("appkey"),
		"apiBaseURL": this.config.get("apiBaseURL"),
		"cdnBaseURL": this.config.get("cdnBaseURL")
	}, this.config.get("auth"));
	this.auth && this.auth.destroy();
	this.auth = new Echo.StreamServer.Controls.Auth(config);
	return element;
};

/**
 * @echo_renderer
 */
composer.renderers.nameContainer = function(element) {
	var status = this._userStatus();
	if (status === "logged" || status === "forcedLogin") {
		element.remove();
	}
	return element;
};

/**
 * @echo_renderer
 */
composer.renderers.postButton = function(element) {
	var self = this;
	var label = this.labels.get(this._isAutoSharingEnabled() ? "postAndShare" : "post");
	var states = {
		"normal": {
			"target": element,
			"icon": false,
			"disabled": false,
			"label": label
		},
		"disabled": {
			"target": element,
			"icon": false,
			"disabled": true,
			"label": label
		},
		"posting": {
			"target": element,
			"icon": this.config.get("cdnBaseURL.sdk-assets") + "/images/loading.gif",
			"disabled": true,
			"label": this.labels.get("posting")
		}
	};
	var postButton = new Echo.GUI.Button(states[this.postButtonState]);
	this.posting = this.posting || {};
	this.posting.subscriptions = this.posting.subscriptions || [];
	var subscribe = function(phase, state, callback) {
		var topic = composer.name + ".onPost" + phase;
		var subscriptions = self.posting.subscriptions;
		if (subscriptions[topic]) {
			self.events.unsubscribe({
				"topic": topic,
				"handlerId": subscriptions[topic]
			});
		}
		subscriptions[topic] = self.events.subscribe({
			"topic": topic,
			"handler": function(topic, params) {
				postButton.setState(state);
				if (callback) callback(params);
			}
		});
	};

	subscribe("Init", states.posting, function() {
		if (self.config.get("confirmation.enabled")) {
			self.view.get("confirmation").hide();
		}
	});
	subscribe("Complete", states.disabled, function(data) {
		if (self.config.get("confirmation.enabled")) {
			var confirmation = self.view.get("confirmation").show();
			setTimeout(function() {
				confirmation.slideUp(self.config.get("confirmation.hidingTimeout"));
			}, self.config.get("confirmation.timeout"));
		}
		if (self._isAutoSharingEnabled()) {
			self._share(data);
		}
		self.removeMedia();
		self.view.render({"name": "tabs"});
		self.view.render({"name": "tags"});
		self.view.render({"name": "markers"});
	});
	subscribe("Error", states.normal, function(params) {
		var request = params.request || {};
		if (request.state && request.state.critical) {
			self._showError(params);
		}
	});
	this.posting.action = this.posting.action || function() {
		if (self.postButtonState === "disabled") return;
		if (self._isPostValid()) {
			self.post();
		}
	};
	element.off("click", this.posting.action).on("click", this.posting.action);
	return element;
};

/**
 * @echo_renderer
 */
composer.renderers.postButtonWrapper = function(element) {
	var action = this.config.get("displaySharingOnPost")
		? "addClass"
		: "removeClass";
	return element[action]("btn-group");
};

/**
 * @echo_renderer
 */
composer.renderers.postButtonSwitcher = function(element) {
	if (!this.config.get("displaySharingOnPost")) {
		element.hide();
	}
	var action = this.postButtonState === "disabled"
		? "addClass"
		: "removeClass";
	return element[action]("disabled");
};

/**
 * @echo_renderer
 */
composer.renderers.switchToPost = function(element) {
	var self = this;
	return element.off("click").on("click", function(e) {
		self._switchAutoSharing("off");
		e.preventDefault();
	});
};

/**
 * @echo_renderer
 */
composer.renderers.switchToPostAndShare = function(element) {
	var self = this;
	return element.off("click").on("click", function(e) {
		self._switchAutoSharing("on");
		e.preventDefault();
	});
};


composer.renderers._metaFields = function(element, extra) {
	var type = extra.type;
	var data = this.get("data.object." + type, this.config.get(type));
	var value = $.trim(Echo.Utils.stripTags(data.join(", ")));
	return this.view.get(type).iHint({
		"text": this.labels.get(type + "Hint"),
		"className": "echo-secondaryColor"
	}).val(value).blur();
};

/**
 * Method used for posting user provided content to the
 *  <a href="http://echoplatform.com/streamserver/docs/rest-api/items-api/submit/" target="_blank">Echo Submit</a>
 * endpoint through <a href="http://echoplatform.com/streamserver/docs/features/submission-proxy/" target="_blank">Echo Submission Proxy</a>.
 */
composer.methods.post = function() {
	var self = this, mediaContent = [];
	var publish = function(phase, data, responseBody, requestState) {
		var args = {
			"topic": "onPost" + phase,
			"data": {"postData": data}
		};
		if (requestState || responseBody) {
			args.data.request = {
				"state": requestState,
				"response": responseBody
			};
		}
		self.events.publish(args);
	};
	var template = this.currentComposer.mediaTemplate && this.currentComposer.mediaTemplate();
	if (template) {
		mediaContent = $.map(this.formData.media, function(media) {
			return self.substitute({
				"template": template,
				"data": $.extend(true, {}, media, {
					"oembed": self._htmlEncode(media)
				})
			});
		});
	}
	var text = self.substitute({
		"template": composer.templates.post,
		"data": {
			"text": self.currentComposer.text(),
			"media": mediaContent.join(""),
			"composer": self.currentComposer.id
		}
	});
	var objectType = this.currentComposer.objectType || this._getASURL("comment");
	var content = [].concat(
		self._getActivity("post", objectType, text),
		self._getActivity("tag", this._getASURL("marker"), self.view.get("markers").val()),
		self._getActivity("tag", this._getASURL("tag"), self.view.get("tags").val())
	);
	var entry = {
		"content": content,
		"appkey": this.config.get("appkey"),
		"sessionID": this.user.get("sessionID", "")
	};
	if (this.config.get("targetQuery")) {
		entry["target-query"] = this.config.get("targetQuery");
	}
	var callbacks = {
		"onData": function(response, state) {
			/**
			 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onPostComplete
			 * Triggered when the submit operation is finished.
			 */
			publish("Complete", entry, response, state);

			/**
			 * @echo_event Echo.Control.onDataInvalidate
			 * Triggered if dataset is changed.
			 */
			// notify all widgets on the page about a new item posted
			Echo.Events.publish({
				"topic": "Echo.Control.onDataInvalidate",
				"context": "global",
				"data": {}
			});
		},
		"onError": function(response, state) {
			/**
			 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onPostError
			 * Triggered if submit operation failed.
			 */
			publish("Error", entry, response, state);
		}
	};
	/**
	 * @echo_event Echo.StreamServer.Controls.SubmitComposer.onPostInit
	 * Triggered if submit operation was started.
	 */
	publish("Init", entry);
	Echo.StreamServer.API.request({
		"endpoint": "submit",
		"method": this.config.get("requestMethod"),
		"itemURIPattern": this.config.get("itemURIPattern"),
		"submissionProxyURL": this.config.get("submissionProxyURL"),
		"timeout": this.config.get("postingTimeout"),
		"secure": this.config.get("useSecureAPI"),
		"data": entry,
		"onData": callbacks.onData,
		"onError": callbacks.onError
	}).send();
};

/**
 * Method highlighting the input data fields
 */
// TODO: better name
composer.methods.highlightField = function(element, message) {
	if (!element) return;
	var css = this.cssPrefix + "error";
	element.parent().addClass(css);
	element.tooltip({
		"title": message,
		"placement": "right",
		"trigger": "hover"
	});
	element.focus(function() {
		$(this).tooltip("destroy");
		$(this).parent().removeClass(css);
	});
};

composer.methods.attachMedia = function(params) {
	var self = this;
	params = $.extend({
		"urls": [],
		"removeOld": false,
		"render": true
	}, params);
	var urls = params.urls.length && params.urls || [params.url || ""];
	urls = $.map(urls, function(url) {
		return $.trim(url);
	});
	this.resolver.resolve(urls, function(data) {
		if (params.removeOld) {
			self.removeMedia();
		}
		data = $.grep(data, function(oembed) {
			return !$.isEmptyObject(oembed) && !~self._getDefinedMediaIndex(oembed);
		});
		if (!data.length) return;
		$.each(data, function(i, oembed) {
			self.formData.media.push(oembed);
		});
		self.view.render({"name": "media"});
	});
};

composer.methods.removeMedia = function(index) {
	if (typeof index === "undefined") {
		this.formData.media = [];
	} else if (!~index) {
		return;
	} else {
		this.formData.media.splice(index, 1);
	}
	this.view.render({"name": "media"});
};

/**
 * Allows to register custom post composer
 */
composer.methods.registerComposer = function(config) {
	if (!config || !config.id) {
		this.log({"message": "Invalid composer configuration"});
		return;
	}
	this.composers.push(config);
};

/**
 * This method adds a custom validator to check the posting possibility.
 */
composer.methods.addPostValidator = function(validator, priority) {
	this.validators[priority === "low" ? "push" : "unshift"](validator);
};

/**
 * Method implements the refresh logic for the Submit Composer control.
 */
/*composer.methods.refresh = function() {
	var self = this;
	this.config.set("data.object.content", this.view.get("text").val());
	$.map(["tags", "markers"], function(field) {
		var elements = self.view.get(field).val().split(", ");
		self.config.set("data.object." + field, elements || []);
	});
	var component = Echo.Utils.getComponent("Echo.StreamServer.Controls.SubmitComposer");
	component.parent.refresh.call(this);
};*/

composer.methods._expand = function() {
	this.collapsed = false;
	this.view.render({"name": "container"});
};

composer.methods._collapse = function() {
	this.collapsed = true;
	this.view.render({"name": "container"});
};

composer.methods._extractInfoFromExternalData = function() {
	var self = this;
	this.formData = {
		"text": "",
		"media": []
	};
	var data = this.config.get("data");
	if (!data || $.isEmptyObject(data)) return;

	Echo.Utils.safelyExecute(function() {
		var content = $("<div>").append(self.config.get("data.object.content"));
		//self.set("content", self.config.get("data.object.content"));
		self.formData.text = $(".echo-item-text", content).html();
		if (/*self.get("content") !== item.get("data.object.content") || */!self.formData.media.length) {
			self.formData.media = $("div[oembed], div[data-oembed]", content).map(function() {
				return $.parseJSON($(this).attr("oembed") || $(this).attr("data-oembed"));
			}).get();
		}
		var composer = $(".echo-item-files", content).data("composer");
		var types = self.config.get("data.object.objectTypes");
		$.each(self.composers, function(i, data) {
			if (data.id === composer) {
				self.currentComposer = data;
				return false;
			}
			var matches = $.grep(types, function(type) {
				return data.objectType === type;
			});
			if (matches.length) {
				self.currentComposer = data;
				return false;
			}
		});
	});
};

composer.methods._htmlEncode = function(json) {
	return JSON.stringify(json)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
};

composer.methods._getDefinedMediaIndex = function(oembed) {
	var found = false, index = -1;
	var fields = ["original_url", "url", "title", "author_name"];
	var fieldsByType = {
		"link": fields.slice(),
		"photo": fields.slice(),
		"video": fields.slice().concat("html")
	};
	$.each(this.formData.media, function(i, media) {
		if (media.type !== oembed.type) return;
		$.each(fieldsByType[oembed.type], function(j, field) {
			found = true;
			if (typeof media[field] !== "undefined" &&
				media[field] !== oembed[field]
			) {
				found = false;
				return false;
			}
		});
		if (found) {
			index = i;
			return false;
		}
	});
	return index;
};

composer.methods._initFormFields = function() {
	var self = this, nonEmpty = [];
	var timer;
	this.postButtonState = "disabled";
	var fields = this.config.get("target")
		.find("input[type=text][required], textarea[required]")
		.on("keyup paste", function() {
			clearTimeout(timer);
			var el = this;
			timer = setTimeout(function() {
				init(el);
			}, 100);
		});
	var init = function(el) {
		var idx = nonEmpty.indexOf(el);
		if ($.trim($(el).val())) {
			if (idx === -1) nonEmpty.push(el);
		} else {
			if (idx !== -1) nonEmpty.splice(idx, 1);
		}
		// TODO: only fields from the current composer plugin must be counted here
		self._setPostButtonState(nonEmpty.length === fields.length ? "normal" : "disabled");
	};
	this.config.get("target")
		.find("input[type=text], textarea")
		.each(function() {
			var el = $(this);
			if (el.prop("echo-processed")) return;
			el.prop("echo-processed", true);
			var hint = el.attr("placeholder");
			if (hint) {
				el.placeholder();
				if (el.attr("required")) {
					el.attr("placeholder", hint + self.labels.get("required"));
				}
			}
		});
	fields.each(function(i, el) {
		init(el);
	});
};

composer.methods._setPostButtonState = function(state) {
	if (state === this.postButtonState) return;
	this.postButtonState = state;
	this.view.render({"name": "postButton"});
	this.view.render({"name": "postButtonSwitcher"});
};

composer.methods._switchAutoSharing = function(state) {
	var enabled = this._isAutoSharingEnabled();
	if (enabled ^ (state !== "on")) return;
	Echo.Cookie.set("sharingOnPost", state === "on");
	Echo.Events.publish({
		"topic": composer.name + ".onAutoSharingToggle",
		"context": "global"
	});
};

composer.methods._isAutoSharingEnabled = function(state) {
	return this.config.get("displaySharingOnPost") &&
		Echo.Cookie.get("sharingOnPost") === "true";
};

composer.methods._share = function(data) {
	// XXX: garantee that first element is "post" and ignore "update"
	var item = data.postData.content[0];
	var payload = {
		"origin": "item",
		"actor": {
			"id": this.user.get("identityUrl"),
			"name": item.actor.name,
			"avatar": item.actor.avatar
		},
		"object": {
			"id": data.request.response.objectID,
			"content": item.object.content
		},
		"source": item.source,
		"target": item.targets[0].id
	};
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": "content/share/request",
			"payload": payload
		}
	}]);

};

composer.methods._requestLoginPrompt = function() {
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": "identity/login/request",
			"payload": this.user.data || {}
		}
	}]);
};

composer.methods._userStatus = function() {
	return this.user.is("logged")
		? "logged"
		: this.config.get("submitPermissions") === "forceLogin"
			? "forcedLogin"
			: "anonymous";
};

composer.methods._getActivity = function(verb, type, data) {
	return !data ? [] : {
		"actor": {
			"objectTypes": [this._getASURL("person")],
			"name": this.user.get("name", this.user.is("logged")
					? ""
					: this.view.get("name").val()),
			"avatar": this.user.get("avatar", "")
		},
		"object": {
			"objectTypes": [type],
			"content": data
		},
		"source": this.config.get("source"),
		"verbs": [this._getASURL(verb)],
		"targets": [{
			"id": this.config.get("targetURL")
		}]
	};
};

composer.methods._getASURL = function(postfix) {
	return "http://activitystrea.ms/schema/1.0/" + postfix;
};

composer.methods._showError = function(data) {
	data = data || {};
	var response = data.request && data.request.response || {};
	var message = $.inArray(response.errorCode, ["network_timeout", "connection_failure"]) >= 0
		? this.labels.get("postingTimeout")
		: this.labels.get("postingFailed", {"error": response.errorMessage || response.errorCode});
	var popup = this._assembleErrorPopup(message);

	new Echo.GUI.Modal({
		"data": {
			"body": popup.content
		},
		"width": popup.width,
		"footer": false,
		"fade": true,
		"show": true
	});
};

composer.methods._assembleErrorPopup = function(message) {
	var dimensions = this.config.get("errorPopup");
	var template = this.substitute({
		"template": '<div class="{data:css}">{data:message}</div>',
		"data": {
			"message": message,
			"css": this.cssPrefix + "error"
		}
	});
	var popup = {
		"content": $(template).css({
			"min-height": dimensions.minHeight,
			"max-height": dimensions.maxHeight
		}),
		"width": dimensions.width
	};
	return popup;
};

composer.methods._isPostValid = function() {
	var valid = true;
	$.each(this.validators, function(i, handler) {
		valid = handler();
		return valid;
	});
	return valid;
};

composer.methods._prepareEventParams = function(params) {
	return $.extend(params, {
		"data": this.get("data"),
		"target": this.config.get("target").get(0),
		"targetURL": this.config.get("targetURL")
	});
};

composer.css =
	'.{class:header} { margin-bottom: 10px; }' +
	'.{class:anonymous} .{class:header} { margin-bottom: 7px; }' +
	'.{class:auth} { display: none; }' +
	'.{class:nameContainer} { margin: 11px 0px 0px 0px; padding: 3px 2px 3px 5px; }' +
	'.{class:nameContainer} input.{class:name}[type="text"] { font-size: 14px; border: none; width: 100%; margin-bottom: 0px; padding: 0px; outline: 0; box-shadow: none; background-color: transparent; }' +
	'.{class:nameContainer} input.{class:name}[type="text"]:focus { outline: 0; box-shadow: none; }' +
	'.{class:nameContainer} input.{class:name}[type="text"].echo-secondaryColor,' +
		'.{class:container} .{class:metadataSubwrapper} input.echo-secondaryColor[type="text"]' +
		' { color: #C6C6C6; }' +
	'.{class:compactFieldWrapper} { padding: 7px 11px; }' +
	'.{class:compactFieldWrapper} input.{class:compactField}[type="text"] { border: none; width: 100%; margin-bottom: 0px; padding: 0px; outline: 0; box-shadow: none; background-color: transparent; }' +
	'.{class:metadataContainer} { margin-top: 6px; }' +
	'.{class:metadataLabel} { float: left; width: 50px; margin-right: -50px; text-align: right; line-height: 22px; }' +
	'.{class:metadataWrapper} { float: left; width: 100%; }' +
	'.{class:metadataSubwrapper} { margin-left: 55px; padding: 2px 2px 2px 3px; background-color: #fff; }' +
	'.{class:container} { padding: 20px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; }' +
	'.{class:container} .{class:metadataSubwrapper} input[type="text"] { width: 100%; border: 0; padding: 0px; outline: 0; box-shadow: none; margin-bottom: 0px; }' +
	'.{class:container} .{class:metadataSubwrapper} input[type="text"]:focus { outline: 0; box-shadow: none; }' +
	'.{class:composers} { margin: 0px; border: 1px solid #dedede; border-width: 0px 1px; }' +
	'.{class:controls} { margin: 0px; padding: 5px; border: 1px solid #d8d8d8; background-color: transparent; }' +
	'.{class:confirmation} { margin-bottom: 10px; display: none; }' +
	'.{class:attachers} { display: none; margin: 5px; float: left; }' +
	'.{class:postButtonWrapper} { float: right; font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; }' +
	'.{class:postButtonWrapper} .dropdown-menu { min-width: 100px; }' +
	'.{class:postButtonWrapper} .{class:postButton}.btn { padding: 3px 12px 5px 12px; }' +
	'.{class:tagsContainer} { display: none !important; }' +
	'.{class:markersContainer} { display: none !important; }' +
	'.{class:border} { border: 1px solid #d8d8d8; }' +
	'.{class:mandatory} { border: 1px solid red; }' +
	'.{class:queriesViewOption} { padding-right: 5px; }' +

	'.echo-sdk-ui .{class:composers} input[type=text], .echo-sdk-ui .{class:composers} textarea { width: 100%; border: 0px; resize: none; outline: none; box-shadow: none; padding: 0px; margin: 0px; background-color: transparent; }' +
	'.echo-sdk-ui .{class:container} input[type=text]:focus, .echo-sdk-ui .{class:composers} textarea:focus { outline: none; box-shadow: none; }' +
	'.echo-sdk-ui .{class:container} input[type=text]:focus:invalid,' +
		'.echo-sdk-ui .{class:container} input[type=text]:focus:invalid:focus,' +
		'.echo-sdk-ui .{class:container} textarea:focus:invalid,' +
		'.echo-sdk-ui .{class:container} textarea:focus:invalid:focus' +
		'{ color: #3c3c3c; border-color: transparent; box-shadow: none; }' +

	'.echo-submitcomposer-delimiter { height: 0px; border-top: 1px dashed #d8d8d8; }' +
	'.echo-submitcomposer-field-wrapper { padding: 7px 11px; border: 1px solid transparent; display: inline-block; width: 100%; box-sizing: border-box !important/* XXX: because of conversations*/; }' +

	'.{class:error} { border: 1px solid red; }' +
	'.{class:error} input, .{class:error} textarea { background: no-repeat center right url({config:cdnBaseURL.sdk-assets}/images/warning.gif); }' +

	'.{class:media} .echo-conversations-mediacontainer-multiple { border: 1px solid #DEDEDE; border-top-style: dashed; border-bottom: 0px; background-color: #F1F1F1; }' +

	// display modes
	'.{class:normal} .{class:compactFieldWrapper},' +
		'.{class:small} .{class:formWrapper},' +
		'.{class:smallest} .{class:formWrapper},' +
		'.{class:smallest} .{class:header} { display: none; }' +
	'.echo-sdk-ui .{class:inline} .nav-tabs,' +
		'.{class:inline} .{class:formWrapper},' +
		'.{class:inline}.{class:anonymous} .{class:header},' +
		'.{class:inline} .echo-streamserver-controls-auth-container { display: none; }' +
	'.{class:inline} .{class:compactFieldWrapper} { margin-left: 38px; }' +
	'.{class:inline}.{class:anonymous} .{class:compactFieldWrapper} { margin-left: 0px; }' +
	'.{class:inline}.{class:container}:not(.{class:anonymous}) { padding-left: 12px; }' +
	'.{class:inline} .{class:header} { float: left; margin: 7px 0px 0px 0px; }' +
	'.{class:inline} .echo-streamserver-controls-auth-avatar,' +
		'.{class:inline} .echo-streamserver-controls-auth-avatar > div { width: 24px; height: 24px; }' +
	'.echo-sdk-ui .{class:small} .nav-tabs,' +
		'.echo-sdk-ui .{class:smallest} .nav-tabs { border-bottom-width: 0px; }' +

	// tabs
	'.{class:icon} { vertical-align: middle; margin-right: 2px; }' +
	'.echo-sdk-ui .{class:tabs} .nav { margin-bottom: 0px; }' +
	'.echo-sdk-ui .{class:tabs} .nav > li > a { padding: 0px; margin-right: 10px; border: 0px; color: #3c3c3c; background-color: transparent; opacity: 0.5; }' +
	'.echo-sdk-ui .{class:tabs} .nav > li > a:hover, .echo-sdk-ui .{class:tabs} .nav > li > a:focus { background-color: transparent; border: 0px; }' +
	'.echo-sdk-ui .{class:tabs} .nav > li.active > a,' +
		'.echo-sdk-ui .{class:tabs} .nav > li.active > a:hover,' +
		'.echo-sdk-ui .{class:tabs} .nav > li.active > a:focus,' +
		'.echo-sdk-ui .{class:tabs} .nav > li.active > a:active { border: 0px; border-bottom: 4px solid #d8d8d8; color: #3c3c3c; background-color: transparent; opacity: 1; }' +
	'';

Echo.Control.create(composer);

})(Echo.jQuery);
