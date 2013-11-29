(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.Like
 * Adds extra Like/Unlike buttons to each item in the Echo Stream
 * control for authenticated users.
 *
 * 	new Echo.StreamServer.Controls.Stream({
 * 		"target": document.getElementById("echo-stream"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Like"
 * 		}]
 * 	});
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("LikeCardUI", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("insertAsFirstChild", "footer", plugin.templates.main);
	this.component.addButtonSpec("LikeCardUI", this._assembleButton("Like"));
	this.component.addButtonSpec("LikeCardUI", this._assembleButton("Unlike"));
};

plugin.config = {
	/**
	 * @cfg {Boolean} asyncFacePileRendering
	 * This parameter is used to enable FacePile control rendering in async mode.
	 */
	"asyncFacePileRendering": false
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"likeThis": " like this.",
	/**
	 * @echo_label
	 */
	"likesThis": " likes this.",
	/**
	 * @echo_label
	 */
	"likeControl": "Like",
	/**
	 * @echo_label
	 */
	"unlikeControl": "Unlike",
	/**
	 * @echo_label
	 */
	"likeProcessing": "Liking...",
	/**
	 * @echo_label
	 */
	"unlikeProcessing": "Unliking..."
};

plugin.dependencies = [{
	"control": "Echo.StreamServer.Controls.FacePile",
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
}];

plugin.events = {
	"Echo.StreamServer.Controls.FacePile.Item.Plugins.LikeCardUI.onUnlike": function(topic, args) {
		this._sendActivity("Unlike", this.component, args.actor);
		return {"stop": ["bubble"]};
	}
};

/**
 * @echo_template
 */
plugin.templates.main =
	'<div class="{plugin.class:likesArea}">' +
		'<div class="{plugin.class:likeIcon}"></div>' +
		'<div class="{plugin.class:likedBy}"></div>' +
		'<div class="{plugin.class:likers}"></div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

plugin.templates.processing =
	'<span class="{plugin.class:processing}">{data:label}</span>';

/**
 * @echo_renderer
 */
plugin.renderers.likedBy = function(element) {
	var plugin = this;
	var item = this.component;
	if (!item.get("data.object.likes").length) {
		return element.hide();
	}
	var likesPerPage = 5;
	var visibleUsersCount = plugin.get("facePile")
		? plugin.get("facePile").getVisibleUsersCount()
		: likesPerPage;
	var youLike = false;
	var userId = item.user.get("identityUrl");
	var users = item.get("data.object.likes");
	$.each(users, function(i, like) {
		if (like.actor.id === userId) {
			youLike = true;
			return false; // break
		}
	});
	var config = plugin.config.assemble({
		"target": element.get(0),
		"data": {
			"itemsPerPage": likesPerPage,
			"entries": users
		},
		"initialUsersCount": visibleUsersCount,
		"totalUsersCount": item.get("data.object.accumulators.likesCount"),
		"item": {
			"avatar": true,
			"text": false
		}
	});
	config.plugins.push({"name": "LikeCardUI"});
	if (item.user.is("admin")) {
		element.addClass(plugin.cssPrefix + "highlight");
	}
	if (this.config.get("asyncFacePileRendering")) {
		setTimeout($.proxy(this._initFacePile, this, config), 0);
	} else {
		this._initFacePile(config);
	}
	return element.show();
};

plugin.renderers.likers = function(element) {
	return element
		.append(this.component.get("data.object.accumulators.likesCount"));
};

plugin.methods._initFacePile = function(config) {
	this.set("facePile", new Echo.StreamServer.Controls.FacePile(config));
};

plugin.methods._sendRequest = function(data, callback, errorCallback) {
	Echo.StreamServer.API.request({
		"endpoint": "submit",
		"secure": this.config.get("useSecureAPI", false, true),
		"submissionProxyURL": this.component.config.get("submissionProxyURL"),
		"onData": callback,
		"onError": errorCallback,
		"data": data
	}).send();
};

plugin.methods._sendActivity = function(name, item, actor) {
	var plugin = this;
	var activity = {
		"verbs": ["http://activitystrea.ms/schema/1.0/" + name.toLowerCase()],
		"targets": [{"id": item.get("data.object.id")}]
	};
	if (actor && actor.id) {
		activity.author = actor.id;
	}

	this._sendRequest({
		"content": activity,
		"appkey": item.config.get("appkey"),
		"sessionID": item.user.get("sessionID"),
		"target-query": item.config.get("parent.query")
	}, function(response) {
		/**
		 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.Like.onLikeComplete
		 * Triggered when the Like operation is finished.
		 */
		/**
		 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.Like.onUnlikeComplete
		 * Triggered when the reverse Like operation is finished.
		 */
		plugin._publishEventComplete({
			"name": name,
			"state": "Complete",
			"response": response
		});
		plugin.requestDataRefresh();
	}, function(response) {
		/**
		 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.Like.onLikeError
		 * Triggered when the Like operation failed.
		 */
		/**
		 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.Like.onUnlikeError
		 * Triggered when the reverse Like operation failed.
		 */
		plugin._publishEventComplete({
			"name": name,
			"state": "Error",
			"response": response
		});
	});
};

plugin.methods._publishEventComplete = function(args) {
	var item = this.component;
	this.events.publish({
		"topic": "on" + args.name + args.state,
		"data": {
			"item": {
				"data": item.get("data"),
				"target": item.config.get("target")
			},
			"response": args.response
		}
	});
};

plugin.methods._assembleButton = function(name) {
	var self = this;
	var callback = function() {
		var item = this;
		item.get("buttons." + self.name + "." + name + ".element")
			.empty()
			.append(self.substitute({
				"template": plugin.templates.processing,
				"data": {
					"label": self.labels.get(name.toLowerCase() + "Processing")
				}
			}));
		self._sendActivity(name, item);
	};
	return function() {
		var item = this;
		var action =
			($.map(item.get("data.object.likes"), function(entry) {
				if (item.user.has("identity", entry.actor.id)) return entry;
			})).length > 0 ? "Unlike" : "Like";
		return {
			"name": name,
			"icon": "{%= baseURL %}/images/like.png",
			"label": self.labels.get(name.toLowerCase() + "Control"),
			"visible": item.user.is("logged") && action === name,
			"once": true,
			"callback": callback
		};
	};
};

plugin.css =
	'.{plugin.class:likesArea} { float: right; }' +
	'.{plugin.class:likeIcon} { float: left; height: 20px; width: 20px; opacity: 0.8; margin-right: 7px; background: url({%= baseURL %}/images/like.png) no-repeat 0px 1px; }' +
	'.{plugin.class:likedBy} { float: left; height: 20px; margin-right: 5px; vertical-align: text-top;}' +
	'.{plugin.class:likers} { float: left; border: 1px solid #808080; border-radius: 50%; color: #808080; display: inline-block; font-size: 10px; height: 20px; line-height: 22px; text-align: center; vertical-align: text-top; width: 20px;}' +
	'.{plugin.class:processing} { vertical-align: middle; font-size: 12px; }' +
	'.{plugin.class:highlight} { line-height: 23px; }' +
	'.{plugin.class:likedBy} .echo-streamserver-controls-facepile-item-avatar { border-radius: 50%; }' +
	'.{plugin.class:likedBy} .echo-streamserver-controls-facepile-item-avatar img { border-radius: 50%; height: 20px; width: 20px; }' +
	'.{plugin.class:likedBy} echo-streamserver-controls-facepile-and { display: none; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.FacePile.Item.Plugins.Like
 * Adds extra controls to items in the Echo FacePile control.
 *
 * @extends Echo.Plugin
 * @private
 */
var plugin = Echo.Plugin.manifest("LikeCardUI", "Echo.StreamServer.Controls.FacePile.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("insertAsLastChild", "container", plugin.templates.main);
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"unlikeOnBehalf": "Unlike on behalf of this user"
};

/**
 * @echo_template
 */
plugin.templates.main = '<img class="{plugin.class:adminUnlike}" src="{config:cdnBaseURL.sdk-assets}/images/container/closeWindow.png"" title="{plugin.label:unlikeOnBehalf}" width="10" height="9">';

/**
 * @echo_renderer
 */
plugin.component.renderers.container = function(element) {
	this.parentRenderer("container", arguments);
	if (this.component.user.is("admin")) {
		element.addClass(this.cssPrefix + "highlight");
	}
};

/**
 * @echo_renderer
 */
plugin.renderers.adminUnlike = function(element) {
	var plugin = this;
	var item = this.component;
	if (!item.user.is("admin")) {
		return element.remove();
	}
	return element.one("click", function() {
		item.view.get("container").css("opacity", 0.3);
		/**
		 * @echo_event Echo.StreamServer.Controls.FacePile.Item.Plugins.Like.onUnlike
		 * Triggered when the item is "unliked" by admin on behalf of a user.
		 */
		plugin.events.publish({
			"topic": "onUnlike",
			"data": {
				"actor": item.get("data"),
				"target": item.config.get("parent.target").get(0)
			},
			"global": false,
			"propagation": false
		});
	});
};

plugin.css =
	'.{plugin.class:adminUnlike} { cursor: pointer; margin-left: 3px; }' +
	'.{plugin.class:highlight} { display: inline-block; line-height: 16px; background-color: #EEEEEE; padding: 1px 3px; border: 1px solid #D2D2D2; border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; margin: 0px 2px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);