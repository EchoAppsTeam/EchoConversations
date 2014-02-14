(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardCollection.Plugins.Reply
 * Adds extra “Reply” button to each item in the Echo Stream control.
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
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var item = this.component;
	item.addButtonSpec("Reply", this._assembleButton());
	this.extendTemplate("insertAsLastChild", "content", plugin.templates.form);
	this.set("documentClickHandler", this._getClickHandler());
	$(document).on("click", this.get("documentClickHandler"));
};

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

plugin.dependencies = [{
	"control": "Echo.StreamServer.Controls.SubmitComposer",
	"url": "{%=baseURL%}/streamserver.pack.js"
}];

/**
 * @echo_template
 */
plugin.templates.form =
	'<div class="{plugin.class:container}">' +
		'<div class="{plugin.class:composer}"></div>' +
	'</div>';

/**
 * @echo_renderer
 */
plugin.renderers.container = function(element) {
	var item = this.component;
	return element
		.addClass(item.get("cssPrefix") + "depth-" + (item.get("depth") + 1));
};

/**
 * @echo_renderer
 */
plugin.renderers.composer = function(element, extra) {
	var item = this.component;
	element.empty();
	if (!item.get("depth") && this.config.get("displayCompactForm")) {
		this._showComposer("inline", element);
	}
	return element;
};


plugin.methods._showComposer = function(mode, target) {
	var item = this;
	var composer = this.get("composer");
	target = target || this.view.get("composer");

	if (composer) {
		composer.config.set("target", target);
		composer.config.set("compact.mode", mode);
		composer.refresh();
		return;
	}

	var config = this._assembleComposerConfig({
		"target": target,
		"compact": {
			"mode": mode
		}
	});
	config.plugins.push({
		"name": "Reply",
		"inReplyTo": item.get("data")
	});
	new Echo.StreamServer.Controls.SubmitComposer(config);
};

plugin.methods._assembleComposerConfig = function(config) {
	var plugin = this, item = this.component;
	return this.config.assemble($.extend(true, {
		"targetURL": item.get("data.object.id"),
		"targetQuery": item.config.get("query", ""),
		"parent": item.config.getAsHash(),
		"data": this.get("data") || {},
		"ready": function() {
			plugin.set("composer", this);
		}
	}, config));
};

plugin.methods._assembleButton = function() {
	var plugin = this;
	var callback = function() {
		plugin._showComposer("none");
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

plugin.methods._getClickHandler = function() {
	var plugin = this;
	return function(event) {
		var composer = plugin.get("composer");
		if (!composer) return;

		var target = composer.config.get("target");
		var isClickedInComposer = target && target.find(event.target).length;
		if (!isClickedInComposer && !composer.get("collapsed")) {
			plugin.view.render({
				"name": "composer"
			});
		}
	};
};

plugin.methods.destroy = function() {
	$(document).off("click", this.get("documentClickHandler"));
};

plugin.css =
	'.{plugin.class:container} { margin-right: 15px; border-left: 4px solid transparent; }' +
	'.{plugin.class:composer} { padding: 8px 0px 15px 0px; }';

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
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @private
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.CardCollection");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
	"Echo.StreamServer.Controls.Card.Reply.onExpand": function(topic, args) {
		/**
		 * @echo_event Echo.StreamServer.Controls.CardCollection.Plugins.Reply.onFormExpand
		 * Triggered if reply form is expanded.
		 */
		this.events.publish({
			"topic": "onFormExpand",
			"data": {
			    "context": args.context
			}
		});
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.SubmitComposer.Plugins.Reply
 * Adds internal data field "inReplyTo" for correct reply workflow.
 *
 * 	new Echo.StreamServer.Controls.SubmitComposer({
 * 		"target": document.getElementById("echo-submit"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Reply",
 * 			"inReplyTo": data 
 * 		}]
 * 	});
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @private
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Reply", "Echo.StreamServer.Controls.SubmitComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var plugin = this, submit = plugin.component;
	var _prepareEventParams = submit._prepareEventParams;
	submit._prepareEventParams = function(params) {
		var _params = _prepareEventParams.call(submit, params);
		_params.inReplyTo = plugin.config.get("inReplyTo");
		return _params;
	};
};

/**
 * @cfg {Object} inReplyTo
 * Entry which is the parent for the current reply.
 */

$.map(["onRender", "onRerender"], function(topic) {
	plugin.events["Echo.StreamServer.Controls.SubmitComposer." + topic] = function() {
		var submit = this.component;
		submit.config.get("target").show();
		// TODO: set focus/scroll to proper element
		submit.view.get("container").get(0).scrollIntoView();
	};
});

plugin.css =
	'.{class}.{plugin.class} .{class:container} { border: none; padding: 0px; }' +
	'.{plugin.class} .{class:nameContainer}, .{plugin.class} .{class:controls}, .{plugin.class} .{class:composers} { background-color: #fff; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
