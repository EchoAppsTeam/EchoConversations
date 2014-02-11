(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Card.Plugins.TweetDisplay
 * Adds the Twitter intents controls into the item UI and updates the
 * item UI to look and behave like a Twitter item. The item UI update includes:
 *
 * + by clicking on the avatar or the user name - the user account on Twitter
 * will be opened;
 * + the item timestamp transforms from a static field to a permanent item
 * link on Twitter.
 *
 * More information about Twitter Intents is available on the page
 * <https://dev.twitter.com/docs/intents>.
 *
 * #### How to use
 * To enable this plugin should be taken add the corresponding section into the
 * Echo Stream configuration parameter plugins:
 *
 * 	new Echo.StreamServer.Controls.CardCollection({
 * 		"target": document.getElementById("echo-stream"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "TweetDisplay"
 * 		}]
 * 	});
 *
 * <b>Note</b>: plugin must be at the very beginning of the plugin list to
 * work correctly. If {@link Echo.StreamServer.Controls.Stream.Plugins.PinboardVisualization PinboardVisualization}
 * plugin is also enabled in the Stream then this plugin must be placed right after it.
 *
 * <b>Note</b>: if TweetDisplay plugin is added to the stream then Reply and
 * Like plugins will be disabled for tweet items. Moreover Reply control is
 * renamed with Comment on non-tweet items to avoid possible confusion.
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("TweetDisplay", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var item = this.component;

	var config = item.config.get("contentTransformations");
	$.map(["text", "html", "xhtml"], function(contentType) {
		config[contentType].hashtags = false;
	});

	item.config.set("contentTransformations", config);
	item.config.set("plugins.Like.enabled", false);
	item.config.set("plugins.Reply.enabled", false);
	item.config.set("plugins.SocialSharing.enabled", false);
	item.config.set("plugins.CommunityFlag.enabled", false);
	// icon must be visible to show that the item is from Twitter
	item.config.set("viaLabel.icon", true);

	this.extendTemplate("replace", "date", plugin.templates.date);
	this.extendTemplate("replace", "authorName", plugin.templates.username);
	item.addButtonSpec(this.name, this._assembleButton("tweet"));
	item.addButtonSpec(this.name, this._assembleButton("retweet"));
	item.addButtonSpec(this.name, this._assembleButton("favorite"));
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"tweet": "Reply",
	/**
	 * @echo_label
	 */
	"retweet": "Retweet",
	/**
	 * @echo_label
	 */
	"favorite": "Favorite",
	/**
	 * @echo_label
	 */
	"comment": "Comment",
	/**
	 * @echo_label
	 */
	"secondsAgo": "{seconds}s",
	/**
	 * @echo_label
	 */
	"minutesAgo": "{minutes}m",
	/**
	 * @echo_label
	 */
	"hoursAgo": "{hours}h",
	/**
	 * @echo_label
	 */
	"monthsAgo": "{day} {month}",
	/**
	 * @echo_label
	 */
	"yearsAgo": "{day} {month} {year}",
	/**
	 * @echo_label
	 */
	"fullDate": "{time} - {date}",
	/**
	 * @echo_label
	 */
	"month1": "Jan",
	/**
	 * @echo_label
	 */
	"month2": "Feb",
	/**
	 * @echo_label
	 */
	"month3": "Mar",
	/**
	 * @echo_label
	 */
	"month4": "Apr",
	/**
	 * @echo_label
	 */
	"month5": "May",
	/**
	 * @echo_label
	 */
	"month6": "Jun",
	/**
	 * @echo_label
	 */
	"month7": "Jul",
	/**
	 * @echo_label
	 */
	"month8": "Aug",
	/**
	 * @echo_label
	 */
	"month9": "Sep",
	/**
	 * @echo_label
	 */
	"month10": "Oct",
	/**
	 * @echo_label
	 */
	"month11": "Nov",
	/**
	 * @echo_label
	 */
	"month12": "Dec"
};

plugin.dependencies = [{
	"loaded": function() { return !!window.twttr; },
	"url": "http://platform.twitter.com/widgets.js"
}];

plugin.enabled = function() {
	return this._isTweet();
};

plugin.events = {
	"Echo.StreamServer.Controls.Card.onRender": function(topic, args) {
		window.twttr && window.twttr.widgets && window.twttr.widgets.load();
		$.map(this.component.buttons[this.name], function(name) {
			if (name && name.element) {
				name.element.unbind("click");
			}
		});
	}
};

plugin.templates.username =
	'<div class="{plugin.class:tweetUserName}"></div>';

plugin.templates.date =
	'<div class="{plugin.class:tweetDate} echo-secondaryFont"></div>';

/**
 * @echo_renderer
 */
plugin.component.renderers.authorName = function(element) {
	var item = this.component;
	return item.parentRenderer("authorName", arguments)
		.removeClass("echo-linkColor")
		.addClass(this.cssPrefix + "tweetScreenName").wrapInner(
			Echo.Utils.hyperlink({
				"href": item.get("data.actor.id")
			}, {
				"openInNewWindow": true,
				"skipEscaping": true
			})
		);
};

/**
 * @echo_renderer
 */
plugin.component.renderers.avatar = function(element) {
	var item = this.component;
	return item.parentRenderer("avatar", arguments).wrap(
		Echo.Utils.hyperlink({
			"href": item.get("data.actor.id")
		}, {
			"openInNewWindow": true,
			"skipEscaping": true
		})
	);
};

/**
 * @echo_renderer
 */
plugin.component.renderers.date = function(element) {
	var item = this.component;
	this.view.render({"name": "tweetDate"});
	return item.parentRenderer("date", arguments);
};

plugin.component.renderers._buttonsDelimiter = function(element) {
	var item = this.component;
	var posDelimiter = item.buttonSpecs[this.name].length;

	return item.parentRenderer("_buttonsDelimiter", arguments)
		.find("span[class*='button-delim']").eq(posDelimiter).text(" | ");
};

/**
 * @echo_renderer
 */
plugin.renderers.tweetUserName = function(element) {
	var item = this.component;
	return element.html(Echo.Utils.hyperlink({
		"href": item.get("data.actor.id"),
		"caption": "@" + this._extractTwitterID(),
		"class": "echo-streamserver-controls-stream-item-authorName"
	}, {
		"openInNewWindow": true,
		"skipEscaping": true
	}));
};

plugin.renderers.tweetDate = function(element) {
	var item = this.component;
	return element.html(Echo.Utils.hyperlink({
		"caption": this._getTweetTime(),
		"href": item.get("data.object.id"),
		"class": "echo-secondaryFont echo-secondaryColor",
		"title": this._getTweetTime(true)
	}, {
		"openInNewWindow": true,
		"skipEscaping": true
	}));
};

plugin.methods._assembleButton = function(name) {
	var plugin = this, item = this.component;
	var match = item.get("data.object.id").match(/\/(\d+)$/);
	var id = match && match[1];
	return function() {
		return {
			"name": name,
			"icon": "icon-" + name,
			"label": plugin.labels.get(name),
			"template": Echo.Utils.hyperlink({
				"href": "https://twitter.com/intent/" + name + "?in_reply_to=" + id + "&tweet_id=" + id,
				"class": "{class:button} intentControl {class:button}-{data:name}",
				"caption":
					'<i class="{plugin.class:buttonIcon} icon-{data:name}"></i>' +
					'<span class="echo-primaryFont {class:buttonCaption}">{data:label}</span>'
			}, {
				"openInNewWindow": true,
				"skipEscaping": true
			}),
			"visible": id && plugin._isTweet()
		};
	};
};

plugin.methods._isTweet = function() {
	var item = this.component;
	return item.get("data.source.name") === "Twitter";
};

plugin.methods._getTweetTime = function(getFull) {
	var item = this.component;
	var d = new Date(item.timestamp * 1000);
	var now = (new Date()).getTime();
	var diff = Math.floor((now - d.getTime()) / 1000);
	var result;
	if (getFull) {
		result = this.labels.get("fullDate", {"time": d.toLocaleTimeString(), "date": d.toLocaleDateString()});
	} else {
		if (diff < 60) {
			result = this.labels.get("secondsAgo", {"seconds": diff});
		} else if(diff < 60 * 60) {
			result = this.labels.get("minutesAgo", {"minutes": Math.floor(diff / 60)});
		} else if(diff < 60 * 60 * 24) {
			result = this.labels.get("hoursAgo", {"hours": Math.floor(diff / (60 * 60))});
		} else if (diff < 60 * 60 * 24 * 365) {
			result = this.labels.get("monthsAgo", {"day": d.getDate(), "month": this.labels.get("month" + (d.getMonth() + 1))});
		} else {
			result = this.labels.get("yearsAgo", {"day": d.getDate(), "month": this.labels.get("month" + (d.getMonth() + 1)), "year": d.getFullYear()});
		}
	}
	return result;
};

plugin.methods._extractTwitterID = function() {
	var item = this.component;
	var match = item.get("data.actor.id").match(/twitter.com\/(.*)/);
	return match ? match[1] : item.get("data.actor.id");
};

plugin.css =
	".{plugin.class} .{class:avatar} a img { border: 0px; }" +
	".{plugin.class} .{class:data} a { text-decoration: none; }" +
	".{plugin.class} .{class:data} a:hover { text-decoration: underline; }" +
	".{plugin.class} .{class:modeSwitch} { margin-left: 6px; }" +
	".{plugin.class:userName} { float: left; font-size: 15px; font-weight: bold; }" +
	".{plugin.css:screenName} { margin-left: 4px; font-size: 11px; font-weight: normal; padding-top: 1px; }" +
	".{plugin.class:userName} a, .{plugin.class:tweetUserName} a, .{plugin.class:intentControl} { text-decoration: none; }" +
	".{plugin.class:intentControl} { margin-right: 10px }" +
	".{plugin.class:tweetUserName} { margin-left: 4px; padding-right: 5px; float: left; }" +
	".{plugin.class:date} { text-decoration: none; color: #C6C6C6; }" +
	".{plugin.class:tweetScreenName} a { text-decoration: none; color: #333333; }" +
	".{plugin.class:tweetDate} a.echo-secondaryFont { text-decoration: none; color: #C6C6C6; }" +
	".{plugin.class:tweetDate} a:hover { text-decoration: underline;  }" +
	".{plugin.class:tweetDate} { float: right; }" +
	".{class:button} i.icon-favorite { background-position: -143px 0px; }" +
	".{class:button} i.icon-tweet {background: url(https://si0.twimg.com/images/dev/cms/intents/icons/sprites/everything-spritev2.png) no-repeat; background-position: -17px -2px; }";
Echo.Plugin.create(plugin);

})(Echo.jQuery);
