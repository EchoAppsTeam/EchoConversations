(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardCollection.Plugins.Reply
 * Adds extra "Reply" button to each item in the Echo Stream control.
 * Integrates Echo Submit Composer control and provides the ability to submit
 * replies to the posted items.
 *
 *		new Echo.StreamServer.Controls.CardCollection({
 *			"target": document.getElementById("echo-stream"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "Reply"
 *			}]
 *		});
 *
 * More information regarding the plugins installation can be found
 * in the ["How to initialize Echo components"](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"displayCompactForm": true
};

plugin.labels = {
	/**
	 * @echo_label
	 * Label for the button in the item
	 */
	"replyControl": "Reply"
};

plugin.init = function() {
	var item = this.component;
	item.addButtonSpec("Reply", this._assembleButton());
	this.extendTemplate("insertAsLastChild", "container", plugin.templates.form);
	this.extendTemplate("insertBefore", "expandChildren", plugin.templates.topSpacing);
};

plugin.dependencies = [{
	"control": "Echo.StreamServer.Controls.CardComposer",
	"url": "{%=baseURL%}/streamserver.pack.js"
}];

/**
 * @echo_template
 */
plugin.templates.form =
	'<div class="{plugin.class:composer}"></div>';

/**
 * @echo_template
 */

plugin.templates.topSpacing =
	'<div class="{plugin.class:topSpacing}"></div>';

/**
 * @echo_renderer
 */
plugin.renderers.composer = function(element) {
	var item = this.component;
	element
		.empty()
		.addClass(item.get("cssPrefix") + "depth-" + (item.get("depth") + 1));
	this._removeComposer();
	if (this._isCompactFormVisible()) {
		element.show();
		this._showComposer("collapsed", element);
	} else {
		element.hide();
	}
	return element;
};

/**
 * @echo_renderer
 */
plugin.renderers.topSpacing = function(element) {
	return this._isCompactFormVisible()
		? element.show()
		: element.hide();
};

plugin.methods.destroy = function() {
	this._removeComposer();
};

plugin.methods._showComposer = function(mode, target) {
	var plugin = this, item = this.component;
	var composer = this.get("composer");
	target = target || this.view.get("composer");

	if (composer) {
		var toExpand = composer.get("collapsed") && mode !== "collapsed";
		toExpand && composer.expand();
		return;
	}

	var config = this.config.assemble({
		"target": target,
		"targetURL": item.get("data.object.id"),
		"targetQuery": item.config.get("query", ""),
		"initialMode": mode,
		"collapseOn": {
			"documentClick": true,
			"postComplete": true
		},
		"parent": item.config.getAsHash(),
		"data": this.get("data") || {},
		"ready": function() {
			plugin.set("composer", this);
			this.config.get("target").show();
			mode === "expanded" && this.focus();
		}
	});
	config.plugins.push({
		"name": "Reply",
		"inReplyTo": this.component.get("data")
	});
	new Echo.StreamServer.Controls.CardComposer(config);
};

plugin.methods._assembleButton = function() {
	var plugin = this;
	var callback = function() {
		plugin._showComposer("expanded");
	};
	return function() {
		var item = this;
		return {
			"name": "Reply",
			"icon": "icon-comment",
			"label": plugin.labels.get("replyControl"),
			"visible": item.get("depth") < item.config.get("parent.children.maxDepth"),
			"callback": callback
		};
	};
};

plugin.methods._isCompactFormVisible = function() {
	return !this.component.get("depth") && this.config.get("displayCompactForm");
};

plugin.methods._removeComposer = function() {
	if (this.composer) {
		this.composer.destroy();
		this.remove("composer");
	}
};

plugin.css =
	'.{plugin.class:topSpacing} { padding-top: 8px; }' +
	'.{plugin.class:composer} { margin-right: 16px; border-left: 4px solid transparent; padding: 8px 0px 16px 0px; }' +
	'.{class:children} .{plugin.class:composer} { padding-bottom: 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardCollection.Plugins.Reply
 * Proxies the "Echo.StreamServer.Controls.Card.Plugins.Reply.onExpand"
 * event on the Stream control level.
 *
 * 	new Echo.StreamServer.Controls.CardCollection({
 * 		"target": document.getElementById("echo-stream"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Reply"
 * 		}]
 * 	});
 *
 * More information regarding the plugins installation can be found
 * in the ["How to initialize Echo components"](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @private
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.CardCollection");

if (Echo.Plugin.isDefined(plugin)) return;

// lizard: please don't remove this plugin

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.Reply
 * Adds internal data field "inReplyTo" for correct reply workflow.
 *
 * 	new Echo.StreamServer.Controls.CardComposer({
 * 		"target": document.getElementById("echo-composer"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Reply",
 * 			"inReplyTo": data 
 * 		}]
 * 	});
 *
 * More information regarding the plugins installation can be found
 * in the ["How to initialize Echo components"](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @private
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.CardComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var plugin = this, composer = plugin.component;
	var _prepareEventParams = composer._prepareEventParams;
	composer._prepareEventParams = function(params) {
		var _params = _prepareEventParams.call(composer, params);
		_params.inReplyTo = plugin.config.get("inReplyTo");
		return _params;
	};
};

/**
 * @cfg {Object} inReplyTo
 * Entry which is the parent for the current reply.
 */

plugin.events = {
	"Echo.StreamServer.Controls.CardComposer.onExpand": function() {
		var composer = this.component;
		composer.config.get("target").show();
		composer.focus();
	},
	"Echo.StreamServer.Controls.CardComposer.onCollapse": function() {
		var composer = this.component;
		if (composer.config.get("initialMode") !== "collapsed") {
			composer.config.get("target").hide();
		}
	}
};

plugin.css =
	'.{class}.{plugin.class} .{class:container} { border: none; padding: 0px; }' +
	'.{plugin.class} .{class:nameContainer}, .{plugin.class} .{class:controls}, .{plugin.class} .{class:composers} { background-color: #fff; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
