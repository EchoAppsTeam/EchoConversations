(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.CardUIShim
 * Extends Auth control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream");

plugin.css =
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:item} { margin: 10px 0px; padding: 5px 0px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }' +
	'.{plugin.class} .{class:item-children} > .{class:item} { margin: 0px; padding: 0px; box-shadow: 0 0 0; border: 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.CardUIShim
 * Extends Item control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Stream.Item");

plugin.init = function() {
	this.extendTemplate("insertAfter", "authorName", plugin.templates.date);
	this.extendTemplate("remove", "date");
};

plugin.templates.date =
	'<div class="{plugin.class:date}"></div>';

plugin.templates.button =
	'<a class="{class:button} {class:button}-{data:name}">' +
		'<img class="{class:buttonIcon}" src="{data:icon}">' +
		'<span class="{class:buttonCaption}">{data:label}</span>' +
	'</a>';

plugin.renderers.date = function(element) {
	// TODO: use parentRenderer here
	this.age = this.component.getRelativeTime(this.component.timestamp);
	return element.html(this.age);
};

plugin.component.renderers._button = function(element, extra) {
	var template = extra.template || plugin.templates.button;

	var data = {
		"label": extra.label || "",
		"name": extra.name,
		"icon": extra.icon || "{%= baseURL %}/images/comment.png"
	};
	var button = $(this.substitute({"template": template, "data": data}));
	if (!extra.clickable) return element.append(button);
	var clickables = $(".echo-clickable", button);
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
	/*
	// TODO: do we need it ?
	if (Echo.Utils.isMobileDevice()) {
		clickables.addClass("echo-linkColor");
	}*/
        return element.append(button);
};

var itemDepthRules = [];
// 100 is a maximum level of children in query, but we can apply styles for ~20
for (var i = 0; i <= 20; i++) {
	itemDepthRules.push('.{plugin.class} .{class:depth}-' + i + ' { margin-left: 0px; padding-left: ' + (i ? 10 + (i - 1) * 7 : 10) + 'px; }');
}

plugin.css =
	'.{plugin.class} .echo-trinaryBackgroundColor { background-color: #ffffff; }' +
	'.{plugin.class:date} { float: left; color: #d3d3d3; margin-left: 5px; line-height: 22px; }' +

	'.{plugin.class} .{class:avatar} { height: 24px; width: 24px; margin-left: 3px; }' +
	'.{plugin.class} .{class:avatar} img { height: 24px; width: 24px; border-radius: 50%;}' +

	'.{plugin.class} .{class:body} { padding-top: 0px; margin-bottom: 8px; }' +
	'.{plugin.class} .{class:content} { padding-top: 15px; }' +
	'.{plugin.class} .{class:body} .{class:text} { color: #262626; font-size: 12px; }' +
	'.{plugin.class} .{class:authorName} { color: #595959; font-weight: normal; font-size: 14px; line-height: 1i6px; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}.echo-linkColor, .{class:buttons} a.{class:button}:hover { color: #c6c6c6; text-decoration: none; }' +
	'.{plugin.class} .{class:buttons} a.{class:button}:hover { opacity: 1}' +

	'.{plugin.class} .{class:button} { margin-right: 10px; opacity: 0.7;}' +
	'.{plugin.class} .{class:button-delim} { display: none; }' +
	'.{plugin.class} .{class:buttonIcon} { margin-right: 4px; }' +
	'.{plugin.class} .{class:buttonCaption} { vertical-align: middle; font-size: 12px; }' +
	'.{plugin.class} .{class:container-child} { padding: 0px; margin: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:footer} { padding-top: 8px; height: 28px; }' +
	'.{plugin.class} .{class:depth-0} .{class:body} { padding-top: 0px; margin: 8px 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:body} .{class:text} { font-size: 13px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} { height: 36px; width: 36px; }' +
	'.{plugin.class} .{class:depth-0} .{class:avatar} img { height: 36px; width: 36px; border-radius: 50%;}' +
	'.{plugin.class} .{class:depth-0} .{class:footer} { border-bottom: 1px solid #e5e5e5; border-top: 1px solid #e5e5e5; }' +
	'.{plugin.class} .{class:depth-0} .{plugin.class:date} { line-height: 40px; }' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-weight: normal; font-size: 17px; line-height: 38px; margin-left: 45px;}' +
	'.{plugin.class} .{class:depth-0} .{class:subwrapper} { margin-left: 0px; }' +
	'.{plugin.class} .{class:depth-0} .{class:childrenMarker} { display: none; }' +

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
	new Echo.GUI.Dropdown({
		"target": element,
		"title": auth.user.get("name", ""),
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
		"google.com": "Google"
	};
	var id = this.component.user.get("identityUrl", "");
	var domain = Echo.Utils.parseURL(id).domain;
	return providers[domain] || domain || id;
};

plugin.css =
	'.{plugin.class:via} { margin-left: 15px; color: #C6C6C6; line-height: 18px; font-size: 12px; }' +
	'.{class:name} ul.nav { margin-bottom: 3px; }' +
	'.{class:name} ul.nav .dropdown-menu li > a { font-size: 14px; }' +
	'.{plugin.class} .{class:avatar} img { border-radius: 50%; }' +
	'.{plugin.class} .{class:login}, .{plugin.class} .{class:signup} { color: #006DCC; }' +
	'.{plugin.class} .{class:userAnonymous} { margin: 0px 0px 7px 2px; text-align: left; font-family: Arial; }' +
	'.{plugin.class} .{class:userLogged} { margin: 0px 0px 5px 3px; }' +
	'.{plugin.class} .{class:name} { float: none; margin: 3px 0px 0px 15px; font-family: Arial; font-weight: normal; }' +
	'.{plugin.class:container} { float: left; }' +
	'.{plugin.class} .{class:avatar} { width: 48px; height: 48px; border-radius: 50%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.CardUIShim
 * Extends Submit control to look like Card-based app.
 */
var plugin = Echo.Plugin.manifest("CardUIShim", "Echo.StreamServer.Controls.Submit");

plugin.labels = {
	"youMustBeLoggedIn": "You must be logged in to comment"
};

//FIXME: utilise relative path
plugin.templates.attach = '<div class="{plugin.class:attach}"><img class="{plugin.class:attachPic}" src="{%= baseURL %}/images/attach.png" /></div>';

plugin.templates.loginRequirementNotice = '<div class="{plugin.class:loginRequirementNotice}">{plugin.label:youMustBeLoggedIn}</div>';

plugin.init = function() {
	var self = this, submit = this.component;

	this.extendTemplate("insertAfter", "postContainer",
				plugin.templates.loginRequirementNotice);

	// drop all validators
	submit.validators = [];

	submit.addPostValidator(function() {
		var textarea = submit.view.get("text");
		var text = textarea.val();
		if (!text) {
			textarea.focus();
			submit.highlightMandatory(textarea);
			setTimeout(function() {
				submit.view.get("content")
					.removeClass("echo-streamserver-controls-submit-mandatory");
			}, 3 * 1000); // keep fixed for now, to be revisited later
			return false;
		}
		if (!submit.user.is("logged")) {
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
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:postButton} { color: #006DCC !important; font-weight: bold; }' +
	'.{plugin.class} .{class:tagsContainer} { display: none !important; }' +
	'.{plugin.class} .{class:markersContainer} { display: none !important; }' +
	'.{plugin.class} .{class:content} textarea.{class:textArea} { height: 75px; }' +
	'.{plugin.class} .{class:controls} { margin: 0px; padding: 5px; border: 1px solid #D2D2D2; border-top: 0px; }' +
	'.{plugin.class} .{class:container} { padding: 10px 15px 15px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }' +
	'.{plugin.class:loginRequirementNotice} { display: none; float: right; margin: 5px; margin: 8px 10px 0 0; color: red; font-weight: bold; font-family: Arial; font-size: 14px; }' +
	'.{plugin.class:attach} { margin: 5px; float: left; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"auth":{
		// TODO: rename to "allowAnonymousSubmission"
		"enableAnonymousComments": false
	},
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"conversationID": "",
	"itemStates": "Untouched,ModeratorApproved",
	"liveUpdates": {
		"transport": "websockets"
	}
};

conversations.config.normalizer = {
	"conversationID": function(value) {
		return value
			|| $("link[rel='canonical']").attr('href')
			|| document.location.href.split("#")[0];
	}
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.Stream"
}];

conversations.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

conversations.renderers.submit = function(element) {
	var allowGuest = this.config.get("auth.enableAnonymousComments");
	this.initComponent({
		"id": "stream",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": this.config.get("conversationID"),
			"infoMessages": {"enabled": false},
			"liveUpdates": this.config.get("liveUpdates"),
			"plugins": [{
				"name": "JanrainAuth",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"submitPermissions": allowGuest ? "allowGuest" : "forceLogin",
				"buttons": ["login", "signup"],
				"nestedPlugins": [{
					"name": "CardUIShim"
				}]
			}, {
				"name": "CardUIShim"
			}]
		}
	});
};

conversations.renderers.stream = function(element) {
	var replyPermissions = this.config.get("auth.enableAnonymousComments");
	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"query": this._buildSearchQuery(),
			"item": {
				"reTag": false
			},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "ReplyCardUI",
				"nestedPlugins": [{
					"name": "JanrainAuth",
					"appId": this.config.get("dependencies.Janrain.appId"),
					"submitPermissions": replyPermissions
						? "allowGuest"
						: "forceLogin",
					"buttons": ["login", "signup"],
					"nestedPlugins": [{
						"name": "CardUIShim"
					}]
				}, {
					"name": "CardUIShim"
				}]
			}, {
				"name": "LikeCardUI"
			}, {
				"name": "ModerationCardUI"
			}]
		}
	});
};

conversations.methods._buildSearchQuery = function() {
	// TODO: think about more scalable approach to override query predicates...
	var states = "state:" + this.config.get("itemStates");
	return "childrenof:" + this.config.get("conversationID") +
		" type:comment " + states +
		" children:2 " + states;
};

Echo.App.create(conversations);

})(Echo.jQuery);
