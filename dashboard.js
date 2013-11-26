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
		"name": "targetURL",
		"component": "Input",
		"type": "string",
		"config": {
			"title": "Target URL",
			"validators": ["required"],
			"data": {"sample": "http://example.com/conversation"}
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
