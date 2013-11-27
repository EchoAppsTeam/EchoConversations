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

plugin.templates.buttonIcon =
	'<img class="{plugin.class:buttonIcon}" src="{data:source}">';

plugin.renderers.date = function(element) {
	// TODO: use parentRenderer here
	this.age = this.component.getRelativeTime(this.component.timestamp);
	return element.html(this.age);
};

plugin.component.renderers.buttons = function(element) {
	var self = this, item = this.component;

	item._assembleButtons();
	item._sortButtons();

	element.empty();
	$.map(item.buttonsOrder, function(name) {
		var data = item.get("buttons." + name);
		if (!data || !data.name || !data.visible()) {
			return;
		}
		self.view.render({
			"name": "buttonIcon",
			"target": element,
			"extra": data
		});
		item.view.render({
			"name": "_button",
			"target": element,
			"extra": data
		});
	});
        return element;
};

plugin.renderers.buttonIcon = function(element, extra) {
	// TODO: get rid of hardcoded URLs
	var iconSrc = {
		"like": "//ec.dbragin.ul.js-kit.com/images/like.png",
		"reply": "//ec.dbragin.ul.js-kit.com/images/comment.png",
		"moderation": "//ec.dbragin.ul.js-kit.com/images/moderate.png"
	}[extra.name.toLowerCase()];

	return iconSrc
		? element.append(this.substitute({
			"template": plugin.templates.buttonIcon,
			"data": {
				"source": iconSrc
			}
		}))
		: element;
};


var itemDepthRules = [];
// 100 is a maximum level of children in query, but we can apply styles for ~20
for (var i = 0; i <= 20; i++) {
	itemDepthRules.push('.{plugin.class} .{class:depth}-' + i + ' { margin-left: ' + (i ? 10 + (i - 1) * 7 : 0) + 'px; }');
}

plugin.css =
	'.{plugin.class} .echo-trinaryBackgroundColor { background-color: #ffffff; }' +
	'.{plugin.class:date} { float: left; color: #d3d3d3; margin-left: 5px; line-height: 22px; }' +
	'.{plugin.class} .{class:footer} { border-bottom: 1px solid #e5e5e5; border-top: 1px solid #e5e5e5; }' +
	'.{plugin.class} .{class:avatar} { border-radius: 50%; }' +
	'.{plugin.class} .{class:avatar} img { height: 48px; width: 48px; }' +

	'.{plugin.class} .{class:body} { padding-top: 0px; margin: 10px 0px; }' +
	'.{plugin.class} .{class:body} .{class:text} { color: #262626; font-size: 13px; }' +
	'.{plugin.class} .{class:authorName} { color: #595959; font-weight: normal; font-size: 17px; line-height: 19px; }' +

	'.{plugin.class} .{class:depth-0} .{plugin.class:buttonIcon} { margin-top: 5px; }' +
	'.{plugin.class} .{class:depth-0} .{class:footer} { height: 30px; }' +
	'.{plugin.class} .{class:depth-0} .{plugin.class:date} { line-height: 50px; }' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-weight: normal; line-height: 48px; margin-left: 60px;}' +
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

plugin.component.renderers.login = function(element) {
	element.addClass("btn");
	return this.parentRenderer("login", arguments);
};

plugin.component.renderers.name = function(element) {
	this.parentRenderer("name", arguments);
	// TODO: get social provider name from identityURL...
	var template = '<div class="{plugin.class:via}">via Twitter</div>';
	element.append(this.substitute({"template": template}));
	return element;
};

plugin.css =
	'.{plugin.class:via} { color: #C6C6C6; line-height: 18px; font-size: 12px; }' +
	'.{plugin.class} .{class:avatar} img { border-radius: 50%; }' +
	'.{plugin.class} .{class:userAnonymous} { margin-bottom: 7px; text-align: left; font-family: Arial; font-weight: bold; }' +
	'.{plugin.class} .{class:userLogged} { margin: 0px 0px 5px 3px; }' +
	'.{plugin.class} .{class:name} { margin: 3px 0px 0px 15px; font-family: Arial; font-weight: normal; }' +
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

//FIXME: utilise relative path
plugin.templates.attach = '<div class="{plugin.class:attach}"><img class="{plugin.class:attachPic}" src="http://conversations.leon.ul.js-kit.com/images/attach.png" /></div>';

plugin.init = function (){
	this.extendTemplate("insertAsFirstChild", "controls", plugin.templates.attach);
};

plugin.css =
	'.{plugin.class} .{class:header} { display: none; }' +
	'.{plugin.class} .{class:postButton} { color: #006DCC !important; font-weight: bold; }' +
	'.{plugin.class} .{class:tagsContainer} { display: none !important; }' +
	'.{plugin.class} .{class:markersContainer} { display: none !important; }' +
	'.{plugin.class} .{class:content} textarea.{class:textArea} { height: 75px; }' +
	'.{plugin.class} .{class:controls} { margin: 0px; padding: 7px; border: 1px solid #D2D2D2; border-top: 0px; }' +
	'.{plugin.class} .{class:container} { padding: 15px; box-shadow: 0px 1px 1px #D2D2D2; border: 1px solid #D2D2D2; }' +
	'.{plugin.class:attach} { margin: 5px; float: left; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	// TODO: add WebSockets config, make WS on by default
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"conversationID": "", // TODO: make auto-detectable by default
	"itemStates": "Untouched,ModeratorApproved"
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
	this.initComponent({
		"id": "stream",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": this.config.get("conversationID"),
			"infoMessages": {"enabled": false},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "JanrainAuth",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"nestedPlugins": [{
					"name": "CardUIShim"
				}]
			}]
		}
	});
};

conversations.renderers.stream = function(element) {
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
				"name": "Reply",
				"nestedPlugins": [{
					"name": "CardUIShim"
				}, {
					"name": "JanrainAuth",
					"appId": this.config.get("dependencies.Janrain.appId"),
					"nestedPlugins": [{
						"name": "CardUIShim"
					}]
				}]
			}, {
				"name": "Like"
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
