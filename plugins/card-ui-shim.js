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

plugin.component.renderers.state = function(element) {
	var activities = this.component.activities;
	var activitiesCount = Echo.Utils.foldl(0, activities.queue, function(entry, acc) {
		if (entry.affectCounter) return ++acc;
	});
	var currentState = this.component.getState() + activitiesCount;
	if (currentState !== activities.lastState) {
		this.component.events.publish({
			"topic": "onActivitiesCountChange",
			"data": {
				"count": activitiesCount,
				"context": this.component.config.get("context")
			}
		});
	}
	return this.parentRenderer("state", arguments);
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
	"Echo.StreamServer.Controls.Stream.Item.onRender": function() {
		this._pageLayoutChange();
	},
	"Echo.Apps.Conversations.onAppResize": function() {
		this._pageLayoutChange();
	},
	"Echo.StreamServer.Controls.FacePile.onRender" : function() {
		this._pageLayoutChange();
	},
	"Echo.StreamServer.Controls.Stream.onActivitiesComplete": function() {
		this._pageLayoutChange();
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
	"topPostIndicatorTitle": "Top Post",
	"actions": "Actions",
	"seeMore": "See more"
};

plugin.config = {
	"topPost": {
		"visible": true,
		"marker": "Conversations.TopPost"
	},
	"fadeTimeout": 10000, // 10 seconds
	"collapsedContentHeight": 110 //px
};

plugin.init = function() {

	this.extendTemplate("insertAsFirstChild", "container", plugin.templates.indicator);

	this.set("isLiveUpdate", this.component.config.get("live"));
	this.extendTemplate("replace", "sourceIcon", plugin.templates.sourceIcon);
	this.extendTemplate("insertBefore", "frame", plugin.templates.topPostMarker);
	this.extendTemplate("remove", "date");
	this.extendTemplate("remove", "authorName");
	this.extendTemplate("insertAsFirstChild", "frame", plugin.templates.header);
	this.extendTemplate("insertAsLastChild", "expandChildren", plugin.templates.chevron);
	this.extendTemplate("insertAfter", "body", plugin.templates.seeMore);
	this.set("buttonsLayout", "inline");

	this.component.block = function(label) {
		if (this.blocked) return;
		this.blocked = true;
		// Due to container have padding and we can't calculate width, we should take its parent (wrapper) instead.
		var content = this.view.get("container").parent();
		var width = content.width();
		// we should take into account that the container has a 10px 0px padding value
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
};

plugin.templates.header =
	'<div class="{plugin.class:header-box}">' +
		'<div class="{plugin.class:header-centered}">' +
			'<div class="{class:authorName}"></div>' +
			'<div class="{class:date}"></div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

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

plugin.templates.compactButtons =
	'<a title="{data:label}" class="{class:button} {class:compactButton} {class:button}-{data:name}">' +
		'<i class="{plugin.class:buttonIcon} {data:icon}"></i>' +
		'<span class="echo-primaryFont {class:buttonCaption}"></span>' +
	'</a>';

plugin.templates.dropdownButtons =
	'<div class="dropdown">' +
		'<a class="dropdown-toggle {class:button}" data-toggle="dropdown" href="#">' +
			'<i class="{plugin.class:buttonIcon} icon-list"></i>' +
			'<span class="echo-primaryFont {class:buttonCaption}">{plugin.label:actions}</span>' +
		'</a>' +
	'</div>';

plugin.templates.indicator =
	'<div class="{class:indicator}"></div>';

plugin.templates.sourceIcon =
	'<div class="{class:sourceIcon}"><img></div>';

plugin.templates.seeMore =
	'<div class="{plugin.class:seeMore}">{plugin.label:seeMore}</div>';

plugin.renderers.topPostMarker = function(element) {
	var item = this.component;

	var visible = this.config.get("topPost.visible") && !item.get("depth")
		&& ~$.inArray(this.config.get("topPost.marker"), item.get("data.object.markers", []));

	return visible
		? element.show()
		: element.hide();
};

plugin.component.renderers.sourceIcon = function(element) {
	var item = this.component;
	var source = item.get("data.source", {});
	element.hide();
	var types = $.map(item.get("data.object.objectTypes"), function(item) {
		return item.split("/").pop();
	});
	if (
		item.config.get("viaLabel.icon")
		&& source.icon
		&& !~$.inArray("comment", types)
	) {
		var img = element.find("img");
		return img
			.attr("src", Echo.Utils.htmlize(source.icon))
			.on("error", function() { element.hide(); })
			.on("load", function() {
				element.show();
			});
	}
	return element;
};

plugin.renderers.seeMore = function(element) {
	var self = this;
	var item = this.component;
	return element.one("click", function() {
		self.view.remove("seeMore");
		item.view.get("body").css("max-height", "");
	});
};

plugin.component.renderers.avatar = function(element) {
	this.parentRenderer("avatar", arguments);

	var img = element.find("img[src]");
	var defaultAvatar = this.component.config.get("defaultAvatar");

	var avatar = $("<div/>").css("background-image", "url('" + img.attr("src") + "'), url('" + defaultAvatar + "')");
	img.replaceWith(avatar);

	// we have to do it because filter must work in IE8 only
	// in other cases we will have square avatar in IE 9
	var isIE8 = document.all && document.querySelector && !document.addEventListener;
	if (isIE8) {
		avatar.css({
			"filter": "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + defaultAvatar + "', sizingMethod='scale'), progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + img.attr("src") + "', sizingMethod='scale')"
		});
	}

	return element;
};

plugin.component.renderers.indicator = function(element) {
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

plugin.component.renderers.tags = function(element) {
	return element.hide();
};

plugin.component.renderers.markers = function(element) {
	return element.hide();
};

plugin.component.renderers.container = function(element) {
	if (this.get("isLiveUpdate")) {
		element.addClass(this.cssPrefix + "liveUpdate");
	}
	this.parentRenderer("container", arguments);

	// we should wrap only once
	return element.parent().hasClass(this.cssPrefix + "wrapper")
		? element
		: element.wrap(this.substitute({
			"template": plugin.templates.wrapper
		}));

};

plugin.component.renderers._inlineButtons = function(element) {
	var item = this.component;
	var buttons = $.map(item.buttonsOrder, function(name) {
		return item.get("buttons." + name);
	});
	$.map(buttons, function(button) {
		if (!button || !Echo.Utils.invoke(button.visible)) {
			return;
		}
		item.view.render({
			"name": "_button",
			"target": element,
			"extra": button
		});
	});
};

plugin.component.renderers._compactButtons = function(element) {
	var item = this.component;
	var buttons = $.map(item.buttonsOrder, function(name) {
		return item.get("buttons." + name);
	});
	$.map(buttons, function(button) {
		if (!button || !Echo.Utils.invoke(button.visible)) {
			return;
		}
		button.template = plugin.templates.compactButtons;
		item.view.render({
			"name": "_button",
			"target": element,
			"extra": button
		});
	});
};

plugin.component.renderers._dropdownButtons = function(element) {
	var self = this;
	var item = this.component;
	var elem = $(this.substitute({
		"template": plugin.templates.dropdownButtons
	}));

	var buttons = $.map(item.buttonsOrder, function(name) {
		return self.component.get("buttons." + name);
	});

	var closeDropdown = function(callback) {
		return function() {
			elem.find(".dropdown-toggle").dropdown("toggle");
			callback && callback();
		};
	};

	(function assembleItems(container, buttons, inner) {
		var menu = $('<ul class="dropdown-menu" role="menu">');
		$.map(buttons, function(button) {
			if (!button || !Echo.Utils.invoke(button.visible)) {
				return;
			}
			var menuItem = $("<li>");
			item.view.render({
				"name": "_button",
				"target": menuItem,
				"extra": $.extend({}, button, {"inner": inner, "clickable": true, "callback": closeDropdown(button.callback)})
			});
			if (button.entries) {
				menuItem.addClass("dropdown-submenu");
				assembleItems(menuItem, button.entries, true);
			}
			menu.append(menuItem);
		});
		container.append(menu);
	})(elem, buttons);

	return element.append(elem);
};

plugin.component.renderers.buttons = function(element) {
	var item = this.component;
	item._assembleButtons();
	item._sortButtons();
	element.empty();

	item.view.render({
		"name": "_" + this.get("currentButtonsState") + "Buttons",
		"target": element
	});
	return element;
};

plugin.component.renderers._button = function(element, extra) {
	var item = this.component;
	var template = extra.template || plugin.templates.button;

	var data = {
		"label": extra.label || "",
		"name": extra.name,
		"icon": item.config.get("plugins." + extra.plugin + ".icon") ||
			extra.icon || (!extra.inner && "icon-comment")
	};
	var button = $(this.substitute({"template": template, "data": data}));
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
			"title": this.get("currentButtonsState") !== "compact" ? extra.label : ""
		});
		extra.callback = function(ev) {
			button.find(".dropdown-toggle").dropdown("toggle");
			ev.preventDefault();
		};
	} else if (this.get("currentButtonsState") === "compact") {
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
		var _data = item.get("buttons." + extra.plugin + "." + extra.name);
		_data.element = button;
		_data.clickableElements = clickables;
		if (Echo.Utils.isMobileDevice()) {
			clickables.addClass("echo-linkColor");
		}
	}
	return element.append(button);
};

plugin.component.renderers.authorName = function(element) {
	this.parentRenderer("authorName", arguments);
	return element.wrapInner("<span/>");
};

plugin.methods._checkItemContentHeight = function() {
	var body = this.component.view.get("body");
	var button = this.view.get("seeMore");

	if (body && button) {
		var collapsedHeight = this.config.get("collapsedContentHeight");
		var coeffToShow = 1.2; // we don`t need to hide text if it`s height <= 120% of collapsedHeight
		if (body.height() > collapsedHeight * coeffToShow && !button.is(":visible")) {
			body.css("max-height", collapsedHeight);
			button.show();
		} else if (body.height() < collapsedHeight && button.is(":visible")) {
			body.css("max-height", "");
			button.hide();
		}
	}
};

plugin.methods._pageLayoutChange = function() {
	var item = this.component;
	var footer = item.view.get("footer");
	var buttons = item.view.get("buttons");
	var buttonsStates = [
		"inline",
		"compact",
		"dropdown"
	];
	if (!this.get("buttonsStates")) {
		this.set("buttonsStates", buttonsStates);
	}
	var configuredButtonsState = this.config.get("initialIntentsDisplayMode") ||  buttonsStates[0];

	var currentState = this.get("currentButtonsState");
	if (!currentState) {
		currentState = configuredButtonsState;
		this.set("currentButtonsState", currentState);
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
			this.set("currentButtonsState", currentState);
			item.view.render({"name": "buttons"});
		} else if (freeSpace > (2 * buttonsWidth)) {
			var indexOfConfiguredState = $.inArray(configuredButtonsState, buttonsStates);
			if (indexOfConfiguredState < index && buttonsStates[index - 1]) {
				currentState = buttonsStates[index - 1];
			} else {
				currentState = configuredButtonsState;
			}
			this.set("currentButtonsState", currentState);
			item.view.render({"name": "buttons"});
		}
	}
	this._checkItemContentHeight();
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
	itemDepthRules.push('.{plugin.class} .{class:depth}-' + i + ' { margin-left: 0px; padding-left: ' + (i ? 12 + (i - 1) * 39 : 16) + 'px; }');
}

plugin.css =
	// see more
	'.{plugin.class:seeMore}:before { content: ""; display: block; height: 3px; box-shadow: 0 -3px 3px rgba(0, 0, 0, 0.08); position: relative; top: 0px; }' +
	'.{plugin.class:seeMore} { margin-top: -8px; display: none; padding: 0 0 15px 0; border-top: 1px solid #D8D8D8; text-align: center; font-size: 12px; cursor: pointer; color: #C6C6C6; }' +
	'.{plugin.class:seeMore}:hover { color: #262626; }' +

	// source icon
	'.{plugin.class} .{class:sourceIcon} { float: left; margin-right: 10px; }' +
	'.{plugin.class} .{class:sourceIcon} > img { margin-top: 2px; height: 16px; width: 16px; }' +

	// indicator
	'.{plugin.class} .{class:container} { position: relative; }' +
	'.{plugin.class} .{class:indicator} { position: absolute; left: 0px; top: 0px; bottom: 0px; width: 4px; background-color: transparent; z-index: 10; }' +

	// TODO: get rid of this item styles (introduced for DS generated items)
	'.{plugin.class} .{class:body} .echo-item-video { position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px; }' +
	'.{plugin.class} .{class:body} .echo-item-video > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class} .{class:body} .echo-item-video > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class} .{class:body} .echo-item-video > object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class} .{class:body} .echo-item-title { font-size: 15px; font-weight: normal; line-height: 21px; margin: 0px; }' +

	// common
	'.{plugin.class} .{plugin.class:dropdownButton} { display: inline; margin-left: 0px; }' +
	'.{plugin.class} .{plugin.class:dropdownButton} > .dropdown { display: inline; }' +
	'.{plugin.class} .{plugin.class:dropdownButton} > .dropdown a { color: inherit; text-decoration: inherit; }' +

	'.{plugin.class:topPostMarker} { float: right; position: absolute; top: -4px; right: 15px; }' +
	'.{plugin.class} .{plugin.class:wrapper} { background: #ffffff; border-bottom: 1px solid #e5e5e5; border-radius: 3px 3px 0px 0px; }' +
	'.{plugin.class} .{class:container}.{class:depth-0} { border-radius: 2px 3px 0px 0px; }' +
	'.{plugin.class} .{class:container}.{plugin.class:liveUpdate} .{class:indicator} { background-color: #f5ba47; }' +

	'.{plugin.class} .echo-trinaryBackgroundColor { background-color: #f8f8f8; }' +
	'.{plugin.class} .{class:date} { float: left; color: #d3d3d3; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; word-wrap: normal; max-width: 100%; }' +

	'.{plugin.class} .{class:avatar} { height: 28px; width: 28px; margin-left: 3px; }' +
	'.{plugin.class} .{class:avatar} div { height: 28px; width: 28px; background-size:cover; display:inline-block; background-position:center; border-radius: 50%;}' +

	'.{plugin.class} .{class:content} { background: #f8f8f8; border-radius: 3px; }' +
	'.{plugin.class} .{class:buttons} { margin-left: 0px; white-space: nowrap; line-height: 20px; }' +
	'.{plugin.class} .{class:metadata} { margin-bottom: 8px; }' +
	'.{plugin.class} .{class:body} { padding-top: 0px; margin-bottom: 8px; overflow: hidden; }' +
	'.{plugin.class} .{class:body} .{class:text} { color: #42474A; font-size: 15px; line-height: 21px; }' +
	'.{plugin.class} .{class:authorName} { float: left; color: #595959; font-weight: normal; font-size: 14px; line-height: 16px; max-width: 100%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; word-wrap: normal; }' +
	'.{plugin.class} .{class:authorName} span { padding-right: 5px; }' +

	'.{plugin.class} .{class:container-child} { padding-top: 8px; padding-bottom: 8px; padding-right: 0px; margin: 0px 15px 2px 0px; }' +
	'.{plugin.class} .{class:content} .{class:container-child-thread} { padding-top: 8px; padding-bottom: 8px; padding-right: 0px; margin: 0px 15px 2px 0px; }' +

	'.{plugin.class} .{class:children} .{class:avatar-wrapper} { margin-top: 5px; }' +
	'.{plugin.class} .{class:children} .{class:frame} { margin-left: 5px; }' +
	'.{plugin.class} .{class:children} .{class:data} { margin-top: 2px; padding-top: 0px; }' +
	'.{plugin.class} .{class:children} .{plugin.class:wrapper} { padding-top: 0px; background: none; border: none; }' +
	'.{plugin.class} .{class:expandChildren} { padding: 15px 0px 8px 16px; margin-bottom: 0px; }' +
	'.{plugin.class} .{class:children} .{class:expandChildren} { padding: 8px 0px; margin-bottom: 0px; }' +

	'.echo-sdk-ui .{plugin.class} .{class:buttons} a:focus { outline: none; }' +
	'.{plugin.class} .{class:button} { margin-right: 10px; }' +
	'.{plugin.class} .{class:buttons} .dropdown .{class:button} { margin-right: 0px; }' +
	'.{plugin.class} .{class:button-delim} { display: none; }' +
	'.echo-sdk-ui .{plugin.class:buttonIcon}[class*=" icon-"] { margin-right: 4px; margin-top: 0px; }' +
	'.{plugin.class} .{plugin.class:buttonIcon} { opacity: 0.3; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}.echo-linkColor,' +
	'.echo-sdk-ui .{plugin.class} .{class:button}:active,' +
	'.echo-sdk-ui .{plugin.class} .{class:button}:focus { text-decoration: none; color: #c6c6c6; }' +
	'.{plugin.class} .{class:container}:hover a.{class:button} { color: #262626; text-decoration: none; }' +
	'.{plugin.class} .{class:buttonCaption} { vertical-align: middle; font-size: 12px; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}.echo-linkColor .{plugin.class:buttonIcon},' +
	'.{plugin.class} .{class:container}:hover .{plugin.class:buttonIcon},' +
	'.{class:buttons} a.{class:button}:hover .{plugin.class:buttonIcon} { opacity: 0.8; }' +
	'.{plugin.class} .{class:compactButton} ul.dropdown-menu { left: -20px; }' +

	'.{plugin.class} .{class:depth-0} .{class:date} { line-height: 20px; }' +
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
	'.{plugin.class} .{class:depth-0} .{class:avatar} div { height: 36px; width: 36px; }' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-weight: normal; font-size: 17px; line-height: 18px; }' +
	'.{plugin.class} .{class:depth-0} .{class:subwrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:childrenMarker} { display: none; }' +
	'.{plugin.class} .{class:depth-0} .{plugin.class:header-box} { height: 36px; margin-left: 45px; }' +
	'.{plugin.class} .{class:depth-0} .{plugin.class:header-box}:before { content: ""; display: inline-block; height: 100%; vertical-align: middle; }' +
	'.{plugin.class} .{class:depth-0} .{plugin.class:header-centered} { display: inline-block; vertical-align: middle; max-width: 100%; max-width: 90%\\9; }' +

	'.{plugin.class} .{class:data} { padding: 7px 0px 0px 0px; }' +
	'.{plugin.class} .{class:content} .{class:depth-0} { padding: 15px 16px 0px 16px; }' +

	// Edit Plugin
	'.echo-streamserver-controls-submit-plugin-Edit .echo-streamserver-controls-submit-metadataContainer { display: none !important; }' +
	'.{class:depth-0} .echo-streamserver-controls-submit-plugin-Edit .echo-streamserver-controls-submit-plugin-Edit-header { line-height: 38px; margin-left: 45px; }' +
	'.{class:depth-0} .echo-streamserver-controls-submit-plugin-Edit .echo-streamserver-controls-submit-body { padding: 7px 0px 0px 0px; }' +
	'.{class:depth-0} .echo-streamserver-controls-submit-plugin-Edit .echo-streamserver-controls-submit-controls { margin-bottom: 5px; }' +

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
	},
	"confirmation": {
		"enable": false,
		"message": "Thanks, your post has been submitted for review",
		"timeout": 5000,
		"hidingTimeout": 200
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
			this.view.render({"name": "button"});
		}
	},
	"Echo.StreamServer.Controls.Submit.onPostInit": function() {
		if (this.config.get("confirmation.enable")) {
			this.view.get("confirmation").hide();
		}
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function() {
		if (this.config.get("confirmation.enable")) {
			var self = this;
			var confirmation = this.view.get("confirmation");
			confirmation.show();
			setTimeout(function() {
				confirmation.slideUp(self.config.get("confirmation.hidingTimeout"));
			}, this.config.get("confirmation.timeout"));
		}
	}
};

plugin.labels = {
	"post": "Post",
	"postAndShare": "Post and Share"
};

plugin.templates.auth = '<div class="{plugin.class:auth}"></div>';

plugin.templates.postButton =
	'<div class="{class:postButton} btn-group">' +
		'<div class="btn btn-primary {plugin.class:button}"></div>' +
		'<div class="btn btn-primary dropdown-toggle {plugin.class:switchSharing}" data-toggle="dropdown">' +
			'<span class="caret"></span>' +
		'</div>' +
		'<ul class="dropdown-menu pull-right">' +
			'<li><a href="#" class="{plugin.class:switchToPost}">{plugin.label:post}</a></li>' +
			'<li><a href="#" class="{plugin.class:switchToPostAndShare}">{plugin.label:postAndShare}</a></li>' +
		'</ul>' +
	'</div>';

plugin.templates.confirmation =
	'<div class="alert alert-success echo-primaryFont {plugin.class:confirmation}">' +
		'{plugin.config:confirmation.message}' +
	'</div>';

plugin.init = function() {
	var self = this, submit = this.component;

	this.extendTemplate("replace", "postButton", plugin.templates.postButton);
	this.extendTemplate("insertBefore", "header", plugin.templates.auth);
	this.extendTemplate("insertAsFirstChild", "container", plugin.templates.confirmation);

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
};

plugin.renderers.confirmation = function(element) {
	return element.hide();
};

plugin.renderers.button = function(element) {
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

plugin.component.renderers.postButton = function(element) {
	return element;
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
	'.echo-sdk-ui .{plugin.class:confirmation} { margin-bottom: 10px; }' +
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
	'.{plugin.class} .{class:postButton} { font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; }' +
	'.{plugin.class} .{control.class:buttons} .dropdown { min-width: 77px; }' +
	'.{plugin.class} .btn.{plugin.class:button} { padding: 3px 12px 5px 12px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
