(function() {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.CardUIShim
 * Extends Stream control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream");

plugin.labels = {
	"emptyStream": "There are no contributions yet.<br>Be first to chime in!"
};

plugin.init = function() {
	this.component.labels.set({
		"emptyStream": this.labels.get("emptyStream")
	});
};

plugin.css =
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:body} .echo-control-message { margin: 10px 0px; border: 1px solid #d2d2d2; box-shadow: 0px 1px 1px #d2d2d2; border-radius: 3px; color: #c6c6c6; padding: 30px 0px 30px 50%; text-align: left;}' +
	'.{plugin.class} .{class:body} .echo-control-message .echo-control-message-info { height: 35px; margin-left: -50%; display: block; font-size: 14px; line-height: 16px; font-weight: normal; font-style: normal; background-image: url({%= baseURL %}/images/info.png); padding-left: 40px; }' +
	'.{plugin.class} .echo-control-message-info { background: url({%= baseURL %}/images/info.png) no-repeat; }' +
	'.{plugin.class} .{class:item} { margin: 10px 0px; padding: 0px; padding-top: 15px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; background: #ffffff; }' +
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
	"Echo.StreamServer.Controls.Stream.Item.onReady": function() {
		if (this.get("isLiveUpdate")) {
			var self = this;
			var container = this.component.view.get("container");

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

plugin.config = {
	"fadeTimeout": 10000 // 10 seconds
};

plugin.init = function() {
	this.set("isLiveUpdate", this.component.config.get("live"));
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
		'<span class="{class:buttonCaption}">{data:label}</span>' +
	'</a>';

plugin.templates.topPostMarker =
	'<i class="icon-bookmark {plugin.class:topPostMarker}"></i>';

plugin.renderers.topPostMarker = function(element) {
	var item = this.component;
	var itemMarkers = this.component.get("data.object.markers", []);
	return (!item.get("depth") && ~$.inArray("Top", itemMarkers))
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

plugin.methods._transitionSupported = function() {
	var s = document.createElement('p').style;
	return 'transition' in s ||
		'WebkitTransition' in s ||
		'MozTransition' in s ||
		'msTransition' in s ||
		'OTransition' in s;
};

var itemDepthRules = [];
// 100 is a maximum level of children in query, but we can apply styles for ~20
for (var i = 0; i <= 20; i++) {
	itemDepthRules.push('.{plugin.class} .{class:depth}-' + i + ' { margin-left: 0px; padding-left: ' + (i ? 8 + (i - 1) * 39 : 16) + 'px; }');
}

plugin.css =
	'.{plugin.class:topPostMarker} { float: right; position: relative; top: -19px; right: 0px; }' +
	'.{plugin.class} .{plugin.class:wrapper} { background: #ffffff; border-bottom: 1px solid #e5e5e5; }' +
	'.{plugin.class} .{class:container} { border-left: 8px solid transparent; background: #ffffff; }' +
	'.{plugin.class} .{class:container}.{plugin.class:liveUpdate} { border-left: 8px solid #f5ba47; }' +

	'.{plugin.class} .echo-trinaryBackgroundColor { background-color: #f8f8f8; }' +
	'.{plugin.class:date} { float: left; color: #d3d3d3; margin-left: 5px; line-height: 18px; }' +

	'.{plugin.class} .{class:avatar} { height: 28px; width: 28px; margin-left: 3px; }' +
	'.{plugin.class} .{class:avatar} img { height: 28px; width: 28px; border-radius: 50%;}' +

	'.{plugin.class} .{class:content} { background: #f8f8f8; }' +
	'.{plugin.class} .{class:buttons} { margin-left: 0px; white-space: nowrap; }' +
	'.{plugin.class} .{class:metadata} { margin-bottom: 8px; }' +
	'.{plugin.class} .{class:body} { padding-top: 0px; margin-bottom: 8px; }' +
	'.{plugin.class} .{class:body} .{class:text} { color: #42474A; font-size: 15px; line-height: 21px; font-family: "Helvetica Neue", arial, sans-serif; }' +
	'.{plugin.class} .{class:authorName} { color: #595959; font-weight: normal; font-size: 14px; line-height: 16px; }' +
	'.{plugin.class} .{class:content} .{class:expandChildren} { margin-top: 15px; }' +
	'.{plugin.class} .{class:content} .{class:container-child-thread} { padding: 0px 0px 0px 8px; margin-top: 20px; }' +
	'.{plugin.class} .{class:children} .{class:avatar-wrapper} { margin-top: 5px; }' +
	'.{plugin.class} .{class:children} .{class:frame} { margin-left: 5px; }' +
	'.{plugin.class} .{class:children} .{class:data} { margin-top: 2px; padding-top: 0px; }' +
	'.{plugin.class} .{class:children} .{plugin.class:wrapper} { padding-top: 0px; background: none; border: none; }' +
	'.{plugin.class} .{class:container-child} { padding: 0px 0px 0px 16px; margin-top: 20px; }' +

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
	'.{plugin.class} .{class:depth-0} .{class:footer} { padding-top: 8px; height: 30px; }' +
	'.{plugin.class} .{class:depth-0} .{class:body} { padding-top: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} { height: 36px; width: 36px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} img { height: 36px; width: 36px; border-radius: 50%;}' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-weight: normal; font-size: 17px; line-height: 38px; margin-left: 45px;}' +
	'.{plugin.class} .{class:depth-0} .{class:subwrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:childrenMarker} { display: none; }' +

	'.{plugin.class} .{class:data} { padding: 7px 0px 0px 0px; }' +
	'.{plugin.class} .{class:content} .{class:depth-0} { padding: 0px 16px 0px 8px; }' +

	itemDepthRules.join("\n");

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.IdentityServer.Controls.Auth.Plugins.CardUIShim
 * Extends Auth control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.IdentityServer.Controls.Auth");

plugin.labels = {
	"via": "via",
	"logout": "Logout",
	"switchIdentity": "Switch Identity"
};

plugin.templates.name =
	'<div class="{plugin.class:container}">' +
		'<div class="{class:name}"></div>' +
		'<div class="{plugin.class:via}">{plugin.label:via} {plugin.data:via}</div>' +
	'</div>';

plugin.init = function() {
	this.set("data.via", this._detectAuthProvider());
	this.extendTemplate("remove", "logout");
	this.extendTemplate("replace", "name", plugin.templates.name);
};

plugin.component.renderers.name = function(element) {
	var auth = this.component, isSwitchAssembled = false;
	var template = '<span class="{plugin.class:dropdown}"></span>';
	new Echo.GUI.Dropdown({
		"target": element,
		"title": auth.user.get("name", "") + this.substitute({"template": template}),
		"extraClass": "nav",
		"entries": [{
			"title": this.labels.get("switchIdentity"),
			"handler": function() {
				if (!isSwitchAssembled) {
					var target = $(this);
					auth._assembleIdentityControl("login", target);
					isSwitchAssembled = true;
					target.click();
				}
			}
		}, {
			"title": this.labels.get("logout"),
			"handler": function() {
				auth.user.logout();
			}
		}]
	});
	return element;
};

plugin.methods._detectAuthProvider = function() {
	// TODO: provide an ability to update this list via plugin config
	var providers = {
		"twitter.com": "Twitter",
		"facebook.com": "Facebook",
		"google.com": "Google",
		"me.yahoo.com": "Yahoo"
	};
	var id = this.component.user.get("identityUrl", "");
	var domain = Echo.Utils.parseURL(id).domain;
	return providers[domain] || domain || id;
};

plugin.css =
	'.{plugin.class:via} { margin-left: 15px; color: #D3D3D3; line-height: 18px; font-size: 12px; font-family: Arial; }' +
	'.{plugin.class} .{class:name} .{plugin.class:dropdown} { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }' +
	'.{plugin.class} .{class:name} ul.nav { margin-bottom: 3px; }' +
	'.{plugin.class} .{class:name} ul.nav .dropdown-menu li > a { font-size: 14px; }' +
	'.{plugin.class} .{class:avatar} img { border-radius: 50%; }' +
	'.{plugin.class} .{class:login}, .{plugin.class} .{class:signup} { color: #006DCC; }' +
	'.{plugin.class} .{class:userAnonymous} { margin: 0px 0px 7px 2px; text-align: left; font-family: Arial; }' +
	'.{plugin.class} .{class:userLogged} { margin: 0px 0px 5px 3px; }' +
	'.{plugin.class} .{class:name} { float: none; margin: 3px 0px 0px 15px; font-family: Arial; font-weight: normal; }' +
	'.{plugin.class:container} { float: left; }' +
	'.{plugin.class} .{class:avatar} { width: 48px; height: 48px; border-radius: 50%; }' +
	'.{plugin.class} .{class:avatar} > img { width: 48px; height: 48px; }';

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
	"submitPermissions": "forceLogin"
};

plugin.labels = {
	"youMustBeLoggedIn": "You must be logged in to comment"
};

plugin.templates.attach = '<div class="{plugin.class:attach}"><img class="{plugin.class:attachPic}" src="{%= baseURL %}/images/attach.png" /></div>';

plugin.templates.loginRequirementNotice = '<div class="{plugin.class:loginRequirementNotice}">{plugin.label:youMustBeLoggedIn}</div>';

plugin.init = function() {
	var self = this, submit = this.component;

	this.extendTemplate("insertAfter", "postContainer",
				plugin.templates.loginRequirementNotice);

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
			var notice = self.view.get("loginRequirementNotice");
			notice.show();
			setTimeout(function() {
				notice.hide();
			}, 5 * 1000); // keep fixed for now, to be revisited later
			return false;
		}
		return true;
	});

// 	Note: let's keep the "attach" icon hidden for now,
//		as there is no functionality associated with it..
//
//	this.extendTemplate("insertAsFirstChild", "controls", plugin.templates.attach);
};

plugin.css =
	'.{plugin.class} .{class:urlContainer} { display: none; }' +
	'.{plugin.class} .{class:avatar} { display: none; }' +
	'.{plugin.class} .{class:fieldsWrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:plugin-JanrainAuth-forcedLogin} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:fieldsWrapper} input { font-weight: normal; }' +
	'.{plugin.class} .{class:nameContainer} { padding: 3px 2px 3px 5px; }' +
	'.{plugin.class} .{class:postButton} { color: #006DCC !important; font-weight: bold; }' +
	'.{plugin.class} .{class:tagsContainer} { display: none !important; }' +
	'.{plugin.class} .{class:markersContainer} { display: none !important; }' +
	'.{plugin.class} .{class:content} textarea.{class:textArea} { height: 75px; }' +
	'.{plugin.class} .{class:controls} { margin: 0px; padding: 5px; border: 1px solid #d8d8d8; border-top: 0px; background: #ffffff;}' +
	'.{plugin.class} .{class:container} { padding: 20px 20px 20px; border: 1px solid #d8d8d8; border-bottom-width: 2px; border-radius: 3px; }' +
	'.{plugin.class} .{class:header} { margin-top: 10px; }' +
	'.{plugin.class:loginRequirementNotice} { display: none; float: right; margin: 5px; margin: 8px 10px 0 0; color: red; font-weight: bold; font-family: Arial; font-size: 14px; }' +
	'.{plugin.class:attach} { margin: 5px; float: left; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
