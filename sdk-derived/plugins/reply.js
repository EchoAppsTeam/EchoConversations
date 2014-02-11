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
	var self = this, item = this.component;
	this.extendTemplate("insertAsLastChild", "content", plugin.templates.form);
	var form = Echo.Utils.get(Echo.Variables, this._getSubmitKey());
	$.each(form || {}, function(key, value) {
	    self.set(key, value);
	});
	item.addButtonSpec("Reply", this._assembleButton());
	this.set("documentClickHandler", this._getClickHandler());
	$(document).on('click', this.get("documentClickHandler"));
};

plugin.config = {
	/**
	 * @cfg {String} actionString
	 * Specifies the hint placed in the empty text area.
	 *
	 *		new Echo.StreamServer.Controls.CardCollection({
	 *			"target": document.getElementById("echo-stream"),
	 *			"appkey": "echo.jssdk.demo.aboutecho.com",
	 *			"plugins": [{
	 *				"name": "Reply",
	 *				"actionString": "Type your comment here..."
	 *			}]
	 *		});
	 */
	"actionString": "Add a comment...",
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

plugin.events = {
	"Echo.StreamServer.Controls.CardCollection.Plugins.Reply.onFormExpand": function(topic, args) {
		var item = this.component;
		var context = item.config.get("context");
		if (this.get("expanded") && context && context !== args.context) {
			this._hideSubmit();
		}
	},
	"Echo.StreamServer.Controls.SubmitComposer.onPostComplete": function(topic, args) {
		this._hideSubmit();
	},
	"Echo.StreamServer.Controls.Card.onRender": function(topic, args) {
		if (this.get("expanded")) {
			this._showSubmit();
		}
	}
};

/**
 * @echo_template
 */
plugin.templates.form =
	'<div class="{plugin.class:replyForm}">' +
		'<div class="{plugin.class:submitForm}"></div>' +
		'<div class="{plugin.class:compactForm}">' +
			'<div class="{plugin.class:compactContent} {plugin.class:compactBorder}">' +
				'<input type="text" class="{plugin.class:compactField} echo-primaryFont echo-secondaryColor">' +
			'</div>' +
		'</div>' +
	'</div>';

/**
 * @echo_renderer
 */
plugin.component.renderers.container = function(element) {
	var item = this.component;
	var threading = item.threading;
	if (this.get("expanded")) {
		item.threading = true;
	}
	item.parentRenderer("container", arguments);
	item.threading = threading;
	return element;
};

/**
 * @echo_renderer
 */
plugin.component.renderers.children = function(element) {
	var item = this.component;
	// perform reply form rerendering *only* when we have exactly 1 item
	// (the first item is being added or the last one is being deleted)
	if (item.get("children").length === 1) {
		var child = item.get("children")[0];
		if (child.get("added") || child.get("deleted")) {
			this.view.render({"name": "compactForm"});
		}
	}
	return item.parentRenderer("children", arguments);
};

/**
 * @echo_renderer
 */
plugin.renderers.submitForm = function(element) {
	return this.get("expanded") ? element.show() : element.empty().hide();
};

/**
 * @echo_renderer
 */
plugin.renderers.compactForm = function(element) {
	return this._isCompactFormVisible()
		? element.show()
		: element.hide();
};

/**
 * @echo_renderer
 */
plugin.renderers.replyForm = function(element) {
	var item = this.component;
	return element
		.addClass(item.get("cssPrefix") + "depth-" + (item.get("depth") + 1));
};

/**
 * @echo_renderer
 */
plugin.renderers.compactField = function(element) {
	var plugin = this;
	return element.focus(function() {
		plugin._showSubmit();
	}).val(this.config.get("actionString"));
};

/**
 * Method to destroy the plugin.
 */
plugin.methods.destroy = function() {
	if (this.get("submit")) {
		Echo.Utils.set(Echo.Variables, this._getSubmitKey(), {
			"expanded": this.get("expanded"),
			"data": {
				"object": this._getSubmitData()
			}
		});
	}
	$(document).off('click', this.get("documentClickHandler"));
};

plugin.methods._isCompactFormVisible = function() {
	var item = this.component;
	return !item.get("depth") && !this.get("expanded") && this.config.get("displayCompactForm");
};

plugin.methods._submitConfig = function(target) {
	var plugin = this, item = this.component;
	return plugin.config.assemble({
		"target": target,
		"targetURL": item.get("data.object.id"),
		"parent": item.config.getAsHash(),
		"data": plugin.get("data") || {},
		"targetQuery": item.config.get("query", ""),
		"ready": function() {
			plugin.set("submit", this);
			plugin._expand();
		}
	});
};

plugin.methods._showSubmit = function() {
	var item = this.component;
	var target = this.view.get("submitForm");
	var submit = this.get("submit");
	if (submit) {
		submit.config.set("target", target);
		submit.render();
		this._expand();
		return target;
	}
	var config = this._submitConfig(target);
	config.plugins.push({
		"name": "Reply",
		"inReplyTo": item.get("data")
	});
	new Echo.StreamServer.Controls.SubmitComposer(config);
	return target;
};

plugin.methods._hideSubmit = function() {
	var item = this.component;
	var submit = this.get("submit");
	if (submit) {
		submit.set("data", undefined);
	}
	this.set("expanded", false);
	this.view.get("submitForm").empty();
	this.view.render({"name": "compactForm"});
	item.view.render({"name": "container"});
	/**
	 * @echo_event Echo.StreamServer.Controls.Card.Plugins.Reply.onCollapse
	 * Triggered when the reply form is closed.
	 */
	this.events.publish({
		"topic": "onCollapse"
	});
};

plugin.methods._expand = function() {
	var item = this.component;
	this.set("expanded", true);
	this.view.render({"name": "submitForm"});
	this.view.render({"name": "compactForm"});
	/**
	 * @echo_event Echo.StreamServer.Controls.Card.Plugins.Reply.onExpand
	 * Triggered when the reply form is expanded.
	 */
	this.events.publish({
		"topic": "onExpand",
		"data": {
			"context": item.config.get("context")
		}
	});
	item.view.render({"name": "container"});
};

plugin.methods._getClickHandler = function() {
	var plugin = this;
	return function(event) {
		var submit = plugin.get("submit");
		var submitForm = plugin.view.get("submitForm");
		var isClickedInSubmitForm = submitForm && submitForm.find(event.target).length;
		if (plugin.get("expanded") && submit/* && !submit.view.get("text").val()*/ && !isClickedInSubmitForm) {
			plugin._hideSubmit();
		}
	};
};

plugin.methods._assembleButton = function() {
	var plugin = this;
	var callback = function() {
		plugin._showSubmit();
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

plugin.methods._getSubmitKey = function() {
	var item = this.component;
	var applicationContext = item.config.get("context").split("/")[0];
	return "forms." + item.data.unique + "-" + applicationContext;
};

plugin.methods._getSubmitData = function() {
	var data = {};
	var submit = this.get("submit");
	data["content"] = "";//submit.view.get("text").val();
	$.map(["tags", "markers"], function(field) {
		var elements = submit.view.get(field).val().split(", ");
		data[field] = elements || [];
	});
	return data;
};

plugin.css =
	'.{plugin.class:replyForm} { margin-right: 15px; border-left: 4px solid transparent; }' +
	'.{plugin.class:submitForm} { padding: 8px 0px 15px 0px; }' +
	'.{plugin.class:compactForm} { padding: 8px 0px 15px 0px; }' +
	'.{plugin.class:compactContent} { padding: 0px 5px 0px 6px; background-color: #fff; height: 28px; line-height: 28px; }' +
	'.{plugin.class:compactBorder} { border: 1px solid #d2d2d2; }' +
	'.{plugin.class:compactContent} input.{plugin.class:compactField}[type="text"].echo-secondaryColor { color: #C6C6C6 }' +
	'.{plugin.class:compactContent} input.{plugin.class:compactField}[type="text"].echo-primaryFont { font-size: 12px; line-height: 16px; }' +
	'.{plugin.class:compactContent} input.{plugin.class:compactField}[type="text"] { width: 100%; height: 16px; border: none; margin: 0px; padding: 0px; box-shadow: none; vertical-align: middle; }' +
	'.{plugin.class:compactContent} input.{plugin.class:compactField}[type="text"]:focus { outline: 0; box-shadow: none; }';

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
	'.{plugin.class} .{class:container} { border: none; padding: 0px; }' +
	'.{plugin.class} .{class:nameContainer}, .{plugin.class} .{class:controls}, .{plugin.class} .{class:composers} { background-color: #fff; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
