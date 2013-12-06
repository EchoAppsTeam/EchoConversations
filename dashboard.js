(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.Conversations.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.Conversations.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.mappings = {
	"allowAnonymousSubmission": {
		"key": "auth.allowAnonymousSubmission"
	},
	"dependencies.appkey": {
		"key": "dependencies.StreamServer.appkey"
	},
	"dependencies.janrainapp": {
		"key": "dependencies.Janrain.appId"
	}
};

dashboard.config = {
	"ecl": [{
		"component": "Echo.Apps.Conversations.Dashboard.TargetSelector",
		"name": "targetURL",
		"type": "string",
		"default": "",
		"config": {
			"title": "Target URL",
			"default": "",
			"data": {"sample": "http://example.com/conversation"},
			"defaultValueTitle": "Use Current Page URL",
			"customValueTitle": "Use this URL"
		}
	},{
		"component": "Input",
		"name": "allPostsQuery",
		"type": "string",
		"default": "",
		"config": {
			"title": "All Posts Query override",
			"desc": "Generally used at runtime to override the query used when displaying the general collection of posts",
			"data": {"sample": "childrenof:{data:conversationID} type:comment state:Untouched,ModeratorApproved children:2"}
		}
	}, {
		"component": "Checkbox",
		"name": "allowAnonymousSubmission",
		"type": "boolean",
		"config": {
			"title": "Allow anonymous submission",
			"desc": "Allow users to post without logging in"
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
		"name": "dependencies",
		"type": "object",
		"config": {
			"title": "Dependencies"
		},
		"items": [{
			"component": "Select",
			"name": "appkey",
			"type": "string",
			"config": {
				"title": "StreamServer application key",
				"desc": "Specifies the application key for this instance",
				"options": []
			}
		}, {
			"component": "Select",
			"name": "janrainapp",
			"type": "string",
			"config": {
				"title": "Janrain application ID",
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
