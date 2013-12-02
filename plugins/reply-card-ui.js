(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("ReplyCardUI", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this, item = this.component;
	this.extendTemplate("insertAsLastChild", "content", plugin.templates.form);
	var form = Echo.Utils.get(Echo.Variables, this._getSubmitKey());
	$.each(form || {}, function(key, value) {
		self.set(key, value);
	});
	item.addButtonSpec("ReplyCardUI", this._assembleButton());
	this.set("documentClickHandler", this._getClickHandler());
	$(document).on('click', this.get("documentClickHandler"));
};

plugin.config = {
	"actionString": "Add a comment..."
};

plugin.labels = {
	"replyControl": "Reply"
};

plugin.dependencies = [{
	"control": "Echo.StreamServer.Controls.Submit",
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
}];

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Plugins.ReplyCardUI.onFormExpand": function(topic, args) {
		var item = this.component;
		var context = item.config.get("context");
		if (this.get("expanded") && context && context !== args.context) {
			this._hideSubmit();
		}
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function() {
		this._hideSubmit();
	},
	"Echo.StreamServer.Controls.Stream.Item.onRender": function() {
		if (this.get("expanded")) {
			this._showSubmit();
		}
	}
};

plugin.templates.form =
	'<div class="{plugin.class:replyForm}">' +
		'<div class="pull-left {plugin.class:avatar}"></div>' +
		'<div class="{plugin.class:submitForm}"></div>' +
		'<div class="{plugin.class:compactForm}">' +
			'<div class="{plugin.class:compactContent} {plugin.class:compactBorder}">' +
				'<input type="text" class="{plugin.class:compactField} echo-primaryFont echo-secondaryColor">' +
			'</div>' +
		'</div>' +
	'</div>';

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

plugin.component.renderers.children = function(element) {
	var item = this.component;
	// perform reply form rerendering *only* when we have exactly 1 item
	// (the first item is being added or the last one is being deleted)
	if (item.get("children").length === 1) {
		var child = item.get("children")[0];
		if (child.get("added") || child.get("deleted")) {
			this._itemCSS("remove", item, this.view.get("compactForm"));
			this.view.render({"name": "compactForm"});
		}
	}
	return item.parentRenderer("children", arguments);
};

plugin.renderers.submitForm = function(element) {
	return this.get("expanded") ? element.show() : element.empty().hide();
};

plugin.renderers.avatar =function(element) {
	var item = this.component;
	item.placeImage({
		"container": element,
		"image": item.user.get("avatar"),
		"defaultImage": item.config.get("defaultAvatar")
	});
	if (item.get("depth") && !this.get("expanded")) {
		element.hide();
	} else {
		element.show();
	}
	return element;
};

plugin.renderers.compactForm = function(element) {
	var item = this.component;
	if (!item.get("depth") && !this.get("expanded")) {
		this._itemCSS("add", item, element);
		return element.show();
	}
	this._itemCSS("remove", item, this.view.get("compactForm"));
	return element.hide();
};

plugin.renderers.compactField = function(element) {
	var plugin = this;
	return element.focus(function() {
		plugin._showSubmit();
	}).val(this.config.get("actionString"));
};

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
	this._itemCSS("add", item, this.view.get("submitForm"));
	var submit = this.get("submit");
	if (submit) {
		submit.config.set("target", target);
		submit.render();
		this._expand();
		return target;
	}
	var config = this._submitConfig(target);
	// add plugin for submit
	config.plugins.push({
		"name": "ReplyCardUI",
		"inReplyTo": item.get("data")
	});
	// add plugin for auth
	$.map(config.plugins, function(plugin) {
		if (plugin.name === "JanrainAuth") {
			plugin.nestedPlugins = plugin.nestedPlugins || [];
			plugin.nestedPlugins.push({
				"name": "ReplyCardUI"
			});
		}
	});
	new Echo.StreamServer.Controls.Submit(config);
	return target;
};

plugin.methods._hideSubmit = function() {
	var item = this.component;
	var submit = this.get("submit");
	if (submit) {
		submit.set("data", undefined);
	}
	this.set("expanded", false);
	this._itemCSS("remove", item, this.view.get("submitForm"));
	this.view.get("submitForm").empty().hide();
	this.view.render({"name": "avatar"});
	this.view.render({"name": "compactForm"});
	item.view.render({"name": "container"});
	
	this.events.publish({
		"topic": "onCollapse"
	});
};

plugin.methods._expand = function() {
	var item = this.component;
	this.set("expanded", true);
	this.view.render({"name": "submitForm"});
	this.view.render({"name": "compactForm"});
	this.view.render({"name": "avatar"});
	
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
		if (plugin.get("expanded") && submit && !submit.view.get("text").val() && !isClickedInSubmitForm) {
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
			"name": "ReplyCardUI",
			"icon": "{%= baseURL %}/images/comment.png",
			"label": plugin.labels.get("replyControl"),
			"visible": item.get("depth") < item.config.get("parent.children.maxDepth"),
			"callback": callback
		};
	};
};

plugin.methods._itemCSS = function(action, item, element) {
	$.each(["container", "container-child", "depth-" + (item.get("depth") + 1)], function(i, css) {
		element[action + "Class"](item.get("cssPrefix") + css);
	});
	element[action + "Class"]('echo-trinaryBackgroundColor');
};

plugin.methods._getSubmitKey = function() {
	var item = this.component;
	var applicationContext = item.config.get("context").split("/")[0];
	return "forms." + item.data.unique + "-" + applicationContext;
};

plugin.methods._getSubmitData = function() {
	var data = {};
	var submit = this.get("submit");
	data["content"] = submit.view.get("text").val();
	$.map(["tags", "markers"], function(field) {
		var elements = submit.view.get(field).val().split(", ");
		data[field] = elements || [];
	});
	return data;
};

plugin.css =
	".{plugin.class} .{class:container-root-thread} { padding: 10px 0px 10px 10px; }" +
	".{plugin.class} .{plugin.class:replyForm} { margin-right: 10px; }" +
	".{plugin.class} .{plugin.class:compactForm} { margin-top: 15px; padding-top: 0px; }" +
	".{plugin.class} .{plugin.class:submitForm} { margin-top: 15px; padding-top: 0px; }" +
	".{plugin.class:compactContent} { padding: 5px 5px 5px 6px; background-color: #fff; height: 26px; line-height: 26px; }" +
	".{plugin.class:avatar} { width: 26px; height: 26px; border-radius: 50%; margin: 5px 0px 0px 10px; }" +
	".{plugin.class} .{plugin.class:avatar} > img { width: 26px; height: 26px; }" +
	".{plugin.class:submitForm} > div { margin-left: 30px; }" +
	".{plugin.class:compactBorder} { margin-left: 30px; border: 1px solid #d2d2d2; }" +
	".{plugin.class:compactContent} input.{plugin.class:compactField}[type='text'].echo-secondaryColor { color: #C6C6C6 }" +
	".{plugin.class:compactContent} input.{plugin.class:compactField}[type='text'].echo-primaryFont { font-size: 14px; line-height: 26px; }" +
	".{plugin.class:compactContent} input.{plugin.class:compactField}[type='text'] { width: 100%; height: 26px; border: none; margin: 0px; padding: 0px; box-shadow: none; vertical-align: middle; }" +
	".{plugin.class:compactContent} input.{plugin.class:compactField}[type='text']:focus { outline: 0; box-shadow: none; }";

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("ReplyCardUI", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Item.Plugins.ReplyCardUI.onExpand": function(topic, args) {
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

(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("ReplyCardUI", "Echo.StreamServer.Controls.Submit");

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

$.map(["onRender", "onRerender"], function(topic) {
	plugin.events["Echo.StreamServer.Controls.Submit." + topic] = function() {
		var submit = this.component;
		submit.config.get("target").show();
		submit.view.get("text").focus();
	};
});

plugin.css =
	'.{plugin.class} .{class:container} { padding-top: 5px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("ReplyCardUI", "Echo.IdentityServer.Controls.Auth");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("remove", "avatar");
};

plugin.css =
	// TODO we shouldn't use foreign plugin class here.
	'.{plugin.class} .echo-identityserver-controls-auth-plugin-CardUIShim-container > div { display: inline-block; }' +
	'.{plugin.class} .echo-identityserver-controls-auth-plugin-CardUIShim-via { margin-left: 5px; }' +
	'.{plugin.class} .{class:userLogged} { margin-left: 0px; }' +
	'.{plugin.class} .{class:name} { margin-left: 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
