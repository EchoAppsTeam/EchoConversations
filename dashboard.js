(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.Conversations.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.Conversations.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.mappings = {
	"appkey": {
		"key": "dependencies.StreamServer.appkey"
	},
	"auth.janrainapp": {
		"key": "dependencies.Janrain.appId"
	}
};

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
		"component": "Echo.Apps.Conversations.Dashboard.TargetSelector",
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
	},{
		"component": "Input",
		"name": "generalCollectionQuery",
		"type": "string",
		"default": "",
		"config": {
			"title": "Override the General Collection Query with the following value",
			"desc": "enerally used at runtime to override the query used when displaying the general collection of posts",
			"data": {"sample": "childrenof:{data:conversationID} type:comment state:Untouched,ModeratorApproved children:2"}
		}
	}, {
		"component": "Checkbox",
		"name": "bozoFilter",
		"type": "boolean",
		"config": {
			"title": "Enable Bozo Filter",
			"desc": "If enabled, ensures that users see their own post irrespective of the moderation state of that post"
		}
	}, {
		"component": "Group",
		"name": "auth",
		"type": "object",
		"config": {
			"title": "Auth"
		},
		"items": [{
			"component": "Checkbox",
			"name": "allowAnonymousSubmission",
			"type": "boolean",
			"config": {
				"title": "Allow anonymous submission",
				"desc": "Allow users to post without logging in"
			}
		}, {
			"component": "Select",
			"name": "janrainapp",
			"type": "string",
			"config": {
				"title": "Janrain App",
				"validators": ["required"],
				"options": []
			}
		}]
	}]
};


dashboard.init = function() {
	var parent = $.proxy(this.parent, this);
	this._requestData(function() {
		parent();
	});
};

dashboard.methods.declareInitialConfig = function() {
	var keys = this.get("appkeys", []);
	var apps = this.get("janrainapps", []);
	return {
		"dependencies": {
			"Janrain": {
				"appId": apps.length ? apps[0].name : undefined
			},
			"StreamServer": {
				"appkey": keys.length ? keys[0].key : undefined
			}
		}
	};
};

dashboard.methods.initConfigurator = function() {
	function findKey(key, ecl) {
		var found;
		$.each(ecl, function(k, item) {
			if (item.name === key) {
				found = item;
				return false;
			} else if (item.type === "object") {
				found = findKey(key, item.items);
				if (found) return false;
			}
		});
		return found;
	}

	var ecl = this.config.get("ecl");

	// populate appkey selectbox
	var appkey = findKey("appkey", ecl);
	appkey.config.options = $.map(this.get("appkeys", []), function(appkey) {
		return {
			"title": appkey.key,
			"value": appkey.key
		};
	});

	// populate janrainapp selectbox
	var janrainapp = findKey("janrainapp", ecl);
	janrainapp.config.options = $.map(this.get("janrainapps", []), function(app) {
		return {
			"title": app.name,
			"value": app.name
		};
	});
	this.parent.apply(this, arguments);
};

dashboard.methods._requestData = function(callback) {
	var self = this;
	var customerId = this.config.get("data.customer.id");
	var deferreds = [];
	var request = this.config.get("request");

	var requests = [{
		"name": "appkeys",
		"endpoint": "customer/" + customerId + "/appkeys"
	}, {
		"name": "janrainapps",
		"endpoint": "customer/" + customerId + "/janrainapps"
	}];
	$.map(requests, function(req) {
		var deferredId = deferreds.push($.Deferred()) - 1;
		request({
			"endpoint": req.endpoint,
			"success": function(response) {
				self.set(req.name, response);
				deferreds[deferredId].resolve();
			}
		});
	});
	$.when.apply($, deferreds).done(callback);
};

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);
