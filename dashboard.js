(function(jQuery) {

var $ = jQuery;

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.Conversations.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.Conversations.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.config = {
	"ecl": [{
		"component": "Select",
		"name": "appkey",
		"type": "string",
		"config": {
			"title": "Application key",
			"desc": "Specifies the application key for this instance",
			"options": []
		}
	}, {
		"component": "Echo.Apps.RTBComments.Dashboard.TargetSelector",
		"name": "conversationID",
		"type": "string",
		"default": "",
		"config": {
			"title": "Conversation ID",
			"default": "",
			"data": {"sample": "http://example.com/conversation"},
			"defaultValueTitle": "Use Current Page URL",
			"customValueTitle": "Use this URL"
		}
	}, {
		"component": "Select",
		"name": "submitFormPosition",
		"type": "string",
		"default": "top",
		"config": {
			"title": "Submit position",
			"desc": "Specifies the position of submit form",
			"options": [{
				"title": "Top",
				"value": "top"
			}, {
				"title": "Bottom",
				"value": "bottom"
			}]
		}
	}]
};

dashboard.init = function() {
	var self = this, parent = $.proxy(this.parent, this);

	var request = this.config.get("request");
	var customerId = this.config.get("data.customer.id");
	request({
		"endpoint": "customer/" + customerId + "/appkeys",
		"success": function(appkeys) {
			self._setAppkeys(appkeys);
			self.set("appkeys", appkeys);
			parent();
		}
	});
};

dashboard.methods.declareInitialConfig = function() {
	var keys = this.get("appkeys", []);
	return {
		"appkey": keys.length ? keys[0].key : undefined
	};
};

dashboard.methods._setAppkeys = function(appkeys) {
	appkeys = appkeys || [];
	this.set("appkeys", appkeys);
	var ecl = this.config.get("ecl");
	ecl[0].config.options = $.map(appkeys, function(appkey) {
		return {
			"title": appkey.key,
			"value": appkey.key
		};
	});
};

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var $ = jQuery;

// TODO rename class
if (Echo.Control.isDefined("Echo.Apps.RTBComments.Dashboard.TargetSelector")) return;

var component = Echo.Control.manifest("Echo.Apps.RTBComments.Dashboard.TargetSelector");

component.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Items.RadioGroup");

component.events = {
	"Echo.AppServer.Controls.Configurator.Items.RadioGroup.onSectionChange": function(topic, data) {
		var isDefault = data.current === "default";
		this._setError(isDefault ? "" : this.input.get("data.error"));
		this.input.config.get("target")[isDefault ? "slideUp" : "slideDown"]();
	},
	"Echo.AppServer.Controls.Configurator.Items.Input.onChange": function() {
		this.setValue(this.value());
		return {"stop": ["bubble"]};
	},
	"Echo.AppServer.Controls.Configurator.Items.Input.onErrorStateChange": function() {
		if (this.section() === "default") {
			this._setError("");
		}
		return {"stop": ["bubble"]};
	}
};

component.config = {
	"default": ""
};

component.labels = {
	"validateError": "This field value should contain a valid URL"
};

component.init = function() {
	this.config.set("options", [{
		"title": this.config.get("defaultValueTitle"),
		"value": this.config.get("default"),
		"section": "default"
	}, {
		"title": this.config.get("customValueTitle"),
		"value": this.config.get("data.value"),
		"section": "custom"
	}]);
	this.parent();
};

component.vars = {
	"input": undefined,
	"currentSection": undefined
};

component.renderers.valueContainer = function(element) {
	var self = this, view = this.view.fork();
	element.empty();
	$.map(this.config.get("options") || [], function(option) {
		self._renderOption(option);
		if (option.section === "custom") {
			new Echo.AppServer.Controls.Configurator.Items.Input({
				"target": $(self.substitute({"template": '<div class="{class:input-container}"></div>'}))
					.appendTo(element)[self._isChecked(option) ? "show" : "hide"](),
				"cdnBaseURL": self.config.get("cdnBaseURL"),
				"data": $.extend(true, {}, self.get("data")),
				"context": self.config.get("context"),
				"validators": [function(value) {
					return {
						"correct": /^https?:\/\/[a-z0-9_\-\.]+\.(?:[a-z0-9_\-]+\.)*[a-z]+(\/|$)/i.test(value),
						"message": self.labels.get("validateError")
					}
				}],
				"ready": function() {
					self.input = this;
				}
			});
		}
	});
	this.set("currentSection", this.section());
	return element;
};

component.methods.value = function() {
	return this.section() === "default"
		? this.config.get("default")
		: this.input.value();
};

component.methods._isChecked = function(option) {
	return (option.section === "default" && this.config.get("default") === option.value ||
		this.get("data.value") !== this.config.get("default")) && this.parent.apply(this, arguments);
};

component.methods._setError = function(error) {
	this.events.publish({
		"topic": "onErrorStateChange",
		"data": {
			"error": error,
			"item": this
		},
		"inherited": true
	});
};

component.css =
	'.{class:valueContainer} input.{class:input}[type="radio"] { margin-top: 0px; vertical-align: middle; width: 16px}' +
	'.{class:input-container} { margin: 5px 0 0 20px; }';

Echo.Control.create(component);

})(Echo.jQuery);
