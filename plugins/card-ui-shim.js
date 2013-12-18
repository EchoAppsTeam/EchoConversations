(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.CardUIShim
 * Extends Stream control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream");

plugin.config = {
	"displayEmptyStream": true
};

plugin.init = function() {
	// Stream should trigger 'onActivitiesComplete' event to start items liveUpdate animation
	this.component._executeNextActivity = function() {
		var acts = this.activities;
		if (!acts.queue.length && this.config.get("state.layout") === "full") {
			acts.state = "paused";
		}

		if (!acts.queue.length) {
			this.events.publish({
				"topic": "onActivitiesComplete"
			});
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

	// disable 'fade' animation
	this.component._spotUpdates.animate.fade = function(item) {
		this.activities.animations--;
		this._executeNextActivity();
	};
};

plugin.component.renderers.header = function(element) {
	return element.hide();
};

plugin.component.renderers.container = function(element) {
	var items = $.grep(this.component.get("threads"), function(item) {
		return !item.deleted;
	});
	return (items.length || this.config.get("displayEmptyStream"))
		? element.show()
		: element.hide();
};

plugin.css =
	'.{plugin.cass} .{class:more} { border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; }' +
	'.{plugin.cass} .{class:messageText} { border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; }' +
	'.{plugin.class:caption} { line-height: 18px; }' +
	'.{plugin.class} .{class:header} { padding: 5px 0px 5px 0px; margin: 0px; font-size: 14px; }' +
	'.{plugin.class} .{class:body} .echo-control-message { margin: 0px 0px 10px; border: 1px solid #d2d2d2; box-shadow: 0px 1px 1px #d2d2d2; border-radius: 3px; color: #c6c6c6; padding: 30px 0px 30px 0px; text-align: left;}' +
	'.{plugin.class} .{class:body} .echo-control-message .echo-control-message-info { height: 35px; display: block; font-size: 14px; line-height: 16px; font-weight: normal; font-style: normal; background-image: url({%= baseURL %}/images/info.png); padding-left: 40px; width: 180px; margin: 0px auto; }' +
	'.{plugin.class} .echo-control-message-info { background: url({%= baseURL %}/images/info.png) no-repeat; }' +
	'.{plugin.class} .{class:item} { margin: 0px 0px 10px 0px; padding: 0px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; background: #ffffff; }' +
	'.{plugin.class} .{class:item-children} .{class:item} { margin: 0px; padding: 0px; box-shadow: 0 0 0; border: 0px; background: #f8f8f8; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.CardUIShim
 * Extends Item control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream.Item");

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onActivitiesComplete": function() {
		var self = this;
		var container = this.component.view.get("container");
		if (this.get("isLiveUpdate") && container) {
			var fade = function() {
				if ($.inviewport(container, {"threshold": 0})) {
					self.set("isLiveUpdate", false);
					if (self._transitionSupported()) {
						container.removeClass(self.cssPrefix + "liveUpdate");
					} else {
						setTimeout(function() {
							// IE 8-9 doesn't support transition, so we just remove the highlighting.
							// Maybe we should use jquery.animate (animating colors requires jQuery UI) ?
							container.removeClass(self.cssPrefix + "liveUpdate");
						}, self.config.get("fadeTimeout"));
					}
					$(document).off("scroll", fade).off("resize", fade);
					return true;

				} else {
					return false;
				}
			};
			if (!fade()) {
				$(document).on("scroll", fade).on("resize", fade);
			}
		}
	}
};

plugin.labels = {
	"topPostIndicatorTitle": "Top Post"
};

plugin.config = {
	"fadeTimeout": 10000, // 10 seconds
	"displayTopPostHighlight": true
};

plugin.init = function() {
	this.set("isLiveUpdate", this.component.config.get("live"));
	this.extendTemplate("replace", "header", plugin.templates.header);
	this.extendTemplate("insertBefore", "frame", plugin.templates.topPostMarker);
	this.extendTemplate("insertAfter", "authorName", plugin.templates.date);
	this.extendTemplate("insertAsLastChild", "expandChildren", plugin.templates.chevron);
	this.extendTemplate("remove", "date");
};

plugin.templates.date =
	'<div class="{plugin.class:date}"></div>';

plugin.templates.wrapper =
	'<div class="{plugin.class:wrapper}"></div>';

plugin.templates.chevron =
	'<span class="{plugin.class:chevron} icon-chevron-down"></span>';

plugin.templates.button =
	'<a class="{class:button} {class:button}-{data:name}">' +
		'<i class="{plugin.class:buttonIcon} {data:icon}"></i>' +
		'<span class="echo-primaryFont {class:buttonCaption}">{data:label}</span>' +
	'</a>';

plugin.templates.topPostMarker =
	'<i class="icon-bookmark {plugin.class:topPostMarker}" title="{plugin.label:topPostIndicatorTitle}"></i>';


plugin.renderers.topPostMarker = function(element) {
	var item = this.component;
	var itemMarkers = item.get("data.object.markers", []);
	var visible = !!this.config.get("displayTopPostHighlight") &&
			!item.get("depth") &&
			~$.inArray("Conversations.TopPost", itemMarkers);
	return visible
		? element.show()
		: element.hide();
};

plugin.renderers.date = function(element) {
	// TODO: use parentRenderer here
	this.age = this.component.getRelativeTime(this.component.timestamp);
	return element.html(this.age);
};

plugin.component.renderers.tags = function(element) {
	return element.hide();
};

plugin.component.renderers.markers = function(element) {
	return element.hide();
};

plugin.component.renderers.container = function(element) {
	if (this.get("isLiveUpdate")) {
		element.addClass(this.cssPrefix + "liveUpdate");
		var transition = "border-left " + this.config.get("fadeTimeout") + "ms linear";
		element.css({
			"transition": transition,
			"-o-transition": transition,
			"-ms-transition": transition,
			"-moz-transition": transition,
			"-webkit-transition": transition
		});
	}
	element = this.parentRenderer("container", arguments);
	return this.component.view.rendered()
		? element
		: element.wrap(this.substitute({
			"template": plugin.templates.wrapper
		}));
};

plugin.component.renderers._button = function(element, extra) {
	var template = extra.template || plugin.templates.button;

	var data = {
		"label": extra.label || "",
		"name": extra.name,
		"icon": extra.icon || "icon-comment"
	};
	var button = $(this.substitute({"template": template, "data": data}));
	if (!extra.clickable) return element.append(button);
	var clickables = $(".echo-clickable", button);
	if (extra.element) {
		button.find("span").empty().append(extra.element);
	}
	if (!clickables.length) {
		clickables = button;
		button.addClass("echo-clickable");
	}
	clickables[extra.once ? "one" : "on"]({
		"click": function(event) {
			event.stopPropagation();
			if (extra.callback) extra.callback();
		}
	});

	var _data = this.component.get("buttons." + extra.plugin + "." + extra.name);
	_data.element = button;
	_data.clickableElements = clickables;
	if (Echo.Utils.isMobileDevice()) {
		clickables.addClass("echo-linkColor");
	}
	return element.append(button);
};

var cache = {};
plugin.methods._transitionSupported = function() {
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

var itemDepthRules = [];
// 100 is a maximum level of children in query, but we can apply styles for ~20
for (var i = 0; i <= 20; i++) {
	itemDepthRules.push('.{plugin.class} .{class:depth}-' + i + ' { margin-left: 0px; padding-left: ' + (i ? 8 + (i - 1) * 39 : 16) + 'px; }');
}

plugin.css =
	'.{plugin.class:topPostMarker} { float: right; position: relative; top: -19px; right: 0px; }' +
	'.{plugin.class} .{plugin.class:wrapper} { background: #ffffff; border-bottom: 1px solid #e5e5e5; border-radius: 3px 3px 0px 0px; }' +
	'.{plugin.class} .{class:container} { border-left: 4px solid transparent; background: #ffffff; }' +
	'.{plugin.class} .{class:container}.{class:depth-0} { border-radius: 2px 3px 0px 0px; }' +
	'.{plugin.class} .{class:container}.{plugin.class:liveUpdate} { border-left: 4px solid #f5ba47; }' +

	'.{plugin.class} .echo-trinaryBackgroundColor { background-color: #f8f8f8; }' +
	'.{plugin.class:date} { float: left; color: #d3d3d3; margin-left: 5px; line-height: 18px; }' +

	'.{plugin.class} .{class:blocker-backdrop} { background-color: transparent; }' +
	'.{plugin.class} .{class:avatar} { height: 28px; width: 28px; margin-left: 3px; }' +
	'.{plugin.class} .{class:avatar} img { height: 28px; width: 28px; border-radius: 50%;}' +

	'.{plugin.class} .{class:content} { background: #f8f8f8; border-radius: 3px; }' +
	'.{plugin.class} .{class:buttons} { margin-left: 0px; white-space: nowrap; }' +
	'.{plugin.class} .{class:metadata} { margin-bottom: 8px; }' +
	'.{plugin.class} .{class:body} { padding-top: 0px; margin-bottom: 8px; }' +
	'.{plugin.class} .{class:body} .{class:text} { color: #42474A; font-size: 15px; line-height: 21px; }' +
	'.{plugin.class} .{class:authorName} { color: #595959; font-weight: normal; font-size: 14px; line-height: 16px; }' +
	'.{plugin.class} .{class:children} .{class:avatar-wrapper} { margin-top: 5px; }' +
	'.{plugin.class} .{class:children} .{class:frame} { margin-left: 5px; }' +
	'.{plugin.class} .{class:children} .{class:data} { margin-top: 2px; padding-top: 0px; }' +
	'.{plugin.class} .{class:children} .{plugin.class:wrapper} { padding-top: 0px; background: none; border: none; }' +
	'.{plugin.class} .{class:container-child} { padding: 20px 0px 0px 16px; margin: 0px 15px 2px 0px; }' +
	'.{plugin.class} .{class:content} .{class:container-child-thread} { padding: 20px 0px 0px 8px; margin: 0px 15px 2px 0px; }' +

	'.{plugin.class} .{class:button} { margin-right: 10px; }' +
	'.{plugin.class} .{class:button-delim} { display: none; }' +
	'.echo-sdk-ui .{plugin.class:buttonIcon}[class*=" icon-"] { margin-right: 4px; margin-top: 0px; }' +
	'.{plugin.class} .{plugin.class:buttonIcon} { opacity: 0.3; }' +
	'.{plugin.class} .{class:buttonCaption} { vertical-align: middle; font-size: 12px; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}.echo-linkColor, .{class:buttons} a.{class:button}:hover { color: #262626; text-decoration: none; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}.echo-linkColor .{plugin.class:buttonIcon},' +
			'.{class:buttons} a.{class:button}:hover .{plugin.class:buttonIcon} { opacity: 0.8; }' +

	'.{plugin.class} .{class:depth-0} .{plugin.class:date} { line-height: 40px; }' +
	'.{plugin.class} .{plugin.class:chevron} { margin-top: 0px !important; }' +
	'.{plugin.class} .{class:expandChildrenLabel} { margin-right: 5px; }' +
	'.{plugin.class} .{class:expandChildren} .{class:expandChildrenLabel} { color: #D3D3D3; }' +
	'.{plugin.class} .{class:expandChildren}:hover .{class:expandChildrenLabel} { color: #262626; }' +
	'.{plugin.class} .{class:expandChildren} .{plugin.class:chevron} { opacity: 0.3; }' +
	'.{plugin.class} .{class:expandChildren}:hover .{plugin.class:chevron} { opacity: 0.8; }' +
	'.{plugin.class} .{class:expandChildren} .echo-message-icon { padding-left: 0px; background: none; }' +
	'.{plugin.class} .{class:expandChildren} .{class:message-loading} { background: none; }' +
	'.{plugin.class} .{class:depth-0} .{class:footer} { padding: 8px 0px 10px; }' +
	'.{plugin.class} .{class:depth-0} .{class:body} { padding-top: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} { height: 36px; width: 36px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} img { height: 36px; width: 36px; border-radius: 50%;}' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-weight: normal; font-size: 17px; line-height: 38px; margin-left: 45px;}' +
	'.{plugin.class} .{class:depth-0} .{class:subwrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:childrenMarker} { display: none; }' +

	'.{plugin.class} .{class:data} { padding: 7px 0px 0px 0px; }' +
	'.{plugin.class} .{class:content} .{class:depth-0} { padding: 15px 16px 0px 12px; }' +

	itemDepthRules.join("\n");

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.CardUIShim
 * Extends Submit control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Submit");

plugin.config = {
	"submitPermissions": "forceLogin",
	"displaySharingOnPost": true,
	"contentTypes": {
		"comments": {
			"visible": true,
			"prompt": "What's on your mind",
			"resolveURLs": true
		}
	}
};

plugin.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() {
			if (this.deferredActivity) {
				this.deferredActivity();
				delete this.deferredActivity;
				// clearing up saved text...
				var targetURL = this.component.config.get("targetURL");
				Echo.Utils.set(Echo.Variables, targetURL, "");
			}
		}
	},
	"Echo.StreamServer.Controls.Submit.onSharingOnPostChange": {
		"context": "global",
		"handler": function() {
			this.view.render({"name": "postButton"});
		}
	}
};

plugin.labels = {
	"post": "Post",
	"postAndShare": "Post and Share"
};

plugin.templates.attach = '<div class="{plugin.class:attach}"><img class="{plugin.class:attachPic}" src="{%= baseURL %}/images/attach.png" /></div>';

plugin.templates.auth = '<div class="{plugin.class:auth}"></div>';

plugin.templates.postButton =
	'<div class="btn-group">' +
		'<button class="btn btn-primary {plugin.class:postButton}"></button>' +
		'<button class="btn btn-primary dropdown-toggle {plugin.class:switchSharing}" data-toggle="dropdown"><span class="caret"></span></button>' +
		'<ul class="dropdown-menu pull-right">' +
			'<li><a href="#" class="{plugin.class:switchToPost}">{plugin.label:post}</a></li>' +
			'<li><a href="#" class="{plugin.class:switchToPostAndShare}">{plugin.label:postAndShare}</a></li>' +
		'</ul>' +
	'</div>';


plugin.init = function() {
	var self = this, submit = this.component;

	this.extendTemplate("remove", "postButton");
	this.extendTemplate("insertAsFirstChild", "postContainer", plugin.templates.postButton);

	this.extendTemplate("insertBefore", "header", plugin.templates.auth);

	// drop all validators
	submit.validators = [];

	submit.addPostValidator(function() {
		var areFieldsValid = true;
		var isGuestAllowed = self.config.get("submitPermissions") === "allowGuest";

		$.each(isGuestAllowed ? ["name", "text"] : ["text"], function (i, field) {
			areFieldsValid = !submit.highlightMandatory(submit.view.get(field));
			return areFieldsValid;
		});

		// exit in case some required fields are empty
		if (!areFieldsValid) return false;

		if (!isGuestAllowed && !submit.user.is("logged")) {
			self.deferredActivity = function() {
				self.component.post();
			};
			self._requestLoginPrompt();
			return false;
		}
		return true;
	});

	submit.config.set("actionString", this.config.get("contentTypes.comments.prompt"));

// 	Note: let's keep the "attach" icon hidden for now,
//		as there is no functionality associated with it..
//
//	this.extendTemplate("insertAsFirstChild", "controls", plugin.templates.attach);
};

plugin.methods._requestLoginPrompt = function() {
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": "identity/login/request",
			"payload": this.component.user.data || {}
		}
	}]);
};

plugin.renderers.postButton = function(element) {
	var self = this;
	var submit = this.component;

	var states = {
		"normal": {
			"target": element,
			"icon": false,
			"disabled": false,
			"label": this.labels.get(this._sharingOnPost() ? "postAndShare" : "post")
		},
		"posting": {
			"target": element,
			"icon": submit.config.get("cdnBaseURL.sdk-assets") + "/images/loading.gif",
			"disabled": true,
			"label": submit.labels.get("posting")
		}
	};

	var postButton = new Echo.GUI.Button(states.normal);
	submit.posting = submit.posting || {};
	submit.posting.subscriptions = submit.posting.subscriptions || [];
	var subscribe = function(phase, state, callback) {
		var topic = "Echo.StreamServer.Controls.Submit.onPost" + phase;
		var subscriptions = submit.posting.subscriptions;
		if (subscriptions[topic]) {
			submit.events.unsubscribe({
				"topic": topic,
				"handlerId": subscriptions[topic]
			});
		}
		subscriptions[topic] = submit.events.subscribe({
			"topic": topic,
			"handler": function(topic, params) {
				postButton.setState(state);
				if (callback) callback(params);
			}
		});
	};

	subscribe("Init", states.posting);
	subscribe("Complete", states.normal, function(data) {
		if (self._sharingOnPost()) {
			self._share(data);
		}
		submit.view.get("text").val("").trigger("blur");
		submit.view.render({"name": "tags"});
		submit.view.render({"name": "markers"});
	});
	subscribe("Error", states.normal, function(params) {
		var request = params.request || {};
		if (request.state && request.state.critical) {
			submit._showError(params);
		}
	});
	submit.posting.action = submit.posting.action || function() {
		if (submit._isPostValid()) {
			submit.post();
		}
	};
	element.off("click", submit.posting.action).on("click", submit.posting.action);

	return element;
};

plugin.renderers.switchSharing = function(element) {
	if (!this.config.get("displaySharingOnPost")) {
		// it should looks like single button, not buttons group
		element.parent().removeClass("btn-group");
		element.hide();
	}
	return element;
};

plugin.renderers.switchToPost = function(element) {
	var self = this;
	return element.on("click", function(e) {
		self._sharingOnPost(false);
		e.preventDefault();
	});
};

plugin.renderers.switchToPostAndShare = function(element) {
	var self = this;
	return element.on("click", function(e) {
		self._sharingOnPost(true);
		e.preventDefault();
	});
};

plugin.component.renderers.header = function(element) {
	var plugin = this, status = plugin._userStatus();
	if (status === "logged" || status === "forcedLogin") {
		return element.empty();
	}
	return plugin.parentRenderer("header", arguments);
};

plugin.component.renderers.container = function(element) {
	var plugin = this;
	plugin.parentRenderer("container", arguments);
	var _class = function(postfix) {
		return plugin.cssPrefix + postfix;
	};
	return element
		.removeClass($.map(["logged", "anonymous", "forcedLogin"], _class).join(" "))
		.addClass(_class(plugin._userStatus()));
};

plugin.renderers.auth = function(element) {
	var config = this.config.assemble($.extend(true, {"target": element}, this.config.get("auth")));
	new Echo.StreamServer.Controls.CardUIAuth(config);
	return element;
};

plugin.methods._share = function(data) {
	var item = data.postData.content[0];
	var payload = {
		"origin": "item",
		"actor": {
			"id": this.component.user.get("identityUrl"),
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

plugin.methods._sharingOnPost = function(enabled) {
	if (typeof enabled !== "undefined") {
		Echo.Cookie.set("sharingOnPost", !!enabled);
		this.component.events.publish({
			"topic": "onSharingOnPostChange",
			"contenxt": "global"
		});
	}
	return this.config.get("displaySharingOnPost")
		&& Echo.Cookie.get("sharingOnPost") === "true";
};

plugin.methods._userStatus = function() {
	return this.component.user.is("logged")
		? "logged"
		: this.config.get("submitPermissions") === "forceLogin"
			? "forcedLogin"
			: "anonymous";
};

plugin.css =
	'.{plugin.class} .{class:urlContainer} { display: none; }' +
	'.{plugin.class} .{class:avatar} { display: none; }' +
	'.{plugin.class} .{class:fieldsWrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:plugin-JanrainAuth-forcedLogin} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:fieldsWrapper} input { font-weight: normal; }' +
	'.{plugin.class} .{class:nameContainer} { padding: 3px 2px 3px 5px; }' +
	'.{plugin.class} .{class:tagsContainer} { display: none !important; }' +
	'.{plugin.class} .{class:markersContainer} { display: none !important; }' +
	'.{plugin.class} .{class:content} textarea.{class:textArea} { height: 75px; }' +
	'.{plugin.class} .{class:controls} { margin: 0px; padding: 5px; border: 1px solid #d8d8d8; border-top: 0px; background: #ffffff;}' +
	'.{plugin.class} .{class:container} { padding: 20px 20px 20px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; }' +
	'.{plugin.class} .{class:header} { margin-top: 10px; }' +
	'.{plugin.class} .{class:postContainer} .dropdown-menu { min-width: 100px; }' +
	'.{plugin.class} .btn.{plugin.class:postButton} { padding: 3px 12px 5px 12px; }' +
	'.{plugin.class:attach} { margin: 5px; float: left; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
